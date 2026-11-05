import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');

test('Review shows observable writing features rather than an estimated Cambridge grade', () => {
  assert.match(html, /Writing Snapshot/);
  assert.match(html, /Word count/);
  assert.match(html, /Sections started/);
  assert.match(html, /Task relevance/);
  assert.match(html, /Not assessed/);
  assert.doesNotMatch(html, /Estimated 0511 R&W grade band/);
  assert.doesNotMatch(html, /function estimateEssayGradeBand/);
});

test('Review presents at most three actionable priorities and no new pseudo-scores', () => {
  assert.match(html, /id="reviewPriorities"/);
  assert.match(html, /function renderPriorities/);
  assert.match(html, /priorities\.slice\(0,\s*3\)/);
  assert.match(html, /contentLabel: 'Not assessed'/);
  assert.match(html, /langLabel: 'Not assessed'/);
  assert.match(html, /Task relevance: Not assessed — no question provided/);
});

test('Exam mode preserves locked feedback before a submitted attempt', () => {
  assert.match(html, /function updateAll\(\)[\s\S]*state\.studyMode === 'exam' && !state\.examSubmitted[\s\S]*clearReviewOutputs\(\)/);
});

test('Legacy teacher analytics are separated from new ungraded observations', () => {
  assert.match(html, /Historic Content Labels \(legacy records\)/);
  assert.match(html, /No legacy ratings to display/);
  assert.match(html, /const legacy = labels\.filter/);
});
