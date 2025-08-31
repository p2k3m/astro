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

test('sign labels anchor to chart corners with padding', () => {
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
  const signNodes = texts.filter(
    (c) => c.attributes['font-size'] === '0.05'
  );
  assert.strictEqual(signNodes.length, 12);

  const snapshot = [];
  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const node = signNodes[h - 1];
    const x = Number(node.attributes.x);
    const y = Number(node.attributes.y);
    const xPad = +(bbox.maxX - x).toFixed(2);
    const yPad = +(y - bbox.minY).toFixed(2);
    const planetNodes = texts.filter((t) =>
      t.textContent.startsWith(`p${h}_`)
    );
    const planetYs = planetNodes.map((t) => Number(t.attributes.y));
    const minPlanetY = planetYs.length ? Math.min(...planetYs) : null;
    const gap = minPlanetY !== null ? +(minPlanetY - y).toFixed(2) : null;
    snapshot.push({ house: h, xPad, yPad, planetGap: gap });
    const touchesFrame = xPad < 0.04 || yPad < 0.08;
    assert.ok(!touchesFrame, 'label touches frame');
    if (gap !== null) assert.ok(gap >= 0.02, 'label overlaps planet');
  }

  assert.deepStrictEqual(snapshot, [
    { house: 1, xPad: 0.04, yPad: 0.08, planetGap: null },
    { house: 2, xPad: 0.04, yPad: 0.08, planetGap: 0.07 },
    { house: 3, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 4, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 5, xPad: 0.04, yPad: 0.08, planetGap: null },
    { house: 6, xPad: 0.04, yPad: 0.08, planetGap: 0.15 },
    { house: 7, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 8, xPad: 0.04, yPad: 0.08, planetGap: 0.15 },
    { house: 9, xPad: 0.04, yPad: 0.08, planetGap: null },
    { house: 10, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 11, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
    { house: 12, xPad: 0.04, yPad: 0.08, planetGap: 0.07 },
  ]);
});

