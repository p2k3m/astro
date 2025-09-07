import expected from '../data/astrosage.json';
import { planetLongitudes, julianDay, PlanetName } from './astro/positions';
import { ascendant, assignHouses, isCombust } from './astro/houses';
import { renderChart } from './ui/chart';

// Birth details: 1 Dec 1982 03:50 UTC (Darbhanga: 26.154N, 85.891E)
const birth = new Date('1982-12-01T03:50:00Z');

(async () => {
  const positions = await planetLongitudes(birth);
  const jd = julianDay(birth);
  const asc = ascendant(jd, 26.154, 85.891);
  const houses = assignHouses(positions, asc);
  const venusCombust = isCombust(positions.Sun, positions.Venus);

  console.log('Computed longitudes:', positions);
  console.log('Ascendant:', asc.toFixed(2));
  console.log(renderChart(houses));
  console.log('Venus combust:', venusCombust);

  console.log('Comparison with AstroSage (degree differences):');
  (Object.keys(expected) as PlanetName[]).forEach((p) => {
    const diff = Math.abs(positions[p] - (expected as any)[p]);
    console.log(`${p}: ${diff.toFixed(2)}`);
  });

  if (houses[1]?.includes('Jupiter')) {
    console.log('Warning: Jupiter is in the 1st house!');
  } else {
    console.log('Jupiter correctly not in the 1st house.');
  }

  if (houses[2]?.includes('Mercury') && houses[2]?.includes('Venus')) {
    console.log('Mercury and Venus are in the 2nd house.');
  } else {
    console.log('Mercury and Venus are NOT both in the 2nd house.');
  }
})();
