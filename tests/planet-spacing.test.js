const assert = require('node:assert');
const test = require('node:test');
const { renderNorthIndian, HOUSE_CENTROIDS } = require('../src/lib/astro.js');

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

test('planets render in distinct rows regardless of house position', () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [
    { name: 'p1', house: 2, deg: 0 },
    { name: 'p2', house: 2, deg: 10 },
    { name: 'p3', house: 2, deg: 20 },
    { name: 'p4', house: 2, deg: 30 },
    { name: 'q1', house: 6, deg: 0 },
    { name: 'q2', house: 6, deg: 10 },
    { name: 'q3', house: 6, deg: 20 },
  ];

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets });
  delete global.document;

  const texts = svg.children.filter((c) => c.tagName === 'text');

  const checkHouse = (house, prefix) => {
    const ys = texts
      .filter((t) => t.textContent.startsWith(prefix))
      .map((t) => Number(t.attributes.y))
      .sort((a, b) => b - a);
    for (let i = 1; i < ys.length; i++) {
      assert.ok(Math.abs(ys[i] - ys[i - 1]) >= 0.02, 'planet rows overlap');
    }
  };

  checkHouse(2, 'p');
  checkHouse(6, 'q');
});
