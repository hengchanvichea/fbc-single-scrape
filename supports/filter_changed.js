import {isChanged, updateCache} from "./helper.js";

export function filterChanged(result){
    const newResult = [];
    for (const item of result) {
        const fixture = item.Body.Events[0];
        const markets = fixture.Markets;
        for(const market of markets){
            const bets = market.ProviderMarkets[0].Bets;
            if(isChanged(bets)){
                updateCache(bets);
                newResult.push(item);
                break;
            }
        }
    }
    return newResult;
}