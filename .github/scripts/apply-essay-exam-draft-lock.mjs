import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (html.includes(after)) return;
  if (!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html = html.replace(before, after);
}

replaceOnce(
  `<button class="tab-btn" data-tab="drafts" onclick="switchTab('drafts')">Saved Drafts</button>`,
  `<button class="tab-btn" id="tabDrafts" data-tab="drafts" onclick="switchTab('drafts')">Saved Drafts</button>`,
  'saved drafts tab id'
);

replaceOnce(
  `if (state.studyMode === 'exam' && !state.examSubmitted && (tab === 'review' || tab === 'preview')) {\n    showToast('Review and Preview unlock after you submit a complete essay.');`,
  `if (state.studyMode === 'exam' && !state.examSubmitted && (tab === 'review' || tab === 'preview' || tab === 'drafts')) {\n    showToast('Review, Preview and Saved Drafts unlock after you submit a complete essay.');`,
  'exam tab guard'
);

replaceOnce(
  `  const previewTab = document.getElementById('tabPreview');\n  if (reviewTab) reviewTab.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');\n  if (previewTab) previewTab.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');`,
  `  const previewTab = document.getElementById('tabPreview');\n  const tabDrafts = document.getElementById('tabDrafts');\n  if (reviewTab) reviewTab.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');\n  if (previewTab) previewTab.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');\n  if (tabDrafts) tabDrafts.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');`,
  'drafts tab disabled state'
);

replaceOnce(
  `function saveDraft() {\n  const name = gv('saveDraftName').trim();`,
  `function saveDraft() {\n  if (state.studyMode === 'exam' && !state.examSubmitted) {\n    showToast('Saved Drafts are unavailable during an active Exam attempt.');\n    return;\n  }\n  const name = gv('saveDraftName').trim();`,
  'save draft exam guard'
);

replaceOnce(
  `function loadDraft(name) {\n  const drafts = getDrafts();`,
  `function loadDraft(name) {\n  if (state.studyMode === 'exam' && !state.examSubmitted) {\n    showToast('Saved Drafts are unavailable during an active Exam attempt.');\n    return;\n  }\n  const drafts = getDrafts();`,
  'load draft exam guard'
);

fs.writeFileSync(file, html);
