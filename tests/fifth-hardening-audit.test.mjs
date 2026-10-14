import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../scripts/essay-suite-refresh.css', import.meta.url), 'utf8');

test('Essay visual refresh preserves the clean print/export layout', () => {
  assert.match(css, /@media\s+print\s*\{/);
  assert.match(css, /@media\s+print[\s\S]*body\s*\{[^}]*background:\s*#fff/);
  assert.match(css, /@media\s+print[\s\S]*\.card\s*\{[^}]*box-shadow:\s*none[^}]*border:\s*none/);
  assert.match(css, /@media\s+print[\s\S]*\.essay-preview\s*\{[^}]*border:\s*none[^}]*padding:\s*20px 0[^}]*max-width:\s*100%/);
});
