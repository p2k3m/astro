const express = require('express');
const jyotish = require('jyotish-calculations');

const app = express();
const PORT = process.env.PORT || 3001;

async function computeAscendant(date, lat, lon) {
  if (jyotish.getAscendant) {
    return await jyotish.getAscendant(date, lat, lon);
  }
  if (jyotish.ascendant) {
    return await jyotish.ascendant(date, lat, lon);
  }
  if (jyotish.getAscendantLongitude) {
    return await jyotish.getAscendantLongitude(date, lat, lon);
  }
  throw new Error('Ascendant calculation not available');
}

async function computePlanet(date, lat, lon, planet) {
  if (jyotish.getPlanetPosition) {
    return await jyotish.getPlanetPosition(planet, date, lat, lon);
  }
  if (jyotish.getPlanet) {
    return await jyotish.getPlanet(planet, date, lat, lon);
  }
  if (jyotish.planet) {
    return await jyotish.planet(planet, date, lat, lon);
  }
  throw new Error('Planet calculation not available');
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

