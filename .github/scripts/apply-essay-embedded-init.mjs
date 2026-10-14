import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (html.includes(after)) return;
  if (!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html = html.replace(before, after);
}

const oldInit = `// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  const sharedTaskLoaded = applySharedTaskFromUrl();
  applySettings();
  bindDraftFields();
  bindPlanFields();
  updateAll();
  if (sharedTaskLoaded) {
    saveState();
    setTimeout(function(){ showToast('Shared essay task loaded'); }, 300);
  }
});`;

const newInit = `// ===== INIT =====
let appInitialised = false;
let domReady = false;

function initialiseApp() {
  if (appInitialised || !domReady) return;
  appInitialised = true;
  loadState();
  const sharedTaskLoaded = applySharedTaskFromUrl();
  applySettings();
  bindDraftFields();
  bindPlanFields();
  updateAll();
  if (sharedTaskLoaded) {
    saveState();
    setTimeout(function(){ showToast('Shared essay task loaded'); }, 300);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  domReady = true;
  if (window.parent === window) initialiseApp();
});`;
replaceOnce(oldInit, newInit, 'deferred app init');

const oldNamespace = `function applyHubStorageNamespace(namespace) {
  const clean = String(namespace || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  if (!clean || clean === hubStorageNamespace) return;
  hubStorageNamespace = clean;
  state = JSON.parse(INITIAL_STATE_JSON);
  loadState();
  applySettings();
  updateAll();
}`;

const newNamespace = `function applyHubStorageNamespace(namespace) {
  const clean = String(namespace || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  if (!clean || clean === hubStorageNamespace) return;
  hubStorageNamespace = clean;
  state = JSON.parse(INITIAL_STATE_JSON);
  if (!appInitialised) return;
  loadState();
  applySettings();
  updateAll();
}`;
replaceOnce(oldNamespace, newNamespace, 'namespace pre-init guard');

replaceOnce(
`  applyHubStorageNamespace(data.storageNamespace);
  hubStaffAccess = data.staffAccess === true;
  if (!hubStaffAccess) state.teacherMode = false;
  if (data.controlledTask) applyControlledTask(data.controlledTask);
  const btn = document.getElementById('btnTeacherToggle');`,
`  applyHubStorageNamespace(data.storageNamespace);
  hubStaffAccess = data.staffAccess === true;
  if (!hubStaffAccess) state.teacherMode = false;
  initialiseApp();
  if (data.controlledTask) applyControlledTask(data.controlledTask);
  const btn = document.getElementById('btnTeacherToggle');`,
'Hub context initialization order');

fs.writeFileSync(file, html);
