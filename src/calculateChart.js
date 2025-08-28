// Utility to compute ascendant and planetary positions.
// The original implementation relied on the "jyotish-calculations" package
// which is not compatible with the browser. Instead, calculations are now
// delegated to a backend API so the frontend remains dependency-free.

async function getAscendant(jsDate, lat, lon) {
  const params = new URLSearchParams({
    date: jsDate.toISOString(),
    lat: String(lat),
    lon: String(lon),
  });

  const res = await fetch(`/api/ascendant?${params.toString()}`);
  if (!res.ok) {
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    throw new Error(data.error || res.statusText);
  }
  const data = await res.json();
  return data.longitude;
}

async function getPlanetPosition(jsDate, lat, lon, planet) {
  const params = new URLSearchParams({
    date: jsDate.toISOString(),
    lat: String(lat),
    lon: String(lon),
    planet,
  });

  const res = await fetch(`/api/planet?${params.toString()}`);
  if (!res.ok) {
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    throw new Error(data.error || res.statusText);
  }
  const data = await res.json();
  return data;
}

const PLANETS = [
  { key: 'sun', abbr: 'Su' },
  { key: 'moon', abbr: 'Mo' },
  { key: 'mars', abbr: 'Ma' },
  { key: 'mercury', abbr: 'Me' },
  { key: 'jupiter', abbr: 'Ju' },
  { key: 'venus', abbr: 'Ve' },
  { key: 'saturn', abbr: 'Sa' },
  { key: 'rahu', abbr: 'Ra' },
  { key: 'ketu', abbr: 'Ke' },
];

function longitudeToSign(longitude) {
  const sign = Math.floor(longitude / 30) + 1; // 1..12
  const degree = longitude % 30;
  return { sign, degree: degree.toFixed(2) };
}

export default async function calculateChart({ date, time, lat, lon }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const jsDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Ascendant calculation
  const ascLong = await getAscendant(jsDate, lat, lon);
  const asc = longitudeToSign(ascLong);

  const houses = Array.from({ length: 12 }, (_, i) => ((asc.sign + i - 1) % 12) + 1);

  // Planetary calculations
  const planets = [];
  for (const p of PLANETS) {
    const info = await getPlanetPosition(jsDate, lat, lon, p.key);
    const pos = longitudeToSign(info.longitude);
    planets.push({
      name: p.key,
      abbr: p.abbr,
      sign: pos.sign,
      degree: pos.degree,
      retrograde: info.retrograde,
      combust: info.combust,
      house: ((pos.sign - asc.sign + 12) % 12) + 1,
    });
  }

  return { ascendant: asc, houses, planets };
}
