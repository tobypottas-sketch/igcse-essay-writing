import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (html.includes(after)) return;
  if (!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html = html.replace(before, after);
}

replaceOnce(
`  sharedTaskKey: '',
};`,
`  sharedTaskKey: '',
  controlledTaskId: '',
};`,
'controlled task state');

replaceOnce(
`      <div class="study-mode-toggle no-print" aria-label="Study mode">`,
`      <div class="study-mode-toggle no-print" id="studyModeToggle" aria-label="Study mode">`,
'study mode toggle id');

replaceOnce(
`          <div class="btn-group">
            <button class="btn btn-primary" onclick="copyStudentTaskLink()">Copy Student Task Link</button>
            <button class="btn btn-secondary" onclick="openStudentTaskPreview()">Open Student Preview</button>
          </div>`,
`          <div class="btn-group">
            <button class="btn btn-primary" onclick="copyStudentTaskLink()">Copy Practice Link</button>
            <button class="btn btn-secondary" onclick="openStudentTaskPreview()">Open Practice Preview</button>
            <button class="btn btn-primary" id="btnControlledTaskLink" onclick="requestControlledTaskLink()">Create Controlled Exam Link</button>
          </div>`,
'controlled task button');

const oldMessage = `window.addEventListener('message', function(event) {
  if (window.parent === window) return;
  if (event.source !== window.parent) return;
  if (event.origin !== window.location.origin) return;
  const data = event.data;
  if (!data || data.type !== 'essay-hub-context') return;

  applyHubStorageNamespace(data.storageNamespace);
  hubStaffAccess = data.staffAccess === true;
  if (!hubStaffAccess) state.teacherMode = false;
  const btn = document.getElementById('btnTeacherToggle');
  if (btn) btn.style.display = hubStaffAccess ? '' : 'none';
  applyTeacherUI();
});`;

const newMessage = `window.addEventListener('message', function(event) {
  if (window.parent === window) return;
  if (event.source !== window.parent) return;
  if (event.origin !== window.location.origin) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'essay-controlled-task-created') {
    if (typeof data.url === 'string' && data.url) {
      showStudentTaskLink(data.url);
      copyTextCompat(data.url)
        .then(function(){ showToast('Controlled Exam link copied!'); })
        .catch(function(){ showToast('Controlled Exam link created — copy it from the box below.'); });
    }
    return;
  }
  if (data.type === 'essay-controlled-task-error') {
    showToast(data.message || 'Controlled task could not be created.');
    return;
  }
  if (data.type !== 'essay-hub-context') return;

  applyHubStorageNamespace(data.storageNamespace);
  hubStaffAccess = data.staffAccess === true;
  if (!hubStaffAccess) state.teacherMode = false;
  if (data.controlledTask) applyControlledTask(data.controlledTask);
  const btn = document.getElementById('btnTeacherToggle');
  if (btn) btn.style.display = hubStaffAccess ? '' : 'none';
  applyTeacherUI();
});`;
replaceOnce(oldMessage, newMessage, 'Hub context message flow');

replaceOnce(
`function buildStudentTaskLink() {`,
`function requestControlledTaskLink() {
  if (!hasHubStaffAccess()) {
    showToast('Controlled Exam links are available through the authenticated Self-Study Hub.');
    return;
  }
  const settings = taskSettingsForShare();
  if (!settings.essayQuestion.trim()) {
    showToast('Add an essay question before sharing.');
    return;
  }
  window.parent.postMessage({
    type: 'essay-create-controlled-task',
    studyMode: 'exam',
    settings: settings
  }, window.location.origin);
  showToast('Creating controlled Exam link...');
}

function applyControlledTask(controlledTask) {
  const id = String(controlledTask?.id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return false;
  if (!controlledTask.settings || typeof controlledTask.settings !== 'object') return false;
  const allowed = [
    'essayQuestion','audience','wordMin','wordMax','argType','promptIdeas',
    'showScaffolds','showLabels','successCriteria','opinionPhrases','linkingPhrases'
  ];
  const incoming = {};
  allowed.forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(controlledTask.settings, key)) incoming[key] = controlledTask.settings[key];
  });
  if (state.controlledTaskId !== id) {
    clearCurrentWorkspace();
    state.examSubmitted = false;
  }
  state.settings = Object.assign({}, state.settings, incoming);
  state.controlledTaskId = id;
  state.sharedTaskKey = 'controlled:' + id;
  state.studyMode = controlledTask.studyMode === 'practice' ? 'practice' : 'exam';
  state.teacherMode = false;
  saveState();
  applySettings();
  updateAll();
  switchTab('task');
  return true;
}

function buildStudentTaskLink() {`,
'controlled task functions');

replaceOnce(
`  state.settings = Object.assign({}, state.settings, incoming);
  state.sharedTaskKey = shared.key;
  state.teacherMode = false;
  return true;`,
`  state.settings = Object.assign({}, state.settings, incoming);
  state.sharedTaskKey = shared.key;
  state.controlledTaskId = '';
  state.studyMode = 'practice';
  state.examSubmitted = false;
  state.teacherMode = false;
  return true;`,
'ordinary shared task is practice');

replaceOnce(
`function setStudyMode(mode) {
  if (mode !== 'practice' && mode !== 'exam') return;`,
`function setStudyMode(mode) {
  if (state.controlledTaskId) {
    showToast('Mode is set by your teacher for this controlled task.');
    return;
  }
  if (mode !== 'practice' && mode !== 'exam') return;`,
'controlled task mode lock');

replaceOnce(
`  const practiceBtn = document.getElementById('btnPracticeMode');
  const examBtn = document.getElementById('btnExamMode');
  if (practiceBtn) practiceBtn.classList.toggle('active', !exam);
  if (examBtn) examBtn.classList.toggle('active', exam);`,
`  const practiceBtn = document.getElementById('btnPracticeMode');
  const examBtn = document.getElementById('btnExamMode');
  const controlled = Boolean(state.controlledTaskId);
  if (practiceBtn) { practiceBtn.classList.toggle('active', !exam); practiceBtn.disabled = controlled; }
  if (examBtn) { examBtn.classList.toggle('active', exam); examBtn.disabled = controlled; }`,
'controlled mode UI lock');

replaceOnce(
`  if (s.audience) metaHTML += '<span>Audience: ' + esc(s.audience) + '</span>';
  if (state.sharedTaskKey) metaHTML += '<span>Shared teacher task</span>';`,
`  if (s.audience) metaHTML += '<span>Audience: ' + esc(s.audience) + '</span>';
  if (state.controlledTaskId) metaHTML += '<span>Controlled teacher task</span>';
  else if (state.sharedTaskKey) metaHTML += '<span>Practice link</span>';`,
'task status label');

fs.writeFileSync(file, html);
