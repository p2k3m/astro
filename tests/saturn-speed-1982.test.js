import assert from 'node:assert';
import test from 'node:test';

const eph = import('../src/lib/ephemeris.js');

test('Saturn sidereal longitude and speed on 1982-12-01', async () => {
  const { compute_positions } = await eph;
  const res = await compute_positions({
    datetime: '1982-12-01T03:50+05:30',
    tz: 'UTC+5:30',
    lat: 26.15216,
    lon: 85.89707,
  });
  const saturn = res.planets.find((p) => p.name === 'saturn');
  // Sidereal longitude should be about 179.238844° (Virgo).
  assert.ok(Math.abs(saturn.lon - 179.23884456223266) < 1e-6);
  // Saturn was retrograde at this time, so speed is negative.
  assert.ok(saturn.speed < 0);
});
