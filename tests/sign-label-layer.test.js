const assert = require('node:assert');
const test = require('node:test');
const {
  renderNorthIndian,
  HOUSE_CENTROIDS,
  HOUSE_BBOXES,
} = require('../src/lib/astro.js');

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

test('sign labels anchor to corners without overlapping planets', () => {
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
  const { minX, maxX, minY, maxY } = HOUSE_BBOXES[0];
  const xs = new Set([minX + 0.04, maxX - 0.04, cx]);
  const texts = svg.children
    .filter(
      (c) =>
        c.tagName === 'text' &&
        xs.has(Number(c.attributes.x)) &&
        Number(c.attributes.y) >= minY &&
        Number(c.attributes.y) <= maxY
    )
    .sort((a, b) => Number(a.attributes.y) - Number(b.attributes.y));
  const snapshot = texts.map((t) => ({
    text: t.textContent,
    x: Number(t.attributes.x),
    y: Number(t.attributes.y),
  }));

  assert.deepStrictEqual(snapshot, [
    { text: 'Asc', x: minX + 0.04, y: minY + 0.08 },
    { text: '1', x: maxX - 0.04, y: minY + 0.08 },
    { text: "p1 00°00'", x: cx, y: cy + 0.07 },
    { text: "p2 10°00'", x: cx, y: cy + 0.11 },
  ]);
});
