import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');
const start = html.indexOf('const PRACTICE_WORD_MIN');
const end = html.indexOf('function practiceItem(', start);
assert.ok(start >= 0 && end > start, 'practice bank must exist');
const sandbox = {};
vm.runInNewContext(html.slice(start, end) + ';this.bank = PRACTICE_BANK; this.min = PRACTICE_WORD_MIN; this.max = PRACTICE_WORD_MAX;', sandbox);
const bank = sandbox.bank;

test('there are twelve original Exercise 6 style tasks with unique ids', () => {
  assert.equal(bank.length, 12);
  assert.equal(new Set(bank.map(t => t.id)).size, 12);
  assert.equal(new Set(bank.map(t => t.label)).size, 12);
  assert.equal(new Set(bank.map(t => t.question)).size, 12);
});

test('both one-sided and balanced tasks are included in equal measure', () => {
  assert.equal(bank.filter(t => t.argType === 'balanced').length, 6);
  assert.equal(bank.filter(t => t.argType === 'one-sided').length, 6);
});

test('every task has a situation, audience, purpose, three prompts and the 120-160 word target', () => {
  assert.equal(sandbox.min, 120);
  assert.equal(sandbox.max, 160);
  for (const t of bank) {
    assert.match(t.id, /^[a-z0-9-]+$/);
    assert.ok(t.audience.length > 5, t.id + ' audience');
    assert.match(t.question, /Write 120–160 words\.$/, t.id);
    assert.match(t.question, /Write (?:your |an )?essay|essay/i, t.id);
    assert.equal(t.prompts.length, 3, t.id + ' prompts');
    assert.ok(t.prompts.every(p => p.length > 10), t.id);
    if (t.argType === 'balanced') assert.match(t.question, /both|advantages and disadvantages|benefits and (?:the )?(?:drawbacks|problems)/i, t.id);
    else assert.match(t.question, /agree or disagree|Choose one side|giving your opinion/i, t.id);
  }
});

test('every task is clearly an essay, not an article, even for magazines, newspapers and websites', () => {
  for (const t of bank) {
    assert.match(t.question, /\bessay\b/i, t.id);
    assert.doesNotMatch(t.question + t.prompts.join(' '), /\barticle\b|\breport\b|\bletter\b/i, t.id);
  }
  assert.match(html, /Every task is an <strong>essay<\/strong>/);
});

test('an unsubmitted Exam Mode teacher task cannot be left', () => {
  assert.match(html, /function teacherTaskLocked\(\) \{\n  return Boolean\(state\.controlledTaskId\) && state\.studyMode === 'exam' && !state\.examSubmitted;/);
  assert.match(html, /function leaveTeacherTask\(\) \{\n  if \(teacherTaskLocked\(\)\)/);
  assert.match(html, /leave\.hidden = locked;/);
});

test('original practice is never presented as an official Cambridge question', () => {
  for (const t of bank) assert.doesNotMatch(JSON.stringify(t), /cambridge|past[- ]paper|specimen|mark scheme/i, t.id);
  assert.match(html, /\[Original practice\]/);
  assert.match(html, /They are not official Cambridge past-paper questions/);
  assert.match(html, /Original practice \\u2013 not an official Cambridge question/);
});

test('teacher tasks stay in charge and the selector cannot go stale', () => {
  // A teacher link or controlled task clears the bank selection and hides the picker.
  assert.match(html, /state\.controlledTaskId = id;\n  state\.bankTaskId = '';/);
  assert.match(html, /state\.controlledTaskId = '';\n  state\.bankTaskId = '';/);
  assert.match(html, /function teacherAssignedTask\(\)/);
  // The active bank question is derived from the saved question text.
  assert.match(html, /item\.question === state\.settings\.essayQuestion/);
  // The cleared workspace is written to the fields before saveState() reads them back.
  assert.match(html, /applySettings\(\);\n  saveState\(\);\n  updateAll\(\);\n  showToast\('Question loaded/);
  assert.match(html, /syncPracticePicker\(true\);/);
});

test('loading a practice question always clears old AI feedback, even when the workspace was empty', () => {
  const from = html.indexOf('function loadPracticeQuestion()');
  const body = html.slice(from, html.indexOf('\n}\n', from));
  assert.match(body, /resetEssayFeedback\(\);/);
});
