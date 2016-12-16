const util = require('util')

const DATA = [
    { age: "young", spectacle: "myope", astigmatism: "no", tears: "reduced", recommended: "none" },
    { age: "young", spectacle: "myope", astigmatism: "no", tears: "normal", recommended: "soft" },
    { age: "young", spectacle: "myope", astigmatism: "yes", tears: "reduced", recommended: "none" },
    { age: "young", spectacle: "myope", astigmatism: "yes", tears: "normal", recommended: "hard" },
    { age: "young", spectacle: "hypermetrope", astigmatism: "no", tears: "reduced", recommended: "none" },
    { age: "young", spectacle: "hypermetrope", astigmatism: "no", tears: "normal", recommended: "soft" },
    { age: "young", spectacle: "hypermetrope", astigmatism: "yes", tears: "reduced", recommended: "none" },
    { age: "young", spectacle: "hypermetrope", astigmatism: "yes", tears: "normal", recommended: "hard" },
    { age: "pre-presbyopic", spectacle: "myope", astigmatism: "no", tears: "reduced", recommended: "none" },
    { age: "pre-presbyopic", spectacle: "myope", astigmatism: "no", tears: "normal", recommended: "soft" },
    { age: "pre-presbyopic", spectacle: "myope", astigmatism: "yes", tears: "reduced", recommended: "none" },
    { age: "pre-presbyopic", spectacle: "myope", astigmatism: "yes", tears: "normal", recommended: "hard" },
    { age: "pre-presbyopic", spectacle: "hypermetrope", astigmatism: "no", tears: "reduced", recommended: "none" },
    { age: "pre-presbyopic", spectacle: "hypermetrope", astigmatism: "no", tears: "normal", recommended: "soft" },
    { age: "pre-presbyopic", spectacle: "hypermetrope", astigmatism: "yes", tears: "reduced", recommended: "none" },
    { age: "pre-presbyopic", spectacle: "hypermetrope", astigmatism: "yes", tears: "normal", recommended: "none" },
    { age: "presbyopic", spectacle: "myope", astigmatism: "no", tears: "reduced", recommended: "none" },
    { age: "presbyopic", spectacle: "myope", astigmatism: "no", tears: "normal", recommended: "none" },
    { age: "presbyopic", spectacle: "myope", astigmatism: "yes", tears: "reduced", recommended: "none" },
    { age: "presbyopic", spectacle: "myope", astigmatism: "yes", tears: "normal", recommended: "hard" },
    { age: "presbyopic", spectacle: "hypermetrope", astigmatism: "no", tears: "reduced", recommended: "none" },
    { age: "presbyopic", spectacle: "hypermetrope", astigmatism: "no", tears: "normal", recommended: "soft" },
    { age: "presbyopic", spectacle: "hypermetrope", astigmatism: "yes", tears: "reduced", recommended: "none" },
    { age: "presbyopic", spectacle: "hypermetrope", astigmatism: "yes", tears: "normal", recommended: "none" },
];

let dataEntropy = evaluate(DATA);

let root = {
    entropy: dataEntropy
}

expand(DATA, root, 'age', ['recommended'])

console.log(util.inspect(root, false, null))


function expand(rows, node, key, used) {
    if (used.length === 5) {
        return;
    }
    node.children = rows.map(row => row[key])
        .filter(distinct)
        .map(value => {
            let ignore = used.slice();
            ignore.push(value);
            let child = {
                value: value,
                node: choose(rows.filter(row => row[key] === value), node.entropy, ignore)
            };
            expand(rows, child, child.key, ignore);
            return child;
        });
}

function choose(rows, root, used) {
    if (rows.length == 0) {
        return null;
    }
    return Object.keys(rows[0])
        .filter(key => used.indexOf(key) < 0)
        .map(key => {
            return {
                key: key,
                entropy: evaluateRow(rows, key, used)
            };
        })
        .reduce((a, b) => a.entropy > b.entropy ? a : b, { entropy: 0 });
}

function evaluateRow(rows, property, used) {
    let sum = simplify(count(rows.filter(row => row[property]), used)).reduce((a, b) => a + b, 0);
    return rows
        .map(row => row[property])
        .filter(distinct)
        .map(value => {
            let filtered = rows.filter(row => row[property] === value);
            return {
                entropy: evaluate(filtered, used),
                key: value,
                count: filtered.length
            };
        })
        .map(a => weigh(a, sum))
        .reduce((a, b) => a + b, 0);
}

function weigh(entropyObj, sum) {
    return (entropyObj.count / sum) * entropyObj.entropy;
}

function simplify(counts) {
    return Object.keys(counts).map(k => counts[k]);
}

function count(rows, resultProperty) {
    let d = [];
    rows.map(row => row.recommended)
        .forEach(v => d[v] === undefined ? d[v] = 1 : d[v]++);
    return d;
}

function evaluate(rows, used) {
    return entropy(normalize(count(rows, used)));
}

function normalize(values) {
    let raw = simplify(values);
    let sum = raw.reduce((a, b) => a + b, 0);
    return raw.map(a => a / sum);
}

function entropy(values) {
    return values
        .map(a => a * Math.log2(a))
        .reduce((a, b) => a - b, 0);
}

function distinct(value, index, self) {
    return self.indexOf(value) === index;
}
