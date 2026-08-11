import {mapLine} from "../supports/helper.js";
import {enrichMarketPrices} from "../supports/price.js";
import {providerId, providerName} from "../supports/provider.js";
export function ouOdds(matchId,marketId,ouData,ouLine) {
    if(ouData==null) return null;
    let overOdds = ouData[0]['value'];
    let underOdds = ouData[1]['value'];
    const line = mapLine(ouLine.line);
    underOdds = parseFloat(underOdds)+1;// convert to decimal odds
    overOdds = parseFloat(overOdds)+1;// convert to decimal odds
    return buildOUMarket(
        matchId,
        marketId,
        line,
        underOdds,
        overOdds
    );
}

function buildOUMarket(matchId, marketId, line, underOdds, overOdds) {
    const nowIso = new Date().toISOString();
    const prefix = `${matchId}_${marketId}_${line}`;
    return enrichMarketPrices({
        Id: marketId,
        Name: "AsianUnderOver",
        MainLine: `${line}`,
        ProviderMarkets: [
            {
                Id: providerId,
                Name: providerName,
                LastUpdate: nowIso,
                SerializedLastUpdate: nowIso,
                Bets: [
                    {
                        Id: `${prefix}_under`,             // put your own ID logic here
                        Probability: null,              // or compute from odds if needed
                        CalculatedMargin: null,
                        Name: "Under",                      // home
                        Status: 1,
                        Line: `${line}`,
                        BaseLine: `${line}`,
                        StartPrice: underOdds,
                        Price: underOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_over`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "Over",                      // away
                        Status: 1,
                        Line: `${line}`,
                        BaseLine: `${line}`,
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
