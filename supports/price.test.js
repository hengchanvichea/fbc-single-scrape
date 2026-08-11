import {providerId, providerName} from "./provider.js";
import {ticketMarketType} from "./ticket_market_type.js";
import {enrichMarketPrices} from "./price.js";

it('should convert 1x2 to price', () => {
    const nowIso = new Date().toISOString();
    const matchId = 12345;
    const marketId = ticketMarketType._1X2; // assuming this is the correct market ID
    const homeOdds = 2.5;
    const drawOdds = 3.2;
    const awayOdds = 2.8;
    const prefix = `${matchId}_${marketId}_0`;
    const market = {
        Id: marketId,
        Name: "1X2",
        ProviderMarkets: [
            {
                Id: providerId,
                Name: providerName,
                LastUpdate: nowIso,
                SerializedLastUpdate: nowIso,
                Bets: [
                    {
                        Id: `${prefix}_1`,             // put your own ID logic here
                        Probability: null,              // or compute from odds if needed
                        CalculatedMargin: null,
                        Name: "1",                      // home
                        Status: 1,
                        StartPrice: homeOdds,
                        Price: homeOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_x`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "X",                      // draw
                        Status: 1,
                        StartPrice: drawOdds,
                        Price: drawOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2",                      // away
                        Status: 1,
                        StartPrice: awayOdds,
                        Price: awayOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    }
                ]
            }
        ]
    };
    const result = enrichMarketPrices(market);
    expect(result.Id).toEqual(marketId);
    expect(result.ProviderMarkets[0].Bets.length).toEqual(3);
});