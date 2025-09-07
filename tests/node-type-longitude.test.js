import assert from 'node:assert';
import test from 'node:test';

import * as swe from '../swisseph/index.js';

const ephemeris = import('../src/lib/ephemeris.js');

test('changing nodeType updates lunar node longitude', async () => {
  const { compute_positions } = await ephemeris;

  const base = {
    datetime: '2000-01-01T00:00',
    tz: 'UTC',
    lat: 0,
    lon: 0,
  };

  const mean = await compute_positions({ ...base, nodeType: 'mean' });
  const trueNode = await compute_positions({ ...base, nodeType: 'true' });

  const meanLon = mean.planets.find((p) => p.name === 'rahu').lon;
  const trueLon = trueNode.planets.find((p) => p.name === 'rahu').lon;

  await swe.ready;
  swe.swe_set_ephe_path('./swisseph/ephe');
  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const jd = swe.swe_julday(2000, 1, 1, 0, swe.SE_GREG_CAL);
  const flag = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL;

  const expectedMean = swe.swe_calc_ut(jd, swe.SE_MEAN_NODE, flag).longitude;
  const expectedTrue = swe.swe_calc_ut(jd, swe.SE_TRUE_NODE, flag).longitude;

  assert.ok(Math.abs(meanLon - expectedMean) < 1e-6);
  assert.ok(Math.abs(trueLon - expectedTrue) < 1e-6);
});

