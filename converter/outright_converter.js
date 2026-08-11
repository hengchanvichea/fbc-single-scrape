import {mergeByFixtureId} from "../supports/merge_line.js";
import {filterChanged} from "../supports/filter_changed.js";
import {get as cacheGet, set as cacheSet} from "../supports/cache.js";
import {
    buildMessage,
    hasLeague,
    hasMarker,
    isNotVirtual,
    parseMatchId,
    parseOutrightMatchTime
} from "../supports/fixture.js";
import {oneXTwoOutrightOdds} from "../build_market/one_x_two_odds.js";
import {ticketMarketType} from "../supports/ticket_market_type.js";
export function convertOddsOutright(data) {
    const type = cacheGet(`outright_type`)===3? 3 : 0;
    const result = [];
    for (const item of data) {
        if(
            item.league_id &&
            item.league_name &&
            isNotVirtual(item.league_name)
        ) {
            if (hasLeague(item.league_name)) continue;
            const leagueName = item.league_name;
            const matches = item.fixtures;

            for (const match of matches) {
                const markets = [];
                const homeTeam = match.team;
                const awayTeam = match.team;
                if (hasMarker(homeTeam) || hasMarker(awayTeam)) continue;
                const matchId = parseMatchId(match.fixture_id);
                const dateTime = parseOutrightMatchTime(match.time);
                const odds = match.markets?.[0]?.value;

                let outright1x2Odds = oneXTwoOutrightOdds(matchId,ticketMarketType._1X2,odds);
                if(outright1x2Odds){
                    markets.push(outright1x2Odds);
                }

                if(markets.length>0){
                    result.push(buildMessage(
                        type,
                        matchId,
                        leagueName,
                        null,
                        dateTime,
                        homeTeam,
                        awayTeam,
                        markets,
                        2
                    ));
                }
            }
        }
    }
    if(result.length>0){
        if(type===0){
            cacheSet(`outright_type`,3,5*60);
            return mergeByFixtureId(result);
        }
        const changedResult = filterChanged(result);
        if(changedResult.length>0){
            return changedResult;
        }

    }
    return [];
}

