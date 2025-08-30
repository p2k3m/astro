const assert = require('node:assert');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { getSignLabel } = require('../src/lib/astro.js');

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.attributes = {};
    this.children = [];
    this.textContent = '';
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  appendChild(child) {
    this.children.push(child);
  }
}

// Extract SIGN_LABEL_POS array from Chart.jsx without executing React code
const chartPath = path.join(__dirname, '../src/components/Chart.jsx');
const chartSrc = fs.readFileSync(chartPath, 'utf8');
const match = chartSrc.match(/const SIGN_LABEL_POS = \[(.*?)\];/s);
if (!match) throw new Error('SIGN_LABEL_POS not found');
const SIGN_LABEL_POS = eval('[ ' + match[1] + ' ]');

function renderMockChart(signInHouse) {
  const root = new Element('div');
  for (let h = 1; h <= 12; h++) {
    const houseDiv = new Element('div');
    const span = new Element('span');
    span.setAttribute('class',
      'absolute text-[10px] text-yellow-300/50 ' + SIGN_LABEL_POS[h - 1]
    );
    span.textContent = getSignLabel(signInHouse[h]);
    houseDiv.appendChild(span);
    root.appendChild(houseDiv);
  }
  return root;
}

test('sign labels positioned at AstroSage corners', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h - 1; // Aries ascendant
  const root = renderMockChart(signInHouse);
  const expected = [
    'bottom-0 right-0', // 1
    'bottom-0 right-0', // 2
    'top-0 right-0', // 3
    'top-0 right-0', // 4
    'top-0 right-0', // 5
    'top-0 left-0', // 6
    'top-0 left-0', // 7
    'top-0 left-0', // 8
    'bottom-0 left-0', // 9
    'bottom-0 left-0', // 10
    'bottom-0 left-0', // 11
    'bottom-0 right-0', // 12
  ];
  const base = 'absolute text-[10px] text-yellow-300/50 ';
  const positions = root.children.map(
    (house) => house.children[0].attributes.class.slice(base.length)
  );
  assert.deepStrictEqual(positions, expected);
});
