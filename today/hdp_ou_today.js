import {RabbitMQManager} from "../rabbitmq/rabbitmq_manager.js";
import {injectCookies, testConnect} from "../src/browser.js";
import sleep from "../supports/sleep.js";
import {convertOddsHdpOu} from "../converter/hdp_ou_converter.js";
import {fileURLToPath} from "url";
import path from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

async function run() {
    const oddsPrefix = "";

    const browser = await testConnect();
    await injectCookies(browser);
    const page = await browser.newPage();

    const mq = new RabbitMQManager();
    mq.configure({queue: process.env.QUEUE_NAME});
    await mq.connect();

    await page.exposeFunction("pushOddsToNode", async (payload) => {
        try {
            if (payload != null) {
                const data = Array.isArray(payload) ? payload : Object.values(payload);
                console.log("data", data.length);
                const results = convertOddsHdpOu("today", data);
                console.log("results:", results.length);
                for (const market of results) {
                    await mq.publishJson(market);
                }
            }
        } catch (error) {
            console.log(`❌ console failed: ${error}\n`);
        }

    });

    // Catch console from iframes
    browser.on("targetcreated", async (target) => {
        try {
            const p = await target.page();
            if (p) p.on("console", (msg) => console.log("IFRAME:", msg.text()));
        } catch {
        }
    });

    // Function to inject observer into a frame
    async function injectObserver(frame) {
        await frame.evaluate((prefix) => {
            // ---------------------------
            // FULL SNAPSHOT EXTRACTOR
            // ---------------------------
            const extractData = () => {
                const result = [];

                const container = document.querySelector("#oTableContainer_D");
                if (!container) return result;

                const rows = container.querySelectorAll(
                    "tr[name='RleagueName'], tr[id^='tr_']"
                );

                let currentLeague = null;

                // Store fixture information because rows 2/3
                // do not contain visible team names.
                const fixtureCache = new Map();

                // ---------------------------------------------------------
                // Helpers
                // ---------------------------------------------------------

                const cleanText = (value = "") => {
                    return String(value)
                        .replace(/\u00a0/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();
                };

                const cleanTeamName = (value = "") => {
                    return cleanText(value)
                        .replace(/\s*\(N\)\s*/gi, "")
                        .trim();
                };

                const hashToInt = (str) => {
                    let h = 2166136261;

                    for (let i = 0; i < str.length; i++) {
                        h ^= str.charCodeAt(i);
                        h = Math.imul(h, 16777619);
                    }

                    return h >>> 0;
                };

                /**
                 * Examples:
                 *
                 * tr_88501541 -> 8850154
                 * tr_88501542 -> 8850154
                 * tr_88501543 -> 8850154
                 */
                const cleanFixtureId = (rowId = "") => {
                    const value = rowId.replace(/^tr_/, "");

                    if (!value) return "";

                    // Last digit = betting line row: 1, 2, 3
                    return value.slice(0, -1);
                };

                /**
                 * Examples:
                 *
                 * tr_88501541 -> 1
                 * tr_88501542 -> 2
                 * tr_88501543 -> 3
                 */
                const getRowLine = (rowId = "") => {
                    const value = rowId.replace(/^tr_/, "");

                    if (!value) return 0;

                    return Number(value.slice(-1)) || 0;
                };

                const extractTeams = (row) => {
                    const teamCell = row.querySelector("td#masrow");

                    if (!teamCell) {
                        return {
                            homeTeam: "",
                            awayTeam: "",
                            given: 0
                        };
                    }

                    const teamElements = Array.from(
                        teamCell.querySelectorAll(
                            "div.LetTeamClass, div.UnLetTeamClass"
                        )
                    );

                    const teams = teamElements
                        .map((element) => cleanTeamName(element.textContent))
                        .filter(Boolean);

                    const homeTeam = teams[0] || "";
                    const awayTeam = teams[1] || "";

                    const letTeam = cleanTeamName(
                        teamCell.querySelector("div.LetTeamClass")?.textContent || ""
                    );

                    let given = 0;

                    if (letTeam && homeTeam && letTeam === homeTeam) {
                        given = 1;
                    } else if (letTeam && awayTeam && letTeam === awayTeam) {
                        given = 2;
                    }

                    return {
                        homeTeam,
                        awayTeam,
                        given
                    };
                };

                const extractTime = (row) => {
                    const cell = row.querySelector("td.text_time");
                    if (!cell) return "";
                    const clone = cell.cloneNode(true);
                    return cleanText(clone.textContent);
                };

                /**
                 * Detect:
                 *
                 * 0<br>        -> given 1
                 * 0.5/1<br>    -> given 1
                 *
                 * <br>0/0.5    -> given 2
                 *
                 * Plain value  -> given 0
                 */
                const extractLine = (td) => {
                    const elements = Array.from(
                        td.querySelectorAll("div.HdpGoalClass")
                    );

                    if (!elements.length) {
                        return null;
                    }

                    // Normally one HdpGoalClass per market cell
                    const element = elements[0];

                    const html = (element.innerHTML || "")
                        .replace(/\u00a0/g, " ")
                        .trim();

                    if (!html) {
                        return null;
                    }

                    const startsWithBr = /^\s*<br\s*\/?>/i.test(html);
                    const endsWithBr = /<br\s*\/?>\s*$/i.test(html);

                    const lineValue = cleanText(
                        html.replace(/<br\s*\/?>/gi, " ")
                    );

                    if (!lineValue) {
                        return null;
                    }

                    let given = 0;

                    if (startsWithBr) {
                        given = 2;
                    } else if (endsWithBr) {
                        given = 1;
                    }

                    return {
                        line: lineValue,
                        given
                    };
                };

                const extractOdds = (td) => {
                    return Array.from(td.querySelectorAll("a[xid]"))
                        .map((anchor) => {
                            const xid = anchor.getAttribute("xid");
                            const value = cleanText(anchor.textContent);

                            if (!xid || !value) {
                                return null;
                            }

                            return {
                                xid,
                                value
                            };
                        })
                        .filter(Boolean);
                };

                const extractMarkets = (row) => {
                    return Array.from(row.querySelectorAll("td"))
                        .map((td, tdIndex) => {
                            const odds = extractOdds(td);

                            if (!odds.length) {
                                return null;
                            }

                            return {
                                index: tdIndex,
                                odds,
                                line: extractLine(td)
                            };
                        })
                        .filter(Boolean);
                };

                // ---------------------------------------------------------
                // Parse
                // ---------------------------------------------------------

                for (const row of rows) {
                    // =====================================================
                    // League row
                    // =====================================================

                    if (row.getAttribute("name") === "RleagueName") {
                        const leagueName = cleanText(
                            row.querySelector(".leagueName")?.textContent ||
                            row.textContent ||
                            ""
                        ).toUpperCase();

                        if (!leagueName) {
                            currentLeague = null;
                            continue;
                        }

                        currentLeague = {
                            league_id: hashToInt(leagueName),
                            league_name: leagueName,
                            fixtures: []
                        };

                        result.push(currentLeague);

                        continue;
                    }

                    // =====================================================
                    // Match row
                    // =====================================================

                    if (!currentLeague) {
                        continue;
                    }

                    const lineId = row.id?.trim();

                    if (!lineId) {
                        continue;
                    }

                    const fixtureId = cleanFixtureId(lineId);

                    if (!fixtureId) {
                        continue;
                    }

                    const rowLine = getRowLine(lineId);

                    // -----------------------------------------------------
                    // Get fixture data
                    // -----------------------------------------------------

                    let fixtureInfo = fixtureCache.get(fixtureId);

                    const extractedTeams = extractTeams(row);

                    // First row normally contains actual team names
                    if (
                        extractedTeams.homeTeam &&
                        extractedTeams.awayTeam
                    ) {
                        fixtureInfo = {
                            homeTeam: extractedTeams.homeTeam,
                            awayTeam: extractedTeams.awayTeam,
                            given: extractedTeams.given,
                            time: extractTime(row)
                        };

                        fixtureCache.set(fixtureId, fixtureInfo);
                    }

                    // If this is row 2/3, get info from first row
                    if (!fixtureInfo) {
                        continue;
                    }

                    // -----------------------------------------------------
                    // Markets
                    // -----------------------------------------------------

                    const markets = extractMarkets(row);

                    // Skip completely empty rows
                    if (!markets.length) {
                        continue;
                    }

                    // -----------------------------------------------------
                    // Add row
                    // -----------------------------------------------------

                    currentLeague.fixtures.push({
                        id: lineId,
                        fixture_id: fixtureId,
                        row_line: rowLine,
                        time: fixtureInfo.time,
                        team: {
                            homeTeam: fixtureInfo.homeTeam,
                            awayTeam: fixtureInfo.awayTeam,
                            given: fixtureInfo.given
                        },
                        markets
                    });
                }

                return result;
            };

            // expose extractor for reuse
            window.__extractOddsSnapshot = extractData;

            // ---------------------------
            // PUSH TO NODE (safe)
            // ---------------------------
            const pushSnapshot = () => {
                try {
                    const payload = extractData();
                    window.pushOddsToNode(payload);
                } catch (e) {
                    console.log("Snapshot push error:", String(e));
                }
            };

            // ---------------------------
            // MUTATION OBSERVER (live)
            // ---------------------------
            if (window.__oddsObserver) {
                try {
                    window.__oddsObserver.disconnect();
                } catch {
                }
                window.__oddsObserver = null;
            }

            const table = document.querySelector("#oTableContainer_D");
            if (!table) return;

            const observer = new MutationObserver(() => {
                pushSnapshot();
            });

            observer.observe(table, {childList: true, subtree: true});
            window.__oddsObserver = observer;

            // ---------------------------
            // 3-SECOND FULL SNAPSHOT TIMER
            // ---------------------------
            if (!window.__oddsSnapshotTimer) {
                window.__oddsSnapshotTimer = setInterval(() => {
                    pushSnapshot();
                }, 15_000);
            }

            // initial snapshot
            pushSnapshot();

        }, oddsPrefix);
    }


    // Function to detect iframe and inject observer
    async function initObserver() {
        await sleep(5000);
        const targetFrame = page
            .frames()
            .find(frame => frame.url().includes("Handicap/Today.aspx"));

        if (!targetFrame) return false;
        await injectObserver(targetFrame);
        console.log(`${targetFrame.url()}- ${new Date().toISOString()} -HDP OU Today observe!`);
        return true;
    }

    // 1 - Load session and main page
    await page.goto(process.env.SITE_BASE_URL, {waitUntil: "networkidle2"});
    console.log("Session URL loaded!");

    // Delay 5 seconds
    await sleep(3000);

    // 3 — Initial observer injection
    await initObserver();

    // 4 — Observe iframe replacements in DOM
    await page.exposeFunction("reinjectObserver", async () => {
        await initObserver();
    });

    await page.evaluate(() => {
        const observer = new MutationObserver(() => {
            window.reinjectObserver();
        });
        observer.observe(document.body, {childList: true, subtree: true});
    });

    // 5 — Detect full page reload
    page.on("framenavigated", async (frame) => {
        if (frame === page.mainFrame()) {
            console.log("Main page reloaded → re-injecting observer...");
            await initObserver();
        }
    });


    console.log("Live tracking initialized — ready!");

    // Keep script running
    await new Promise(() => {
    });
}

run().catch((err) => console.error("Error:", err));
