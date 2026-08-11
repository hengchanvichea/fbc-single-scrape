import {makeHdpLines, mapLine} from "../supports/helper.js";
import {enrichMarketPrices} from "../supports/price.js";
import {providerId, providerName} from "../supports/provider.js";

export function hdpOdds(matchId, marketId, hdpData, hdpLine) {
    if (hdpData == null) return null;
    let homeOdds = hdpData[0]['value'];
    let awayOdds = hdpData[1]['value'];
    let line = null;
    if (hdpLine['given'] === 1) {
        line = "-" + mapLine(hdpLine['line']);
    }
    if (hdpLine['given'] === 2) {
        line = "+" + mapLine(hdpLine['line']);
    }
    homeOdds = parseFloat(homeOdds) + 1;// convert to decimal odds
    awayOdds = parseFloat(awayOdds) + 1;// convert to decimal odds
    return buildHDPMarket(
        matchId,
        marketId,
        line,
        homeOdds,
        awayOdds,
    );
}

function buildHDPMarket(matchId, marketId, line, homeOdds, awayOdds) {
    const nowIso = new Date().toISOString();
    const prefix = `${matchId}_${marketId}_${line}`;
    const {homeLine, awayLine} = makeHdpLines(line);
    return enrichMarketPrices({
        Id: marketId,
        Name: "AsianHandicap",
        MainLine: `${line} (0-0)`,
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
                        Line: `${homeLine} (0-0)`,
                        BaseLine: `${line} (0-0)`,
                        StartPrice: homeOdds,
                        Price: homeOdds,
                        ProviderBetId: providerId,
                        LastUpdate: nowIso,
                    },
                    {
                        Id: `${prefix}_2`,
                        Probability: null,
                        CalculatedMargin: null,
                        Name: "2",                      // away
                        Status: 1,
                        Line: `${awayLine} (0-0)`,
                        BaseLine: `${line} (0-0)`,
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
