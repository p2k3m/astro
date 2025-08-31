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
  for (let h = 1; h <= 12; h++) {
    const bbox = HOUSE_BBOXES[h - 1];
    const signNode = texts.find((t) => t.textContent === String(h));
    assert.ok(signNode, `missing sign label for house ${h}`);
    const signX = Number(signNode.attributes.x);
    const signY = Number(signNode.attributes.y);
    const planetNodes = texts.filter((t) => t.textContent.startsWith(`p${h}_`));
    planetNodes.forEach((p) => {
      const px = Number(p.attributes.x);
      const py = Number(p.attributes.y);
      const dx = Math.abs(px - signX);
      const dy = Math.abs(py - signY);
      assert.ok(dy >= 0.02 || dx >= 0.05, `label overlaps planet in house ${h}`);
    });
    const yPad = +(signY - bbox.minY).toFixed(2);
    assert.ok(yPad >= 0.08, `label touches top border in house ${h}`);
  }
});
