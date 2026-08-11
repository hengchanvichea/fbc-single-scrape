import {ticketMarketType} from "../supports/ticket_market_type.js";
import {hdpOdds} from "./hdp_odds.js";

it('should hdp odds converter', () => {
    const matchId = 12345;
    const marketId = ticketMarketType.AsianHandicap;
    const hdpData = hdpOdds(
        matchId,
        marketId,
        [
            {
                "xid": "36266154175496192_1",
                "value": "2.89"
            },
            {
                "xid": "36266154175496192_2",
                "value": "2.34"
            },
            {
                "xid": "36266154175496192_3",
                "value": "2.66"
            }
        ],
        {
            "line": "0",
            "given": 1
        }

    );
    expect(hdpData.Id).toBe(marketId);
    expect(hdpData.ProviderMarkets[0].Bets.length).toBe(2);
});