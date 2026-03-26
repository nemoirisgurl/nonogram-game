export function permutation(iterable, r) {
    if (r > iterable.length || r <= 0) {
        return [];
    }
    const solutions = [];
    const choices = Array.from(iterable);
    function backtrack(current) {
        if (current.length === r) {
            solutions.push([...current]);
            return;
        }
        for (let i = 0; i < choices.length; i++) {
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
    const choices = Array.from(iterable);
    const n = choices.length;
    if (r > n || r <= 0) return;

    const idx = Array.from({ length: r }, (_, i) => i);
    let yielded = 0;

    while (true) {
        yield idx.map((i) => choices[i]);
        yielded += 1;
        if (yielded >= limit) return;

        // Find rightmost index that can be incremented.
        let i = r - 1;
        while (i >= 0 && idx[i] === n - r + i) i -= 1;
        if (i < 0) break;

        idx[i] += 1;
        for (let j = i + 1; j < r; j += 1) idx[j] = idx[j - 1] + 1;
    }
}

