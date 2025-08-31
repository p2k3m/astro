import { SIGN_NAMES } from './astro.js';

const PLANET_ABBR = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
};

export function summarizeChart(data) {
  const ascendant = SIGN_NAMES[data.ascSign - 1];
  const moon = data.planets.find((p) => p.name === 'moon');
  const moonSign = SIGN_NAMES[(moon?.sign ?? 1) - 1];
  const houses = Array.from({ length: 13 }, () => '');
  for (let h = 1; h <= 12; h++) {
    const abbrs = data.planets
      .filter((p) => p.house === h)
      .map((p) => PLANET_ABBR[p.name] || p.name.slice(0, 2));
    houses[h] = abbrs.join(' ');
  }
  return { ascendant, moonSign, houses };
}
