import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (html.includes(after)) return;
  if (!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html = html.replace(before, after);
}

replaceOnce(
  `function switchTab(tab) {\n  if (state.studyMode === 'exam' && !state.examSubmitted && (tab === 'review' || tab === 'preview' || tab === 'drafts')) {\n    showToast('Review, Preview and Saved Drafts unlock after you submit a complete essay.');\n    return;\n  }`,
  `function switchTab(tab) {\n  if (state.studyMode === 'exam' && tab === 'drafts') {\n    showToast('Saved Drafts are unavailable in Exam Mode.');\n    return;\n  }\n  if (state.studyMode === 'exam' && !state.examSubmitted && (tab === 'review' || tab === 'preview')) {\n    showToast('Review and Preview unlock after you submit a complete essay.');\n    return;\n  }`,
  'full Exam drafts tab guard'
);

replaceOnce(
  `  if (tabDrafts) tabDrafts.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');`,
  `  if (tabDrafts) tabDrafts.setAttribute('aria-disabled', exam ? 'true' : 'false');`,
  'full Exam drafts aria state'
);

replaceOnce(
  `function saveDraft() {\n  if (state.studyMode === 'exam' && !state.examSubmitted) {\n    showToast('Saved Drafts are unavailable during an active Exam attempt.');`,
  `function saveDraft() {\n  if (state.studyMode === 'exam') {\n    showToast('Saved Drafts are unavailable in Exam Mode.');`,
  'save draft full Exam guard'
);

replaceOnce(
  `function loadDraft(name) {\n  if (state.studyMode === 'exam' && !state.examSubmitted) {\n    showToast('Saved Drafts are unavailable during an active Exam attempt.');`,
  `function loadDraft(name) {\n  if (state.studyMode === 'exam') {\n    showToast('Saved Drafts are unavailable in Exam Mode.');`,
  'load draft full Exam guard'
);

fs.writeFileSync(file, html);
