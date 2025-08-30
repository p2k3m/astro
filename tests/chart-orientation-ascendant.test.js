const assert = require('node:assert');
const test = require('node:test');
const { renderNorthIndian, HOUSE_POLYGONS } = require('../src/lib/astro.js');

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

const centroid = (pts) => {
  // Area-weighted centroid using the shoelace formula to mirror the library logic.
  let doubleArea = 0;
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    doubleArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (doubleArea === 0) {
    const [sx, sy] = pts.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
    return { cx: sx / n, cy: sy / n };
  }
  const area = doubleArea / 2;
  return { cx: cx / (6 * area), cy: cy / (6 * area) };
};

test('renderNorthIndian and Chart orient Aries ascendant clockwise', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h - 1;
  const data = { ascSign: 0, signInHouse, planets: [] };

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, data);
  const houseTexts = svg.children.filter(
    (c) =>
      c.tagName === 'text' &&
      c.attributes['font-size'] === '0.03' &&
      /^\d+$/.test(c.textContent)
  );
  assert.strictEqual(houseTexts.length, 12);
  for (let i = 0; i < 12; i++) {
    const t = houseTexts.find((ht) => ht.textContent === String(i + 1));
    assert.ok(t, `house ${i + 1} missing`);
    const poly = HOUSE_POLYGONS[i];
    const { cx, cy } = centroid(poly);
    assert.strictEqual(Number(t.attributes.x), cx);
    assert.strictEqual(Number(t.attributes.y), cy - 0.06);
  }
  delete global.document;

  const chartPolys = signInHouse.slice(1).map((s) => HOUSE_POLYGONS[s]);
  assert.deepStrictEqual(chartPolys, HOUSE_POLYGONS);
});
