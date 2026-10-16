import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('student app provides a clear return route to the Self-Study Hub', () => {
  assert.match(html, /class="hub-return-link"/);
  assert.match(html, /href="https:\/\/tobypottas-sketch\.github\.io\/igcse-self-study-hub\/"/);
  assert.match(html, /target="_top"/);
  assert.match(html, /← Back to Hub/);
});
