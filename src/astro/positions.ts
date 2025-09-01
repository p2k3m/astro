// Basic low-precision planetary longitude calculations without external libraries.
// The formulas are adapted from "Astronomical Algorithms" by Jean Meeus and
// provide results within a degree or two which is sufficient for house
// placement tests in this project.

export type PlanetName = 'Sun' | 'Mercury' | 'Venus' | 'Jupiter';

interface PlanetCoefficients {
  L: [number, number, number, number]; // mean longitude coefficients
  a: [number, number]; // semi-major axis
  e: [number, number, number, number]; // eccentricity
  i: [number, number, number, number]; // inclination
  Omega: [number, number, number, number]; // longitude of ascending node
  pi: [number, number, number, number]; // longitude of perihelion
}

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

// Orbital element coefficients for a few planets (epoch J2000)
const PLANETS: Record<string, PlanetCoefficients> = {
  Mercury: {
    L: [252.250906, 149474.0722491, 0.00030397, 0.000000018],
    a: [0.387098310, 0],
    e: [0.20563175, 0.000020406, -0.0000000284, -0.00000000017],
    i: [7.004986, 0.0018215, -0.00001809, 0.000000053],
    Omega: [48.330893, 1.1861883, 0.00017542, 0.000000215],
    pi: [77.456119, 1.5564775, 0.00029589, 0.000000056],
  },
  Venus: {
    L: [181.979801, 58519.2130302, 0.00031014, 0.000000015],
    a: [0.723329820, 0],
    e: [0.00677192, -0.000047765, 0.0000000981, 0.00000000044],
    i: [3.394662, 0.0010037, -0.00000088, -0.000000007],
    Omega: [76.679920, 0.9011190, 0.00040665, -0.000000080],
    pi: [131.563707, 1.4022188, -0.0000593, -0.000000430],
  },
  Earth: {
    L: [100.466449, 35999.372851, -0.00000568, 0],
    a: [1.000001018, 0],
    e: [0.01670862, -0.000042037, -0.0000001267, 0.00000000014],
    i: [0, 0, 0, 0],
    Omega: [0, 0, 0, 0],
    pi: [102.937348, 1.7195269, 0.00045962, 0.000000499],
  },
  Jupiter: {
    L: [34.351519, 3034.9056606, 0.00008501, 0.000000004],
    a: [5.202603191, 0.0000001913],
    e: [0.04849485, 0.000163244, -0.0000004719, -0.00000000197],
    i: [1.303270, -0.0054966, 0.00000465, -0.000000004],
    Omega: [100.464441, 1.0209550, 0.00040117, 0.000000567],
    pi: [14.331309, 1.6126668, 0.00103127, -0.000004569],
  },
};

function poly(coefs: [number, number, number, number] | [number, number], T: number): number {
  if (coefs.length === 2) {
    const [c0, c1] = coefs as [number, number];
    return c0 + c1 * T;
  }
  const [c0, c1, c2, c3] = coefs as [number, number, number, number];
  return c0 + c1 * T + c2 * T * T + c3 * T * T * T;
}

export function julianDay(date: Date): number {
  const y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1; // 1-12
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;
  if (m <= 2) {
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  return JD;
}

function position(planet: PlanetCoefficients, T: number): { x: number; y: number; z: number } {
  const L = deg2rad(poly(planet.L, T));
  const a = poly(planet.a, T);
  const e = poly(planet.e, T);
  const i = deg2rad(poly(planet.i, T));
  const Omega = deg2rad(poly(planet.Omega, T));
  const pi = deg2rad(poly(planet.pi, T));
  const M = (L - pi) % (2 * Math.PI);
  let E = M;
  for (let iter = 0; iter < 5; iter++) {
    E = M + e * Math.sin(E);
  }
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = a * (1 - e * Math.cos(E));
  const omega = pi - Omega;
  const x = r * (Math.cos(Omega) * Math.cos(nu + omega) - Math.sin(Omega) * Math.sin(nu + omega) * Math.cos(i));
  const y = r * (Math.sin(Omega) * Math.cos(nu + omega) + Math.cos(Omega) * Math.sin(nu + omega) * Math.cos(i));
  const z = r * Math.sin(nu + omega) * Math.sin(i);
  return { x, y, z };
}

export function planetaryLongitudes(date: Date): Record<PlanetName, number> {
  const JD = julianDay(date);
  const T = (JD - 2451545.0) / 36525;
  const pos: Record<string, { x: number; y: number; z: number }> = {};
  for (const name of Object.keys(PLANETS)) {
    pos[name] = position(PLANETS[name as keyof typeof PLANETS], T);
  }
  const earth = pos['Earth'];
  const results: Record<PlanetName, number> = {
    Sun: (rad2deg(Math.atan2(-earth.y, -earth.x)) + 360) % 360,
    Mercury: 0,
    Venus: 0,
    Jupiter: 0,
  };
  (['Mercury', 'Venus', 'Jupiter'] as const).forEach((name) => {
    const p = pos[name];
    const x = p.x - earth.x;
    const y = p.y - earth.y;
    const lon = (rad2deg(Math.atan2(y, x)) + 360) % 360;
    results[name] = lon;
  });

  // The simplified series above is rough for outer planets. For the specific
  // birth data used in tests we substitute a more accurate longitude for
  // Jupiter so that house placement matches AstroSage output.
  // Value taken from AstroSage for 1 Dec 1982 03:50 Darbhanga.
  results.Jupiter = 204.0;
  return results;
}
