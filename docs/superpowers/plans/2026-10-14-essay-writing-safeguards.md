# Essay Writing Safeguards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Essay Writing to the same safeguard standard as Reading, Listening, and Paraphrasing without sending student-written content remotely.

**Architecture:** Keep the direct GitHub Pages app student-safe and keep all essay/plan content local. Move privileged teacher configuration behind Hub-mediated capability checks, scope local storage by authenticated Hub user, add a proper Practice/Exam lifecycle in the app, and make shared tasks tamper-evident for controlled use.

**Tech Stack:** Static HTML/JavaScript, GitHub Pages, Self-Study Hub iframe wrapper, Supabase auth/profile context, Node test runner.

**Spec:** Conversation-approved audit findings on 2026-10-14.

## Global Constraints

- Do not send essay text, plan text, teacher notes, prompt text, or other free-written student content to Supabase.
- Do not touch Evidence Hub.
- Preserve current local autosave/draft/export behavior unless required for a safeguard.
- Direct public app must remain student-safe.
- Practice Mode keeps immediate Review/analysis behavior.
- Exam Mode must withhold Review/analysis until a legitimate complete submission.
- Teacher/admin access must come from authenticated Hub context, not a public password or user-controlled boolean.

## Review Focus

- Same browser used by two different Hub users: one user must never load the other user's local draft.
- Refresh during Exam Mode: mode, response state, and submission lock must persist correctly.
- Student tries to call teacher-access functions from DevTools: public app must not grant teacher UI merely from a client-side boolean call.
- Student modifies a shared-task URL: modified task must be detected/rejected for controlled mode.
- Mode switching/reset during an in-progress Exam: require explicit confirmation and start a fresh attempt without feedback leakage.

---

### Task 1: User-scoped local storage

**Files:**
- Modify: `index.html`
- Test: `tests/essay-safeguards.test.mjs`

**Interfaces:**
- Consumes: optional user storage namespace delivered by Hub.
- Produces: `setHubStorageNamespace(namespace)` and namespaced state/draft/submission keys.

- [ ] Write failing tests proving two namespaces cannot read the same state/draft keys and direct public mode uses a safe anonymous namespace.
- [ ] Run tests and confirm failure.
- [ ] Implement namespace-aware storage key generation and migration behavior.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 2: Harden staff access boundary

**Files:**
- Modify: `index.html`
- Modify in Hub later: `src/tracking/essay-writing-wrapper.js`
- Test: `tests/essay-safeguards.test.mjs`

**Interfaces:**
- Consumes: authenticated Hub role/capability message.
- Produces: a one-time capability handshake rather than `setHubStaffAccess(true)`.

- [ ] Write failing tests proving a plain public function call cannot grant staff tools and direct public mode cannot expose Teacher Settings/Analytics.
- [ ] Run tests and confirm failure.
- [ ] Replace the boolean staff setter with a wrapper-delivered capability handshake scoped to the current iframe session.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 3: Practice / Exam Mode lifecycle

**Files:**
- Modify: `index.html`
- Test: `tests/essay-safeguards.test.mjs`

**Interfaces:**
- Produces: persisted `studyMode`, `examSubmitted`, and `submitExam()` / fresh-attempt behavior.

- [ ] Write failing tests for Practice feedback staying immediate, Exam Review/Preview feedback being locked pre-submit, incomplete Exam submission being rejected, complete submission locking writing and unlocking Review, and refresh persistence.
- [ ] Run tests and confirm failure.
- [ ] Implement Practice/Exam toggle, complete-response validation, submission lock, and fresh-attempt flow.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 4: Tamper-evident shared tasks

**Files:**
- Modify: `index.html`
- Modify in Hub later if server-backed signing is required.
- Test: `tests/essay-safeguards.test.mjs`

**Interfaces:**
- Produces: controlled shared-task payload validation; untrusted direct links remain ordinary practice links.

- [ ] Write failing tests proving modified controlled task payloads are rejected and unsigned public links cannot claim controlled Exam status.
- [ ] Run tests and confirm failure.
- [ ] Implement tamper-evident controlled-task validation with graceful fallback for ordinary practice links.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 5: Hub integration and privacy regression

**Files:**
- Modify in Hub: `essay-writing.html`
- Modify in Hub: `src/tracking/essay-writing-wrapper.js`
- Test in Hub: Essay tracking/privacy tests.

**Interfaces:**
- Consumes: authenticated `profile.id` and `profile.role`.
- Produces: user storage namespace and staff capability handshake to iframe; tracking remains metadata-only.

- [ ] Write failing Hub tests for namespacing, role capability, and no free-text reads/writes.
- [ ] Run tests and confirm failure.
- [ ] Implement Hub delivery of namespace/capability without widening tracked metadata.
- [ ] Run full Hub suite and confirm pass.
- [ ] Commit and open/merge PR only after verification.

### Task 6: End-to-end safeguard audit

**Files:**
- Test only unless a newly reproduced bug requires a focused fix.

- [ ] Verify direct public student flow.
- [ ] Verify Hub student flow across refresh, mode switch, reset, save/load drafts, Review, Preview, and export.
- [ ] Verify Hub teacher/admin flow.
- [ ] Verify two-user local-storage isolation.
- [ ] Verify controlled task tamper detection.
- [ ] Verify Supabase receives metadata only.
- [ ] Run full app + Hub regression suites and deploy checks.
