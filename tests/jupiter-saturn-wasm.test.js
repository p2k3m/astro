import assert from 'node:assert';
import test from 'node:test';

// Verify that raw values from the WASM Swiss Ephemeris are
// returned without any manual adjustments.  Jupiter and Saturn
// on 1982-12-28 are used as reference values.
test('Jupiter and Saturn longitudes and speeds match Swiss Ephemeris', async () => {
  const swe = await import('../swisseph/index.js');
  await swe.ready;

  // Ensure the ephemeris data and sidereal mode are configured
  swe.swe_set_ephe_path('./swisseph/ephe');
  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

  const jd = swe.swe_julday(1982, 12, 28, 0, swe.SE_GREG_CAL);
  const flag = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL;

  const jupiter = swe.swe_calc_ut(jd, swe.SE_JUPITER, flag);
  const saturn = swe.swe_calc_ut(jd, swe.SE_SATURN, flag);

  // Expected values generated from the Swiss Ephemeris (Lahiri sidereal)
  assert.ok(Math.abs(jupiter.longitude - 216.7701434) < 1e-6);
  assert.ok(Math.abs(saturn.longitude - 188.9978761) < 1e-6);
  assert.ok(Math.abs(jupiter.longitudeSpeed - 0.19958399999950416) < 1e-8);
  assert.ok(Math.abs(saturn.longitudeSpeed - 0.07495199999084434) < 1e-8);
});

