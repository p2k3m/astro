const assert = require('node:assert');
const test = require('node:test');
const { renderNorthIndian, HOUSE_BBOXES } = require('../src/lib/astro.js');

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
    const bbox = HOUSE_BBOXES[h - 1];
    const signNode = texts.find((t) => t.textContent === String(h));
    assert.ok(signNode, `missing sign label for house ${h}`);
    const sx = Number(signNode.attributes.x);
    const sy = Number(signNode.attributes.y);
    const xPad = +(bbox.maxX - sx).toFixed(2);
    const yPad = +(sy - bbox.minY).toFixed(2);
    const planetYs = texts
      .filter((t) => t.textContent.startsWith(`p${h}`))
      .map((t) => Number(t.attributes.y));
    const minPlanetY = Math.min(...planetYs);
    const gap = +(minPlanetY - sy).toFixed(2);

    snapshot.push({ house: h, xPad, yPad, planetGap: gap });
    assert.ok(xPad >= 0.04, `label touches right border in house ${h}`);
    assert.ok(yPad >= 0.08, `label touches top border in house ${h}`);
    assert.ok(gap >= 0.02, `label overlaps planet in house ${h}`);
  }

  assert.deepStrictEqual(snapshot, [
    { house: 1, xPad: 0.04, yPad: 0.08, planetGap: 0.07 },
    { house: 2, xPad: 0.04, yPad: 0.08, planetGap: 0.07 },
    { house: 3, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 4, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 5, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 6, xPad: 0.04, yPad: 0.08, planetGap: 0.15 },
    { house: 7, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 8, xPad: 0.04, yPad: 0.08, planetGap: 0.15 },
    { house: 9, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 10, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 11, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 12, xPad: 0.04, yPad: 0.08, planetGap: 0.07 },
  ]);
});

