import fs from 'node:fs';

const path = 'essay-app.html';
let html = fs.readFileSync(path, 'utf8');
const before = `function readSharedTaskFromUrl() {
  let encoded = '';
  try {
    const params = new URLSearchParams(window.location.search || '');
    encoded = params.get('task') || '';
  } catch (e) {}

  // Backward-compatible fallback if a fragment-based task link is ever used.
  if (!encoded) {
    const hash = window.location.hash || '';
    if (hash.indexOf('#task=') === 0) encoded = hash.slice(6);
  }
`;
const after = `function readSharedTaskFromUrl() {
  let encoded = '';
  const hash = window.location.hash || '';
  if (hash.indexOf('#task=') === 0) encoded = hash.slice(6);
`;
if (!html.includes(before)) {
  if (html.includes(after)) process.exit(0);
  throw new Error('Expected shared-task URL reader block not found');
}
html = html.replace(before, after);
fs.writeFileSync(path, html);
