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

// Common four-letter abbreviations corresponding to the full names above.
// These provide short but still recognisable labels for UI display.
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
  'PPhl',
  'UPhl',
  'Hast',
  'Chit',
  'Swat',
  'Vish',
  'Anur',
  'Jyes',
  'Mula',
  'PAsa',
  'UAsa',
  'Shra',
  'Dhan',
  'Shat',
  'PBha',
  'UBha',
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
