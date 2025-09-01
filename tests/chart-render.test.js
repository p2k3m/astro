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

test('North Indian chart uses one outer square and internal grid', async () => {
  const svg = new Element('svg');
  global.document = doc;
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const { renderNorthIndian, CHART_PATHS } = await astro;
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets: [] });

  const paths = svg.children.filter((c) => c.tagName === 'path');
  assert.strictEqual(paths.length, 4);
  assert.strictEqual(paths[0].attributes.d, CHART_PATHS.outer);
  assert.strictEqual(paths[0].attributes['stroke-width'], '0.02');
  assert.strictEqual(paths[1].attributes.d, CHART_PATHS.diagonals[0]);
  assert.strictEqual(paths[2].attributes.d, CHART_PATHS.diagonals[1]);
  assert.strictEqual(paths[1].attributes['stroke-width'], '0.01');
  assert.strictEqual(paths[2].attributes['stroke-width'], '0.01');
  assert.strictEqual(paths[3].attributes.d, CHART_PATHS.inner);
  assert.strictEqual(paths[3].attributes['stroke-width'], '0.01');
  assert.ok(svg.children.every((el) => el.tagName !== 'line'));
  delete global.document;
});

test('planet labels show abbreviations without degrees', async () => {
  const svg = new Element('svg');
  global.document = doc;
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const planets = [
    { name: 'sun', house: 1, deg: 15 },
    { name: 'mercury', house: 1, deg: 20, retro: true },
  ];
  const { renderNorthIndian } = await astro;
  renderNorthIndian(svg, { ascSign: 1, signInHouse, planets });
  delete global.document;
  const labels = svg.children.filter((c) => c.tagName === 'text').map((t) => t.textContent);
  assert.ok(labels.includes('Su'));
  assert.ok(labels.includes('Me(R)'));
  assert.ok(labels.every((t) => !t.includes('°')));
});
