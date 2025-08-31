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

test('reference charts for Darbhanga on 1982-12-01 match expected placements', async () => {
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(am.ascSign, 7);
  const amPlanets = Object.fromEntries(am.planets.map((p) => [p.name, p]));
  assert.strictEqual(amPlanets.sun.sign, 7);
  assert.strictEqual(amPlanets.sun.house, 2);
  assert.strictEqual(amPlanets.moon.sign, 1);
  assert.strictEqual(amPlanets.moon.house, 8);
  assert.strictEqual(amPlanets.jupiter.sign, 6);
  assert.strictEqual(amPlanets.jupiter.house, 1);
  assert.strictEqual(amPlanets.saturn.sign, 5);
  assert.strictEqual(amPlanets.saturn.house, 12);
  assert.deepStrictEqual(
    am.planets.filter((p) => p.house === 7).map((p) => p.name),
    ['mercury', 'venus']
  );

  global.document = doc;
  const svgAm = new Element('svg');
  renderNorthIndian(svgAm, am);
  assert.strictEqual(
    svgAm.children.filter((c) => c.tagName === 'path').length,
    4
  );

  const pm = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897);
  assert.strictEqual(pm.ascSign, 2);
  const pmPlanets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  assert.strictEqual(pmPlanets.sun.sign, 7);
  assert.strictEqual(pmPlanets.sun.house, 7);
  assert.strictEqual(pmPlanets.moon.sign, 1);
  assert.strictEqual(pmPlanets.moon.house, 1);
  assert.strictEqual(pmPlanets.jupiter.house, 6);
  assert.strictEqual(pmPlanets.saturn.house, 5);

  const svgPm = new Element('svg');
  renderNorthIndian(svgPm, pm);
  assert.strictEqual(
    svgPm.children.filter((c) => c.tagName === 'path').length,
    4
  );
  delete global.document;
});
