import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

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

test('renderNorthIndian defaults to numeric sign labels', async () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  global.document = doc;
  const svg = new Element('svg');
  const { renderNorthIndian } = await astro;
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets: [] });
  const texts = svg.children.filter(
    (c) => c.tagName === 'text' && c.attributes['font-size'] === '0.05'
  );
  const labels = texts.map((t) => t.textContent);
  assert.deepStrictEqual(labels, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  delete global.document;
});

test('renderNorthIndian can use abbreviated sign labels', async () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  global.document = doc;
  const svg = new Element('svg');
  const { renderNorthIndian } = await astro;
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets: [] }, {
    useAbbreviations: true,
  });
  const texts = svg.children.filter(
    (c) => c.tagName === 'text' && c.attributes['font-size'] === '0.05'
  );
  const labels = texts.map((t) => t.textContent);
  assert.deepStrictEqual(labels, ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']);
  delete global.document;
});

