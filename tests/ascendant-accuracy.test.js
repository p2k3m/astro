import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';

test('Ascendant matches AstroSage for London 2023-03-21 00:00 UTC', () => {
  const jd = swe.swe_julday(2023, 3, 21, 0, swe.SE_GREG_CAL);
  const { ascendant } = swe.swe_houses_ex(
    jd,
    51.5,
    0,
    'P',
    swe.SEFLG_SIDEREAL | swe.SEFLG_SWIEPH
  );
  // AstroSage reference: ~7° Scorpio (217.98°)
  assert.ok(Math.abs(ascendant - 217.98) < 0.5);
});
