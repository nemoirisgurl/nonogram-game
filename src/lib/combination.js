export function permutation(iterable, r) {
    const choices = Array.isArray(iterable) ? iterable.slice() : Array.from(iterable ?? []);
    const size = choices.length;
    const pickCount = Number.isInteger(r) ? r : Number.parseInt(r, 10);

    if (!Number.isInteger(pickCount) || pickCount > size || pickCount <= 0) {
        return [];
    }
    const solutions = [];
    function backtrack(current) {
        if (current.length === pickCount) {
            solutions.push([...current]);
            return;
        }
        for (let i = 0; i < size; i++) {
            if (current.includes(choices[i])) {
                continue;
            }
            current.push(choices[i]);
            backtrack(current);
            current.pop();
        }
    }
    backtrack([]);
    return solutions;
}

export function* combination(iterable, r, limit = Infinity) {
    const choices = Array.isArray(iterable) ? iterable.slice() : Array.from(iterable ?? []);
    const n = choices.length;
    const pickCount = Number.isInteger(r) ? r : Number.parseInt(r, 10);
    const maxResults = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : Infinity;

    if (pickCount === 0) {
        if (maxResults > 0) yield [];
        return;
    }
    if (!Number.isInteger(pickCount) || pickCount > n || pickCount < 0 || maxResults === 0) return;

    const idx = Array.from({ length: pickCount }, (_, i) => i);
    let yielded = 0;

    while (true) {
        yield idx.map((i) => choices[i]);
        yielded += 1;
        if (yielded >= maxResults) return;

        // Find rightmost index that can be incremented.
        let i = pickCount - 1;
        while (i >= 0 && idx[i] === n - pickCount + i) i -= 1;
        if (i < 0) break;

        idx[i] += 1;
        for (let j = i + 1; j < pickCount; j += 1) idx[j] = idx[j - 1] + 1;
    }
}

