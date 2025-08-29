const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert');
const test = require('node:test');

function loadGetTimezoneOffset() {
  let code = fs.readFileSync(path.join(__dirname, '../src/calculateChart.js'), 'utf8');
  code = code.replace(
    'export default async function calculateChart',
    'async function calculateChart'
  );
  code += '\nmodule.exports = { getTimezoneOffset };';
  const sandbox = {
    module: { exports: {} },
    exports: {},
    fetch: async () => { throw new Error('network'); },
    console: { error: () => {} },
  };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports.getTimezoneOffset;
}

test('85°E results in UTC+5:30', async () => {
  const getTimezoneOffset = loadGetTimezoneOffset();
  const offset = await getTimezoneOffset(0, 85);
  assert.strictEqual(offset, 330);
});

test('known longitudes map to expected offsets', async () => {
  const getTimezoneOffset = loadGetTimezoneOffset();
  const cases = [
    { lon: 0, expected: 0 },
    { lon: -74, expected: -300 },
    { lon: 120, expected: 480 },
  ];
  for (const { lon, expected } of cases) {
    const offset = await getTimezoneOffset(0, lon);
    assert.strictEqual(offset, expected, `longitude ${lon}`);
  }
});

