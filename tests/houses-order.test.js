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

test('houses and signs increase clockwise from ascendant', async () => {
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) signInHouse[h] = h;
  const data = { ascSign: 1, signInHouse, planets: [] };

  global.document = doc;
  const svg = new Element('svg');
  const { renderNorthIndian, HOUSE_CENTROIDS } = await astro;
  renderNorthIndian(svg, data);
  const signTexts = svg.children.filter(
    (c) => c.tagName === 'text' && c.attributes['font-size'] === '0.05'
  );
  assert.strictEqual(signTexts.length, 12);
  for (let i = 0; i < 12; i++) {
    const t = signTexts.find((st) => st.textContent === String(i + 1));
    assert.ok(t, `sign ${i + 1} missing`);
  }
  delete global.document;

  for (let i = 0; i < 12; i++) {
    const current = signInHouse[i + 1];
    const next = signInHouse[(i + 1) % 12 + 1];
    assert.strictEqual(next, (current % 12) + 1);

    const { cx: cx1, cy: cy1 } = HOUSE_CENTROIDS[i];
    const { cx: cx2, cy: cy2 } = HOUSE_CENTROIDS[(i + 1) % 12];
    const x1 = cx1 - 0.5;
    const y1 = 0.5 - cy1;
    const x2 = cx2 - 0.5;
    const y2 = 0.5 - cy2;
    const cross = x1 * y2 - y1 * x2;
    assert.ok(cross < 0, `houses ${i + 1} -> ${((i + 2) > 12 ? 1 : i + 2)} not clockwise`);
  }
});
