function permutation(iterable, r) {
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

function combination(iterable, r) {
    if (r > iterable.length || r <= 0) {
        return [];
    }
    const solutions = [];
    const choices = Array.from(iterable);
    function backtrack(start, current) {
        if (current.length === r) {
            solutions.push([...current]);
            return;
        }
        for (let i = start; i < choices.length; i++) {
            current.push(choices[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }
    backtrack(0, []);
    return solutions;

}

