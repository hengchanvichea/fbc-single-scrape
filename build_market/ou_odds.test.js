import {ticketMarketType} from "../supports/ticket_market_type.js";
import {ouOdds} from "./ou_odds.js";

it('should ou odds converter', () => {
    const matchId = 12345;
    const marketId = ticketMarketType.AsianHandicap;
    const oupData = ouOdds(
        matchId,
        marketId,
        [
            {
                "xid": "36266154141941767_1",
                "value": "0.81"
            },
            {
                "xid": "36266154141941767_2",
                "value": "0.91"
            }
        ],
        {
            "line": "1.5-2",
            "given": 1
        }
    );
    console.log(JSON.stringify(oupData));
    expect(oupData.Id).toBe(marketId);
    expect(oupData.ProviderMarkets[0].Bets.length).toBe(2);
});