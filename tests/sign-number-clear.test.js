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

function pointInPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

test('sign numbers remain clear and non-overlapping', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [];
  for (let h = 1; h <= 12; h++) {
    planets.push({ name: `p${h}a`, house: h, deg: 0 });
    planets.push({ name: `p${h}b`, house: h, deg: 10 });
  }

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets });
  delete global.document;

  const texts = svg.children.filter((c) => c.tagName === 'text');
  const snapshot = [];

  for (let h = 1; h <= 12; h++) {
    const poly = HOUSE_POLYGONS[h - 1];
    const bbox = HOUSE_BBOXES[h - 1];
    const signNode = texts.find((t) => t.textContent === String(h));
    assert.ok(signNode, `missing sign label for house ${h}`);
    const sx = Number(signNode.attributes.x);
    const sy = Number(signNode.attributes.y);
    assert.ok(pointInPolygon([sx, sy], poly), `label outside polygon in house ${h}`);
    const minPad = Math.min(
      sx - bbox.minX,
      bbox.maxX - sx,
      sy - bbox.minY,
      bbox.maxY - sy
    );
    assert.ok(minPad > 0.05, `label too close to edge in house ${h}`);
    const planetYs = texts
      .filter((t) => t.textContent.startsWith(`p${h}`))
      .map((t) => Number(t.attributes.y));
    const minPlanetY = Math.min(...planetYs);
    const gap = +(minPlanetY - sy).toFixed(2);
    snapshot.push({ house: h, planetGap: gap });
    assert.ok(gap >= 0.02, `label overlaps planet in house ${h}`);
  }

  assert.deepStrictEqual(snapshot, [
    { house: 1, planetGap: 0.05 },
    { house: 2, planetGap: 0.07 },
    { house: 3, planetGap: 0.22 },
    { house: 4, planetGap: 0.22 },
    { house: 5, planetGap: 0.22 },
    { house: 6, planetGap: 0.15 },
    { house: 7, planetGap: 0.22 },
    { house: 8, planetGap: 0.15 },
    { house: 9, planetGap: 0.22 },
    { house: 10, planetGap: 0.22 },
    { house: 11, planetGap: 0.22 },
    { house: 12, planetGap: 0.07 },
  ]);
});

