import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadGetTimezoneOffset() {
  let code = fs.readFileSync(path.join(__dirname, '../src/lib/timezone.js'), 'utf8');
  code = code.replace("import luxon from 'luxon';", '');
  code = code.replace('const { DateTime } = luxon;', '');
  code = code.replace(/export /g, '');
  code += '\nmodule.exports = { getTimezoneOffset };';

  // Stub geo-tz to map coordinates used in tests to IANA zones
  const geoTz = {
    find(lat, lon) {
      if (Math.abs(lat - 40.7128) < 0.5 && Math.abs(lon + 74.0060) < 0.5) {
        return ['America/New_York'];
      }
      if (Math.abs(lat - 55.7558) < 0.5 && Math.abs(lon - 37.6173) < 0.5) {
        return ['Europe/Moscow'];
      }
      return [];
    },
  };

  // Minimal luxon DateTime stub using Intl API for historical offsets
  const DateTime = {
    fromObject({ year, month, day, hour = 0, minute = 0 }, { zone }) {
      const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const parts = dtf.formatToParts(utc);
      const vals = {};
      for (const { type, value } of parts) {
        if (type !== 'literal') vals[type] = value;
      }
      const local = new Date(
        `${vals.year}-${vals.month}-${vals.day}T${vals.hour}:${vals.minute}:${vals.second}Z`
      );
      return { offset: (local - utc) / 60000 };
    },
  };

  const sandbox = {
    module: { exports: {} },
    exports: {},
    geoTz,
    DateTime,
  };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports.getTimezoneOffset;
}

test('handles DST transitions for New York', () => {
  const getTimezoneOffset = loadGetTimezoneOffset();
  const summer = getTimezoneOffset({
    date: '2023-07-01',
    time: '00:00',
    lat: 40.7128,
    lon: -74.006,
  });
  const winter = getTimezoneOffset({
    date: '2023-01-01',
    time: '00:00',
    lat: 40.7128,
    lon: -74.006,
  });
  assert.strictEqual(summer, -240);
  assert.strictEqual(winter, -300);
});

test('accounts for historical changes in Moscow', () => {
  const getTimezoneOffset = loadGetTimezoneOffset();
  const jan2010 = getTimezoneOffset({
    date: '2010-01-01',
    time: '00:00',
    lat: 55.7558,
    lon: 37.6173,
  });
  const jul2010 = getTimezoneOffset({
    date: '2010-07-01',
    time: '00:00',
    lat: 55.7558,
    lon: 37.6173,
  });
  const jan2015 = getTimezoneOffset({
    date: '2015-01-01',
    time: '00:00',
    lat: 55.7558,
    lon: 37.6173,
  });
  assert.strictEqual(jan2010, 180);
  assert.strictEqual(jul2010, 240);
  assert.strictEqual(jan2015, 180);
});
