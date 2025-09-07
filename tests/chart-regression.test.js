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

test('computePositions matches AstroSage for Darbhanga 1982-12-01 03:50', async () => {
  const { computePositions, renderNorthIndian } = await astro;
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);

  // Ascendant sign
  assert.strictEqual(result.ascSign, 7);
  assert.strictEqual(result.signInHouse[1], result.ascSign);

  // Sign sequence (sign in each house)
  assert.deepStrictEqual(result.signInHouse, [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);

  // Expected house placement for each planet
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
    const expectedHouses = {
      sun: 3,
      moon: 9,
      mars: 4,
      mercury: 3,
      jupiter: 2,
      venus: 3,
      saturn: 2,
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
    rahu: false,
    ketu: false,
  };
  for (const [name, retro] of Object.entries(expectedRetro)) {
    assert.strictEqual(planets[name].retro, retro, `${name} retrograde`);
  }

  // Combustion states
  const expectedCombust = {
    sun: false,
    moon: false,
    mars: false,
    mercury: true,
    jupiter: false,
    venus: true,
    saturn: false,
    rahu: false,
    ketu: false,
  };
  for (const [name, combust] of Object.entries(expectedCombust)) {
    assert.strictEqual(planets[name].combust, combust, `${name} combust`);
  }

  // Render chart and ensure planet labels are present
  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, result);
  delete global.document;
  const labels = svg.children
    .filter((c) => c.tagName === 'text')
    .map((c) => c.textContent);
  const expectedLabels = [
    'Me(C)',
    'Ve(C)',
    'Ju',
    'Pl',
    'Su',
    'Ur',
    'Ne',
    'Ke',
    'Ma(Ex)',
    'Mo',
    'Ra',
    'Sa',
  ];
  for (const lbl of expectedLabels) {
    assert.ok(labels.includes(lbl), `missing label ${lbl}`);
  }
});
