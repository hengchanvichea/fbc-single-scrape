import {enrichMarketPrices} from "../supports/price.js";
import {providerId, providerName} from "../supports/provider.js";
import {isMissing} from "../supports/helper.js";

export function oeOdds(matchId, marketId, oddOdds, evenOdds) {
    if(isMissing(oddOdds) || isMissing(evenOdds)) return null;
    oddOdds = parseFloat(oddOdds) + 1;// convert to decimal odds
    evenOdds = parseFloat(evenOdds) + 1;// convert to decimal odds
    return buildOUMarket(
        matchId,
        marketId,
        oddOdds,
        evenOdds
    );
}

function buildOUMarket(matchId, marketId, underOdds, overOdds) {
    const nowIso = new Date().toISOString();
    const prefix = `${matchId}_${marketId}`;
    return enrichMarketPrices({
        Id: marketId,
        Name: "OddEven",
        ProviderMarkets: [
            {
                Id: providerId,
                Name: providerName,
                LastUpdate: nowIso,
                SerializedLastUpdate: nowIso,
                Bets: [
                    {
                        Id: `${prefix}_odd`,             // put your own ID logic here
                        Probability: null,              // or compute from odds if needed
                        CalculatedMargin: null,
                        Name: "Odd",                      // home
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: underOdds,
                        Price: underOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_even`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "Even",                      // away
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: overOdds,
                        Price: overOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    }
                ]
            }
        ]
    });
}
