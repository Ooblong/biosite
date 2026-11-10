// Tiles screenshots into one image for side-by-side review.
// node tools/montage.mjs <dir> <regex> <out.png> [cols] [width]
import { chromium } from 'playwright-core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const [dir, re, out, cols = 5, w = 260] = process.argv.slice(2);
const files = readdirSync(dir).filter(f => new RegExp(re).test(f)).sort();
const html = `<body style="margin:0;background:#222;font:12px sans-serif;color:#fff;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px;padding:8px;width:max-content">${files.map(f => `<figure style="margin:0"><img style="width:${w}px;display:block" src="data:image/png;base64,${readFileSync(path.join(dir, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`).join('')}</body>`;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 400, height: 400 } });
await p.setContent(html); await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(out, files.length);
