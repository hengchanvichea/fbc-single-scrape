/**
 * @param {object[]} data
 * @param {number} index
 */
export function marketOdds(data, index){
    return data.find(item => item.index === index) || null;
}