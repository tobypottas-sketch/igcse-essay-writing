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
  assert.match(src, /addEventListener\('click',\s*\(\)\s*=>\s*loadDraft\(d\.name\)\)/);
});

test('Teacher comment-bank text is never interpolated into inline JavaScript handlers', () => {
  const src = functionSource('applyCommentBank', 'switchTab');
  assert.doesNotMatch(src, /onclick=.*insertComment/);
  assert.match(src, /btn\.textContent\s*=\s*c/);
  assert.match(src, /addEventListener\('click',\s*\(\)\s*=>\s*insertComment\(c\)\)/);
});

test('Practice task links keep teacher-created task content out of the URL query string', () => {
  const src = functionSource('buildStudentTaskLink', 'showStudentTaskLink');
  assert.doesNotMatch(src, /\?task=/);
  assert.match(src, /#task=/);
});
