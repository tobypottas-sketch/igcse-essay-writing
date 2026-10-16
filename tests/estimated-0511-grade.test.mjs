import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');

test('Essay results shows an honest 0511 R&W grade band rather than pretending essay-only checks are an official component grade', () => {
  assert.match(html, /Estimated 0511 R&W grade band/);
  assert.match(html, /estimateEssayGradeBand/);
  assert.match(html, /A–B/);
  assert.match(html, /F–G/);
  assert.match(html, /Component 12 combines reading and writing/i);
  assert.match(html, /not an official Cambridge result/i);
});

// Regression guard for honest essay-only grade-band wording.
