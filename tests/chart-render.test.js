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
  code += '\nmodule.exports = { default: Chart, SIGN_BOXES };';
  const sandbox = { module: {}, exports: {}, require };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports;
}

test('Chart renders only with exactly 12 houses in natural order', () => {
  const { default: Chart } = loadChart();
  const natural = Array.from({ length: 12 }, (_, i) => i + 1);
  assert.strictEqual(
    Chart({ data: { houses: natural, planets: [] } }),
    'Chart'
  );
  assert.strictEqual(
    Chart({ data: { houses: Array(11).fill(1), planets: [] } }),
    'Invalid chart data'
  );
  assert.strictEqual(
    Chart({ data: { houses: Array(13).fill(1), planets: [] } }),
    'Invalid chart data'
  );
  // Misordered houses should also be rejected
  assert.strictEqual(
    Chart({ data: { houses: [1, 2, 4, 3, 5, 6, 7, 8, 9, 10, 11, 12], planets: [] } }),
    'Invalid chart data'
  );
});

test('Chart SVG uses 12 distinct rhombi with no central cross', () => {
  const { SIGN_BOXES } = loadChart();
  assert.strictEqual(SIGN_BOXES.length, 12);
  const unique = new Set(SIGN_BOXES.map((b) => b.points));
  assert.strictEqual(unique.size, 12);
  const code = fs.readFileSync(
    path.join(__dirname, '../src/components/Chart.jsx'),
    'utf8'
  );
  assert.ok(!code.includes('<line'));
});

test('Planet labels are centred within sign boxes', () => {
  const code = fs.readFileSync(
    path.join(__dirname, '../src/components/Chart.jsx'),
    'utf8'
  );
  assert.ok(code.includes("top: `${box.cy}%`"));
  assert.ok(code.includes("left: `${box.cx}%`"));
  assert.ok(code.includes("transform: 'translate(-50%, -50%)'"));
  assert.ok(code.includes('planetBySign[box.sign] &&'));
});

test('Rhombi positions follow canonical North-Indian layout', () => {
  const { SIGN_BOXES } = loadChart();
  const expected = [
    '50,0 62.5,12.5 50,25 37.5,12.5',
    '87.5,25 100,37.5 87.5,50 75,37.5',
    '87.5,50 100,62.5 87.5,75 75,62.5',
    '62.5,75 75,87.5 62.5,100 50,87.5',
    '50,75 62.5,87.5 50,100 37.5,87.5',
    '12.5,50 25,62.5 12.5,75 0,62.5',
    '12.5,25 25,37.5 12.5,50 0,37.5',
    '37.5,0 50,12.5 37.5,25 25,12.5',
    '37.5,25 50,37.5 37.5,50 25,37.5',
    '62.5,25 75,37.5 62.5,50 50,37.5',
    '62.5,50 75,62.5 62.5,75 50,62.5',
    '37.5,50 50,62.5 37.5,75 25,62.5',
  ];
  const points = Array.from(SIGN_BOXES, (b) => b.points);
  assert.deepStrictEqual(points, expected);
});
