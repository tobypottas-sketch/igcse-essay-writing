import fs from 'node:fs';
const file='index.html';
let html=fs.readFileSync(file,'utf8');

const start=html.indexOf('function saveDraft() {');
const end=html.indexOf('\nfunction getDrafts()', start);
if(start<0 || end<0) throw new Error('saveDraft function block not found');
let block=html.slice(start,end);
block=block
  .replace("    showToast('Saved Drafts are unavailable in Exam Mode.');\n    return;", "    showToast('Saved Drafts are unavailable in Exam Mode.');\n    return false;")
  .replace("  if (!name) { showToast('Please enter a draft name.'); return; }", "  if (!name) { showToast('Please enter a draft name.'); return false; }")
  .replace("  showToast('Draft saved: ' + name);\n}", "  showToast('Draft saved: ' + name);\n  return true;\n}");
html=html.slice(0,start)+block+html.slice(end);
fs.writeFileSync(file,html);
