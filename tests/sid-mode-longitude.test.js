import assert from 'node:assert';
import test from 'node:test';

test('changing sidMode updates sidereal longitude', async () => {
  const swe = await import('../swisseph/index.js');
  await swe.ready;

  // Use bundled ephemeris data
  swe.swe_set_ephe_path('./swisseph/ephe');

  const jd = swe.swe_julday(2000, 1, 1, 0, swe.SE_GREG_CAL);
  const flag = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const lahiri = swe.swe_calc_ut(jd, swe.SE_SUN, flag).longitude;

  swe.swe_set_sid_mode(swe.SE_SIDM_FAGAN_BRADLEY, 0, 0);
  const other = swe.swe_calc_ut(jd, swe.SE_SUN, flag).longitude;

  // Expect a noticeable difference between sidereal modes
  assert.ok(Math.abs(lahiri - other) > 0.1);
});

