import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return html.slice(start, end);
}

test('Saved draft names are never interpolated into inline JavaScript handlers', () => {
  const src = functionSource('renderDrafts', 'resetCurrentDraft');
  assert.doesNotMatch(src, /onclick=.*d\.name/);
  assert.doesNotMatch(src, /onclick=\\?"loadDraft/);
  assert.doesNotMatch(src, /onclick=\\?"deleteDraft/);
});

test('Teacher comment-bank text is never interpolated into inline JavaScript handlers', () => {
  const src = functionSource('renderCommentBank', 'switchTab');
  assert.doesNotMatch(src, /onclick=.*insertComment/);
});
