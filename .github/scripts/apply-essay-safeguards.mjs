import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (html.includes(after)) return;
  if (!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html = html.replace(before, after);
}

replaceOnce(
  "  sharedTaskKey: '',\n};",
  "  sharedTaskKey: '',\n};\nconst INITIAL_STATE_JSON = JSON.stringify(state);",
  'initial state snapshot'
);

const oldStorageBlock = `const MEMORY_STORAGE = {};
let hubStorageNamespace = 'anonymous';

function storageKey(name) {
  return \`igcse0511:\${hubStorageNamespace}:\${name}\`;
}

function setHubStorageNamespace(namespace) {
  const clean = String(namespace || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  if (!clean || clean === hubStorageNamespace) return;
  hubStorageNamespace = clean;
  state = JSON.parse(INITIAL_STATE_JSON);
  loadState();
  applySettings();
  updateAll();
}
window.setHubStorageNamespace = setHubStorageNamespace;`;

const newStorageBlock = `const MEMORY_STORAGE = {};
let hubStorageNamespace = 'anonymous';
let hubStaffAccess = false;

function storageKey(name) {
  return \`igcse0511:\${hubStorageNamespace}:\${name}\`;
}

function applyHubStorageNamespace(namespace) {
  const clean = String(namespace || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  if (!clean || clean === hubStorageNamespace) return;
  hubStorageNamespace = clean;
  state = JSON.parse(INITIAL_STATE_JSON);
  loadState();
  applySettings();
  updateAll();
}

function hasHubStaffAccess() {
  return hubStaffAccess === true && window.parent !== window;
}

window.addEventListener('message', function(event) {
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

if (html.includes(oldStorageBlock)) {
  html = html.replace(oldStorageBlock, newStorageBlock);
} else if (!html.includes(newStorageBlock)) {
  replaceOnce('const MEMORY_STORAGE = {};', newStorageBlock, 'storage namespace functions');
}

html = html
  .replaceAll("'igcse0511_state'", "storageKey('state')")
  .replaceAll("'igcse0511_drafts'", "storageKey('drafts')")
  .replaceAll("'igcse0511_submissions'", "storageKey('submissions')")
  .replace("  teacherAccessAllowed: false,\n", '')
  .replace("      state.teacherAccessAllowed = false;\n", '');

const oldTeacher = `function toggleTeacherMode() {
  if (!state.teacherAccessAllowed) {
    showToast('Teacher tools are available through the authenticated Self-Study Hub.');
    return;
  }
  state.teacherMode = !state.teacherMode;
  applyTeacherUI();
  showToast(state.teacherMode ? 'Teacher tools opened' : 'Switched to Student Mode');
}

function setHubStaffAccess(allowed) {
  state.teacherAccessAllowed = allowed === true;
  if (!state.teacherAccessAllowed) state.teacherMode = false;
  const btn = document.getElementById('btnTeacherToggle');
  if (btn) btn.style.display = state.teacherAccessAllowed ? '' : 'none';
  applyTeacherUI();
}
window.setHubStaffAccess = setHubStaffAccess;

function applyTeacherUI() {
  const btn = document.getElementById('btnTeacherToggle');
  const tabT = document.getElementById('tabTeacher');
  const tabA = document.getElementById('tabAnalytics');
  const fbCard = document.getElementById('teacherFeedbackCard');
  if (state.teacherMode) {`;

const newTeacher = `function toggleTeacherMode() {
  if (!hasHubStaffAccess()) {
    state.teacherMode = false;
    applyTeacherUI();
    showToast('Teacher tools are available through the authenticated Self-Study Hub.');
    return;
  }
  state.teacherMode = !state.teacherMode;
  applyTeacherUI();
  showToast(state.teacherMode ? 'Teacher tools opened' : 'Switched to Student Mode');
}

function applyTeacherUI() {
  const btn = document.getElementById('btnTeacherToggle');
  const tabT = document.getElementById('tabTeacher');
  const tabA = document.getElementById('tabAnalytics');
  const fbCard = document.getElementById('teacherFeedbackCard');
  const allowed = hasHubStaffAccess();
  if (!allowed) state.teacherMode = false;
  if (btn) btn.style.display = allowed ? '' : 'none';
  if (state.teacherMode && allowed) {`;
replaceOnce(oldTeacher, newTeacher, 'teacher capability flow');

fs.writeFileSync(file, html);
