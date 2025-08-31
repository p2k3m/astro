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

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets: [] });
  delete global.document;

  const texts = svg.children.filter(
    (c) => c.tagName === 'text' && c.attributes['font-size'] === '0.05'
  );
  assert.strictEqual(texts.length, 12);

  const snapshot = [];
  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const node = texts[h - 1];
    const x = Number(node.attributes.x);
    const y = Number(node.attributes.y);
    const xPad = +(bbox.maxX - x).toFixed(2);
    const yPad = +(y - bbox.minY).toFixed(2);
    snapshot.push({ house: h, xPad, yPad });
    assert.ok(xPad >= 0.04, 'label touches right border');
    assert.ok(yPad >= 0.08, 'label touches top border');
  }

  assert.deepStrictEqual(
    snapshot,
    Array.from({ length: 12 }, (_, i) => ({ house: i + 1, xPad: 0.04, yPad: 0.08 }))
  );
});

