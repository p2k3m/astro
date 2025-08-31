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

test('sign labels render before planets with stable spacing', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [
    { name: 'p1', house: 1, deg: 0 },
    { name: 'p2', house: 1, deg: 10 },
  ];

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets });
  delete global.document;

  const { cx, cy } = HOUSE_CENTROIDS[0];
  const texts = svg.children.filter(
    (c) =>
      c.tagName === 'text' &&
      Number(c.attributes.x) === cx &&
      Number(c.attributes.y) < 0.5
  );
  const snapshot = texts.map((t) => ({
    text: t.textContent,
    y: Number(t.attributes.y),
  }));

  assert.deepStrictEqual(snapshot, [
    { text: 'Asc', y: cy + 0.08 },
    { text: '1', y: cy },
    { text: 'p1 00°00\'', y: cy + 0.07 },
    { text: 'p2 10°00\'', y: cy + 0.11 },
  ]);
});
