export function monthFirst(locale = 'en-US') {
  const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2020, 11, 31));
  const idxMonth = parts.findIndex((p) => p.type === 'month');
  const idxDay = parts.findIndex((p) => p.type === 'day');
  return idxMonth < idxDay;
}

export function parseDateInput(input, locale = 'en-US') {
  if (!input) return null;
  const parts = input.trim().split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [a, b, c] = parts;
  const monthFirstOrder = monthFirst(locale);
  const day = monthFirstOrder ? b : a;
  const month = monthFirstOrder ? a : b;
  const year = c;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseTimeInput(input, ampm = 'AM') {
  if (!input) return null;
  const parts = input.trim().split(':').map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  let [hour, minute] = parts;
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  hour = hour % 12;
  if (ampm === 'PM') hour += 12;
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatTime24To12(time24) {
  const parts = time24.split(':').map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return { time: '', ampm: 'AM' };
  let [hour, minute] = parts;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  const hh = String(hour);
  const mm = String(minute).padStart(2, '0');
  return { time: `${hh}:${mm}`, ampm };
}
