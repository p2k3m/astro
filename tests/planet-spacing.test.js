const assert = require('node:assert');
const test = require('node:test');
const { renderNorthIndian, HOUSE_CENTROIDS } = require('../src/lib/astro.js');

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
  removeChild(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) this.children.splice(i, 1);
  }
  get firstChild() {
    return this.children[0];
  }
}

const doc = { createElementNS: (ns, tag) => new Element(tag) };

test('planets render in distinct rows below sign label', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h - 1;
  const planets = [
    { name: 'p1', house: 2, deg: 0 },
    { name: 'p2', house: 2, deg: 10 },
    { name: 'p3', house: 2, deg: 20 },
    { name: 'p4', house: 2, deg: 30 },
  ];

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 0, signInHouse, planets });
  delete global.document;

  const { cx, cy } = HOUSE_CENTROIDS[1]; // house 2
  const texts = svg.children.filter((c) => c.tagName === 'text');
  const planetYs = texts
    .filter((t) => Number(t.attributes.x) === cx && t.textContent.startsWith('p'))
    .map((t) => Number(t.attributes.y));

  assert.strictEqual(planetYs.length, 4);
  planetYs.forEach((y) => {
    assert.ok(y >= cy + 0.05, 'planet overlaps sign label');
  });
  for (let i = 1; i < planetYs.length; i++) {
    assert.ok(planetYs[i] - planetYs[i - 1] >= 0.02, 'planet rows overlap');
  }
});
