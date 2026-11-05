import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');
const start = html.indexOf('function buildWritingTargets(');
const end = html.indexOf('function renderPriorities(a) {', start);
assert.ok(start >= 0 && end > start, 'feedback helper must exist');

const sandbox = {
  countWords: text => (String(text).trim().match(/\S+/g) || []).length,
  REASON_MARKERS: ['because', 'one reason', 'this is because'],
  EXAMPLE_MARKERS: ['for example', 'for instance', 'such as']
};
vm.runInNewContext(html.slice(start, end), sandbox);
const suggest = settings => Array.from(sandbox.buildWritingTargets(settings));
const base = {
  intro: 'Some people are concerned about phones at school, but I think they should be permitted.',
  arg1: 'Firstly, phones allow students to look up unfamiliar vocabulary. For example, a student can use a dictionary.',
  arg2: 'However, phones can distract classmates, because some pupils might check messages. Schools can set clear rules.',
  conc: 'In conclusion, phones can help pupils when they are used responsibly and with sensible school rules.',
  question: '',
  wordMin: 120, wordMax: 160
};
function expanded(overrides = {}) { return { ...base, ...overrides }; }

test('suggestions are local, limited to three and carry actionable paragraph navigation', () => {
  const results = suggest(expanded());
  assert.ok(results.length >= 2 && results.length <= 3);
  for (const target of results) {
    assert.ok(['observed','self-check'].includes(target.kind));
    assert.ok(['draftIntro','draftArg1','draftArg2','draftConc'].includes(target.field));
    assert.ok(target.title && target.detail && target.action && target.area);
  }
  assert.ok(results.some(t => t.kind === 'self-check'));
  assert.ok(!results.some(t => /No essay question is assigned/.test(t.detail)));
});

test('missing section receives an honest observed-feature target', () => {
  const results = suggest(expanded({ conc: '' }));
  assert.equal(results[0].kind, 'observed');
  assert.equal(results[0].field, 'draftConc');
  assert.match(results[0].detail, /0 words/);
});

test('repeated topic words are reported using measured occurrences, not invented synonyms', () => {
  const results = suggest(expanded({
    intro: 'Phones are useful. Phones are common.',
    arg1: 'Phones help with research. Phones can also distract. Phones should follow rules.',
    arg2: base.arg2, conc:base.conc, wordMin:1
  }));
  const match = results.find(t => /repeated vocabulary/i.test(t.title));
  assert.ok(match);
  assert.match(match.detail, /“phones” appears 7 times/);
  assert.match(match.action, /when precise/);
});

test('targets never assign grades or claim argument quality was verified', () => {
  const results = suggest(expanded({ question:'Should phones be banned at school?' }));
  const text = JSON.stringify(results);
  assert.doesNotMatch(text, /A–B|Strong language|Cambridge grade|well developed/i);
  assert.match(text, /check|read|compare|consider|add|remove|explain/i);
});

test('exam feedback still gates review before submission', () => {
  assert.match(html, /function updateAll\(\)[\s\S]*state.studyMode === 'exam' && !state.examSubmitted[\s\S]*clearReviewOutputs\(\)/);
});
