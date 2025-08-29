const fs = require('fs');
const express = require('express');
const path = require('path');

// Import both the high-level calculations library and the low-level ephemeris library.
const jyotish = require('jyotish-calculations');
const swisseph = require('swisseph-v2');

// --- Initialization ---

// Define the path to the Swiss Ephemeris files.
// '__dirname' is automatically available in CommonJS modules.
const ephemerisPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'swisseph-v2', // The correct package name that contains the ephemeris files.
  'ephe'
);

// Check if the ephemeris directory exists. If not, log a detailed error and exit.
if (!fs.existsSync(ephemerisPath)) {
  console.error(
    'Swiss Ephemeris path not found. Please ensure "swisseph-v2" is installed correctly.'
  );
  console.error('Expected path:', ephemerisPath);
  process.exit(1);
}

try {
  // The setEphemerisPath function belongs to the 'swisseph-v2' package.
  // We must configure it directly.
  swisseph.swe_set_ephe_path(ephemerisPath);
  console.log('Swiss Ephemeris path configured successfully.');
} catch (err) {
  console.error('Failed to configure Swiss Ephemeris:', err);
  process.exit(1);
}

// --- Express Server Setup ---

const app = express();
const PORT = process.env.PORT || 3001;

// --- API Endpoints ---

async function computeAscendant(date, lat, lon) {
  // The 'getAscendant' function returns an object with a longitude property.
  const { longitude } = await jyotish.getAscendant(date, lat, lon);
  return longitude;
}

async function computePlanet(date, lat, lon, planetName) {
  return jyotish.getPlanetPosition(planetName, date, lat, lon);
}

app.get('/api/ascendant', async (req, res) => {
  const { date, lat, lon } = req.query;
  if (!date || !lat || !lon) {
    return res.status(400).json({ error: 'Missing required query parameters: date, lat, lon' });
  }
  try {
    const jsDate = new Date(date);
    const longitude = await computeAscendant(jsDate, parseFloat(lat), parseFloat(lon));
    res.json({ longitude });
  } catch (err) {
    console.error('Error in /api/ascendant:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/planet', async (req, res) => {
  const { date, lat, lon, planet } = req.query;
  if (!date || !lat || !lon || !planet) {
    return res.status(400).json({ error: 'Missing required query parameters: date, lat, lon, planet' });
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
    console.error('Error in /api/planet:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server.
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
