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

test('planet labels keep clear of sign numbers in every house', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [];
  const counts = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
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
  const snapshot = [];

  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const signNode = texts.find((t) => t.textContent === String(h));
    assert.ok(signNode, `missing sign label for house ${h}`);
    const signY = Number(signNode.attributes.y);
    const planetYs = texts
      .filter((t) => t.textContent.startsWith(`p${h}_`))
      .map((t) => Number(t.attributes.y));
    const minPlanetY = planetYs.length ? Math.min(...planetYs) : null;
    const gap =
      minPlanetY !== null ? +(minPlanetY - signY).toFixed(2) : null;
    snapshot.push({ house: h, gap });
    if (gap !== null) {
      assert.ok(gap >= 0.02, `label overlaps planet in house ${h}`);
    }
    const yPad = +(signY - bbox.minY).toFixed(2);
    assert.ok(yPad >= 0.08, `label touches top border in house ${h}`);
  }

  assert.deepStrictEqual(snapshot, [
    { house: 1, gap: null },
    { house: 2, gap: 0.07 },
    { house: 3, gap: 0.22 },
    { house: 4, gap: 0.22 },
    { house: 5, gap: 0.22 },
    { house: 6, gap: 0.15 },
    { house: 7, gap: null },
    { house: 8, gap: 0.15 },
    { house: 9, gap: 0.22 },
    { house: 10, gap: 0.22 },
    { house: 11, gap: 0.22 },
    { house: 12, gap: 0.07 },
  ]);
});
