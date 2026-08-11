export function enrichMarketPrices(market) {
    return {
        ...market,
        ProviderMarkets: market.ProviderMarkets.map(providerMarket => ({
            ...providerMarket,
            Bets: providerMarket.Bets.map(bet => {
                const {
                    PriceIN,
                    PriceUS,
                    PriceUK,
                    PriceMA,
                    PriceHK
                } = price(bet.Price);

                return {
                    ...bet,
                    PriceIN,
                    PriceUS,
                    PriceUK,
                    PriceMA,
                    PriceHK
                };
            })
        }))
    };
}
function price(decimal) {
    const d = Number(decimal);

    // Hong Kong & Indonesian: d - 1
    const hk = (d - 1).toFixed(2);
    const priceHK = hk.toString();
    const priceIN = hk.toString();

    // American odds
    let priceUS;
    if (d >= 2) {
        priceUS = Math.round((d - 1) * 100).toString();  // positive
    } else {
        priceUS = Math.round(-100 / (d - 1)).toString(); // negative
    }

    // UK fractional odds (approximation)
    function decimalToFraction(x, maxDen = 200) {
        const target = x - 1; // decimal to fractional (dec = 1 + frac)
        let bestNum = 0;
        let bestDen = 1;
        let bestErr = Infinity;
        for (let den = 1; den <= maxDen; den++) {
            const num = Math.round(target * den);
            const err = Math.abs(target - num / den);
            if (err < bestErr) {
                bestErr = err;
                bestNum = num;
                bestDen = den;
            }
        }
        return `${bestNum}/${bestDen}`;
    }
    const priceUK = decimalToFraction(d);

    // Margin-like value (placeholder; change to your real logic)
    const priceMA = (-1 / d).toString();

    return {
        PriceIN: priceIN,
        PriceUS: priceUS,
        PriceUK: priceUK,
        PriceMA: priceMA,
        PriceHK: priceHK
    };
}