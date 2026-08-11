import {RabbitMQManager} from "./rabbitmq/rabbitmq_manager.js";
import {injectCookies, testConnect} from "./src/browser.js";
import sleep from "./supports/sleep.js";
import {convertOddsHdpOu} from "./converter/hdp_ou_converter.js";

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
                // console.log("data", data.length);
                // const results = convertOddsHdpOu("today", data);
                // console.log("results:", results.length);
                // for (const market of results) {
                //     await mq.publishJson(market);
                // }
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
                if (!container) return [];
                const rows = container.querySelectorAll("tr[id], tr[name]");
                let currentLeague = null;
                for (const row of rows) {
                    const rowId = row.id?.trim();
                    const rowName = row.getAttribute("name")?.trim();
                    const key = rowId || `name_${rowName}`;
                    if (!key) continue;
                    const hashToInt = (str) => {
                        let h = 2166136261; // FNV-1a seed
                        for (let i = 0; i < str.length; i++) {
                            h ^= str.charCodeAt(i);
                            h = Math.imul(h, 16777619);
                        }
                        return h >>> 0;
                    };
                    if (rowName) {
                        const leagueNameCell = row.querySelector("td.leagueName");
                        const leagueName = (leagueNameCell?.innerText || row.innerText || "").trim().toUpperCase();

                        currentLeague = {
                            league_id: hashToInt(leagueName),
                            league_name: leagueName,
                            fixtures: [],
                        };
                        result.push(currentLeague);
                        continue;
                    }
                    if (rowId && currentLeague) {

                        const cleanText = (s) => (s || "").replace(/\s+/g, " ").trim();

                        const extractTeams = (row) => {
                            const teamCell = row.querySelector("td.none_rline");
                            if (!teamCell) return {homeTeam: "", awayTeam: ""};

                            // Handles:
                            // 1) Let + UnLet
                            // 2) UnLet + UnLet
                            // 3) Let + Let
                            const teams = Array.from(
                                row.querySelectorAll("div.LetTeamClass,div.UnLetTeamClass")
                            )
                                .map((el) => cleanText(el.textContent))
                                .filter(Boolean);

                            return {
                                homeTeam: (teams[0] || "").replace("(N)", "").trim(),
                                awayTeam: (teams[1] || "").replace("(N)", "").trim(),
                            };
                        };
                        const cleanFixtureId = (id) => {
                            return id.split("_")[1].slice(0, -1);
                        }
                        const {homeTeam, awayTeam} = extractTeams(row);
                        const letTeam = row.querySelector("div.LetTeamClass")?.textContent.trim() ?? "";
                        const given = letTeam === homeTeam ? 1 : letTeam === awayTeam ? 2 : 0;
                        const time = row.querySelector("td.text_time")?.textContent ?? "";
                        if (!homeTeam || !awayTeam) continue;

                        const cellData = {homeTeam, awayTeam, given};

                        const lineId = row.getAttribute("id");
                        const fixtureId = cleanFixtureId(lineId);


                        const oddsByTd = Array.from(row.querySelectorAll("td"))
                            .map((td, tdIndex) => {
                                const htmlLine = Array.from(td.querySelectorAll("div.HdpGoalClass"))
                                    .map(div => div.innerHTML?.trim()).join("") || null;
                                let line = null;
                                if (htmlLine) {
                                    function getBrSide(html) {
                                        const s = (html || "").replace(/\u00a0/g, " ").trim();
                                        const isLeft = /^\s*<br\s*\/?>/i.test(s);      // "<br>1.5/2"
                                        const isRight = /<br\s*\/?>\s*$/i.test(s);     // "1.5/2<br>"
                                        if (isLeft) return 2;
                                        if (isRight) return 1;
                                        return 0; // no br at edge / unknown
                                    }

                                    const given = getBrSide(htmlLine);
                                    const lineValue = htmlLine.replace(/<br\s*\/?>/gi, "").trim();
                                    line = {line: lineValue, given};
                                }

                                const items = Array.from(td.querySelectorAll("a[xid]")).map((a) => ({
                                    xid: a.getAttribute("xid"),
                                    value: a.textContent?.trim() || '',
                                }));

                                if (!items.length) return null;

                                return {
                                    index: tdIndex,
                                    odds: items,
                                    line,
                                };
                            })
                            .filter(Boolean);

                        currentLeague.fixtures.push({
                            id: lineId,
                            time: time,
                            fixture_id: fixtureId,
                            team: cellData,
                            markets: oddsByTd,
                        });
                    }
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
        let targetFrame = null;
        const frames = page.frames();
        await sleep(5000);
        for (const mainFrame of frames) {
            // Delay 3 seconds
            const childFrames = mainFrame.childFrames();
            for (const f of childFrames) {
                try {
                    if (f.url().includes("Handicap/Today.aspx")) {
                        targetFrame = f;
                        break;
                    }
                } catch {
                }
            }

        }

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
