import { PlanetName } from '../astro/positions';

export function renderChart(houses: Record<number, PlanetName[]>): string {
  let out = '';
  for (let h = 1; h <= 12; h++) {
    const occupants = houses[h]?.join(', ') || '-';
    out += `House ${h}: ${occupants}\n`;
  }
  return out;
}
