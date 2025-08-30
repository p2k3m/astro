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
      c.attributes['font-size'] === '3' &&
      /^\d+$/.test(c.textContent)
  );
  assert.strictEqual(houseTexts.length, 12);
  for (let i = 0; i < 12; i++) {
    const t = houseTexts.find((ht) => ht.textContent === String(i + 1));
    assert.ok(t, `house ${i + 1} missing`);
    const expected = HOUSE_POLYGONS[i];
    assert.strictEqual(Number(t.attributes.x), expected.cx);
    assert.strictEqual(Number(t.attributes.y), expected.cy - 6);
  }
  delete global.document;

  const chartPolys = signInHouse.slice(1).map((s) => HOUSE_POLYGONS[s]);
  assert.deepStrictEqual(chartPolys, HOUSE_POLYGONS);
});
