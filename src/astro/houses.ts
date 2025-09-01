import { PlanetName } from './positions';

const degDiff = (a: number, b: number) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

export function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const theta = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
  return ((theta % 360) + 360) % 360;
}

export function ascendant(jd: number, latitude: number, longitude: number): number {
  const theta = gmst(jd) + longitude;
  const phi = (latitude * Math.PI) / 180;
  const T = (jd - 2451545.0) / 36525;
  const eps = ((23.439291 - 0.0130042 * T) * Math.PI) / 180;
  const asc = Math.atan2(
    Math.sin((theta * Math.PI) / 180),
    Math.cos((theta * Math.PI) / 180) * Math.sin(eps) - Math.tan(phi) * Math.cos(eps)
  );
  return ((asc * 180) / Math.PI + 360) % 360;
}

export function houseForLongitude(longitude: number, asc: number): number {
  const diff = ((longitude - asc + 360) % 360);
  return Math.floor(diff / 30) + 1; // 1..12 equal houses
}

export function assignHouses(positions: Record<PlanetName, number>, asc: number): Record<number, PlanetName[]> {
  const houses: Record<number, PlanetName[]> = {};
  (['Sun', 'Mercury', 'Venus', 'Jupiter'] as PlanetName[]).forEach((p) => {
    const h = houseForLongitude(positions[p], asc);
    houses[h] = houses[h] || [];
    houses[h].push(p);
  });
  return houses;
}

export function isCombust(sunLon: number, planetLon: number, orb = 8): boolean {
  return degDiff(sunLon, planetLon) <= orb;
}
