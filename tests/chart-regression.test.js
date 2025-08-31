const assert = require('node:assert');
const test = require('node:test');
const { computePositions, renderNorthIndian } = require('../src/lib/astro.js');

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

test('computePositions matches AstroSage for Darbhanga 1982-12-01 03:50', async () => {
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);

  // Ascendant sign
  assert.strictEqual(result.ascSign, 7);
  assert.strictEqual(result.signInHouse[1], result.ascSign);

  // Sign sequence (sign in each house)
  assert.deepStrictEqual(result.signInHouse, [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);

  // Expected house placement for each planet
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
    const expectedHouses = {
      sun: 2,
      moon: 8,
      mars: 6,
      mercury: 7,
      jupiter: 2,
      venus: 7,
      saturn: 1,
      rahu: 9,
      ketu: 3,
    };
  for (const [name, house] of Object.entries(expectedHouses)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }

  // Retrograde flags
  const expectedRetro = {
    sun: false,
    moon: false,
    mars: false,
    mercury: false,
    jupiter: false,
    venus: false,
    saturn: false,
    rahu: true,
    ketu: true,
  };
  for (const [name, retro] of Object.entries(expectedRetro)) {
    assert.strictEqual(planets[name].retro, retro, `${name} retrograde`);
  }

  // Combustion states
  const expectedCombust = {
    sun: false,
    moon: false,
    mars: false,
    mercury: false,
    jupiter: true,
    venus: false,
    saturn: false,
    rahu: false,
    ketu: false,
  };
  for (const [name, combust] of Object.entries(expectedCombust)) {
    assert.strictEqual(planets[name].combust, combust, `${name} combust`);
  }

  // Render chart and compare snapshot to guard against layout regressions
  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, result);
  delete global.document;
  const snapshot = svg.children.map((c) => ({
    tag: c.tagName,
    attrs: c.attributes,
    text: c.textContent,
  }));
  assert.deepStrictEqual(snapshot, [
    { tag: 'path', attrs: { d: 'M0 0 L1 0 L1 1 L0 1 Z', 'stroke-width': '0.02' }, text: '' },
    { tag: 'path', attrs: { d: 'M0 0 L1 1', 'stroke-width': '0.01' }, text: '' },
    { tag: 'path', attrs: { d: 'M1 0 L0 1', 'stroke-width': '0.01' }, text: '' },
    { tag: 'path', attrs: { d: 'M0.5 0 L1 0.5 L0.5 1 L0 0.5 Z', 'stroke-width': '0.01' }, text: '' },
    { tag: 'text', attrs: { x: '0.29', y: '0.08', 'text-anchor': 'start', 'font-size': '0.03' }, text: 'Asc' },
    { tag: 'text', attrs: { x: '0.71', y: '0.08', 'text-anchor': 'end', 'font-size': '0.05' }, text: '7' },
    { tag: 'text', attrs: { x: '0.46', y: '0.08', 'text-anchor': 'end', 'font-size': '0.05' }, text: '8' },
    { tag: 'text', attrs: { x: '0.21', y: '0.08', 'text-anchor': 'end', 'font-size': '0.05' }, text: '9' },
    { tag: 'text', attrs: { x: '0.46', y: '0.33', 'text-anchor': 'end', 'font-size': '0.05' }, text: '10' },
    { tag: 'text', attrs: { x: '0.21', y: '0.58', 'text-anchor': 'end', 'font-size': '0.05' }, text: '11' },
    { tag: 'text', attrs: { x: '0.46', y: '0.83', 'text-anchor': 'end', 'font-size': '0.05' }, text: '12' },
    { tag: 'text', attrs: { x: '0.71', y: '0.58', 'text-anchor': 'end', 'font-size': '0.05' }, text: '1' },
    { tag: 'text', attrs: { x: '0.96', y: '0.83', 'text-anchor': 'end', 'font-size': '0.05' }, text: '2' },
    { tag: 'text', attrs: { x: '0.96', y: '0.58', 'text-anchor': 'end', 'font-size': '0.05' }, text: '3' },
    { tag: 'text', attrs: { x: '0.96', y: '0.33', 'text-anchor': 'end', 'font-size': '0.05' }, text: '4' },
    { tag: 'text', attrs: { x: '0.96', y: '0.08', 'text-anchor': 'end', 'font-size': '0.05' }, text: '5' },
    { tag: 'text', attrs: { x: '0.96', y: '0.08', 'text-anchor': 'end', 'font-size': '0.05' }, text: '6' },
    { tag: 'text', attrs: { x: '0.5', y: '0.32', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "saturn(Ex) 00°14'" },
    { tag: 'text', attrs: { x: '0.25', y: '0.15333333333333332', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "sun 14°46'" },
    { tag: 'text', attrs: { x: '0.25', y: '0.19333333333333333', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "jupiter(C) 05°04'" },
    { tag: 'text', attrs: { x: '0.08333333333333333', y: '0.32', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "ketu(R) 11°53'" },
    { tag: 'text', attrs: { x: '0.25', y: '0.98', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "mars 08°19'" },
    { tag: 'text', attrs: { x: '0.5', y: '0.8200000000000001', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "mercury 29°13'" },
    { tag: 'text', attrs: { x: '0.5', y: '0.8600000000000001', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "venus 10°02'" },
    { tag: 'text', attrs: { x: '0.75', y: '0.98', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "moon(Ex) 13°17'" },
    { tag: 'text', attrs: { x: '0.9166666666666666', y: '0.8200000000000001', 'text-anchor': 'middle', 'font-size': '0.03' }, text: "rahu(R) 11°53'" },
  ]);
});
