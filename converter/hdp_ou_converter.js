import {ticketMarketType} from "../supports/ticket_market_type.js";
import {oneXTwoOdds} from "../build_market/one_x_two_odds.js";
import {hdpOdds} from "../build_market/hdp_odds.js";
import {ouOdds} from "../build_market/ou_odds.js";
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
import {marketOdds} from "../supports/market.js";

export function convertOddsHdpOu(date, data) {
    const type = cacheGet(`${date}_hdp_ou_type`) === 3 ? 3 : 0;
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
                const {homeTeam, awayTeam, given} = match.team;
                if (hasMarker(homeTeam) || hasMarker(awayTeam)) continue;
                const matchId = parseMatchId(match.fixture_id);
                const time = parseMatchTime(match.time);

                // --------------- To be implemented ---------------
                let ft1x2Odds = null, ftHDPOdds = null, ftOUOdds = null;
                let ht1x2Odds = null, htHDPOdds = null, htOUOdds = null;
                // Full Time 1x2 or Handicap
                const fullTime1x2 = marketOdds(match.markets, 2);
                if (fullTime1x2) {
                    ft1x2Odds = oneXTwoOdds(matchId, ticketMarketType._1X2, fullTime1x2.odds);
                    markets.push(ft1x2Odds);
                }
                // Full Time Handicap odds
                const fullTimeHdp = marketOdds(match.markets, 3);
                if (fullTimeHdp) {
                    ftHDPOdds = hdpOdds(matchId, ticketMarketType.AsianHandicap, fullTimeHdp.odds, fullTimeHdp.line);
                    markets.push(ftHDPOdds);
                }
                // Full Time OU odds
                const fullTimeOU = marketOdds(match.markets, 4);
                if (fullTimeOU) {
                    ftOUOdds = ouOdds(matchId, ticketMarketType.AsianUnderOver, fullTimeOU.odds, fullTimeOU.line);
                    markets.push(ftOUOdds);
                }
                // Half Time 1x2
                const halfTime1x2 = marketOdds(match.markets, 5);
                if (halfTime1x2) {
                    ht1x2Odds = oneXTwoOdds(matchId, ticketMarketType._1X21stPeriod, halfTime1x2.odds);
                    markets.push(ht1x2Odds);
                }
                const halfTimeHdp = marketOdds(match.markets, 6);
                if (halfTimeHdp) {
                    htHDPOdds = hdpOdds(matchId, ticketMarketType.AsianHandicap1stPeriod, halfTimeHdp.odds, halfTimeHdp.line);
                    markets.push(htHDPOdds);
                }
                const halfTimeOU = marketOdds(match.markets, 7);
                if (halfTimeOU) {
                    htOUOdds = ouOdds(
                        matchId,
                        ticketMarketType.AsianUnderOver1stPeriod,
                        halfTimeOU.odds,
                        halfTimeOU.line
                    );
                    markets.push(htOUOdds);
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
            cacheSet(`${date}_hdp_ou_type`, 3, 5 * 60); // Type = 0 => Send All Line and Market
            return mergeByFixtureId(result);
        }
        const needRemoveLine = cacheGet(`${date}_hdp_ou_remove_old_line`) ?? false;
        if (!needRemoveLine) {
            cacheSet(`${date}_hdp_ou_remove_old_line`, true, 60);
            return changeType(mergeByFixtureId(result), 1);// Type = 1 => Send All Line and Market for remove
        }
        const changedResult = filterChanged(result);// Type = 3 => Send only change Line
        if (changedResult.length > 0) {
            return changedResult;
        }

    }
    return [];
}

