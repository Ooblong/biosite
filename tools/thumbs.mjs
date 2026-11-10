// Captures a phone-sized screenshot of each site for the gallery cards.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE || 'http://localhost:4173';
const only = process.argv[2];
const sites = readdirSync(path.join(root, 'sites')).filter(s => /^\d\d-/.test(s) && (!only || s.includes(only)));
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
for (const s of sites) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/sites/${s}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(s.includes('mosaic') || s.includes('receipt') ? 3200 : 2200);
  await p.screenshot({ path: path.join(root, 'thumbs', `${s}.jpg`), type: 'jpeg', quality: 72 });
  await p.close();
  console.log('thumb', s);
}
await b.close();
