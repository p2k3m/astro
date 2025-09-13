const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];

// AstroSage-style abbreviations corresponding to the full names above.
// These match the labels used in AstroSage charts, offering familiar
// short forms for users who prefer that formatting.
const NAKSHATRA_ABBREVIATIONS = [
  'Aswi',
  'Bhar',
  'Krit',
  'Rohi',
  'Mrig',
  'Ardr',
  'Puna',
  'Push',
  'Ashl',
  'Magh',
  'PuPha',
  'UtPha',
  'Hast',
  'Chit',
  'Swat',
  'Vish',
  'Anur',
  'Jyes',
  'Mula',
  'PuSha',
  'UtSha',
  'Shra',
  'Dhan',
  'Shat',
  'PuBha',
  'UtBha',
  'Reva',
];

function longitudeToNakshatra(lon, { useAbbreviations = false } = {}) {
  const norm = ((lon % 360) + 360) % 360;
  const segment = 360 / 27; // 13°20'
  const index = Math.floor(norm / segment);
  const pada = Math.floor((norm % segment) / (segment / 4)) + 1;
  const names = useAbbreviations ? NAKSHATRA_ABBREVIATIONS : NAKSHATRA_NAMES;
  return { nakshatra: names[index], pada };
}

const NAKSHATRA_NAME_TO_ABBR = Object.fromEntries(
  NAKSHATRA_NAMES.map((name, i) => [name, NAKSHATRA_ABBREVIATIONS[i]])
);

export {
  NAKSHATRA_NAMES,
  NAKSHATRA_ABBREVIATIONS,
  NAKSHATRA_NAME_TO_ABBR,
  longitudeToNakshatra,
};
