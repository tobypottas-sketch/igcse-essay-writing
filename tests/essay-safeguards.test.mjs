import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

test('Hub storage namespace scopes all local Essay data keys', () => {
  assert.match(html, /function\s+storageKey\s*\(/);
  assert.match(html, /storageKey\(['"]state['"]\)/);
  assert.match(html, /storageKey\(['"]drafts['"]\)/);
  assert.match(html, /storageKey\(['"]submissions['"]\)/);
  assert.doesNotMatch(html, /safeStorageSet\(['"]igcse0511_state['"]/);
  assert.doesNotMatch(html, /safeStorageGet\(['"]igcse0511_drafts['"]/);
  assert.doesNotMatch(html, /safeStorageGet\(['"]igcse0511_submissions['"]/);
});

test('direct public use has an isolated anonymous storage namespace', () => {
  assert.match(html, /let\s+hubStorageNamespace\s*=\s*['"]anonymous['"]/);
  assert.match(html, /igcse0511:\$\{hubStorageNamespace\}:/);
});

test('Hub namespace is applied internally and reloads only that users workspace', () => {
  assert.match(html, /applyHubStorageNamespace[\s\S]*hubStorageNamespace/);
  assert.doesNotMatch(html, /window\.setHubStorageNamespace/);
});

test('public app has no boolean Teacher Mode grant hook', () => {
  assert.doesNotMatch(html, /setHubStaffAccess/);
  assert.doesNotMatch(html, /window\.setHubStaffAccess/);
  assert.doesNotMatch(html, /teacherAccessAllowed/);
});

test('embedded Hub context is accepted only from the same-origin parent frame', () => {
  assert.match(html, /addEventListener\(['"]message['"]/);
  assert.match(html, /event\.source\s*!==\s*window\.parent/);
  assert.match(html, /window\.parent\s*===\s*window/);
  assert.match(html, /event\.origin\s*!==\s*window\.location\.origin/);
  assert.match(html, /essay-hub-context/);
  assert.match(html, /staffAccess/);
  assert.match(html, /storageNamespace/);
});

test('embedded app waits for authenticated Hub context before loading local state', () => {
  assert.match(html, /let\s+appInitialised\s*=\s*false/);
  assert.match(html, /function\s+initialiseApp\s*\(/);
  assert.match(html, /DOMContentLoaded[\s\S]*window\.parent\s*===\s*window[\s\S]*initialiseApp\(\)/);
  assert.match(html, /data\.type\s*!==\s*['"]essay-hub-context['"][\s\S]*applyHubStorageNamespace\(data\.storageNamespace\)[\s\S]*initialiseApp\(\)/);
  assert.doesNotMatch(html, /DOMContentLoaded['"],\s*function\(\)\s*\{\s*loadState\(\)/);
});

test('Teacher UI re-checks Hub authorization before revealing controls', () => {
  assert.match(html, /function\s+hasHubStaffAccess\s*\(/);
  assert.match(html, /function\s+applyTeacherUI[\s\S]*hasHubStaffAccess\(\)/);
  assert.match(html, /function\s+toggleTeacherMode[\s\S]*hasHubStaffAccess\(\)/);
});

test('Essay state persists Practice or Exam mode and submission state', () => {
  assert.match(html, /studyMode:\s*['"]practice['"]/);
  assert.match(html, /examSubmitted:\s*false/);
  assert.match(html, /id=['"]btnPracticeMode['"]/);
  assert.match(html, /id=['"]btnExamMode['"]/);
  assert.match(html, /function\s+setStudyMode\s*\(/);
  assert.match(html, /function\s+updateModeUI\s*\(/);
});

test('unfinished Exam blocks Review, Preview, and Saved Drafts without rendering analysis', () => {
  assert.match(html, /function\s+switchTab[\s\S]*state\.studyMode\s*===\s*['"]exam['"][\s\S]*!state\.examSubmitted[\s\S]*review[\s\S]*preview[\s\S]*drafts/);
  assert.match(html, /function\s+updateAll[\s\S]*state\.studyMode\s*===\s*['"]exam['"][\s\S]*!state\.examSubmitted[\s\S]*clearReviewOutputs\(\)[\s\S]*return/);
  assert.match(html, /function\s+clearReviewOutputs\s*\(/);
  assert.match(html, /id=['"]tabDrafts['"]/);
});

test('saved draft import and save are blocked during unfinished Exam', () => {
  assert.match(html, /function\s+loadDraft\s*\([\s\S]*state\.studyMode\s*===\s*['"]exam['"][\s\S]*!state\.examSubmitted[\s\S]*return/);
  assert.match(html, /function\s+saveDraft\s*\([\s\S]*state\.studyMode\s*===\s*['"]exam['"][\s\S]*!state\.examSubmitted[\s\S]*return/);
  assert.match(html, /function\s+updateModeUI[\s\S]*tabDrafts[\s\S]*aria-disabled/);
});

test('Exam submission requires all four essay sections and then locks editing', () => {
  assert.match(html, /function\s+isExamComplete\s*\(/);
  assert.match(html, /draftIntro[\s\S]*draftArg1[\s\S]*draftArg2[\s\S]*draftConc/);
  assert.match(html, /function\s+submitExam\s*\([\s\S]*!isExamComplete\(\)[\s\S]*return[\s\S]*state\.examSubmitted\s*=\s*true[\s\S]*saveState\(\)[\s\S]*switchTab\(['"]review['"]\)/);
  assert.match(html, /function\s+updateModeUI[\s\S]*examSubmitted[\s\S]*disabled/);
});

test('Exam mode has a fresh-attempt path and mode switching does not silently keep work', () => {
  assert.match(html, /function\s+startNewExamAttempt\s*\(/);
  assert.match(html, /function\s+hasCurrentWork\s*\(/);
  assert.match(html, /function\s+clearCurrentWorkspace\s*\(/);
  assert.match(html, /function\s+setStudyMode[\s\S]*hasCurrentWork\(\)[\s\S]*confirm/);
  assert.match(html, /startNewExamAttempt[\s\S]*clearCurrentWorkspace\(\)[\s\S]*examSubmitted\s*=\s*false/);
});

test('Practice mode keeps Review and Preview available before submission', () => {
  assert.match(html, /state\.studyMode\s*!==\s*['"]exam['"]/);
});

test('controlled tasks can only be applied from validated Hub context', () => {
  assert.match(html, /controlledTaskId:\s*['"]/);
  assert.match(html, /function\s+applyControlledTask\s*\(/);
  assert.match(html, /data\.controlledTask[\s\S]*applyControlledTask\(data\.controlledTask\)/);
  assert.match(html, /applyControlledTask[\s\S]*controlledTaskId[\s\S]*studyMode[\s\S]*settings/);
});

test('controlled task mode cannot be changed locally by the student', () => {
  assert.match(html, /function\s+setStudyMode[\s\S]*state\.controlledTaskId[\s\S]*return/);
  assert.match(html, /Mode is set by your teacher/);
});

test('ordinary Base64 shared links are explicitly Practice and never controlled', () => {
  assert.match(html, /function\s+applySharedTaskFromUrl[\s\S]*state\.controlledTaskId\s*=\s*['"]["']?;/);
  assert.match(html, /function\s+applySharedTaskFromUrl[\s\S]*state\.studyMode\s*=\s*['"]practice['"]/);
  assert.doesNotMatch(html, /payload\s*=\s*\{[\s\S]{0,180}controlledTaskId/);
});

test('staff can request a server-backed controlled Exam link through the Hub parent', () => {
  assert.match(html, /function\s+requestControlledTaskLink\s*\(/);
  assert.match(html, /requestControlledTaskLink[\s\S]*hasHubStaffAccess\(\)/);
  assert.match(html, /essay-create-controlled-task/);
  assert.match(html, /studyMode:\s*['"]exam['"]/);
  assert.match(html, /id=['"]btnControlledTaskLink['"]/);
});
