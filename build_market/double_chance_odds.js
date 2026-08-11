import {enrichMarketPrices} from "../supports/price.js";
import {providerId, providerName} from "../supports/provider.js";
import {isMissing} from "../supports/helper.js";

export function dcOdds(matchId, marketId, _1XOdds, _12Odds, _2XOdds) {
    if (isMissing(_1XOdds) || isMissing(_12Odds) || isMissing(_2XOdds)) return null;
    return buildDcMarket(
        matchId,
        marketId,
        _1XOdds,
        _12Odds,
        _2XOdds
    );
}

function buildDcMarket(matchId, marketId, _1XOdds, _12Odds, _2XOdds) {
    const nowIso = new Date().toISOString();
    const prefix = `${matchId}_${marketId}`;
    return enrichMarketPrices({
        Id: marketId,
        Name: "DoubleChance",
        ProviderMarkets: [
            {
                Id: providerId,
                Name: providerName,
                LastUpdate: nowIso,
                SerializedLastUpdate: nowIso,
                Bets: [
                    {
                        Id: `${prefix}_1x`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "1X",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: _1XOdds,
                        Price: _1XOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_12`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "12",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: _12Odds,
                        Price: _12Odds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2x`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2X",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: _2XOdds,
                        Price: _2XOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    }
                ]
            }
        ]
    });
}
