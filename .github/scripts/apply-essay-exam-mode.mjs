import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (html.includes(after)) return;
  if (!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html = html.replace(before, after);
}

replaceOnce(
`let state = {
  teacherMode: false,`,
`let state = {
  teacherMode: false,
  studyMode: 'practice',
  examSubmitted: false,`,
'study mode state');

replaceOnce(
`#wcTotal{color:var(--teal)!important}
`,
`#wcTotal{color:var(--teal)!important}
.study-mode-toggle{display:flex;gap:4px;padding:3px;border:1px solid rgba(20,155,150,.22);border-radius:8px;background:rgba(255,255,255,.45)}
.study-mode-toggle .btn-mode{padding:5px 10px;border-radius:6px}
#btnPracticeMode.active{background:var(--teal);border-color:var(--teal);color:#fff}
#btnExamMode.active{background:var(--rose);border-color:var(--rose);color:#fff}
.tab-btn[aria-disabled="true"]{opacity:.45;cursor:not-allowed}
`,
'mode styles');

replaceOnce(
`      <span class="autosave-indicator no-print" title="Autosave status"><span class="autosave-dot saved" id="autosaveDot"></span><span id="autosaveLabel" style="font-size:0.7rem;opacity:0.8;">Saved</span></span>
      <button class="btn-mode" id="btnTeacherToggle" onclick="toggleTeacherMode()" style="display:none;">Teacher Mode</button>`,
`      <span class="autosave-indicator no-print" title="Autosave status"><span class="autosave-dot saved" id="autosaveDot"></span><span id="autosaveLabel" style="font-size:0.7rem;opacity:0.8;">Saved</span></span>
      <div class="study-mode-toggle no-print" aria-label="Study mode">
        <button class="btn-mode active" id="btnPracticeMode" onclick="setStudyMode('practice')">Practice</button>
        <button class="btn-mode" id="btnExamMode" onclick="setStudyMode('exam')">Exam</button>
      </div>
      <button class="btn-mode" id="btnTeacherToggle" onclick="toggleTeacherMode()" style="display:none;">Teacher Mode</button>`,
'header study mode controls');

replaceOnce(
`    <button class="tab-btn" data-tab="review" onclick="switchTab('review')">Review</button>
    <button class="tab-btn" data-tab="preview" onclick="switchTab('preview')">Preview &amp; Export</button>`,
`    <button class="tab-btn" id="tabReview" data-tab="review" onclick="switchTab('review')">Review</button>
    <button class="tab-btn" id="tabPreview" data-tab="preview" onclick="switchTab('preview')">Preview &amp; Export</button>`,
'tab ids');

replaceOnce(
`    <div class="btn-group no-print" style="justify-content:center;margin-top:16px;">
      <button class="btn btn-primary" onclick="switchTab('review')">Review My Essay &rarr;</button>
      <button class="btn btn-secondary" onclick="switchTab('preview')">Preview Final Essay</button>
    </div>`,
`    <div class="btn-group no-print" id="draftActionGroup" style="justify-content:center;margin-top:16px;">
      <button class="btn btn-primary" id="btnReviewDraft" onclick="switchTab('review')">Review My Essay &rarr;</button>
      <button class="btn btn-secondary" id="btnPreviewDraft" onclick="switchTab('preview')">Preview Final Essay</button>
      <button class="btn btn-primary" id="btnSubmitExam" onclick="submitExam()" style="display:none;">Submit Exam</button>
      <button class="btn btn-secondary" id="btnNewExamAttempt" onclick="startNewExamAttempt()" style="display:none;">Start new attempt</button>
    </div>`,
'draft actions');

replaceOnce(
`  applyCommentBank();
  renderDraftsList();
}`,
`  applyCommentBank();
  renderDraftsList();
  updateModeUI();
}`,
'apply settings mode UI');

const oldSwitch = `function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
  const panel = document.getElementById('panel-' + tab);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
  if (tab === 'review' || tab === 'preview') updateAll();
}`;
const newSwitch = `function switchTab(tab) {
  if (state.studyMode === 'exam' && !state.examSubmitted && (tab === 'review' || tab === 'preview')) {
    showToast('Review and Preview unlock after you submit a complete essay.');
    return;
  }
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
  const panel = document.getElementById('panel-' + tab);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
  if (tab === 'review' || tab === 'preview') updateAll();
}`;
replaceOnce(oldSwitch, newSwitch, 'switch tab guard');

const modeFunctions = `// ===== STUDY MODE =====
function isPracticeMode() {
  return state.studyMode !== 'exam';
}

function hasCurrentWork() {
  return Object.values(state.plan || {}).some(v => String(v || '').trim()) ||
    Object.values(state.draft || {}).some(v => String(v || '').trim());
}

function clearCurrentWorkspace() {
  state.plan = { q1:'', q2:'', q3:'', q4:'', q5:'', q6:'', q7:'' };
  state.draft = { intro:'', arg1:'', arg2:'', conc:'' };
  state.teacherNotes = '';
  state.lastAnalysis = null;
}

function setStudyMode(mode) {
  if (mode !== 'practice' && mode !== 'exam') return;
  if (mode === state.studyMode) return;
  gatherUIState();
  if (hasCurrentWork() && !window.confirm('Switching study mode will clear the current plan and draft. Continue?')) return;
  clearCurrentWorkspace();
  state.studyMode = mode;
  state.examSubmitted = false;
  saveState();
  applySettings();
  updateAll();
  switchTab('task');
}

function isExamComplete() {
  return ['draftIntro','draftArg1','draftArg2','draftConc'].every(id => gv(id).trim().length > 0);
}

function submitExam() {
  if (state.studyMode !== 'exam' || state.examSubmitted) return;
  gatherUIState();
  if (!isExamComplete()) {
    showToast('Complete all four essay sections before submitting.');
    switchTab('draft');
    return;
  }
  state.examSubmitted = true;
  saveState();
  updateModeUI();
  updateAll();
  switchTab('review');
  showToast('Exam submitted. Review is now unlocked.');
}

function startNewExamAttempt() {
  if (state.studyMode !== 'exam') return;
  gatherUIState();
  if (hasCurrentWork() && !window.confirm('Start a fresh Exam attempt? The current unsaved workspace will be cleared.')) return;
  clearCurrentWorkspace();
  state.examSubmitted = false;
  saveState();
  applySettings();
  updateAll();
  switchTab('task');
}

function updateModeUI() {
  const exam = state.studyMode === 'exam';
  const locked = exam && state.examSubmitted;
  const preSubmitExam = exam && !state.examSubmitted;
  const practiceBtn = document.getElementById('btnPracticeMode');
  const examBtn = document.getElementById('btnExamMode');
  if (practiceBtn) practiceBtn.classList.toggle('active', !exam);
  if (examBtn) examBtn.classList.toggle('active', exam);

  ['planQ1','planQ2','planQ3','planQ4','planQ5','planQ6','planQ7','draftIntro','draftArg1','draftArg2','draftConc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked;
  });

  const reviewTab = document.getElementById('tabReview');
  const previewTab = document.getElementById('tabPreview');
  if (reviewTab) reviewTab.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');
  if (previewTab) previewTab.setAttribute('aria-disabled', preSubmitExam ? 'true' : 'false');
  const reviewBtn = document.getElementById('btnReviewDraft');
  const previewBtn = document.getElementById('btnPreviewDraft');
  const submitBtn = document.getElementById('btnSubmitExam');
  const newBtn = document.getElementById('btnNewExamAttempt');
  if (reviewBtn) reviewBtn.style.display = preSubmitExam ? 'none' : '';
  if (previewBtn) previewBtn.style.display = preSubmitExam ? 'none' : '';
  if (submitBtn) submitBtn.style.display = preSubmitExam ? '' : 'none';
  if (newBtn) newBtn.style.display = locked ? '' : 'none';
}

`;
replaceOnce('// ===== TEACHER MODE =====', modeFunctions + '// ===== TEACHER MODE =====', 'study mode functions');

const oldUpdateAll = `function updateAll() {
  updateWordCounts();
  const analysis = analyzeEssay();
  renderChecks(analysis);
  renderLangFeedback(analysis);
  renderPerformance(analysis);
  renderPreview();
}`;
const newUpdateAll = `function updateAll() {
  updateWordCounts();
  if (state.studyMode === 'exam' && !state.examSubmitted) {
    clearReviewOutputs();
    return;
  }
  const analysis = analyzeEssay();
  renderChecks(analysis);
  renderLangFeedback(analysis);
  renderPerformance(analysis);
  renderPreview();
}

function clearReviewOutputs() {
  const pc = document.getElementById('perfContent');
  const pl = document.getElementById('perfLanguage');
  const grid = document.getElementById('checkGrid');
  const lang = document.getElementById('langFeedback');
  const preview = document.getElementById('essayPreview');
  if (pc) { pc.textContent = '—'; pc.className = 'perf-value'; }
  if (pl) { pl.textContent = '—'; pl.className = 'perf-value'; }
  if (grid) grid.innerHTML = '<p style="color:#777;font-size:0.85rem;">Feedback is locked until this Exam attempt is submitted.</p>';
  if (lang) lang.innerHTML = '<p style="color:#777;font-size:0.85rem;">Language feedback is locked until submission.</p>';
  if (preview) preview.innerHTML = '<p style="color:#777;font-style:italic;">Final Preview unlocks after submission.</p>';
}`;
replaceOnce(oldUpdateAll, newUpdateAll, 'review gating');

fs.writeFileSync(file, html);
