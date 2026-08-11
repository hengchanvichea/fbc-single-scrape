import {get as cacheGet, set as cacheSet} from "./cache.js";
import crypto from 'crypto';
import fs from "fs";
export function mapLine(line) {
    // line is a string like "0-0.5", "0.5-1", "1-1.5", ...
    if (typeof line !== "string") return line;

    const parts = line.split("-");
    if (parts.length !== 2) return line;

    const start = parseFloat(parts[0]);
    const end = parseFloat(parts[1]);

    if (Number.isNaN(start) || Number.isNaN(end)) return null;

    // Map to the midpoint of the interval
    return (start + end) / 2;
}
export function makeHdpLines(baseLine) {
    const absPart = baseLine.replace(/^[+-]+/, '').trim() || '0';
    if (baseLine.startsWith('-')) {
        return {homeLine:`-${absPart}`, awayLine:`+${absPart}`};
    }
    if (baseLine.startsWith('+')) {
        return {homeLine:`+${absPart}`,awayLine:`-${absPart}`};
    }
    return {homeLine:absPart,awayLine:absPart};
}

export function generateId(name) {
    const md5Hash = crypto
        .createHash('md5')
        .update(name, 'utf8')
        .digest('hex');

    return parseInt(md5Hash.slice(0, 6), 16) + 80000;
}


export function isChanged(bets){
    for(const bet of bets){
        const cacheKey = bet.Id;
        const cachedPrice = cacheGet(cacheKey);
        if(cachedPrice !== bet.Price){
            return true;
        }
    }
    return false;
}
export function updateCache(bets){
    for(const bet of bets){
        const cacheKey = bet.Id;
        cacheSet(cacheKey, bet.Price);
    }
}

export function isMissing(value){
    return value == null || value === "";
}