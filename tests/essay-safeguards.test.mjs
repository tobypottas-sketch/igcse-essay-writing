import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

test('Hub storage namespace scopes all local Essay data keys', () => {
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

test('Hub namespace is applied internally and reloads only that users workspace', () => {
  assert.match(html, /applyHubStorageNamespace[\s\S]*hubStorageNamespace[\s\S]*loadState\(\)[\s\S]*applySettings\(\)/);
  assert.doesNotMatch(html, /window\.setHubStorageNamespace/);
});

test('public app has no boolean Teacher Mode grant hook', () => {
  assert.doesNotMatch(html, /setHubStaffAccess/);
  assert.doesNotMatch(html, /window\.setHubStaffAccess/);
  assert.doesNotMatch(html, /teacherAccessAllowed/);
});

test('embedded Hub context is accepted only from the same-origin parent frame', () => {
  assert.match(html, /addEventListener\(['"]message['"]/);
  assert.match(html, /event\.source\s*!==\s*window\.parent/);
  assert.match(html, /window\.parent\s*===\s*window/);
  assert.match(html, /event\.origin\s*!==\s*window\.location\.origin/);
  assert.match(html, /essay-hub-context/);
  assert.match(html, /staffAccess/);
  assert.match(html, /storageNamespace/);
});

test('Teacher UI re-checks Hub authorization before revealing controls', () => {
  assert.match(html, /function\s+hasHubStaffAccess\s*\(/);
  assert.match(html, /function\s+applyTeacherUI[\s\S]*hasHubStaffAccess\(\)/);
  assert.match(html, /function\s+toggleTeacherMode[\s\S]*hasHubStaffAccess\(\)/);
});
