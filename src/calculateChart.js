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

  try {
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
  } catch (err) {
    throw new Error(`Failed to fetch ascendant: ${err.message}`);
  }
}

async function getPlanetPosition(jsDate, lat, lon, planet) {
  const params = new URLSearchParams({
    date: jsDate.toISOString(),
    lat: String(lat),
    lon: String(lon),
    planet,
  });

  try {
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
  } catch (err) {
    throw new Error(`Failed to fetch ${planet} data: ${err.message}`);
  }
}

// Attempt to determine the timezone offset (in minutes) for a location.
// Uses an external API when available and falls back to a simple
// approximation based on longitude if the request fails.
async function getTimezoneOffset(lat, lon) {
  try {
    const url = `https://www.timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.currentUtcOffset) {
        const { hours = 0, minutes = 0 } = data.currentUtcOffset;
        return hours * 60 + minutes;
      }
    }
  } catch (err) {
    // Ignore network or parsing errors and use fallback below
    console.error('Failed to fetch timezone offset', err);
  }
  // Fallback: crude estimate from longitude with half-hour precision
  return Math.round(lon / 7.5) * 30;
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

export function longitudeToSign(longitude) {
  longitude = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(longitude / 30) + 1; // 1..12
  const degree = longitude % 30;
  // Return degree as a numeric value rounded to two decimals
  // Using unary plus converts the string result of toFixed back to a number
  return { sign, degree: +degree.toFixed(2) };
}

export default async function calculateChart({ date, time, lat, lon }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  let jsDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Adjust for the location's timezone offset so the backend receives UTC
  // timestamps. If the offset cannot be determined, the function falls back
  // to using the provided time as-is.
  const tzOffset = await getTimezoneOffset(lat, lon);
  jsDate = new Date(jsDate.getTime() - tzOffset * 60000);

  // Ascendant calculation
  const ascLong = await getAscendant(jsDate, lat, lon);
  const asc = longitudeToSign(ascLong);

  const houses = Array.from(
    { length: 12 },
    (_, i) => ((asc.sign + i - 1) % 12) + 1
  );

  // Sanity check: ensure we ended up with a full 12-sign progression
  // starting from the ascendant. This helps catch logic errors if the
  // calculation above is ever altered.
  const expected = Array.from(
    { length: 12 },
    (_, i) => ((asc.sign + i - 1) % 12) + 1
  );
  const validHouses =
    houses.length === 12 && houses.every((h, idx) => h === expected[idx]);
  if (!validHouses) {
    throw new Error('Invalid house sequence');
  }

  // Planetary calculations
  let planetData;
  try {
    planetData = await Promise.all(
      PLANETS.map((p) => getPlanetPosition(jsDate, lat, lon, p.key))
    );
  } catch (err) {
    throw new Error(`Failed to fetch planetary data: ${err.message}`);
  }

  const planets = planetData.map((info, idx) => {
    const p = PLANETS[idx];
    const pos = longitudeToSign(info.longitude);
    return {
      name: p.key,
      abbr: p.abbr,
      sign: pos.sign,
      degree: pos.degree,
      retrograde: info.retrograde,
      combust: info.combust,
      exalted: info.exalted,
      debilitated: info.debilitated,
      house: ((pos.sign - asc.sign + 12) % 12) + 1,
    };
  });

  return { ascendant: asc, houses, planets };
}
