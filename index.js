const util = require('util');

const DATA = require('./data/weather.json');

let root = choose(DATA, ['play']);
expand(DATA, root, ['play']);

console.log(util.inspect(root, false, null));

//display(root, '');

function display(node, indent) {
    if (!node.key) {
        return;
    }
    console.log(indent + node.key);
    if (!node.children) {
        return;
    }
    node.children.forEach(child => {
        console.log(indent + ' - ' + child.value + ':');
        display(child.node, indent + '    ');
    });
}

function expand(rows, node, used) {
    if (node.entropy === 0) {
        return;
    }
    let ignore = used.slice();
    ignore.push(node.key);
    node.children = rows.map(row => row[node.key])
        .filter(distinct)
        .map(value => {
            let child = {
                value: value,
                node: choose(rows.filter(row => row[node.key] === value), ignore)
            };
            expand(rows, child.node, ignore);
            return child;
        });
}

function choose(rows, used) {
    if (rows.length == 0) {
        return null;
    }
    return Object.keys(rows[0])
        .filter(key => used.indexOf(key) < 0)
        .map(key => {
            return {
                key: key,
                entropy: evaluateRow(rows, key)
            };
        })
        .reduce((a, b) => a.entropy > b.entropy ? a : b, {entropy: 0});
}

function evaluateRow(rows, property) {
    let sum = simplify(count(rows.filter(row => row[property]), property)).reduce((a, b) => a + b, 0);
    return rows
        .map(row => row[property])
        .filter(distinct)
        .map(value => {
            let filtered = rows.filter(row => row[property] === value);
            return {
                entropy: evaluate(filtered, property),
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

function count(rows, key) {
    let d = [];
    rows.map(row => row[key])
        .forEach(v => d[v] === undefined ? d[v] = 1 : d[v]++);
    return d;
}

function evaluate(rows, property) {
    return entropy(normalize(count(rows, property)), property);
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
