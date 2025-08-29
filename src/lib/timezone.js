import find from 'geo-tz';
import { DateTime } from 'luxon';

/**
 * Determine the IANA timezone name for a latitude and longitude.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {string} IANA timezone name
 */
export function getTimezoneName(lat, lon) {
  // Use the 'find' function directly. It returns an array of timezone names.
  const zones = find(lat, lon);

  if (!zones || zones.length === 0) {
    throw new Error('Unable to determine time zone');
  }

  // Return the first timezone from the results array.
  return zones[0];
}

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
  const zone = getTimezoneName(lat, lon);

  const [year, month, day] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);

  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone });
  return dt.offset; // offset in minutes
}

/**
 * Convert a local ISO datetime string in a given timezone to a JS Date in UTC.
 *
 * @param {Object} opts
 * @param {string} opts.datetime - Local datetime in ISO format (YYYY-MM-DDTHH:mm)
 * @param {string} opts.zone - IANA timezone name
 * @returns {Date} UTC date
 */
export function toUTC({ datetime, zone }) {
  // Use Luxon to parse the local time in the specified zone
  const dt = DateTime.fromISO(datetime, { zone });
  
  // Convert the Luxon object directly to a native JavaScript Date.
  // The JS Date object's internal value is always a UTC timestamp.
  return dt.toJSDate();
}