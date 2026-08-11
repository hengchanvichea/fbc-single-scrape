import {ticketMarketType} from "../supports/ticket_market_type.js";
import {changeType, mergeByFixtureId} from "../supports/merge_line.js";
import {filterChanged} from "../supports/filter_changed.js";
import {get as cacheGet, set as cacheSet} from "../supports/cache.js";
import {htFtOdds} from "../build_market/ht_ft_odds.js";
import {
    buildMessage,
    hasLeague, hasMarker,
    isNotVirtual,
    parseMatchId,
    parseMatchTime
} from "../supports/fixture.js";

export function convertOddsHtFt(date, data) {
    const type = cacheGet(`${date}_ht_ft_type`) === 3 ? 3 : 0;
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
                const oddHH = match.markets?.[0]?.value;
                const oddHD = match.markets?.[1]?.value;
                const oddHA = match.markets?.[2]?.value;
                const oddDH = match.markets?.[3]?.value;
                const oddDD = match.markets?.[4]?.value;
                const oddDA = match.markets?.[5]?.value;
                const oddAH = match.markets?.[6]?.value;
                const oddAD = match.markets?.[7]?.value;
                const oddAA = match.markets?.[8]?.value;

                const htFTOdds = htFtOdds(
                    matchId,
                    ticketMarketType.HtFt,
                    oddHH,
                    oddHD,
                    oddHA,
                    oddDH,
                    oddDD,
                    oddDA,
                    oddAH,
                    oddAD,
                    oddAA,
                );

                if (htFTOdds != null) {
                    markets.push(htFTOdds);
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
            cacheSet(`${date}_ht_ft_type`, 3, 9*60);
            return mergeByFixtureId(result);
        }

        const needRemoveLine = cacheGet(`${date}_ht_ft_remove_old_line`)??false;
        if(!needRemoveLine){
            cacheSet(`${date}_ht_ft_remove_old_line`,true,60);
            return changeType(mergeByFixtureId(result),1);
        }

        const changedResult = filterChanged(result);
        if(changedResult.length>0){
            return changedResult;
        }

    }
    return [];

}
