const fs = require('fs');
const express = require('express');
const path = require('path');

let ascendant;
let planet;
let setEphemerisPath;
let init;
try {
  ({ ascendant, planet, setEphemerisPath, init } = require('jyotish-calculations'));
  if (typeof ascendant !== 'function' || typeof planet !== 'function') {
    throw new Error('Missing required exports');
  }
} catch (err) {
  console.error('Failed to load jyotish-calculations:', err);
  process.exit(1);
}

// Initialize jyotish-calculations with the Swiss Ephemeris path before
// handling any requests. Exit with a clear error if initialization fails
// so that errors don't surface later as silent 500 responses.
const ephemerisPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'swisseph',
  'ephe'
);

if (!fs.existsSync(ephemerisPath)) {
  console.error('Swiss Ephemeris path not found:', ephemerisPath);
  process.exit(1);
}

const initPromise = (async () => {
  if (typeof setEphemerisPath === 'function') {
    setEphemerisPath(ephemerisPath);
  } else if (typeof init === 'function') {
    await init(ephemerisPath);
  } else {
    throw new Error('jyotish-calculations missing initialization function');
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

async function computeAscendant(date, lat, lon) {
  return await ascendant(date, lat, lon);
}

async function computePlanet(date, lat, lon, planetName) {
  return await planet(planetName, date, lat, lon);
}

app.get('/api/ascendant', async (req, res) => {
  const { date, lat, lon } = req.query;
  if (!date || !lat || !lon) {
    res.status(400).json({ error: 'Missing query parameters' });
    return;
  }
  try {
    const jsDate = new Date(date);
    const result = await computeAscendant(jsDate, parseFloat(lat), parseFloat(lon));
    const longitude = typeof result === 'number' ? result : result.longitude;
    res.json({ longitude });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/planet', async (req, res) => {
  const { date, lat, lon, planet } = req.query;
  if (!date || !lat || !lon || !planet) {
    res.status(400).json({ error: 'Missing query parameters' });
    return;
  }
  try {
    const jsDate = new Date(date);
    const result = await computePlanet(jsDate, parseFloat(lat), parseFloat(lon), planet);
    res.json({
      longitude: result.longitude ?? result.lng ?? result.lon ?? result.longitudeDeg,
      retrograde: result.retrograde ?? result.isRetrograde ?? false,
      combust: result.combust ?? result.isCombust ?? false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize jyotish-calculations:', err);
    process.exit(1);
  });

