import fs from 'node:fs';
const file='index.html';
let html=fs.readFileSync(file,'utf8');
html=html
  .replace("    showToast('Saved Drafts are unavailable in Exam Mode.');\n    return;", "    showToast('Saved Drafts are unavailable in Exam Mode.');\n    return false;")
  .replace("  if (!name) { showToast('Please enter a draft name.'); return; }", "  if (!name) { showToast('Please enter a draft name.'); return false; }")
  .replace("  showToast('Draft saved: ' + name);\n}\n\nfunction getDrafts()", "  showToast('Draft saved: ' + name);\n  return true;\n}\n\nfunction getDrafts()");
fs.writeFileSync(file,html);
