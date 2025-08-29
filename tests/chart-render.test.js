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
  code += '\nmodule.exports = { default: Chart };';
  const sandbox = { module: {}, exports: {}, require };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports.default;
}

test('Chart renders only with exactly 12 houses', () => {
  const Chart = loadChart();
  assert.strictEqual(
    Chart({ data: { houses: Array(12).fill(1), planets: [] } }),
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
});

test('Chart SVG includes inner polygon to separate houses', () => {
  const code = fs.readFileSync(
    path.join(__dirname, '../src/components/Chart.jsx'),
    'utf8'
  );
  assert.ok(code.includes('points="50,25 75,50 50,75 25,50"'));
});
