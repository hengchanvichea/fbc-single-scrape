import {enrichMarketPrices} from "../supports/price.js";
import {providerId, providerName} from "../supports/provider.js";

export function csOdds(matchId, marketId, odds) {
    return buildCsBets(
        matchId,
        marketId,
        odds
    );
}


function buildCsBets(matchId, marketId, odds) {
    const nowIso = new Date().toISOString();
    const prefix = `${matchId}_${marketId}`;
    const bets = odds
        .filter(item => Number.isFinite(Number(item.value)) &&
            (/^\d+:\d+$/.test(item.score) || item.score === "Aos")
        )
        .map(item => ({
            Id: `${prefix}_${item.score.replace(":", "_")}`,
            Probability: null,
            CalculatedMargin: null,
            Name: item.score.replace(":", "-"),
            Status: 1,
            Line: null,
            BaseLine: null,
            StartPrice: item.value,
            Price: item.value,
            ProviderBetId: providerId,
            LastUpdate: nowIso,
        }));

    return enrichMarketPrices({
        Id: marketId,
        Name: "CorrectScore",
        ProviderMarkets: [
            {
                Id: providerId,
                Name: providerName,
                LastUpdate: nowIso,
                SerializedLastUpdate: nowIso,
                Bets: bets,
            }
        ]
    });
}