import NodeCache from 'node-cache';
const cache = new NodeCache({stdTTL: 0,checkperiod: 2 });
export function set(key, data,ttl=600) {
    try {
        cache.set(key, data, ttl);
    } catch (error) {
        console.error("Error caching data:", error);
    }
}
export function get(key) {
    try {
        return cache.get(key);
    } catch (error) {
        console.error("Error retrieving cached data:", error);
        return null;
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function run() {
    set("testKey", {value: 42});
    let data = get("testKey");
    console.log("Cached data:", data);
    await sleep(5000);
    data = get("testKey");
    console.log("Cached data after TTL:", data);
}
// run();