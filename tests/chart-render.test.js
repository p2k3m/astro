const assert = require('node:assert');
const test = require('node:test');
const { renderNorthIndian, diamondPath } = require('../src/lib/astro.js');

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

test('North Indian chart uses single outer diamond with internal grid', () => {
  const svg = new Element('svg');
  global.document = doc;
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h - 1;
  renderNorthIndian(svg, { ascSign: 0, signInHouse, planets: [] });

  const paths = svg.children.filter((c) => c.tagName === 'path');
  assert.strictEqual(paths.length, 13);
  assert.strictEqual(paths[0].attributes.d, diamondPath(50, 50, 50));
  assert.strictEqual(paths[0].attributes['stroke-width'], '2');
  for (let i = 1; i < paths.length; i++) {
    assert.strictEqual(paths[i].attributes['stroke-width'], '1');
  }
  assert.ok(svg.children.every((el) => el.tagName !== 'line'));
  delete global.document;
});
