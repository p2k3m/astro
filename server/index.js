import fs from 'fs';
import express from '../express/index.cjs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// The Swiss Ephemeris library is loaded dynamically when the server starts.

// --- Initialization ---

// Define the path to the Swiss Ephemeris files.
// Compute __dirname since it's not available in ES modules.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ephemerisPath = path.join(__dirname, '..', 'swisseph', 'ephe');

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

const VALID_NODE_TYPES = new Set(['mean', 'true']);
const VALID_HOUSE_SYSTEMS = new Set([
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
]);

// --- API Endpoints ---

let ephemerisModule;
async function getEphemeris() {
  if (!ephemerisModule) {
    ephemerisModule = await import('../src/lib/ephemeris.js');
  }
  return ephemerisModule;
}

app.get('/api/positions', async (req, res) => {
  const {
    datetime,
    tz,
    lat,
    lon,
    sidMode,
    houseSystem,
    nodeType,
    nakshatraAbbr,
  } = req.query;
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
    const node = nodeType ? nodeType.toLowerCase() : undefined;
    if (nodeType && !VALID_NODE_TYPES.has(node)) {
      return res.status(400).json({ error: 'Invalid nodeType parameter' });
    }
    const house = houseSystem ? houseSystem.toUpperCase() : undefined;
    if (houseSystem && !VALID_HOUSE_SYSTEMS.has(house)) {
      return res.status(400).json({ error: 'Invalid houseSystem parameter' });
    }
    const { compute_positions } = await getEphemeris();
    const sidModeNum = sidMode ? parseInt(sidMode, 10) : undefined;
    const result = await compute_positions({
      datetime,
      tz,
      lat: latNum,
      lon: lonNum,
      sidMode: sidModeNum,
      nodeType: node,
      houseSystem: house,
      nakshatraAbbr: nakshatraAbbr === 'true' || nakshatraAbbr === '1',
    });
    res.json(result);
  } catch (err) {
    console.error('Error in /api/positions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export the app for testing purposes.
export default app;

// --- Swiss Ephemeris Setup ---

try {
  const swisseph = await import('../swisseph/index.js');
  await swisseph.ready;
  swisseph.swe_set_ephe_path(ephemerisPath);
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  console.log('Swiss Ephemeris path configured successfully.');

  // Start the server only after Swiss Ephemeris is configured and only if this
  // file is executed directly.
  if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  }
} catch (err) {
  console.error('Failed to configure Swiss Ephemeris:', err);
  process.exit(1);
}
