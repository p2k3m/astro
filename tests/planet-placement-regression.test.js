import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';

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

test('planet positions match AstroSage for sample chart', async () => {
  const { computePositions, renderNorthIndian, HOUSE_BBOXES } = await astro;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  const planets = Object.fromEntries(data.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.saturn.sign, 7, 'saturn sign');
  assert.ok(!planets.saturn.retro, 'saturn retro');
  const expected = {
    sun: 3,
    moon: 9,
    mars: 4,
    mercury: 3,
    jupiter: 2,
    venus: 3,
    saturn: 2,
    uranus: 3,
    neptune: 3,
    pluto: 1,
    rahu: 9,
    ketu: 3,
  };
  const PLANET_ABBR = {
    sun: 'Su',
    moon: 'Mo',
    mars: 'Ma',
    mercury: 'Me',
    jupiter: 'Ju',
    venus: 'Ve',
    saturn: 'Sa',
    uranus: 'Ur',
    neptune: 'Ne',
    pluto: 'Pl',
    rahu: 'Ra',
    ketu: 'Ke',
  };

  global.document = doc;
  const svg = new Element('svg');
  renderNorthIndian(svg, data);
  delete global.document;

  const texts = svg.children.filter(
    (c) => c.tagName === 'text' && !/^Asc$/.test(c.textContent) && !/^\d+$/.test(c.textContent)
  );

  for (const [name, house] of Object.entries(expected)) {
    const abbr = PLANET_ABBR[name];
    const node = texts.find((t) => t.textContent.startsWith(abbr));
    assert.ok(node, `missing ${name}`);
    const x = Number(node.attributes.x);
    const y = Number(node.attributes.y);
    const { minX, maxX, minY, maxY } = HOUSE_BBOXES[house - 1];
    assert.ok(x >= minX && x <= maxX, `${name} outside house ${house} horizontally`);
    assert.ok(y >= minY && y <= maxY, `${name} outside house ${house} vertically`);
  }
});
