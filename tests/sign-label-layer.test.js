const assert = require('node:assert');
const test = require('node:test');
const {
  renderNorthIndian,
  HOUSE_CENTROIDS,
  HOUSE_BBOXES,
  HOUSE_POLYGONS,
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

const SIGN_MARGIN = 0.08;

test('sign labels anchor without overlapping planets', () => {
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
  const { minX, minY, maxX, maxY } = HOUSE_BBOXES[0];
  const ascX = minX + 0.04;
  const signX = maxX - 0.04;
  const texts = svg.children.filter(
    (c) =>
      c.tagName === 'text' &&
      Number(c.attributes.x) >= minX &&
      Number(c.attributes.x) <= maxX &&
      Number(c.attributes.y) >= minY &&
      Number(c.attributes.y) <= maxY
  );
  const snapshot = texts
    .filter((t) => [ascX, signX, cx].includes(Number(t.attributes.x)))
    .sort((a, b) => Number(a.attributes.y) - Number(b.attributes.y))
    .map((t) => ({
      text: t.textContent,
      x: Number(t.attributes.x),
      y: Number(t.attributes.y),
    }));
  assert.deepStrictEqual(snapshot, [
    { text: 'Asc', x: ascX, y: minY + SIGN_MARGIN },
    { text: '1', x: signX, y: minY + SIGN_MARGIN },
    { text: "p1 00°00'", x: cx, y: cy + 0.07 },
    { text: "p2 10°00'", x: cx, y: cy + 0.11 },
  ]);
});
