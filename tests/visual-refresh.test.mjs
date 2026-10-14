import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../scripts/essay-suite-refresh.css', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Essay Writer uses the shared suite palette and visual refresh layer', () => {
  assert.match(css, /ESSAY WRITER SUITE VISUAL REFRESH/);
  assert.match(css, /--teal:\s*#149b96/i);
  assert.match(css, /--teal-deep:\s*#0d7f7b/i);
  assert.match(css, /--plum:\s*#bf8aa2/i);
  assert.match(css, /--suite-sage:\s*#8fb39a/i);
});

test('Essay Writer refresh styles the core shell consistently', () => {
  assert.match(css, /\.app-header\s*\{[^}]*background:\s*transparent/s);
  assert.match(css, /\.header-top\s*\{[^}]*border-radius:\s*var\(--radius-xl\)/s);
  assert.match(css, /\.tab-nav\s*\{[^}]*border-radius:\s*18px/s);
  assert.match(css, /\.card\s*\{[^}]*border-radius:\s*var\(--radius-lg\)/s);
  assert.match(css, /\.task-banner\s*\{[^}]*border-left:\s*6px solid var\(--teal\)/s);
});

test('Practice and Exam controls keep distinct suite states', () => {
  assert.match(css, /#btnPracticeMode\.active\s*\{[^}]*var\(--teal\)/s);
  assert.match(css, /#btnExamMode\.active\s*\{[^}]*var\(--plum-lite\)/s);
});

test('Pages shell injects the suite stylesheet into the assembled app', () => {
  assert.match(shell, /include_relative essay-app\.html/);
  assert.match(shell, /scripts\/essay-suite-refresh\.css/);
});
