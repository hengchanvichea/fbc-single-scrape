export function mergeByFixtureId(items) {
    const fixtureMap = new Map();

    for (const item of items) {
        const ev = item?.Body?.Events?.[0];
        if (!ev) continue;

        const fixtureId = ev.FixtureId;

        if (!fixtureMap.has(fixtureId)) {
            fixtureMap.set(fixtureId, deepClone(item));
            continue;
        }

        const existing = fixtureMap.get(fixtureId);
        const exEv = existing.Body.Events[0];

        // 1) keep the latest Fixture snapshot
        const exLU = exEv?.Fixture?.LastUpdate || "";
        const newLU = ev?.Fixture?.LastUpdate || "";
        if (newLU > exLU) {
            exEv.Fixture = deepClone(ev.Fixture);
        }

        // 2) merge markets deep (dedupe)
        exEv.Markets = mergeMarkets(exEv.Markets || [], ev.Markets || []);

        // 3) choose Livescore if newer exists (optional)
        exEv.Livescore = ev.Livescore ?? exEv.Livescore;
    }

    return Array.from(fixtureMap.values());
}

export function changeType(items,type) {
    const result = [];
    for (const item of items) {
        item.Header.Type = type;
        result.push(item);
    }
    return result;
}

function mergeMarkets(aMarkets, bMarkets) {
    const marketMap = new Map();

    const addMarket = (m) => {
        const key = m.Id; // stable in your sample
        if (!marketMap.has(key)) {
            marketMap.set(key, deepClone(m));
            return;
        }

        const ex = marketMap.get(key);
        ex.Name = m.Name ?? ex.Name;
        ex.MainLine = m.MainLine ?? ex.MainLine;

        ex.ProviderMarkets = mergeProviders(ex.ProviderMarkets || [], m.ProviderMarkets || []);
    };

    aMarkets.forEach(addMarket);
    bMarkets.forEach(addMarket);

    return Array.from(marketMap.values());
}

function mergeProviders(aProviders, bProviders) {
    const provMap = new Map();

    const addProvider = (p) => {
        const key = p.Id; // 1001 in your sample
        if (!provMap.has(key)) {
            provMap.set(key, deepClone(p));
            return;
        }

        const ex = provMap.get(key);

        // keep newest provider update
        const exLU = ex.LastUpdate || "";
        const newLU = p.LastUpdate || "";
        if (newLU > exLU) {
            ex.Name = p.Name ?? ex.Name;
            ex.LastUpdate = p.LastUpdate ?? ex.LastUpdate;
            ex.SerializedLastUpdate = p.SerializedLastUpdate ?? ex.SerializedLastUpdate;
        }

        ex.Bets = mergeBets(ex.Bets || [], p.Bets || []);
    };

    aProviders.forEach(addProvider);
    bProviders.forEach(addProvider);

    return Array.from(provMap.values());
}

function mergeBets(aBets, bBets) {
    const betMap = new Map();

    const addBet = (b) => {
        const key = b.Id; // stable in your sample
        if (!betMap.has(key)) {
            betMap.set(key, deepClone(b));
            return;
        }

        const ex = betMap.get(key);

        // keep the newest bet
        const exLU = ex.LastUpdate || "";
        const newLU = b.LastUpdate || "";
        if (newLU > exLU) {
            betMap.set(key, { ...ex, ...deepClone(b) });
        } else {
            // fill missing fields only
            for (const [k, v] of Object.entries(b)) {
                if (ex[k] == null && v != null) ex[k] = v;
            }
        }
    };

    aBets.forEach(addBet);
    bBets.forEach(addBet);

    return Array.from(betMap.values());
}

function deepClone(obj) {
    if (typeof structuredClone === "function") return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
}
