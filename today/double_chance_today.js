import {RabbitMQManager} from "../rabbitmq/rabbitmq_manager.js";
import {injectCookies, testConnect} from "../src/browser.js";
import sleep from "../supports/sleep.js";
import {convertOddsDc} from "../converter/double_chance_converter.js";
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
                const results = convertOddsDc("today", data);
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

                const container = document.querySelector("#oTableContainer_D");
                if (!container) return [];


                const cleanText = (s = "") =>
                    s.replace(/\s+/g, " ").trim();


                const hashToInt = (str) => {
                    let h = 2166136261;

                    for (let i = 0; i < str.length; i++) {
                        h ^= str.charCodeAt(i);
                        h = Math.imul(h, 16777619);
                    }
                    return h >>> 0;
                };

                const parseFixtureId = (id) => {
                    return id.split("_")[1].slice(0, -1);
                };

                const extractLeague = (row) => {
                    const leagueName =
                        cleanText(
                            row.querySelector(".leagueName")?.textContent ||
                            row.textContent
                        )
                            .toUpperCase();

                    return {
                        league_id: hashToInt(leagueName),
                        league_name: leagueName,
                        fixtures: []
                    };
                };


                const extractTeams = (row) => {
                    const teamCell = row.querySelector(
                        "td.UnLetTeamClass, td.LetTeamClass"
                    );

                    if (!teamCell) {
                        return {
                            homeTeam: "",
                            awayTeam: ""
                        };
                    }

                    const teams = teamCell.innerText
                        .split("-VS-")
                        .map(t => cleanText(t))
                        .filter(Boolean)
                        .map(t => t.replace("(N)", "").trim());

                    return {
                        homeTeam: teams[0] || "",
                        awayTeam: teams[1] || ""
                    };
                };

                const extractMarkets = (row) => {
                    return [...row.querySelectorAll("a[xid]")].map(a => ({
                        xid: a.getAttribute("xid"),
                        value: cleanText(a.textContent)
                    }));
                };

                const result = [];
                let currentLeague = null;

                const rows = container.querySelectorAll(
                    "tr[id], tr[name]"
                );

                for (const row of rows) {
                    const rowName =
                        row.getAttribute("name")?.trim();

                    // League header
                    if (rowName) {
                        currentLeague = extractLeague(row);
                        result.push(currentLeague);
                        continue;
                    }

                    // Fixture row
                    if (!currentLeague) continue;

                    const rowId = row.id?.trim();
                    if (!rowId) continue;

                    const {
                        homeTeam,
                        awayTeam
                    } = extractTeams(row);

                    if (!homeTeam || !awayTeam)
                        continue;

                    currentLeague.fixtures.push({
                        id: rowId,
                        fixture_id: parseFixtureId(rowId),
                        time: cleanText(
                            row.querySelector("td.text_time")
                                ?.textContent
                        ),
                        team: {homeTeam, awayTeam},
                        markets: extractMarkets(row)

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
            .find(frame => frame.url().includes("Handicap/OneX2.aspx"));

        if (!targetFrame) return false;
        await injectObserver(targetFrame);
        console.log(`${targetFrame.url()}- ${new Date().toISOString()} -DC Today observe!`);
        return true;
    }

    async function goToDC() {
        let targetFrame = null;
        const frames = page.frames();
        await sleep(5000);
        for (const mainFrame of frames) {
            // Delay 3 seconds
            const childFrames = mainFrame.childFrames();
            for (const f of childFrames) {
                try {
                    if (f.url().includes("Menu.aspx")) {
                        targetFrame = f;
                        break;
                    }
                } catch {
                }
            }

        }

        if (!targetFrame) return;

        await targetFrame.evaluate(() => {
            document.querySelector('[id="1_1X2"] a').click();
        });
    }

    // 1 - Load session and main page
    await page.goto(process.env.SITE_BASE_URL, {waitUntil: "networkidle2"});
    await goToDC();
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
