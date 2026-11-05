import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../essay-app.html', import.meta.url), 'utf8');
const begin = html.indexOf('const DRAFT_CLEAR_FIELDS = Object.freeze(');
const end = html.indexOf('function updateModeUI() {', begin);
assert.ok(begin >= 0 && end > begin);

function setup({ mode='practice', submitted=false, approved=true } = {}) {
  const ids = ['draftIntro','draftArg1','draftArg2','draftConc'];
  const fields = Object.fromEntries(ids.map(id => [id, { value:id + ' text', disabled:mode === 'exam' && submitted }]));
  const controls = Object.fromEntries(ids.map(id => [id, { disabled:false }]));
  const clearAll = { disabled:false };
  const state = { studyMode:mode, examSubmitted:submitted, plan:{ q1:'keep plan' }, settings:{ essayQuestion:'keep question' } };
  let saves=0, refreshes=0, confirmations=0;
  const sandbox = {
    state, autosaveTimer:0, clearTimeout() {},
    document: {
      getElementById(id) { return id === 'btnClearEntireDraft' ? clearAll : fields[id]; },
      querySelector(selector) { return controls[selector.match(/"([^"]+)"/)[1]]; }
    },
    window: { confirm() { confirmations++; return approved; } },
    saveState() { saves++; }, updateAll() { refreshes++; }, showToast() {}
  };
  vm.runInNewContext(html.slice(begin,end), sandbox);
  return { ...sandbox, fields, controls, clearAll, counters:()=>({ saves, refreshes, confirmations }) };
}

test('four individual buttons and one whole-draft button are wired', () => {
  for (const id of ['draftIntro','draftArg1','draftArg2','draftConc']) {
    assert.match(html, new RegExp('data-clear-draft="' + id + '"'));
    assert.match(html, new RegExp("onclick=\"clearDraftSection\\('" + id + "'\\)\""));
  }
  assert.match(html, /id="btnClearEntireDraft"/);
});

test('clearing one section preserves all other sections and the plan', () => {
  const a=setup(); a.clearDraftSection('draftArg1');
  assert.equal(a.fields.draftArg1.value,'');
  assert.equal(a.fields.draftIntro.value,'draftIntro text');
  assert.equal(a.fields.draftArg2.value,'draftArg2 text');
  assert.equal(a.state.plan.q1,'keep plan');
  assert.equal(a.state.settings.essayQuestion,'keep question');
  assert.equal(a.counters().saves,1);
  assert.equal(a.counters().refreshes,1);
});

test('clearing all draft fields leaves the plan and assigned question unchanged', () => {
  const a=setup(); a.clearEntireDraft();
  assert.ok(Object.values(a.fields).every(field => field.value === ''));
  assert.equal(a.state.plan.q1,'keep plan');
  assert.equal(a.state.settings.essayQuestion,'keep question');
  assert.equal(a.counters().saves,1);
  assert.equal(a.counters().refreshes,1);
});

test('confirmation cancellation never deletes writing', () => {
  const a=setup({ approved:false }); a.clearEntireDraft(); a.clearDraftSection('draftIntro');
  assert.equal(a.fields.draftIntro.value,'draftIntro text');
  assert.equal(a.counters().saves,0);
  assert.equal(a.counters().confirmations,2);
});

test('submitted exams cannot clear any writing', () => {
  const a=setup({ mode:'exam', submitted:true });
  a.updateDraftClearControls(); a.clearDraftSection('draftIntro'); a.clearEntireDraft();
  assert.equal(a.fields.draftIntro.value,'draftIntro text');
  assert.equal(a.clearAll.disabled,true);
  assert.ok(Object.values(a.controls).every(control => control.disabled));
  assert.equal(a.counters().saves,0);
});
