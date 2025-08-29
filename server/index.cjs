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

function computeAscendant(date, lat, lon) {
  // Convert UTC time to a fractional UT hour value.
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  // Calculate the Julian day and then compute house cusps.
  const julianDay = swisseph.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    swisseph.SE_GREG_CAL
  );
  const houses = swisseph.swe_houses(julianDay, lat, lon, 'P');

  // Error handling: Check if the houses and ascendant properties exist
  if (!houses || typeof houses.ascendant === 'undefined') {
    console.error('Failed to compute houses. Result:', houses);
    throw new Error('Could not compute ascendant from swisseph.');
  }

  // The 'ascendant' property holds the longitude.
  return houses.ascendant;
}

// =======================================================================
// ▼▼▼ THIS FUNCTION HAS BEEN CORRECTED ▼▼▼
// Replaced jyotish.getPlanetPosition with a direct swisseph implementation.
// =======================================================================
async function computePlanet(date, lat, lon, planetName) {
  // Map planet names to swisseph constants
  const planetMap = {
    sun: swisseph.SE_SUN,
    moon: swisseph.SE_MOON,
    mercury: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS,
    mars: swisseph.SE_MARS,
    jupiter: swisseph.SE_JUPITER,
    saturn: swisseph.SE_SATURN,
    rahu: swisseph.SE_TRUE_NODE, // Rahu is the true north node
    ketu: swisseph.SE_MEAN_NODE, // This is an approximation for Ketu, often calculated as 180 degrees from Rahu
  };

  const planetId = planetMap[planetName];
  if (typeof planetId === 'undefined') {
    throw new Error(`Invalid planet name: ${planetName}`);
  }

  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const julianDay = swisseph.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    swisseph.SE_GREG_CAL
  );

  const planetData = swisseph.swe_calc_ut(julianDay, planetId, swisseph.SEFLG_SPEED);

  if (!planetData || typeof planetData.longitude === 'undefined') {
    throw new Error(`Failed to calculate position for ${planetName}`);
  }
  
  let longitude = planetData.longitude;
  // For Ketu, we calculate it as 180 degrees opposite Rahu
  if (planetName === 'ketu') {
      const rahuData = swisseph.swe_calc_ut(julianDay, swisseph.SE_TRUE_NODE, 0);
      longitude = (rahuData.longitude + 180) % 360;
  }


  return {
    longitude: longitude,
    retrograde: planetData.longitudeSpeed < 0,
    // Note: 'combust' calculation is complex and depends on the Sun's position.
    // It is omitted here to fix the primary calculation error.
    combust: false,
  };
}


app.get('/api/ascendant', async (req, res) => {
  const { date, lat, lon } = req.query;
  if (!date || !lat || !lon) {
    return res.status(400).json({ error: 'Missing required query parameters: date, lat, lon' });
  }
  try {
    const jsDate = new Date(date);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (Number.isNaN(jsDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date parameter' });
    }
    if (!Number.isFinite(latNum)) {
      return res.status(400).json({ error: 'Invalid latitude parameter' });
    }
    if (!Number.isFinite(lonNum)) {
      return res.status(400).json({ error: 'Invalid longitude parameter' });
    }

    // This now calls the corrected function
    const longitude = computeAscendant(jsDate, latNum, lonNum);
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
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const planetName = String(planet).toLowerCase();

    if (Number.isNaN(jsDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date parameter' });
    }
    if (!Number.isFinite(latNum)) {
      return res.status(400).json({ error: 'Invalid latitude parameter' });
    }
    if (!Number.isFinite(lonNum)) {
      return res.status(400).json({ error: 'Invalid longitude parameter' });
    }
    const validPlanets = [
      'sun',
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
      'rahu',
      'ketu'
    ];
    if (!validPlanets.includes(planetName)) {
      return res.status(400).json({ error: `Invalid planet parameter: ${planet}` });
    }

    const { longitude, retrograde, combust } = await computePlanet(
      jsDate,
      latNum,
      lonNum,
      planetName
    );
    res.json({ longitude, retrograde, combust });
  } catch (err) {
    console.error('Error in /api/planet:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server only if this file is executed directly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Export the app for testing purposes.
module.exports = app;
module.exports.computeAscendant = computeAscendant;
