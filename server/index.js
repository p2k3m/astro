const fs = require('fs');
const express = require('express');
const path = require('path');

const jyotishModule = require('jyotish-calculations');
const { setEphemerisPath, getAscendantLongitude, getPlanetPosition } =
  jyotishModule.default || jyotishModule;

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

try {
  setEphemerisPath(ephemerisPath);
} catch (err) {
  console.error('Failed to initialize jyotish-calculations:', err);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

async function computeAscendant(date, lat, lon) {
  return getAscendantLongitude(date, lat, lon);
}

async function computePlanet(date, lat, lon, planetName) {
  return getPlanetPosition(planetName, date, lat, lon);
}

app.get('/api/ascendant', async (req, res) => {
  const { date, lat, lon } = req.query;
  if (!date || !lat || !lon) {
    res.status(400).json({ error: 'Missing query parameters' });
    return;
  }
  try {
    const jsDate = new Date(date);
    const longitude = await computeAscendant(jsDate, parseFloat(lat), parseFloat(lon));
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
    const { longitude, retrograde, combust } = await computePlanet(
      jsDate,
      parseFloat(lat),
      parseFloat(lon),
      planet
    );
    res.json({ longitude, retrograde, combust });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

