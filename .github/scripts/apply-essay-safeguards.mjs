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

replaceOnce(
  "const MEMORY_STORAGE = {};",
  `const MEMORY_STORAGE = {};
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
window.setHubStorageNamespace = setHubStorageNamespace;`,
  'storage namespace functions'
);

html = html
  .replaceAll("'igcse0511_state'", "storageKey('state')")
  .replaceAll("'igcse0511_drafts'", "storageKey('drafts')")
  .replaceAll("'igcse0511_submissions'", "storageKey('submissions')");

fs.writeFileSync(file, html);
