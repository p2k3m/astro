const assert = require('node:assert');
const test = require('node:test');
const {
  renderNorthIndian,
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

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

test('sign labels stay inside each house polygon', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;

  const planets = [];
  const counts = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
  for (let h = 1; h <= 12; h++) {
    for (let i = 0; i < counts[h - 1]; i++) {
      planets.push({ name: `p${h}_${i}`, house: h, deg: i * 10 });
    }
  }

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets });
  delete global.document;

  const texts = svg.children.filter((c) => c.tagName === 'text');
  const signNodes = texts.filter((c) => c.attributes['font-size'] === '0.05');
  assert.strictEqual(signNodes.length, 12);

  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const poly = HOUSE_POLYGONS[h - 1];
    const node = signNodes[h - 1];
    const x = Number(node.attributes.x);
    const y = Number(node.attributes.y);
    const minPad = Math.min(
      x - bbox.minX,
      bbox.maxX - x,
      y - bbox.minY,
      bbox.maxY - y
    );
    assert.ok(minPad >= 0.03, `label too close to edge in house ${h}`);
    assert.ok(
      pointInPolygon(x, y, poly),
      `label lies outside polygon in house ${h}`
    );
    const planetNodes = texts.filter((t) => t.textContent.startsWith(`p${h}_`));
    const planetYs = planetNodes.map((t) => Number(t.attributes.y));
    const minPlanetY = planetYs.length ? Math.min(...planetYs) : null;
    const signBottom = y + 0.025;
    if (minPlanetY !== null)
      assert.ok(
        minPlanetY - signBottom >= 0.02,
        `label overlaps planet in house ${h}`
      );
  }
});
