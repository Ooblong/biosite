// Automated check of every site, on a phone and a desktop viewport.
// Usage: node tools/qa.mjs [filter] [--shots dir]
import { chromium } from 'playwright-core';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE || 'http://localhost:4173';
const args = process.argv.slice(2);
const filter = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--shots'));
const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
if (shotDir) mkdirSync(shotDir, { recursive: true });
const sites = readdirSync(path.join(root, 'sites')).filter(s => /^\d\d-/.test(s) && (!filter || s.includes(filter)));

const NEED = ['Sairah', 'My Photo Gallery', 'Free', 'Desktop only', 'Something new', 'Privacy policy', 'Get updates when new apps'];
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];

for (const site of sites) {
  for (const vp of [{ n: 'phone', width: 390, height: 844, mobile: true }, { n: 'desktop', width: 1440, height: 900 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const issues = [];
    page.on('pageerror', e => issues.push('JS error: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_NAME|fonts\.g|503/.test(m.text())) issues.push('console: ' + m.text().slice(0, 140)); });
    page.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) issues.push('request failed: ' + r.url()); });
    await page.goto(`${BASE}/sites/${site}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    if (shotDir) await page.screenshot({ path: path.join(shotDir, `${site}-${vp.n}.png`) });

    const over = await page.evaluate(() => {
      const w = innerWidth, out = [];
      if (document.scrollingElement.scrollWidth > w + 1) out.push('page scrolls sideways (' + document.scrollingElement.scrollWidth + 'px)');
      return out;
    });
    issues.push(...over);
    const small = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('a[href],button,input,[data-get]').forEach(el => {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (!r.width || cs.visibility === 'hidden' || el.closest('[inert],dialog,[aria-hidden=true]') || el.type === 'checkbox' || el.classList.contains('k-hp')) return;
        if (r.top > innerHeight * 3) return;
        if (r.height < 32 || r.width < 32) bad.push((el.textContent.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 24) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      return bad.slice(0, 6);
    });
    if (small.length) issues.push('small tap targets: ' + small.join(' | '));

    await page.evaluate(async () => { if (window.BIO_QA) await window.BIO_QA(); });
    await page.waitForTimeout(400);
    const text = await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('*')].map(e => e.textContent).join(' ').slice(0, 1e6));
    const missing = NEED.filter(s => !text.includes(s));
    if (missing.length) issues.push('missing content: ' + missing.join(', '));
    const parts = await page.evaluate(() => ({
      nl: document.querySelectorAll('form.k-form').length,
      get: document.querySelectorAll('[data-get],[data-run=get]').length,
      demo: document.querySelectorAll('.pg, [data-preview], .preview').length,
      priv: document.querySelectorAll('a[href$="privacy.html"]').length,
      soc: document.querySelectorAll('.k-soc').length
    }));
    if (!parts.nl) issues.push('no newsletter form');
    if (!parts.get) issues.push('no get-it button');
    if (!parts.demo) issues.push('no product preview');
    if (!parts.priv) issues.push('no privacy link');
    if (parts.soc < 3) issues.push('social links missing');

    // Real form round-trip through the download dialog
    let formResult = '';
    try {
      // pick a get-it button a real visitor could actually reach and tap
      const idx = await page.evaluate(() => [...document.querySelectorAll('[data-get]')].findIndex(b => {
        if (b.closest('[inert]')) return false;
        b.scrollIntoView({ block: 'center' });
        const r = b.getBoundingClientRect(); if (!r.width) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit && (hit === b || b.contains(hit));
      }));
      if (idx >= 0) await page.locator('[data-get]').nth(idx).click({ timeout: 3000 });
      else { issues.push('note: no tappable get-it button on first screen state, opened dialog directly'); await page.evaluate(() => BIO.openGet()); }
      const dlg = page.locator('dialog.k-get[open]');
      await dlg.waitFor({ timeout: 3000 });
      await dlg.locator('input[type=email]').fill('qa-test@example.com');
      await dlg.locator('button[type=submit]').click();
      await dlg.locator('.k-msg:not(:empty)').waitFor({ timeout: 5000 });
      formResult = await dlg.locator('.k-msg').textContent();
      if (shotDir && vp.mobile) await page.screenshot({ path: path.join(shotDir, `${site}-dialog.png`) });
    } catch (e) { issues.push('download dialog flow failed: ' + e.message.split('\n')[0]); }
    report.push({ site, vp: vp.n, issues, formResult });
    await ctx.close();
  }
}
await browser.close();
for (const r of report) console.log(`${r.issues.length ? '✗' : '✓'} ${r.site} [${r.vp}] ${r.issues.join(' ; ')}${r.formResult ? '' : ''}`);
const forms = [...new Set(report.map(r => r.formResult))];
console.log('form replies seen:', forms);
writeFileSync(path.join(root, 'tools', 'qa-report.json'), JSON.stringify(report, null, 2));
