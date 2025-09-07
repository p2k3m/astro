import * as swe from '../../swisseph/index.js';

export type PlanetName = 'Sun' | 'Mercury' | 'Venus' | 'Jupiter';

const epheUrl = new URL('../../swisseph/ephe/', import.meta.url);
swe.ready.then(() => {
  if (epheUrl.protocol === 'file:') swe.swe_set_ephe_path(epheUrl.pathname);
  try {
    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  } catch {}
});

export function julianDay(date: Date): number {
  const y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1; // 1-12
  const d =
    date.getUTCDate() +
    (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;
  if (m <= 2) {
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    B -
    1524.5;
  return JD;
}

const PLANET_CODES: Record<PlanetName, number> = {
  Sun: swe.SE_SUN,
  Mercury: swe.SE_MERCURY,
  Venus: swe.SE_VENUS,
  Jupiter: swe.SE_JUPITER,
};

async function calcLongitude(planet: PlanetName, date: Date): Promise<number> {
  await swe.ready;
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;
  const jd = swe.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    swe.SE_GREG_CAL,
  );
  const flag = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;
  const data = swe.swe_calc_ut(jd, PLANET_CODES[planet], flag);
  return data.longitude;
}

export async function planetLongitudes(date: Date): Promise<Record<PlanetName, number>> {
  const result = {} as Record<PlanetName, number>;
  for (const planet of Object.keys(PLANET_CODES) as PlanetName[]) {
    result[planet] = await calcLongitude(planet, date);
  }
  return result;
}
