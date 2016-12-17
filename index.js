const util = require('util');

const DATA = require('./data/contact-lense.json');

let resultProperty = 'recommended';
let root = choose(DATA, [resultProperty]);
expand(DATA, root, [resultProperty, root.key]);

display(root);

function display(node, indent) {
    indent = indent || '';
    if (!node.key) {
        return;
    }
    if (node.results) {
        if (node.results.length === 1) {
            console.log(indent + node.results[0].value);
            return;
        }
        console.log(indent + node.key + ':');
        indent += ' ';
        node.results.forEach(result => console.log(indent + (result.key !== undefined ? result.key + ': ' : '') + result.value));
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
        if (rows.map(row => row[used[0]]).filter(distinct).length === 1) {
            node.results = [{value: rows[0][used[0]]}];
            return;
        }
        node.results = node.values.map(value => {
            return {
                key: value,
                value: rows.filter(row => row[node.key] === value).map(row => row[used[0]]).filter(distinct)
            };
        });
        return;
    }
    let ignore = used.slice();
    ignore.push(node.key);
    node.children = rows.map(row => row[node.key])
        .filter(distinct)
        .map(value => {
            let filtered = rows.filter(row => row[node.key] === value);
            let child = {
                value: value,
                node: choose(filtered, ignore)
            };
            expand(filtered, child.node, ignore);
            return child;
        });
}

function choose(rows, used) {
    return Object.keys(rows[0])
        .filter(key => used.indexOf(key) < 0)
        .map(key => {
            return {
                key: key,
                entropy: evaluateRow(rows, key, used[0]),
                values: rows.map(row => row[key]).filter(distinct)
            };
        })
        .reduce((a, b) => a.entropy < b.entropy ? a : b, {entropy: Infinity});
}

function evaluateRow(rows, property, resultProperty) {
    let counts = count(rows, property);
    return rows
        .map(row => row[property])
        .filter(distinct)
        .map(value => {
            return {
                entropy: evaluate(rows.filter(row => row[property] === value), resultProperty),
                count: counts[value],
                value: value
            };
        })
        .map(a => weigh(a, rows.length))
        .reduce((a, b) => a + b, 0);
}

function weigh(entropyObj, sum) {
    return (entropyObj.count / sum) * entropyObj.entropy;
}

function flatten(counts) {
    return Object.keys(counts).map(k => counts[k]);
}

function count(rows, key) {
    let d = [];
    rows.map(row => row[key])
        .forEach(v => d[v] === undefined ? d[v] = 1 : d[v]++);
    return d;
}

function evaluate(rows, resultProperty) {
    return entropy(normalize(flatten(count(rows, resultProperty))));
}

function normalize(values) {
    let sum = values.reduce((a, b) => a + b, 0);
    return values.map(a => a / sum);
}

function entropy(values) {
    return values
        .map(a => a * Math.log2(a))
        .reduce((a, b) => a - b, 0);
}

function distinct(value, index, self) {
    return self.indexOf(value) === index;
}
