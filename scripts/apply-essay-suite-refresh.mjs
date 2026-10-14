import { readFileSync, writeFileSync } from 'node:fs';

const htmlPath = 'index.html';
const cssPath = 'scripts/essay-suite-refresh.css';
const html = readFileSync(htmlPath, 'utf8');
const css = readFileSync(cssPath, 'utf8').trim();
const start = '/* ===== CAMBRIDGE SUITE VISUAL REFRESH ===== */';
const end = '</style>';
const startIndex = html.indexOf(start);
const endIndex = html.indexOf(end, startIndex >= 0 ? startIndex : 0);
if (endIndex < 0) throw new Error('Could not find closing style tag');
let next;
if (startIndex >= 0) {
  next = html.slice(0, startIndex) + css + '\n\n' + html.slice(endIndex);
} else {
  next = html.slice(0, endIndex) + '\n' + css + '\n\n' + html.slice(endIndex);
}
writeFileSync(htmlPath, next);
