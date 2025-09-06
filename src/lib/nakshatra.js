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

function longitudeToNakshatra(lon) {
  const norm = ((lon % 360) + 360) % 360;
  const segment = 360 / 27; // 13°20'
  const index = Math.floor(norm / segment);
  const pada = Math.floor((norm % segment) / (segment / 4)) + 1;
  return { nakshatra: NAKSHATRA_NAMES[index], pada };
}

export { NAKSHATRA_NAMES, longitudeToNakshatra };
