import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return html.slice(start, end);
}

test('Saved draft names are never interpolated into inline JavaScript handlers', () => {
  const src = functionSource('renderDraftsList', 'resetCurrentDraft');
  assert.doesNotMatch(src, /onclick=.*d\.name/);
  assert.doesNotMatch(src, /onclick=\\?"loadDraft/);
  assert.doesNotMatch(src, /onclick=\\?"deleteDraft/);
  assert.match(src, /name\.textContent\s*=\s*d\.name/);
});

test('Teacher comment bank content is not injected into inline JavaScript handlers', () => {
  const src = functionSource('renderCommentBank', 'copyTeacherNotes');
  assert.doesNotMatch(src, /onclick=.*comment/);
  assert.match(src, /textContent\s*=\s*comment/);
  assert.match(src, /addEventListener\(['"]click['"]/);
});

test('Practice task links keep teacher-authored settings out of the query string', () => {
  const src = functionSource('generateStudentTaskLink', 'requestControlledTaskLink');
  assert.doesNotMatch(src, /searchParams\.set\(['"]task['"]/);
  assert.match(src, /hash\s*=\s*['"]task=/);
});

test('shared practice tasks can still read legacy query links while preferring fragments', () => {
  const src = functionSource('readSharedTaskFromUrl', 'applySharedTaskFromUrl');
  assert.match(src, /location\.hash/);
  assert.match(src, /searchParams\.get\(['"]task['"]\)/);
});
