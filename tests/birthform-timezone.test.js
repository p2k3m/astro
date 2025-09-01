import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadHandleSelect(sandbox) {
  const code = fs.readFileSync(path.join(__dirname, '../src/components/BirthForm.jsx'), 'utf8');
  const match = code.match(/const handleSelect = \(item\) => {[\s\S]*?};/);
  if (!match) throw new Error('handleSelect not found');
  const snippet = match[0].replace('const handleSelect', 'handleSelect');
  vm.runInNewContext(snippet, sandbox);
  return sandbox.handleSelect;
}

test('selecting a city sets its timezone', () => {
  const sandbox = {
    form: {
      name: '',
      date: null,
      time: null,
      place: '',
      lat: null,
      lon: null,
      timezone: 'Asia/Calcutta',
    },
    setForm(newForm) {
      sandbox.form = newForm;
    },
    setSuggestions() {},
    getTimezoneName(lat, lon) {
      assert.strictEqual(lat, 40.7128);
      assert.strictEqual(lon, -74.006);
      return 'America/New_York';
    },
  };
  const handleSelect = loadHandleSelect(sandbox);
  const item = { name: 'New York', lat: 40.7128, lon: -74.006 };
  handleSelect(item);
  assert.strictEqual(sandbox.form.timezone, 'America/New_York');
});
