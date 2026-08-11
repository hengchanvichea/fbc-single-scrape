export const ticketMarketType = Object.freeze({
    _1X2: 1,
    _1X21stPeriod: 41,

    AsianHandicap: 3,
    AsianHandicap1stPeriod: 64,

    AsianUnderOver: 835,
    AsianUnderOver1stPeriod: 836,

    OddEven: 5,
    OddEven1stPeriod: 72,

    DoubleChance: 7,
    DoubleChance1stPeriod: 456,

    CorrectScore: 6,
    CorrectScore1stPeriod: 9,

    HtFt: 4
});


// groups (equivalent to static methods)
const HALF_TIME = new Set([
    ticketMarketType._1X21stPeriod,
    ticketMarketType.AsianHandicap1stPeriod,
    ticketMarketType.AsianUnderOver1stPeriod,
    ticketMarketType.OddEven1stPeriod,
    ticketMarketType.DoubleChance1stPeriod,
    ticketMarketType.CorrectScore1stPeriod
]);

const FULL_TIME = new Set([
    ticketMarketType._1X2,
    ticketMarketType.AsianHandicap,
    ticketMarketType.AsianUnderOver,
    ticketMarketType.OddEven,
    ticketMarketType.DoubleChance,
    ticketMarketType.CorrectScore,
    ticketMarketType.HtFt
]);

const ASIAN_MARKET = new Set([
    ticketMarketType.AsianHandicap,
    ticketMarketType.AsianHandicap1stPeriod,
    ticketMarketType.AsianUnderOver,
    ticketMarketType.AsianUnderOver1stPeriod,
    ticketMarketType.OddEven,
    ticketMarketType.OddEven1stPeriod
]);

const SIDE_MARKET = ASIAN_MARKET;

const MORE_MARKET_IDS = [
    ticketMarketType.HtFt,
    ticketMarketType.OddEven,
    ticketMarketType.OddEven1stPeriod,
    ticketMarketType._1X2,
    ticketMarketType._1X21stPeriod,
    ticketMarketType.DoubleChance,
    ticketMarketType.DoubleChance1stPeriod,
    ticketMarketType.CorrectScore,
    ticketMarketType.CorrectScore1stPeriod
];

const HOME_AWAY = [
    ticketMarketType.AsianHandicap,
    ticketMarketType.AsianHandicap1stPeriod
];

const UNDER_OVER = [
    ticketMarketType.AsianUnderOver,
    ticketMarketType.AsianUnderOver1stPeriod
];

const ODD_EVEN = [
    ticketMarketType.OddEven,
    ticketMarketType.OddEven1stPeriod
];

const OTHERS = [
    ticketMarketType._1X2,
    ticketMarketType._1X21stPeriod,
    ticketMarketType.HtFt,
    ticketMarketType.DoubleChance,
    ticketMarketType.DoubleChance1stPeriod,
    ticketMarketType.CorrectScore,
    ticketMarketType.CorrectScore1stPeriod
];

// helper functions (equivalent to instance/static methods)
export const TicketMarket = {
    isHtFt: typeId => typeId === ticketMarketType.HtFt,

    is1X2: typeId =>
        typeId === ticketMarketType._1X2 ||
        typeId === ticketMarketType._1X21stPeriod,

    isAsianHandicap: typeId =>
        typeId === ticketMarketType.AsianHandicap ||
        typeId === ticketMarketType.AsianHandicap1stPeriod,

    isAsianUnderOver: typeId =>
        typeId === ticketMarketType.AsianUnderOver ||
        typeId === ticketMarketType.AsianUnderOver1stPeriod,

    isOddEven: typeId =>
        typeId === ticketMarketType.OddEven ||
        typeId === ticketMarketType.OddEven1stPeriod,

    isDoubleChance: typeId =>
        typeId === ticketMarketType.DoubleChance ||
        typeId === ticketMarketType.DoubleChance1stPeriod,

    isCorrectScore: typeId =>
        typeId === ticketMarketType.CorrectScore ||
        typeId === ticketMarketType.CorrectScore1stPeriod,

    isAsianMarket: typeId => ASIAN_MARKET.has(typeId),

    isFirstHalf: typeId => HALF_TIME.has(typeId),

    hasSideMarket: typeId => SIDE_MARKET.has(typeId),

    getHalfTime: () => Array.from(HALF_TIME),
    getFullTime: () => Array.from(FULL_TIME),
    moreMarketIds: () => [...MORE_MARKET_IDS],
    getHomeAway: () => [...HOME_AWAY],
    getUnderOver: () => [...UNDER_OVER],
    getOddEven: () => [...ODD_EVEN],
    getOthers: () => [...OTHERS]
};