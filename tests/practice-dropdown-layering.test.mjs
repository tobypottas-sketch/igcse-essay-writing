import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Regression guard for "the practice-question dropdown opens underneath the next section".
// Causes (reproduced on the live page):
//  1. #practicePicker is a .card, and the later ".card{overflow:hidden}" rules (this file and scripts/essay-suite-refresh.css)
//     beat ".practice-picker{overflow:visible}", so the open menu was cut off at the card's edge and clicks fell through to the section below.
//  2. place() called window.scrollBy() when little room was left below the picker, moving the document by 137-594px.
//  3. setActive() used Element.scrollIntoView(), which also scrolls the window.

const root = fileURLToPath(new URL('..', import.meta.url));
const html = fs.readFileSync(path.join(root, 'essay-app.html'), 'utf8');
const codeOnly = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

test('the picker card is forced to overflow:visible with a selector that wins over .card', () => {
  assert.match(html, /#practicePicker\.card\.practice-picker\s*\{\s*overflow:\s*visible\s*\}/);
});

test('the practice combobox never scrolls the document itself', () => {
  const from = html.indexOf('function enhancePracticeSelect');
  assert.ok(from > 0, 'combobox source located');
  const code = codeOnly(html.slice(from, html.indexOf('\n}\n', from)));
  assert.ok(code.length > 1500);
  for (const forbidden of [/\bscrollBy\s*\(/, /\bscrollTo\s*\(/, /\.scrollIntoView\s*\(/, /\bscrollingElement\b/]) {
    assert.doesNotMatch(code, forbidden, String(forbidden));
  }
  for (const call of code.match(/\.focus\([^)]*\)/g) ?? []) assert.match(call, /preventScroll:\s*true/, call);
  assert.match(code.replace(/\s+/g, ''), /list\.scrollTop=/);
});

function loadPlaywright() {
  for (const from of [import.meta.url, 'file:///home/claude/.npm-global/lib/node_modules/']) {
    try { const require = createRequire(from); try { return require('playwright'); } catch { return require('@playwright/test'); } } catch { /* next */ }
  }
  return null;
}
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const dir of fs.readdirSync(base).filter(n => n.startsWith('chromium')).sort().reverse()) {
      for (const rel of ['chrome-linux/chrome', 'chrome']) { const p = path.join(base, dir, rel); if (fs.existsSync(p)) return p; }
    }
  } catch { /* none */ }
  return undefined; // let Playwright use its own download
}
function serve() {
  const server = http.createServer((req, res) => {
    try {
      const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!file.startsWith(root) || !fs.statSync(file).isFile()) throw new Error('nf');
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(file)] ?? 'application/octet-stream';
      res.writeHead(200, { 'content-type': type }).end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

const playwright = loadPlaywright();
let launchable = false;
if (playwright) {
  try { const b = await playwright.chromium.launch({ executablePath: findChromium() }); await b.close(); launchable = true; } catch { /* no browser */ }
}
const browserTest = launchable ? test : test.skip;

const VIEWPORTS = [
  { label: 'desktop', width: 1100, height: 900 },
  { label: 'short desktop', width: 1366, height: 600 },
  { label: 'very short', width: 1100, height: 420 },
  { label: 'tablet', width: 820, height: 900, isMobile: true, hasTouch: true },
  { label: 'phone', width: 390, height: 700, isMobile: true, hasTouch: true }
];

// The production page also loads scripts/essay-suite-refresh.css (injected by index.html); reproduce that, because it carries
// one of the ".card{overflow:hidden}" rules that caused the clipping.
async function openPage(browser, origin, vp, embedded) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let frame = page;
  if (embedded) {
    await page.route('**/wrapper.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;overflow:hidden"><iframe id="f" src="/essay-app.html" style="border:0;width:100%;height:100vh"></iframe></body>' }));
    await page.goto(`${origin}/wrapper.html`);
    const handle = await page.waitForSelector('#f');
    frame = await handle.contentFrame();
    await page.evaluate(() => document.getElementById('f').contentWindow.postMessage({ type: 'essay-hub-context', storageNamespace: 'user-test', staffAccess: false, controlledTask: null }, '*'));
    await frame.waitForSelector('#practiceCombo', { state: 'attached' });
  } else {
    await page.goto(`${origin}/essay-app.html`);
  }
  await frame.waitForSelector('#practiceCombo', { state: 'attached' });
  await frame.addStyleTag({ path: path.join(root, 'scripts', 'essay-suite-refresh.css') });
  await frame.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  return { ctx, page, frame, errors };
}

for (const embedded of [false, true]) {
  browserTest(`the practice dropdown stays above the next section and never moves the page (${embedded ? 'embedded in the hub' : 'standalone'})`, async () => {
    const { server, origin } = await serve();
    const browser = await playwright.chromium.launch({ executablePath: findChromium() });
    const failures = [];
    try {
      for (const vp of VIEWPORTS) {
        const { ctx, page, frame, errors } = await openPage(browser, origin, vp, embedded);
        const tag = `${embedded ? 'iframe' : 'page'} / ${vp.label}`;
        // Real pointer events at the element's centre; unlike locator.click() this never scrolls the page on its own.
        const clickAt = async sel => {
          const c = await frame.$eval(sel, el => { const r = el.getBoundingClientRect(), f = window.frameElement ? window.frameElement.getBoundingClientRect() : { left: 0, top: 0 }; return { x: f.left + r.left + r.width / 2, y: f.top + r.top + r.height / 2 }; });
          await page.mouse.click(c.x, c.y);
        };
        const y = () => frame.evaluate(() => Math.round(window.scrollY));
        // Put the picker in view first, so any later movement is the page's doing and not the test runner scrolling to click.
        await frame.evaluate(() => document.getElementById('practiceCombo').scrollIntoView({ block: 'center', behavior: 'instant' }));
        await frame.waitForTimeout(150);
        const start = await y();

        await clickAt('#practiceCombo');
        await frame.waitForTimeout(250);
        const probe = await frame.evaluate(() => {
          const list = document.getElementById('practiceList'), lr = list.getBoundingClientRect();
          const card = document.getElementById('practicePicker');
          const rows = [...list.querySelectorAll('[role=option]')];
          const visible = rows.filter(li => { const r = li.getBoundingClientRect(); return r.top >= lr.top && r.bottom <= lr.bottom && r.height > 0; });
          const covered = visible.filter(li => {
            const r = li.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !(hit && (hit === li || li.contains(hit)));
          }).length;
          return {
            open: !list.hidden, rows: rows.length, visible: visible.length, covered,
            cardOverflow: getComputedStyle(card).overflow, up: list.classList.contains('is-up'),
            top: lr.top, bottom: lr.bottom, hasScroll: list.scrollHeight > list.clientHeight + 1,
            hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            comboW: Math.round(document.getElementById('practiceCombo').getBoundingClientRect().width), menuW: Math.round(lr.width),
            sameRow: Math.abs(document.querySelector('.practice-picker__row .btn').getBoundingClientRect().top - document.getElementById('practiceCombo').getBoundingClientRect().top) < 2
          };
        });
        const opened = await y();
        if (!probe.open) failures.push(`${tag}: menu did not open`);
        if (probe.cardOverflow !== 'visible') failures.push(`${tag}: picker card overflow is ${probe.cardOverflow}`);
        if (probe.covered) failures.push(`${tag}: ${probe.covered} of ${probe.visible} visible rows are covered by other content`);
        if (probe.visible < Math.min(3, probe.rows)) failures.push(`${tag}: only ${probe.visible} rows usable`);
        if (probe.top < -1 || probe.bottom > vp.height + 1) failures.push(`${tag}: menu leaves the viewport (${Math.round(probe.top)}..${Math.round(probe.bottom)} of ${vp.height})`);
        if (probe.comboW > 561) failures.push(`${tag}: selector is ${probe.comboW}px wide (max 560)`);
        if (Math.abs(probe.menuW - probe.comboW) > 1) failures.push(`${tag}: menu ${probe.menuW}px differs from selector ${probe.comboW}px`);
        if (vp.width >= 700 && !probe.sameRow) failures.push(`${tag}: Use this question button is not beside the selector`);
        if (probe.hOverflow) failures.push(`${tag}: horizontal overflow`);
        if (opened !== start) failures.push(`${tag}: opening moved the page ${start} -> ${opened}`);

        // Keyboard: arrows and Home/End move the highlight, keep the page still, and Escape closes without choosing.
        for (const key of ['ArrowDown', 'End', 'PageUp', 'Home']) { await page.keyboard.press(key); await frame.waitForTimeout(40); }
        if (await y() !== start) failures.push(`${tag}: keys moved the page`);
        await page.keyboard.press('Escape'); await frame.waitForTimeout(100);
        if (await frame.evaluate(() => !document.getElementById('practiceList').hidden)) failures.push(`${tag}: Escape did not close`);
        if (await frame.evaluate(() => document.activeElement && document.activeElement.id) !== 'practiceCombo') failures.push(`${tag}: focus not returned to the button`);
        if (await y() !== start) failures.push(`${tag}: Escape moved the page`);

        // Mouse/touch selection of a row that used to sit under the next section (the 4th), and the real select follows.
        await clickAt('#practiceCombo'); await frame.waitForTimeout(150);
        const before = await frame.$eval('#practiceSelect', s => s.value);
        await frame.evaluate(() => document.querySelectorAll('#practiceList [role=option]')[3].scrollIntoView({ block: 'nearest' }));
        const target = frame.locator('#practiceList [role=option]').nth(3);
        const { x, yy } = await target.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, yy: r.top + r.height / 2 }; });
        const hitsRow = await frame.evaluate(([px, py]) => { const el = document.elementFromPoint(px, py); return !!el && !!el.closest('#practiceList'); }, [x, yy]);
        if (!hitsRow) failures.push(`${tag}: the 4th row is not the topmost element at its centre`);
        await page.mouse.click(x, yy); await frame.waitForTimeout(200);
        const after = await frame.$eval('#practiceSelect', s => s.value);
        if (after === before || !after) failures.push(`${tag}: choosing the 4th row did not change the question`);
        if (await frame.evaluate(() => !document.getElementById('practiceList').hidden)) failures.push(`${tag}: menu stayed open after choosing`);

        // Click outside closes it and leaves the page alone.
        await clickAt('#practiceCombo'); await frame.waitForTimeout(150);
        const beforeOutside = await y();
        await page.mouse.click(3, Math.round(vp.height / 2));
        await frame.waitForTimeout(120);
        if (await frame.evaluate(() => !document.getElementById('practiceList').hidden)) failures.push(`${tag}: click outside did not close`);
        if (await y() !== beforeOutside) failures.push(`${tag}: click outside moved the page`);
        if (errors.length) failures.push(`${tag}: page errors ${errors.join('; ')}`);
        await ctx.close();
      }
    } finally { await browser.close(); server.close(); }
    assert.deepEqual(failures, []);
  });
}
