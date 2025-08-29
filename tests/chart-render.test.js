const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert');
const test = require('node:test');

function loadChart() {
  let code = fs.readFileSync(path.join(__dirname, '../src/components/Chart.jsx'), 'utf8');
  code = code.replace("import React from 'react';", "const React = { isValidElement: () => true };");
  code = code.replace(
    "import PropTypes from 'prop-types';",
    'const PropTypes = new Proxy({}, { get: () => { const fn = () => fn; fn.isRequired = fn; return fn; }});'
  );
  code = code.replace('export default function Chart', 'function Chart');
  code = code.replace(/export const /g, 'const ');
  code = code.replace(
    /return \([\s\S]*?\n\s*\);\n  }\n  const signInHouse/,
    'return "Invalid chart data";\n  }\n  const signInHouse'
  );
  code = code.replace(
    /if \(invalidHouses \|\| invalidPlanets\) {\n[\s\S]*?\n\s*}\n\n/,
    'if (invalidHouses || invalidPlanets) {\n    return "Invalid chart data";\n  }\n\n'
  );
  code = code.replace(/if \(\n\s*children !== undefined[\s\S]*?\n\s*}\n\n/, '');
  code = code.replace(
    /\n  return \([\s\S]*?\n\s*\);\n}\n\nChart.propTypes/,
    '\n  return "Chart";\n}\n\nChart.propTypes'
  );
  code += '\nmodule.exports = { default: Chart, HOUSE_POLYGONS };';
  const sandbox = { module: {}, exports: {}, require };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports;
}

test('Chart renders for valid house to sign maps regardless of ascendant', () => {
  const { default: Chart } = loadChart();

  const signInHouseForAsc = (asc) => {
    const arr = Array(13).fill(null);
    for (let i = 0; i < 12; i++) {
      const house = i + 1;
      arr[house] = (asc - 1 + i) % 12;
    }
    return arr;
  };

  const aries = signInHouseForAsc(1);
  const libra = signInHouseForAsc(7);

  assert.strictEqual(
    Chart({ data: { signInHouse: aries, planets: [] } }),
    'Chart'
  );
  assert.strictEqual(
    Chart({ data: { signInHouse: libra, planets: [] } }),
    'Chart'
  );

  assert.strictEqual(
    Chart({ data: { signInHouse: aries.slice(1), planets: [] } }),
    'Invalid chart data'
  );
  const tooLong = Array(14).fill(null);
  for (let i = 1; i <= 13; i++) tooLong[i] = (i - 1) % 12;
  assert.strictEqual(
    Chart({ data: { signInHouse: tooLong, planets: [] } }),
    'Invalid chart data'
  );

  const misordered = aries.slice();
  [misordered[2], misordered[3]] = [misordered[3], misordered[2]];
  assert.strictEqual(
    Chart({ data: { signInHouse: misordered, planets: [] } }),
    'Chart'
  );
});

test('Chart SVG uses 12 distinct rhombi with no central cross', () => {
  const { HOUSE_POLYGONS } = loadChart();
  assert.strictEqual(HOUSE_POLYGONS.length, 12);
  const paths = HOUSE_POLYGONS.map((p) => p.d);
  const unique = new Set(paths);
  assert.strictEqual(unique.size, 12);
  const code = fs.readFileSync(
    path.join(__dirname, '../src/components/Chart.jsx'),
    'utf8'
  );
  assert.ok(!code.includes('<line'));
});

test('Planet labels are centred within house boxes', () => {
  const code = fs.readFileSync(
    path.join(__dirname, '../src/components/Chart.jsx'),
    'utf8'
  );
  assert.ok(code.includes("top: `${p.cy}%`"));
  assert.ok(code.includes("left: `${p.cx}%`"));
  assert.ok(code.includes("transform: 'translate(-50%, -50%)'"));
  assert.ok(code.includes('planetByHouse[houseNum] &&'));
});

test('Rhombi positions follow canonical North-Indian layout', () => {
  const { HOUSE_POLYGONS } = loadChart();
  const expected = [
    [25, 50],
    [25, 75],
    [41.6667, 75],
    [50, 75],
    [75, 75],
    [75, 58.3333],
    [75, 50],
    [75, 25],
    [58.3333, 25],
    [50, 25],
    [25, 25],
    [25, 41.6667],
  ];
  const coords = HOUSE_POLYGONS.map((p) => [p.cx, p.cy]);
  assert.strictEqual(JSON.stringify(coords), JSON.stringify(expected));
});
