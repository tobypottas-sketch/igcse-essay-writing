import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');

test('Essay app source remains the full application behind the Pages shell', () => {
  assert.match(app, /function\s+initialiseApp\s*\(/);
  assert.match(app, /IGCSE 0511 Essay Writer Dashboard/);
});
