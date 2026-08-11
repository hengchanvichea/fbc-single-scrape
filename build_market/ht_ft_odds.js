import {enrichMarketPrices} from "../supports/price.js";
import {providerId, providerName} from "../supports/provider.js";
import {isMissing} from "../supports/helper.js";

export function htFtOdds(
    matchId,
    marketId,
    hh,
    hd,
    ha,
    dh,
    dd,
    da,
    ah,
    ad,
    aa
) {
    if(
        isMissing(hh) ||
        isMissing(hd) ||
        isMissing(ha) ||
        isMissing(dh) ||
        isMissing(dd) ||
        isMissing(da) ||
        isMissing(ah) ||
        isMissing(ad) ||
        isMissing(aa)
    )
        return  null;
    return buildHTFTMarket(
        matchId,
        marketId,
        hh,
        hd,
        ha,
        dh,
        dd,
        da,
        ah,
        ad,
        aa
    );
}

function buildHTFTMarket(
    matchId,
    marketId,
    hh,
    hd,
    ha,
    dh,
    dd,
    da,
    ah,
    ad,
    aa
) {
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
                        Id: `${prefix}_1/1`,             // put your own ID logic here
                        Probability: null,              // or compute from odds if needed
                        CalculatedMargin: null,
                        Name: "1/1",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: hh,
                        Price: hh,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_1/X`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "1/X",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: hd,
                        Price: hd,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_1/2`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "1/2",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: ha,
                        Price: ha,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_X/1`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "X/1",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: dh,
                        Price: dh,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_X/X`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "X/X",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: dd,
                        Price: dd,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_X/2`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "X/2",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: da,
                        Price: da,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2/1`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2/1",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: ah,
                        Price: ah,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2/1`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2/1",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: ah,
                        Price: ah,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2/X`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2/X",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: ad,
                        Price: ad,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2/2`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2/2",
                        Status: 1,
                        Line: null,
                        BaseLine: null,
                        StartPrice: aa,
                        Price: aa,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                ]
            }
        ]
    });
}
