import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Essay Writer uses the shared suite palette and visual refresh layer', () => {
  assert.match(html, /ESSAY WRITER SUITE VISUAL REFRESH/);
  assert.match(html, /--teal:\s*#149b96/i);
  assert.match(html, /--teal-deep:\s*#0d7f7b/i);
  assert.match(html, /--plum:\s*#bf8aa2/i);
  assert.match(html, /--suite-sage:\s*#8fb39a/i);
});

test('Essay Writer refresh styles the core shell consistently', () => {
  assert.match(html, /\.app-header\s*\{[^}]*background:\s*transparent/s);
  assert.match(html, /\.header-top\s*\{[^}]*border-radius:\s*var\(--radius-xl\)/s);
  assert.match(html, /\.tab-nav\s*\{[^}]*border-radius:\s*18px/s);
  assert.match(html, /\.card\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/s);
  assert.match(html, /\.task-banner\s*\{[^}]*border-left:\s*6px solid var\(--teal\)/s);
});

test('Practice and Exam controls keep distinct suite states', () => {
  assert.match(html, /#btnPracticeMode\.active\s*\{[^}]*var\(--teal\)/s);
  assert.match(html, /#btnExamMode\.active\s*\{[^}]*var\(--plum-lite\)/s);
});
