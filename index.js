// Electorate Lookup App for WA using Node.js, Express, and Turf.js
// Ensure that you have the two GeoJSON files in the root directory of your project.

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const turf = require('@turf/turf');
const axios = require('axios');

app.use(bodyParser.json());
app.use(express.static('public'));

// Load GeoJSON files (already uploaded and named)
const federalElectorates = JSON.parse(fs.readFileSync('./E_WA2024_region.json'));
const stateElectorates = JSON.parse(fs.readFileSync('./Final_District_Boundaries_WAEC_2023.json'));

async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address);
  const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=au`);
  if (response.data.length === 0) throw new Error('Address not found');
  const { lat, lon } = response.data[0];
  return [parseFloat(lon), parseFloat(lat)];
}

function findElectorate(point, geojson) {
  for (const feature of geojson.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      return feature.properties;
    }
  }
  return null;
}

app.post('/lookup', async (req, res) => {
  try {
    const { address } = req.body;
    const coords = await geocodeAddress(address);
    const point = turf.point(coords);

    const federal = findElectorate(point, federalElectorates);
    const state = findElectorate(point, stateElectorates);
console.log('Address:', address);
console.log('Coordinates:', coords);
console.log('Federal Match:', federal);
console.log('State Match:', state);

    res.json({ federal, state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
