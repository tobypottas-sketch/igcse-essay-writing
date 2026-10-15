import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');

test('Practice Links keep task settings in the URL fragment and read the fragment back', () => {
  assert.match(html, /return base \+ '#task=' \+ encodeURIComponent\(encoded\)/, 'Practice Link builder should use the fragment');
  assert.match(html, /window\.location\.hash/, 'Practice Link reader should inspect the fragment');
  assert.match(html, /hash\.indexOf\('#task='\) === 0/, 'Practice Link reader should recognise #task=');
});

test('legacy query-string Practice Links remain readable for backward compatibility', () => {
  assert.match(html, /new URLSearchParams\(window\.location\.search \|\| ''\)/);
  assert.match(html, /params\.get\('task'\)/);
});
