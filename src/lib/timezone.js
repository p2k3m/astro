import TimezoneFinder from 'timezonefinder';
import { DateTime } from 'luxon';

const finder = new TimezoneFinder();

/**
 * Determine the timezone offset in minutes for a given local date/time
 * at the specified latitude and longitude.
 *
 * @param {Object} opts
 * @param {string} opts.date - Local date in YYYY-MM-DD format
 * @param {string} opts.time - Local time in HH:mm format
 * @param {number} opts.lat - Latitude
 * @param {number} opts.lon - Longitude
 * @returns {number} UTC offset in minutes (east of UTC is positive)
 */
export function getTimezoneOffset({ date, time, lat, lon }) {
  const zone = finder.timezoneAt(lat, lon);
  if (!zone) {
    throw new Error('Unable to determine time zone');
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);

  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone });
  return dt.offset; // offset in minutes
}
