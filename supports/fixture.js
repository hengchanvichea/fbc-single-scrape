import {generateId} from "./helper.js";

export function buildMessage(type, matchId, league, leagueIcon, time, homeTeam, awayTeam, markets = [], sportId = 1) {
    return {
        Header: {
            Type: type,
            MsgGuid: crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-0000-0000-000000000000",
            ServerTimestamp: Date.now()
        },
        Body: {
            Events: [
                {
                    FixtureId: matchId,
                    Fixture: {
                        Subscription: {
                            Type: 2,
                            Status: 1
                        },
                        Sport: {
                            Id: sportId,
                            Name: "Soccer"
                        },
                        Location: null,
                        League: {
                            Id: generateId(league),
                            Name: league,
                            Icon: leagueIcon
                        },
                        StartDate: time,
                        LastUpdate: new Date().toISOString(),
                        Status: 1,
                        Participants: [
                            {
                                Id: generateId(homeTeam),
                                Name: homeTeam,
                                Position: "1"
                            },
                            {
                                Id: generateId(awayTeam),
                                Name: awayTeam,
                                Position: "2"
                            }
                        ],
                        FixtureExtraData: null
                    },
                    Livescore: null,
                    Markets: markets
                }
            ]
        }
    };
}


export function parseMatchTime(timeStr) {
    const now = new Date();

    try {
        if (typeof timeStr !== "string" || !timeStr.trim()) {
            throw new Error("Time must be a non-empty string");
        }

        const cleaned = timeStr
            .trim()
            .replace(/live$/i, "")
            .trim();

        const match = cleaned.match(
            /^(?:(\d{1,2})\/(\d{1,2})\s*)?(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
        );

        if (!match) {
            throw new Error(`Unsupported time format: ${timeStr}`);
        }

        const day = match[1]
            ? Number.parseInt(match[1], 10)
            : now.getDate();

        const month = match[2]
            ? Number.parseInt(match[2], 10)
            : now.getMonth() + 1;

        let hour = Number.parseInt(match[3], 10);
        const minute = Number.parseInt(match[4], 10);
        const ampm = match[5]?.toUpperCase();

        if (month < 1 || month > 12) {
            throw new Error(`Invalid month: ${month}`);
        }

        if (minute < 0 || minute > 59) {
            throw new Error(`Invalid minute: ${minute}`);
        }

        if (ampm) {
            if (hour < 1 || hour > 12) {
                throw new Error(`Invalid 12-hour value: ${hour}`);
            }

            if (ampm === "PM" && hour !== 12) hour += 12;
            if (ampm === "AM" && hour === 12) hour = 0;
        } else if (hour < 0 || hour > 23) {
            throw new Error(`Invalid 24-hour value: ${hour}`);
        }

        const year = now.getFullYear();

        // Interpret the input as local time.
        const result = new Date(
            year,
            month - 1,
            day,
            hour,
            minute,
            0,
            0
        );

        // Detect invalid dates such as 31/02.
        if (
            result.getFullYear() !== year ||
            result.getMonth() !== month - 1 ||
            result.getDate() !== day
        ) {
            throw new Error(`Invalid date: ${day}/${month}`);
        }

        // toISOString() converts the local Date to UTC.
        return result.toISOString();
    } catch (error) {
        console.error("parseMatchTime error:", error);
        return now.toISOString();
    }
}

export function parseOutrightMatchTime(dateStr) {
    // examples: "18/11/2026"
    const now = new Date();
    try {
        const [day, month, year] = dateStr.split("/");
        let hour = 0;
        const minute = 0;
        return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)).toISOString();
    } catch (e) {
        return now
    }
}

export function parseMatchId(matchIdRaw) {
    const cleaned = String(matchIdRaw).replaceAll("|", "").trim();
    // Use BigInt for IDs larger than Number.MAX_SAFE_INTEGER
    return `2${cleaned}`;
}

export function isNotESport(leagueIcon) {
    return leagueIcon && !leagueIcon.includes("Flags/136.png");
}

export function isNotMLS(leagueIcon) {
    return leagueIcon && !leagueIcon.includes("Flags/43.png");
}

export function isNotVirtual(leagueName) {
    return !leagueName.includes("Virtual")
}

export function hasMarker(team) {
    return team.includes("(V)") || team.includes('+');
}

export function hasLeague(name) {
    const leagueNames = process.env.LEAGUE.split(',');
    return leagueNames.includes(name);
}
