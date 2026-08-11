import {changeType, mergeByFixtureId} from "../supports/merge_line.js";
import {filterChanged} from "../supports/filter_changed.js";
import {get as cacheGet, set as cacheSet} from "../supports/cache.js";
import {
    buildMessage,
    hasLeague,
    hasMarker,
    isNotVirtual,
    parseMatchId,
    parseMatchTime
} from "../supports/fixture.js";
import {csOdds} from "../build_market/correct_score_odds.js";
import {ticketMarketType} from "../supports/ticket_market_type.js";

export function convertOddsCs(date, data) {
    const type = cacheGet(`${date}_cs_type`) === 3 ? 3 : 0;
    const result = [];
    for (const item of data) {
        if (
            item.league_id &&
            item.league_name &&
            isNotVirtual(item.league_name)
        ) {
            if (hasLeague(item.league_name)) continue;
            const leagueName = item.league_name;
            const matches = item.fixtures;

            for (const match of matches) {
                const markets = [];
                const {homeTeam, awayTeam} = match.team;
                if (hasMarker(homeTeam) || hasMarker(awayTeam)) continue;
                const matchId = parseMatchId(match.fixture_id);
                const time = parseMatchTime(match.time);

                // Full Time Correct Score
                const ftCSOdds = csOdds(
                    matchId,
                    ticketMarketType.CorrectScore,
                    match.markets
                );

                if (ftCSOdds) {
                    markets.push(ftCSOdds);
                }

                if (markets.length > 0) {
                    result.push(buildMessage(
                        type,
                        matchId,
                        leagueName,
                        null,
                        time,
                        homeTeam,
                        awayTeam,
                        markets
                    ));
                }
            }
        }
    }
    if (result.length > 0) {
        if (type === 0) {
            cacheSet(`${date}_cs_type`, 3, 12 * 60);
            return mergeByFixtureId(result);
        }

        const needRemoveLine = cacheGet(`${date}_cs_remove_old_line`) ?? false;
        if (!needRemoveLine) {
            cacheSet(`${date}_cs_remove_old_line`, true, 60);
            return changeType(mergeByFixtureId(result), 1);
        }

        const changedResult = filterChanged(result);
        if (changedResult.length > 0) {
            return changedResult;
        }

    }
    return [];
}



