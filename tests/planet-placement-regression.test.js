const assert = require('node:assert');
const test = require('node:test');
const { computePositions, renderNorthIndian, HOUSE_BBOXES } = require('../src/lib/astro.js');

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

test('planet positions match AstroSage for sample chart', async () => {
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const expected = {
    sun: 2,
    moon: 8,
    mars: 6,
    mercury: 8,
    jupiter: 2,
    venus: 7,
    saturn: 1,
    rahu: 9,
    ketu: 3,
  };

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, data);
  delete global.document;

  const texts = svg.children.filter(
    (c) => c.tagName === 'text' && !/^Asc$/.test(c.textContent) && !/^\d+$/.test(c.textContent)
  );

  for (const [name, house] of Object.entries(expected)) {
    const node = texts.find((t) => t.textContent.startsWith(name));
    assert.ok(node, `missing ${name}`);
    const x = Number(node.attributes.x);
    const y = Number(node.attributes.y);
    const { minX, maxX, minY, maxY } = HOUSE_BBOXES[house - 1];
    assert.ok(x >= minX && x <= maxX, `${name} outside house ${house} horizontally`);
    assert.ok(y >= minY && y <= maxY, `${name} outside house ${house} vertically`);
  }
});
