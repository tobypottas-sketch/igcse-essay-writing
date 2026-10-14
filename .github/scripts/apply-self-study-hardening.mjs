import fs from 'node:fs';

const file='index.html';
let html=fs.readFileSync(file,'utf8');
function replaceOnce(before,after,label){
  if(html.includes(after)) return;
  if(!html.includes(before)) throw new Error(`Missing ${label} anchor`);
  html=html.replace(before,after);
}

const suiteCss=`\n/* ===== CAMBRIDGE SUITE VISUAL REFRESH ===== */\n:root{\n  --teal:#149b96;--teal-deep:#0d7f7b;--teal-lite:#eaf8f7;\n  --rose:#c88383;--rose-deep:#ad6f70;--rose-lite:#fbefef;\n  --suite-ink:#293638;--suite-muted:#657477;--suite-line:#d7e5e4;\n}\nbody{background:linear-gradient(180deg,#f5fbfb 0%,#f7f8f7 100%);color:var(--suite-ink)}\n.app-header{background:linear-gradient(135deg,#dff4f2 0%,#ccebea 100%);color:var(--suite-ink);box-shadow:0 4px 18px rgba(30,72,75,.10)}\n.header-logo{width:auto;height:50px;background:transparent;border-radius:0}\n.header-logo img{display:block;width:auto;height:48px;object-fit:contain}\n.header-badge{background:rgba(20,155,150,.10);color:var(--teal-deep);border:1px solid rgba(20,155,150,.22)}\n.btn-mode{background:rgba(200,131,131,.12);border:1px solid rgba(173,111,112,.30);color:var(--rose-deep)}\n.btn-mode:hover,.btn-mode.active{background:var(--rose);border-color:var(--rose);color:#fff}\n.tab-nav{border-top:1px solid rgba(20,155,150,.18)}\n.tab-btn{color:#607173}.tab-btn:hover{color:var(--teal-deep);background:rgba(20,155,150,.06)}.tab-btn.active{color:var(--teal-deep);border-bottom-color:var(--teal)}\n.card{border:1px solid var(--suite-line);border-radius:14px;box-shadow:0 3px 14px rgba(39,75,78,.06)}\n.card-header{background:#fbfefe;border-bottom:1px solid var(--suite-line)}\n.card-header .accent-bar{background:var(--teal)}\n.task-banner{background:linear-gradient(135deg,var(--teal-lite),#fff);border-left-color:var(--teal);border-radius:0 14px 14px 0}\n.task-banner .task-label{color:var(--teal-deep)}\n.btn-primary{background:var(--teal)}.btn-primary:hover{background:var(--teal-deep)}\n.btn-outline:hover{border-color:var(--teal);color:var(--teal-deep)}\ntextarea:focus,input:focus,select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(20,155,150,.11)}\n.wc-meter{background:var(--teal-lite);border:1px solid var(--suite-line)}\n#wcTotal{color:var(--teal)!important}\n`;
replaceOnce('\n</style>', suiteCss+'\n</style>', 'suite CSS');

replaceOnce(
`      <div class="header-logo">\n        <svg viewBox="0 0 32 32" fill="none">\n          <rect x="2" y="4" width="28" height="24" rx="3" fill="#d4451a"/>\n          <path d="M8 11h16M8 16h12M8 21h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>\n          <circle cx="26" cy="22" r="4" fill="#fbbf24" stroke="#d4451a" stroke-width="1.5"/>\n          <path d="M25 22l1 1 2-2" stroke="#d4451a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>\n      </div>`,
`      <div class="header-logo"><img src="https://tobypottas-sketch.github.io/igcse-reading/cambridge-english-header.png" alt="Cambridge English"></div>`,
'Cambridge logo');

replaceOnce(
`<button class="btn-mode" id="btnTeacherToggle" onclick="toggleTeacherMode()">Teacher Mode</button>`,
`<button class="btn-mode" id="btnTeacherToggle" onclick="toggleTeacherMode()" style="display:none;">Teacher Mode</button>`,
'teacher button hidden');

replaceOnce(
`<div class="task-question" id="taskQuestionDisplay">No essay question set yet. Ask your teacher or switch to Teacher Mode to set the task.</div>`,
`<div class="task-question" id="taskQuestionDisplay">No essay question set yet. Open a shared task link from your teacher.</div>`,
'initial empty-task guidance');
replaceOnce(
`qd.textContent = s.essayQuestion || 'No essay question set yet. Ask your teacher or switch to Teacher Mode to set the task.';`,
`qd.textContent = s.essayQuestion || 'No essay question set yet. Open a shared task link from your teacher.';`,
'dynamic empty-task guidance');

replaceOnce(
`let state = {\n  teacherMode: false,`,
`let state = {\n  teacherMode: false,\n  teacherAccessAllowed: false,`,
'teacher access state');

replaceOnce(
`      // Don't persist teacher mode across reloads for security\n      state.teacherMode = false;`,
`      // Staff access is granted only by the authenticated Self-Study Hub wrapper.\n      state.teacherMode = false;\n      state.teacherAccessAllowed = false;`,
'load access reset');

const oldTeacher=`function toggleTeacherMode() {\n  if (state.teacherMode) {\n    state.teacherMode = false;\n    applyTeacherUI();\n    showToast('Switched to Student Mode');\n    return;\n  }\n  // Prompt for password\n  showModal(\n    '<h3>Teacher Mode</h3><p style="font-size:0.85rem;color:#666;margin-bottom:14px;">Enter the Teacher Mode password:</p>' +\n    '<input type="password" id="teacherPwInput" style="margin-bottom:6px;" placeholder="Password...">' +\n    '<div class="btn-group"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="checkTeacherPw()">Unlock</button></div>'\n  );\n  setTimeout(() => { const inp = document.getElementById('teacherPwInput'); if (inp) { inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') checkTeacherPw(); }); } }, 100);\n}\n\nfunction checkTeacherPw() {\n  const inp = document.getElementById('teacherPwInput');\n  if (inp && inp.value === 'NKCS1234') {\n    state.teacherMode = true;\n    closeModal();\n    applyTeacherUI();\n    showToast('Teacher Mode unlocked');\n  } else {\n    showToast('Incorrect password');\n  }\n}\n`;
const newTeacher=`function toggleTeacherMode() {\n  if (!state.teacherAccessAllowed) {\n    showToast('Teacher tools are available through the authenticated Self-Study Hub.');\n    return;\n  }\n  state.teacherMode = !state.teacherMode;\n  applyTeacherUI();\n  showToast(state.teacherMode ? 'Teacher tools opened' : 'Switched to Student Mode');\n}\n\nfunction setHubStaffAccess(allowed) {\n  state.teacherAccessAllowed = allowed === true;\n  if (!state.teacherAccessAllowed) state.teacherMode = false;\n  const btn = document.getElementById('btnTeacherToggle');\n  if (btn) btn.style.display = state.teacherAccessAllowed ? '' : 'none';\n  applyTeacherUI();\n}\nwindow.setHubStaffAccess = setHubStaffAccess;\n`;
replaceOnce(oldTeacher,newTeacher,'teacher password flow');

fs.writeFileSync(file,html);
