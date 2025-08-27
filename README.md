# Vedic Astrology Chart Generator

A single-page React application that renders an accurate North Indian style D1 (Rashi) chart based on birth details. It uses the Swiss Ephemeris powered [`jyotish-calculations`](https://www.npmjs.com/package/jyotish-calculations) library for high precision and Geoapify for location autocompletion.

## Live Demo

[Live Demo](https://example.com) <!-- Replace with real demo URL when deployed -->

## Features

- Collects name, date, time, and place of birth.
- Autocomplete for birth location using Geoapify API.
- Calculates Ascendant and planetary positions (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu).
- Indicates retrograde (R) and combust (C) planets.
- Renders responsive North Indian (diamond-style) chart.
- Dark, glassmorphic UI with Tailwind CSS.

## Technology Stack

- React + Vite
- Tailwind CSS
- jyotish-calculations (Swiss Ephemeris)
- Geoapify Geocoding API

## Prerequisites

- Node.js and npm

## Local Setup & Installation

```bash
# Clone the repository
npm install

# Create environment variables
# GEOAPIFY_API_KEY=YOUR_API_KEY_HERE

# Run in development
npm run dev
```

1. Clone this repository.
2. Install dependencies with `npm install`.
3. Create a `.env` file in the project root and define `GEOAPIFY_API_KEY` with your key.
4. Start the development server using `npm run dev`.

## Deployment

Build the project and deploy the generated `dist/` folder to any static hosting provider (Netlify, Vercel, etc.).

```bash
npm run build
```

Upload the contents of `dist/` to your hosting service.
