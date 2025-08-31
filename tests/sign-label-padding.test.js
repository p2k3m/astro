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

test('sign labels keep padding from borders and planets', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [];
  for (let h = 1; h <= 12; h++) {
    planets.push({ name: `p${h}`, house: h, deg: 0 });
  }

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets });
  delete global.document;

  const texts = svg.children.filter((c) => c.tagName === 'text');
  const snapshot = [];

  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const signX = bbox.maxX - 0.04;
    const signY = bbox.minY + 0.08;

    const signNode = texts.find(
      (t) =>
        Math.abs(Number(t.attributes.x) - signX) < 1e-9 &&
        Math.abs(Number(t.attributes.y) - signY) < 1e-9
    );
    assert.ok(signNode, `missing sign label for house ${h}`);

    const planetNodes = texts.filter((t) =>
      t.textContent.startsWith(`p${h} `)
    );
    const planetYs = planetNodes.map((t) => Number(t.attributes.y));
    const minPlanetY = planetYs.length ? Math.min(...planetYs) : null;
    const gap = minPlanetY !== null ? +(minPlanetY - signY).toFixed(2) : null;

    const xPad = +(bbox.maxX - signX).toFixed(2);
    const yPad = +(signY - bbox.minY).toFixed(2);
    const touchesFrame = xPad < 0.04 || yPad < 0.08;
    const overlapsPlanet = gap !== null && gap < 0.02;

    snapshot.push({ house: h, xPad, yPad, planetGap: gap });

    assert.ok(!touchesFrame, 'label touches frame');
    assert.ok(!overlapsPlanet, 'label overlaps planet');
  }

  assert.deepStrictEqual(snapshot, [
    { house: 1, xPad: 0.04, yPad: 0.08, planetGap: 0.24 },
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
