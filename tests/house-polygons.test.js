import test from 'node:test';
import assert from 'node:assert';

const astro = import('../src/lib/astro.js');

test('HOUSE_POLYGONS exposes 12 regions with expected centroids', async () => {
  const { HOUSE_POLYGONS, HOUSE_CENTROIDS, polygonCentroid } = await astro;
  assert.strictEqual(HOUSE_POLYGONS.length, 12);
  HOUSE_POLYGONS.forEach((poly, i) => {
    assert.ok(poly.length >= 3);
    const { cx, cy } = polygonCentroid(poly);
    const expected = HOUSE_CENTROIDS[i];
    assert.ok(Math.abs(cx - expected.cx) < 1e-9);
    assert.ok(Math.abs(cy - expected.cy) < 1e-9);
  });
});
