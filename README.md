# Vedic Astrology Chart Generator

A single-page React application that renders an accurate North Indian style D1 (Rashi) chart based on birth details. It uses the Swiss Ephemeris powered [`jyotish-calculations`](https://www.npmjs.com/package/jyotish-calculations) library for high precision and a local dataset or geocoder service for location autocompletion.

## Live Demo

[Live Demo](https://example.com) <!-- Replace with real demo URL when deployed -->

## Features

- Collects name, date, time, and place of birth.
- Autocomplete for birth location using a local dataset or geocoder service.
- Calculates Ascendant and planetary positions (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu).
- Indicates retrograde (R), combust (C), and exalted (Ex) planets.
- Renders responsive North Indian (diamond-style) chart.
- Dark, glassmorphic UI with Tailwind CSS.

## Technology Stack

- React + Vite
- Tailwind CSS
- jyotish-calculations (Swiss Ephemeris)
- Local city dataset or self-hosted Nominatim/Pelias

## Prerequisites

- Node.js and npm

## Local Setup & Installation

```bash
# Clone the repository
npm install

# Run in development
# Start backend and frontend together
npm run dev:all
```

1. Clone this repository.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev:all` to run the backend and Vite dev server simultaneously.

### Preparing the offline location dataset

The app looks for a `public/cities.json` file containing objects with `name`, `lat` and `lon` fields. You can build this file from the [GeoNames](https://www.geonames.org/) database:

```bash
curl -L https://download.geonames.org/export/dump/cities5000.zip -o cities.zip
unzip cities.zip cities5000.txt
# Convert to JSON (requires Node.js)
node -e "const fs=require('fs');fs.writeFileSync('public/cities.json',JSON.stringify(fs.readFileSync('cities5000.txt','utf8').split('\\n').map(l=>l.split('\\t')).filter(l=>l[1]).map(l=>({name:l[1]+', '+l[8],lat:+l[4],lon:+l[5]}))))"
```

Alternatively, point `src/lib/offlineGeocoder.js` to a locally hosted [Nominatim](https://nominatim.org/) or [Pelias](https://pelias.io/) server and query it instead of the JSON file.

## Deployment

Build the project and deploy the generated `dist/` folder to any static hosting provider (Netlify, Vercel, etc.).

```bash
npm run build
```

Upload the contents of `dist/` to your hosting service.

## Visual comparison with AstroSage

To confirm that the chart output matches common astrology software, you can
compare it against the AstroSage online chart using known reference data:

1. Open the AstroSage birth chart calculator and set the location to
   **Darbhanga, India** (26.152° N, 85.897° E).
2. Generate charts for these reference times in the India/Calcutta time zone:
   - **1 December 1982, 03:50**
   - **1 December 1982, 15:50**
3. Run this project and enter the same details. The ascendant sign and the
   houses occupied by the Sun and Moon should match the AstroSage results.

A regression test in `tests/reference-case.test.js` performs the AstroSage
comparison by hardcoding these values so you can verify them automatically with
`npm test`.
