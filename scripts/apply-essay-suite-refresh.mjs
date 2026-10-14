import { readFileSync, writeFileSync } from 'node:fs';

const htmlPath = 'index.html';
const cssPath = 'scripts/essay-suite-refresh.css';
const html = readFileSync(htmlPath, 'utf8');
const css = readFileSync(cssPath, 'utf8').trim();
const oldStart = '/* ===== CAMBRIDGE SUITE VISUAL REFRESH ===== */';
const newStart = '/* ===== ESSAY WRITER SUITE VISUAL REFRESH ===== */';
const end = '</style>';
if (html.includes(newStart)) process.exit(0);
const startIndex = html.indexOf(oldStart);
const endIndex = html.indexOf(end, startIndex >= 0 ? startIndex : 0);
if (endIndex < 0) throw new Error('Could not find closing style tag');
const next = startIndex >= 0
  ? html.slice(0, startIndex) + css + '\n\n' + html.slice(endIndex)
  : html.slice(0, endIndex) + '\n' + css + '\n\n' + html.slice(endIndex);
writeFileSync(htmlPath, next);
