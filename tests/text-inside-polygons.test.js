import test from 'node:test';
import assert from 'node:assert';

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

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

test('all text elements render inside their house polygons', async () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const codes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj', 'kk', 'll'];
  const planets = codes.map((name, i) => ({ name, sign: i + 1, house: i + 1, deg: 0 }));
  const expected = Object.fromEntries(codes.map((c, i) => [c, i + 1]));
  const data = { ascSign: 1, signInHouse, planets };

  global.document = doc;
  const svg = new Element('svg');
  const { renderNorthIndian, HOUSE_POLYGONS } = await astro;
  renderNorthIndian(svg, data);
  delete global.document;

  const texts = svg.children.filter((c) => c.tagName === 'text');
  texts.forEach((t) => {
    const x = Number(t.attributes.x);
    const y = Number(t.attributes.y);
    const name = t.textContent;
    if (expected[name]) {
      const house =
        HOUSE_POLYGONS.findIndex((poly) => pointInPolygon(x, y, poly)) + 1;
      assert.strictEqual(house, expected[name]);
    }
  });
});

