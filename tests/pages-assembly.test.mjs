import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../scripts/essay-suite-refresh.css', import.meta.url), 'utf8');

test('Pages shell assembles the real Essay app with the suite stylesheet', () => {
  assert.match(shell, /include_relative essay-app\.html/);
  assert.match(shell, /scripts\/essay-suite-refresh\.css/);
  assert.match(app, /IGCSE 0511 Essay Writer Dashboard/);
  assert.match(css, /ESSAY WRITER SUITE VISUAL REFRESH/);
});
