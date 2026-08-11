import {ticketMarketType} from "../supports/ticket_market_type.js";
import {changeType, mergeByFixtureId} from "../supports/merge_line.js";
import {filterChanged} from "../supports/filter_changed.js";
import {get as cacheGet, set as cacheSet} from "../supports/cache.js";
import {oeOdds} from "../build_market/oe_odds.js";
import {
    buildMessage,
    hasLeague, hasMarker,
    isNotVirtual,
    parseMatchId,
    parseMatchTime
} from "../supports/fixture.js";

export function convertOddsOe(date, data) {
    const type = cacheGet(`${date}_ft_oe_type`) === 3 ? 3 : 0;
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
                const odds = match.markets?.[0]?.value;
                const even = match.markets?.[1]?.value;

                // Full Time OU odds
                const ftOEOdds = oeOdds(matchId, ticketMarketType.OddEven, odds, even);
                if (ftOEOdds != null) {
                    markets.push(ftOEOdds);
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
            cacheSet(`${date}_ft_oe_type`, 3, 8 * 60);
            return mergeByFixtureId(result);
        }

        const needRemoveLine = cacheGet(`${date}_ft_oe_remove_old_line`) ?? false;
        if (!needRemoveLine) {
            cacheSet(`${date}_ft_oe_remove_old_line`, true, 60);
            return changeType(mergeByFixtureId(result), 1);
        }

        const changedResult = filterChanged(result);
        if (changedResult.length > 0) {
            return changedResult;
        }

    }
    return [];
}

