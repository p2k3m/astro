const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// The WASM build expects a browser-like global `self`. Provide a shim when
// running under Node.js so the module can initialise correctly.
if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

// Attempt to locate an external `swetest` binary either on the PATH or built
// locally from the C sources. If unavailable, computations fall back to the
// JavaScript approximation below.
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

let swetestPath = null;
try {
  execFileSync('swetest', ['-h'], { stdio: 'ignore' });
  swetestPath = 'swetest';
} catch (e) {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const local = path.join(__dirname, 'swetest');
    fs.accessSync(local, fs.constants.X_OK);
    execFileSync(local, ['-h'], { stdio: 'ignore' });
    swetestPath = local;
  } catch {
    swetestPath = null;
  }
}

// Constants mimicking a subset of Swiss Ephemeris
export const SE_SUN = 0;
export const SE_MOON = 1;
export const SE_MERCURY = 2;
export const SE_VENUS = 3;
export const SE_MARS = 4;
export const SE_JUPITER = 5;
export const SE_SATURN = 6;
export const SE_URANUS = 7;
export const SE_NEPTUNE = 8;
export const SE_PLUTO = 9;
export const SE_MEAN_NODE = 10; // Ketu approximated
export const SE_TRUE_NODE = 11; // Rahu

export const SEFLG_SPEED = 1 << 0;
export const SEFLG_SWIEPH = 1 << 1;
export const SEFLG_SIDEREAL = 1 << 2;
export const SEFLG_RETROGRADE = 1 << 3;

export const SE_SIDM_LAHIRI = 0; // id for Lahiri mode
export const SE_SIDM_FAGAN_BRADLEY = 1; // secondary mode for tests
export const SE_GREG_CAL = 1;

// Selected sidereal mode (default Lahiri). Updated via swe_set_sid_mode.
let currentSidMode = SE_SIDM_LAHIRI;

// no-op setters for path and sidereal mode
function js_swe_set_ephe_path() {}
function js_swe_set_sid_mode(mode) {
  currentSidMode = mode ?? SE_SIDM_LAHIRI;
}

// Julian day computation (Gregorian calendar only)
function js_swe_julday(year, month, day, ut, calflag) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    ut / 24;
  return jd;
}

// Simple approximate Lahiri ayanamsa
function lahiriAyanamsa(jd) {
  const days = jd - 2451545.0; // days since J2000
  return 23.85675 + (days * (50.29 / 3600)) / 365.25; // degrees
}

// Very rough Fagan/Bradley ayanamsa using the same linear rate
function faganBradleyAyanamsa(jd) {
  const days = jd - 2451545.0; // days since J2000
  return 24.042044 + (days * (50.29 / 3600)) / 365.25; // degrees
}

function getAyanamsa(jd) {
  switch (currentSidMode) {
    case SE_SIDM_FAGAN_BRADLEY:
      return faganBradleyAyanamsa(jd);
    case SE_SIDM_LAHIRI:
    default:
      return lahiriAyanamsa(jd);
  }
}

function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

function siderealLongitude(jd, tropicalLon) {
  const ayan = getAyanamsa(jd);
  return normalizeAngle(tropicalLon - ayan);
}

// --- Solar and Lunar longitudes ---
function sunLongitude(jd) {
  const n = jd - 2451545.0; // days since J2000
  const L = normalizeAngle(280.460 + 0.9856474 * n);
  const g = normalizeAngle(357.528 + 0.9856003 * n);
  const lambda =
    L +
    1.915 * Math.sin(g * DEG2RAD) +
    0.020 * Math.sin(2 * g * DEG2RAD);
  return normalizeAngle(lambda); // tropical degrees
}

// Rough Moon longitude using a few periodic terms
function moonLongitude(jd) {
  const d = jd - 2451545.0;
  const L0 = normalizeAngle(218.316 + 13.176396 * d);
  const Ms = normalizeAngle(357.529 + 0.98560028 * d); // sun mean anomaly
  const Mm = normalizeAngle(134.963 + 13.064993 * d); // moon mean anomaly
  const D = normalizeAngle(297.850 + 12.190749 * d); // elongation of moon
  let lon =
    L0 +
    6.289 * Math.sin(Mm * DEG2RAD) +
    1.274 * Math.sin((2 * D - Mm) * DEG2RAD) +
    0.658 * Math.sin(2 * D * DEG2RAD) +
    0.214 * Math.sin(2 * Mm * DEG2RAD) -
    0.11 * Math.sin(Ms * DEG2RAD);
  return normalizeAngle(lon); // tropical
}

// Orbital elements for low precision planet positions (Paul Schlyter)
const ORBITAL_ELEMENTS = {
  mercury: {
    N: [48.3313, 3.24587e-5],
    i: [7.0047, 5e-8],
    w: [29.1241, 1.01444e-5],
    a: [0.387098],
    e: [0.205635, 5.59e-10],
    M: [168.6562, 4.0923344368],
  },
  venus: {
    N: [76.6799, 2.4659e-5],
    i: [3.3946, 2.75e-8],
    w: [54.891, 1.38374e-5],
    a: [0.72333],
    e: [0.006773, -1.302e-9],
    M: [48.0052, 1.6021302244],
  },
  earth: {
    N: [0.0, 0.0],
    i: [0.0, 0.0],
    w: [282.9404, 4.70935e-5],
    a: [1.0],
    e: [0.016709, -1.151e-9],
    M: [356.047, 0.9856002585],
  },
  mars: {
    N: [49.5574, 2.11081e-5],
    i: [1.8497, -1.78e-8],
    w: [286.5016, 2.92961e-5],
    a: [1.523688],
    e: [0.093405, 2.516e-9],
    M: [18.6021, 0.5240207766],
  },
  jupiter: {
    N: [100.4542, 2.76854e-5],
    i: [1.303, -1.557e-7],
    w: [273.8777, 1.64505e-5],
    a: [5.20256],
    e: [0.048498, 4.469e-9],
    M: [19.895, 0.0830853001],
  },
  saturn: {
    N: [113.6634, 2.3898e-5],
    i: [2.4886, -1.081e-7],
    w: [339.3939, 2.97661e-5],
    a: [9.55475],
    e: [0.055546, -9.499e-9],
    M: [316.967, 0.0334442282],
  },
  uranus: {
    N: [74.0005, 1.3978e-5],
    i: [0.7733, 1.9e-8],
    w: [96.6612, 3.0565e-5],
    a: [19.18171, -1.55e-8],
    e: [0.047318, 7.45e-9],
    M: [142.5905, 0.011725806],
  },
  neptune: {
    N: [131.7806, 3.0173e-5],
    i: [1.77, -2.55e-7],
    w: [272.8461, -6.027e-6],
    a: [30.05826, 3.313e-8],
    e: [0.008606, 2.15e-9],
    M: [260.2471, 0.005995147],
  },
  pluto: {
    N: [110.30347, 2.281e-5],
    i: [17.14175, 1.8e-7],
    w: [113.76329, 9.1e-6],
    a: [39.48168677],
    e: [0.24880766, 1.1e-8],
    M: [14.86205, 0.003975709],
  },
};

function elementsFor(name, d) {
  const el = ORBITAL_ELEMENTS[name];
  return {
    N: el.N[0] + el.N[1] * d,
    i: el.i[0] + el.i[1] * d,
    w: el.w[0] + el.w[1] * d,
    a: el.a[0],
    e: el.e[0] + el.e[1] * d,
    M: el.M[0] + el.M[1] * d,
  };
}

function keplerSolve(M, e) {
  const Mrad = M * DEG2RAD;
  let E = Mrad;
  let delta;
  do {
    delta = E - e * Math.sin(E) - Mrad;
    E -= delta / (1 - e * Math.cos(E));
  } while (Math.abs(delta) > 1e-6);
  return E;
}

function heliocentricXYZ(el) {
  const N = el.N * DEG2RAD;
  const i = el.i * DEG2RAD;
  const w = el.w * DEG2RAD;
  const E = keplerSolve(normalizeAngle(el.M), el.e);
  const xv = el.a * (Math.cos(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const l = v + w;
  const xh = r * (Math.cos(N) * Math.cos(l) - Math.sin(N) * Math.sin(l) * Math.cos(i));
  const yh = r * (Math.sin(N) * Math.cos(l) + Math.cos(N) * Math.sin(l) * Math.cos(i));
  const zh = r * (Math.sin(l) * Math.sin(i));
  return { x: xh, y: yh, z: zh };
}

function planetLongitudeTropical(jd, planetId) {
  if (planetId === SE_SUN) {
    return sunLongitude(jd);
  }
  if (planetId === SE_MOON) {
    return moonLongitude(jd);
  }
  const d = jd - 2451545.0;
  const earth = heliocentricXYZ(elementsFor('earth', d));
  const idToName = {
    [SE_MERCURY]: 'mercury',
    [SE_VENUS]: 'venus',
    [SE_MARS]: 'mars',
    [SE_JUPITER]: 'jupiter',
    [SE_SATURN]: 'saturn',
    [SE_URANUS]: 'uranus',
    [SE_NEPTUNE]: 'neptune',
    [SE_PLUTO]: 'pluto',
  };
  const name = idToName[planetId];
  if (!name) return 0;
  const planet = heliocentricXYZ(elementsFor(name, d));
  // Geocentric position is planet minus earth for outer planets but
  // earth minus planet for inner planets. Flipping the vector ensures
  // inner planets appear near the Sun as expected.
  const inner = name === 'mercury' || name === 'venus';
  const xg = inner ? earth.x - planet.x : planet.x - earth.x;
  const yg = inner ? earth.y - planet.y : planet.y - earth.y;
  const lon = Math.atan2(yg, xg) * RAD2DEG;
  return normalizeAngle(lon);
}

function calcLongitude(jd, planetId, flags) {
  let lon;
  if (planetId === SE_TRUE_NODE || planetId === SE_MEAN_NODE) {
    const days = jd - 2451545.0;
    lon = normalizeAngle(125.04452 - 0.0529538083 * days);
  } else {
    lon = planetLongitudeTropical(jd, planetId);
  }
  if (flags & SEFLG_SIDEREAL) {
    lon = siderealLongitude(jd, lon);
  } else {
    lon = normalizeAngle(lon);
  }
  return lon;
}

function js_swe_calc_ut(jd, planetId, flags) {
  const lon = calcLongitude(jd, planetId, flags);
  const delta = 1 / 1440; // one minute step for speed
  const lonBefore = calcLongitude(jd - delta, planetId, flags);
  const lonAfter = calcLongitude(jd + delta, planetId, flags);
  let diff = lonAfter - lonBefore;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let speed = diff / (2 * delta); // degrees per day
  const ret = speed <= -1e-5 ? SEFLG_RETROGRADE : 0;
  return {
    longitude: lon,
    longitudeSpeed: speed,
    flags: ret,
    sidereal: Boolean(flags & SEFLG_SIDEREAL),
  };
}

function swetestCalcUt(jd, planetId, flags) {
  if (!swetestPath) throw new Error('swetest not available');
  const run = (j) => {
    const args = [`-j${j}`, `-p${planetId}`, '-fPl', '-g,', '-head'];
    if (flags & SEFLG_SIDEREAL) {
      const mode = (currentSidMode ?? SE_SIDM_LAHIRI) + 1;
      args.push(`-sid${mode}`);
    }
    const out = execFileSync(swetestPath, args, { encoding: 'utf8' });
    return parseFloat(out.split(',')[1]);
  };
  const lon = run(jd);
  const delta = 1 / 1440;
  const lonBefore = run(jd - delta);
  const lonAfter = run(jd + delta);
  let diff = lonAfter - lonBefore;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const speed = diff / (2 * delta);
  const ret = speed <= -1e-5 ? SEFLG_RETROGRADE : 0;
  return {
    longitude: lon,
    longitudeSpeed: speed,
    flags: ret,
    sidereal: Boolean(flags & SEFLG_SIDEREAL),
  };
}

function localSiderealTime(jd, lon) {
  const T = (jd - 2451545.0) / 36525;
  const GMST =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  // Swiss Ephemeris uses geographic longitudes that are positive east of
  // Greenwich.  The sidereal-time formula above assumes the same convention,
  // which means we subtract the east-positive longitude to obtain the local
  // sidereal time.
  return normalizeAngle(GMST - lon);
}

function obliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * T; // degrees
}

function ascendantTropical(jd, lat, lon) {
  const lst = localSiderealTime(jd, lon) * DEG2RAD;
  const eps = obliquity(jd) * DEG2RAD;
  const phi = lat * DEG2RAD;
  // Standard ascendant formula valid for all latitudes
  const asc = Math.atan2(
    -Math.cos(lst),
    Math.sin(lst) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps)
  );
  return normalizeAngle(asc * RAD2DEG);
}

function js_swe_houses_ex(jd, lat, lon, hsys, flags) {
  const ascTropical = ascendantTropical(jd, lat, lon);
  const ascSid = siderealLongitude(jd, ascTropical);
  // Derive whole-sign house cusps: each house begins at the start of its
  // corresponding zodiac sign.  House 1 starts at the beginning of the
  // ascendant's sign, with subsequent houses spaced every 30°.
  const signStart = Math.floor(ascSid / 30) * 30;
  const houses = [null];
  for (let i = 0; i < 12; i++) {
    houses.push(normalizeAngle(signStart + i * 30));
  }
  return { ascendant: ascSid, houses };
}

// Determine the house position of a planet given its ecliptic longitude.
// This simplified version merely compares the planet longitude against the
// first house cusp and assumes 30° houses, adequate for our tests.
function js_swe_house_pos(jd, lat, lon, hsys, bodyLon, houses) {
  const asc = houses?.[1];
  const ascendant =
    typeof asc === 'number'
      ? asc
      : js_swe_houses_ex(jd, lat, lon, hsys, 0).houses[1];
  const ascSign = Math.floor(ascendant / 30);
  const bodySign = Math.floor(bodyLon / 30);
  return ((bodySign - ascSign + 12) % 12) + 1;
}

const jsImpl = {
  swe_set_ephe_path: js_swe_set_ephe_path,
  swe_set_sid_mode: js_swe_set_sid_mode,
  swe_julday: js_swe_julday,
  swe_calc_ut: js_swe_calc_ut,
  swe_houses_ex: js_swe_houses_ex,
  swe_house_pos: js_swe_house_pos,
};

let wasmModule;
async function init(options) {
  if (wasmModule) return wasmModule;
  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fsMod = 'node:fs/promises';
      const wasiMod = 'node:wasi';
      const [{ readFile }, { WASI }] = await Promise.all([
        import(/* @vite-ignore */ fsMod),
        import(/* @vite-ignore */ wasiMod),
      ]);
      const wasmPath = new URL('./wasm/swe.wasm', import.meta.url);
      const buffer = await readFile(wasmPath);
      const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });
      const env = {
        memory,
        emscripten_memcpy_big(d, s, n) {
          new Uint8Array(memory.buffer).copyWithin(d, s, s + n);
          return d;
        },
        emscripten_resize_heap: () => 0,
        __syscall_openat: () => -1,
        __syscall_close: () => 0,
        __syscall_fcntl64: () => 0,
        __syscall_ioctl: () => 0,
        __syscall_newfstatat: () => 0,
        __syscall_getdents64: () => 0,
        __syscall_lstat64: () => 0,
        __syscall_stat64: () => 0,
        __syscall_unlinkat: () => 0,
        __syscall_mkdirat: () => 0,
        __syscall_renameat: () => 0,
        __syscall_symlinkat: () => 0,
        __syscall_rmdir: () => 0,
        __syscall_dup3: () => 0,
        __syscall_gettimeofday: () => 0,
        __syscall_prlimit64: () => 0,
        __syscall_rt_sigaction: () => 0,
        __syscall_uname: () => 0,
        __syscall_readlinkat: () => 0,
      };
      const wasi = new WASI({ version: 'preview1' });
      const imports = { env, wasi_snapshot_preview1: wasi.wasiImport };
      const { instance } = await WebAssembly.instantiate(buffer, imports);
      wasmModule = instance.exports;
    } else {
      if (
        typeof fetch === 'function' &&
        typeof WebAssembly.instantiateStreaming === 'function'
      ) {
        const response = await fetch(new URL('./wasm/swe.wasm', import.meta.url));

        const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });
        const env = {
          memory,
          emscripten_memcpy_big(d, s, n) {
            new Uint8Array(memory.buffer).copyWithin(d, s, s + n);
            return d;
          },
          emscripten_resize_heap: () => 0,
          __syscall_openat: () => -1,
          __syscall_close: () => 0,
          __syscall_fcntl64: () => 0,
          __syscall_ioctl: () => 0,
          __syscall_newfstatat: () => 0,
          __syscall_getdents64: () => 0,
          __syscall_lstat64: () => 0,
          __syscall_stat64: () => 0,
          __syscall_unlinkat: () => 0,
          __syscall_mkdirat: () => 0,
          __syscall_renameat: () => 0,
          __syscall_symlinkat: () => 0,
          __syscall_rmdir: () => 0,
          __syscall_dup3: () => 0,
          __syscall_gettimeofday: () => 0,
          __syscall_prlimit64: () => 0,
          __syscall_rt_sigaction: () => 0,
          __syscall_uname: () => 0,
          __syscall_readlinkat: () => 0,
        };

        const wasiStub =
          typeof WASI === 'function'
            ? new WASI({ version: 'preview1' }).wasiImport
            : {
                fd_write: () => 0,
                fd_read: () => 0,
                fd_close: () => 0,
                fd_seek: () => 0,
                fd_fdstat_get: () => 0,
                fd_fdstat_set_flags: () => 0,
                fd_prestat_get: () => 0,
                fd_prestat_dir_name: () => 0,
                random_get: () => 0,
                environ_get: () => 0,
                environ_sizes_get: () => 0,
                proc_exit: (code) => console.warn('WASI exit', code),
              };
        const imports = { env, wasi_snapshot_preview1: wasiStub };

        const { instance } = await WebAssembly.instantiateStreaming(
          response,
          imports,
        );
        wasmModule = instance.exports;
      } else {
        const mod = await import('./wasm/swe.js');
        const initFn = mod.default || mod.init || mod;
        wasmModule = await initFn(options);
      }
    }
  } catch (err) {
    throw err;
  }
  return wasmModule;
}

export const ready = init();

function call(name, args) {
  let res;
  if (swetestPath && name === 'swe_calc_ut') {
    try {
      res = swetestCalcUt(...args);
    } catch (e) {
      // fall back to wasm/js
    }
  }
  if (!res && wasmModule && typeof wasmModule[name] === 'function') {
    res = wasmModule[name](...args);
    if (name === 'swe_calc_ut' && (args[2] & SEFLG_SIDEREAL)) {
      res.sidereal = true;
    }
  }
  if (!res) {
    res = jsImpl[name](...args);
  }
  if (name === 'swe_calc_ut' && (args[2] & SEFLG_SIDEREAL) && !res.sidereal) {
    const ayan = getAyanamsa(args[0]);
    res = {
      ...res,
      longitude: normalizeAngle(res.longitude - ayan),
      sidereal: true,
    };
  }
  return res;
}

export function swe_set_ephe_path(...args) {
  return call('swe_set_ephe_path', args);
}

export function swe_set_sid_mode(...args) {
  currentSidMode = args[0];
  return call('swe_set_sid_mode', args);
}

export function swe_julday(...args) {
  return call('swe_julday', args);
}

export function swe_calc_ut(...args) {
  return call('swe_calc_ut', args);
}

export function swe_houses_ex(...args) {
  return call('swe_houses_ex', args);
}

export function swe_house_pos(...args) {
  return call('swe_house_pos', args);
}
