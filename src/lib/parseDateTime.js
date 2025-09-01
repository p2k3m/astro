import { DateTime } from 'luxon';

export function monthFirst(locale = 'en-US') {
  const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2020, 11, 31));
  const idxMonth = parts.findIndex((p) => p.type === 'month');
  const idxDay = parts.findIndex((p) => p.type === 'day');
  return idxMonth < idxDay;
}

export function parseDateInput(input, locale = 'en-US') {
  if (!input) return null;
  const pattern = monthFirst(locale) ? 'MM-dd-yyyy' : 'dd-MM-yyyy';
  const dt = DateTime.fromFormat(input.trim(), pattern, {
    zone: 'utc',
    setZone: true,
    locale: 'en',
    strict: true,
  });
  return dt.isValid ? dt.toISODate() : null;
}

export function parseTimeInput(input, ampm = 'AM') {
  if (!input) return null;
  const raw = `${input.trim()} ${ampm}`.toUpperCase();
  const dt = DateTime.fromFormat(raw, 'h:mm a', {
    zone: 'utc',
    setZone: true,
    strict: true,
  });
  if (!dt.isValid) return null;
  const h1 = dt.toFormat('h:mm a').toUpperCase();
  const h2 = dt.toFormat('hh:mm a').toUpperCase();
  if (raw !== h1 && raw !== h2) return null;
  return dt.toFormat('HH:mm');
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
