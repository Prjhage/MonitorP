/**
 * Simple concurrency pool helper to limit parallel execution of async tasks.
 * @param {number} limit - Max number of concurrent tasks.
 * @param {Array} items - Items to process.
 * @param {Function} iterator - Async function to run for each item.
 */
const runWithLimit = async (limit, items, iterator) => {
    const results = [];
    const executing = new Set();
    for (const item of items) {
        const p = Promise.resolve().then(() => iterator(item));
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean).catch(clean);
        if (executing.size >= limit) {
            await Promise.race(executing).catch(() => {});
        }
    }
    return Promise.allSettled(results);
};

module.exports = { runWithLimit };
