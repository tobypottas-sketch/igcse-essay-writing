import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

test('Hub storage namespace scopes all local Essay data keys', () => {
  assert.match(html, /function\s+setHubStorageNamespace\s*\(/);
  assert.match(html, /function\s+storageKey\s*\(/);
  assert.match(html, /storageKey\(['"]state['"]\)/);
  assert.match(html, /storageKey\(['"]drafts['"]\)/);
  assert.match(html, /storageKey\(['"]submissions['"]\)/);
  assert.doesNotMatch(html, /safeStorageSet\(['"]igcse0511_state['"]/);
  assert.doesNotMatch(html, /safeStorageGet\(['"]igcse0511_drafts['"]/);
  assert.doesNotMatch(html, /safeStorageGet\(['"]igcse0511_submissions['"]/);
});

test('direct public use has an isolated anonymous storage namespace', () => {
  assert.match(html, /let\s+hubStorageNamespace\s*=\s*['"]anonymous['"]/);
  assert.match(html, /igcse0511:\$\{hubStorageNamespace\}:/);
});

test('changing Hub namespace reloads only that users local workspace', () => {
  assert.match(html, /setHubStorageNamespace[\s\S]*hubStorageNamespace[\s\S]*loadState\(\)[\s\S]*applySettings\(\)/);
});
