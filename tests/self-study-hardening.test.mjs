import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html','utf8');

test('public app has no embedded teacher password', () => {
  assert.equal(html.includes('NKCS1234'), false);
  assert.equal(html.includes('checkTeacherPw'), false);
});

test('teacher controls are hidden until Hub grants staff access', () => {
  assert.match(html, /id="btnTeacherToggle"[^>]*style="display:none;/);
  assert.match(html, /let hubStaffAccess\s*=\s*false/);
  assert.match(html, /function hasHubStaffAccess\(\)/);
  assert.match(html, /hubStaffAccess\s*=\s*data\.staffAccess\s*===\s*true/);
  assert.match(html, /event\.source\s*!==\s*window\.parent/);
  assert.match(html, /event\.origin\s*!==\s*window\.location\.origin/);
});

test('Essay app uses Cambridge suite branding', () => {
  assert.match(html, /cambridge-english-header\.png/);
  assert.match(html, /CAMBRIDGE SUITE VISUAL REFRESH/);
  assert.match(html, /--teal:/);
  assert.match(html, /--rose:/);
});

test('student empty-task guidance does not invite Teacher Mode', () => {
  assert.equal(html.includes('Ask your teacher or switch to Teacher Mode to set the task.'), false);
  assert.match(html, /Open a shared task link from your teacher/);
});