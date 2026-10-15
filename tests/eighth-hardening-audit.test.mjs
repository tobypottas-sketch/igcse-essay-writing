import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const end = html.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return html.slice(start, end);
}

test('shared teacher task content is read only from the URL fragment, never the query string', () => {
  const src = functionSource('readSharedTaskFromUrl', 'applySharedTaskFromUrl');
  assert.doesNotMatch(src, /window\.location\.search/);
  assert.doesNotMatch(src, /params\.get\(['"]task['"]\)/);
  assert.match(src, /window\.location\.hash/);
});
