import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');

test('saveDraft exposes only a boolean success signal to the Hub hook',()=>{
  const match=html.match(/function\s+saveDraft\s*\(\)\s*\{[\s\S]*?\n\}/);
  assert.ok(match,'saveDraft function missing');
  const body=match[0];
  assert.match(body,/state\.studyMode\s*===\s*['"]exam['"][\s\S]*return false/);
  assert.match(body,/if\s*\(!name\)[\s\S]*return false/);
  assert.match(body,/Draft saved:[\s\S]*return true/);
});
