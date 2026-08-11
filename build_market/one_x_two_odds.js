import {providerId, providerName} from "../supports/provider.js";
import {enrichMarketPrices} from "../supports/price.js";

export function oneXTwoOdds(matchId,marketId,oneXTwoData) {
    if(oneXTwoData==null) return null;
    const ftHomeOdds = oneXTwoData[0]['value'];
    const ftAwayOdds = oneXTwoData[1]['value'];
    const ftDrawOdds = oneXTwoData[2]['value'];
    return build1x2Market(
        matchId,
        marketId,
        parseFloat(ftHomeOdds),
        parseFloat(ftDrawOdds),
        parseFloat(ftAwayOdds)
    );
}


export function oneXTwoOutrightOdds(matchId,marketId,homeOdds) {
    if(homeOdds==null) return null;
    return build1x2Market(
        matchId,
        marketId,
        parseFloat(homeOdds),
        parseFloat('1.0'),
        parseFloat('1.0')
    );
}

function build1x2Market(matchId, marketId, homeOdds, drawOdds, awayOdds) {
    const nowIso = new Date().toISOString();
    const prefix = `${matchId}_${marketId}_0`;
    return enrichMarketPrices({
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
    });
}
