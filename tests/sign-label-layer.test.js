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
const SIGN_TOWARDS_VERTEX = 0.6;
const SIGN_PAD_X = 0.04;

function computeSignPoint(h) {
  const poly = HOUSE_POLYGONS[h - 1];
  const centroid = HOUSE_CENTROIDS[h - 1];
  const bbox = HOUSE_BBOXES[h - 1];
  const { minX, maxX, minY, maxY } = bbox;
  let target = poly[0];
  for (const [x, y] of poly) {
    if (y < target[1] || (y === target[1] && x > target[0])) target = [x, y];
  }
  let sx = centroid.cx + (target[0] - centroid.cx) * SIGN_TOWARDS_VERTEX;
  let sy = centroid.cy + (target[1] - centroid.cy) * SIGN_TOWARDS_VERTEX;
  if (sx < minX + SIGN_MARGIN) sx = minX + SIGN_MARGIN;
  if (sx > maxX - SIGN_MARGIN) sx = maxX - SIGN_MARGIN;
  if (sy < minY + SIGN_MARGIN) sy = minY + SIGN_MARGIN;
  if (sy > maxY - SIGN_MARGIN) sy = maxY - SIGN_MARGIN;
  return { sx, sy };
}

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
  const { sx: signX, sy: signY } = computeSignPoint(1);
  const ascX = minX + SIGN_PAD_X;
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
    { text: 'Asc', x: ascX, y: signY },
    { text: '1', x: signX, y: signY },
    { text: "p1 00°00'", x: cx, y: cy + 0.07 },
    { text: "p2 10°00'", x: cx, y: cy + 0.11 },
  ]);
});
