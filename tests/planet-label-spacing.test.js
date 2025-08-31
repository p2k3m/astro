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
const MIN_GAP = 0.02;
const MIN_SHIFT = 0.05;

test('planet labels keep clear of sign numbers in every house', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [];
  const counts = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4];
  for (let h = 1; h <= 12; h++) {
    for (let i = 0; i < counts[h - 1]; i++) {
      planets.push({ name: `p${h}_${i}`, house: h, deg: i * 5 });
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
    const signBottom = signY + 0.025;
    const yPad = +(signY - bbox.minY).toFixed(2);
    assert.ok(yPad >= 0.08, `label touches top border in house ${h}`);
    planetNodes.forEach((p) => {
      const px = Number(p.attributes.x);
      const py = Number(p.attributes.y);
      const dx = Math.abs(px - signX);
      if (py >= signY) {
        const dy = py - signBottom;
        assert.ok(dy + 1e-6 >= MIN_GAP || dx >= MIN_SHIFT, `label overlaps planet in house ${h}`);
      } else {
        assert.ok(dx >= MIN_SHIFT, `label overlaps planet in house ${h}`);
      }
    });
    const ys = planetNodes.map((p) => Number(p.attributes.y)).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) {
      assert.ok(ys[i] - ys[i - 1] > 0, `planets not ordered downward in house ${h}`);
    }
  }
});
