const fs = require('fs');
const express = require('../express/index.cjs');
const path = require('path');

// Placeholder for the Swiss Ephemeris library which will be loaded dynamically.
let swisseph;

// --- Initialization ---

// Define the path to the Swiss Ephemeris files.
// '__dirname' is automatically available in CommonJS modules.
const ephemerisPath = path.join(
  __dirname,
  '..',
  'swisseph',
  'ephe'
);

// Check if the ephemeris directory exists. If not, log a detailed error and exit.
if (!fs.existsSync(ephemerisPath)) {
  console.error(
    'Swiss Ephemeris path not found. Please ensure "swisseph" is installed correctly.'
  );
  console.error('Expected path:', ephemerisPath);
  process.exit(1);
}

// --- Express Server Setup ---

const app = express();
const PORT = process.env.PORT || 3001;

// --- API Endpoints ---

let ephemerisModule;
async function getEphemeris() {
  if (!ephemerisModule) {
    ephemerisModule = await import('../src/lib/ephemeris.js');
  }
  return ephemerisModule;
}

app.get('/api/positions', async (req, res) => {
  const { datetime, tz, lat, lon, sidMode, nodeType, nakshatraAbbr } = req.query;
  if (!datetime || !tz || !lat || !lon) {
    return res
      .status(400)
      .json({ error: 'Missing required query parameters: datetime, tz, lat, lon' });
  }
  try {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (!Number.isFinite(latNum)) {
      return res.status(400).json({ error: 'Invalid latitude parameter' });
    }
    if (!Number.isFinite(lonNum)) {
      return res.status(400).json({ error: 'Invalid longitude parameter' });
    }
    const { compute_positions } = await getEphemeris();
    const sidModeNum = sidMode ? parseInt(sidMode, 10) : undefined;
    const result = await compute_positions({
      datetime,
      tz,
      lat: latNum,
      lon: lonNum,
      sidMode: sidModeNum,
      nodeType,
      nakshatraAbbr: nakshatraAbbr === 'true' || nakshatraAbbr === '1',
    });
    res.json(result);
  } catch (err) {
    console.error('Error in /api/positions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export the app for testing purposes.
module.exports = app;

(async () => {
  try {
    swisseph = await import('../swisseph/index.js');
    await swisseph.ready;
    swisseph.swe_set_ephe_path(ephemerisPath);
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    console.log('Swiss Ephemeris path configured successfully.');

    // Start the server only after Swiss Ephemeris is configured and only if this
    // file is executed directly.
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('Failed to configure Swiss Ephemeris:', err);
    process.exit(1);
  }
})();
