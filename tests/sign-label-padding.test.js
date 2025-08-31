const assert = require('node:assert');
const test = require('node:test');
const {
  renderNorthIndian,
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

  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const signNode = texts.find((t) => t.textContent === String(h));
    assert.ok(signNode, `missing sign label for house ${h}`);
    const x = Number(signNode.attributes.x);
    const y = Number(signNode.attributes.y);
    const minPad = Math.min(
      x - bbox.minX,
      bbox.maxX - x,
      y - bbox.minY,
      bbox.maxY - y
    );
    assert.ok(minPad >= 0.03, 'label touches frame');

    const planetNodes = texts.filter((t) => t.textContent.startsWith(`p${h} `));
    const planetYs = planetNodes.map((t) => Number(t.attributes.y));
    const minPlanetY = planetYs.length ? Math.min(...planetYs) : null;
    if (minPlanetY !== null)
      assert.ok(minPlanetY - y >= 0.02, 'label overlaps planet');
  }
});
