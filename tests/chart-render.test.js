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
  code = code.replace(
    /if \(invalidHouses \|\| invalidPlanets\) {\n[\s\S]*?\n\s*}\n\n/,
    'if (invalidHouses || invalidPlanets) {\n    return "Invalid chart data";\n  }\n\n'
  );
  code = code.replace(/if \(\n\s*children !== undefined[\s\S]*?\n\s*}\n\n/, '');
  code = code.replace(
    /return \([\s\S]*?\n\s*\);\n}\n\nChart.propTypes/,
    'return "Chart";\n}\n\nChart.propTypes'
  );
  code += '\nmodule.exports = { default: Chart, HOUSE_BOX_CENTERS, BOX_SIZE, diamondPath };';
  const sandbox = { module: {}, exports: {}, require };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports;
}

test('Chart renders for valid sign to house maps regardless of ascendant', () => {
  const { default: Chart } = loadChart();

  const housesForAsc = (asc) => {
    const arr = Array(13).fill(null);
    for (let i = 0; i < 12; i++) {
      const sign = ((asc - 1 + i) % 12) + 1;
      arr[sign] = i + 1;
    }
    return arr;
  };

  const aries = housesForAsc(1);
  const libra = housesForAsc(7);

  assert.strictEqual(Chart({ data: { houses: aries, planets: [] } }), 'Chart');
  assert.strictEqual(Chart({ data: { houses: libra, planets: [] } }), 'Chart');

  assert.strictEqual(
    Chart({ data: { houses: aries.slice(1), planets: [] } }),
    'Invalid chart data'
  );
  const tooLong = Array(14).fill(null);
  for (let i = 1; i <= 13; i++) tooLong[i] = i;
  assert.strictEqual(
    Chart({ data: { houses: tooLong, planets: [] } }),
    'Invalid chart data'
  );

  const misordered = aries.slice();
  [misordered[2], misordered[3]] = [misordered[3], misordered[2]];
  assert.strictEqual(
    Chart({ data: { houses: misordered, planets: [] } }),
    'Invalid chart data'
  );
});

test('Chart SVG uses 12 distinct rhombi with no central cross', () => {
  const { HOUSE_BOX_CENTERS, BOX_SIZE, diamondPath } = loadChart();
  assert.strictEqual(HOUSE_BOX_CENTERS.length, 12);
  const paths = HOUSE_BOX_CENTERS.map((c) => diamondPath(c.cx, c.cy, BOX_SIZE));
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
  assert.ok(code.includes("top: `${c.cy}%`"));
  assert.ok(code.includes("left: `${c.cx}%`"));
  assert.ok(code.includes("transform: 'translate(-50%, -50%)'"));
  assert.ok(code.includes('planetByHouse[houseNum] &&'));
});

test('Rhombi positions follow canonical North-Indian layout', () => {
  const { HOUSE_BOX_CENTERS } = loadChart();
  const expected = [
    [50, 12.5],
    [87.5, 37.5],
    [87.5, 62.5],
    [62.5, 87.5],
    [50, 87.5],
    [12.5, 62.5],
    [12.5, 37.5],
    [37.5, 12.5],
    [37.5, 37.5],
    [62.5, 37.5],
    [62.5, 62.5],
    [37.5, 62.5],
  ];
  const coords = HOUSE_BOX_CENTERS.map((c) => [c.cx, c.cy]);
  assert.strictEqual(JSON.stringify(coords), JSON.stringify(expected));
});
