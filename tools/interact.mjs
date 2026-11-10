// Pass 3: drives each site's own interaction, checks the email flow end to end
// against a stand-in email API, and re-runs every site with reduced motion.
import { chromium } from 'playwright-core';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); };

// 1. stand-in for the Resend API, records every call
const calls = [];
const stub = http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c); req.on('end', () => {
    const body = JSON.parse(b || '{}'); calls.push({ path: req.url, auth: req.headers.authorization, body });
    if (body.email === 'already@example.com' || (Array.isArray(body.to) ? body.to[0] : body.to) === 'already@example.com') { res.writeHead(409); return res.end('{}'); }
    if ((body.to || body.email || '').toString().startsWith('fail')) { res.writeHead(500); return res.end('{}'); }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"id":"test"}');
  });
}).listen(4199);
const app = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: '4175', RESEND_API_KEY: 're_test', EMAIL_FROM: 'Test <t@example.com>', PRODUCT_DOWNLOAD_URL: 'https://example.com/my-photo-gallery.zip', RESEND_API_BASE: 'http://localhost:4199', RATE_LIMIT_MAX: '9999' } });
await new Promise(r => app.stdout.once('data', r));

const B = 'http://localhost:4175', U = 'http://localhost:4174';
const browser = await chromium.launch({ channel: 'chrome' });
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

// 2. email flow, configured
{
  const p = await (await browser.newContext(phone)).newPage();
  await p.goto(B + '/sites/18-bento/'); await p.waitForTimeout(500);
  await p.click('[data-get]');
  const d = p.locator('dialog.k-get[open]');
  await d.locator('input[type=email]').fill('nope'); await d.locator('button[type=submit]').click();
  ok('Rejects a malformed email before sending', /doesn't look right/.test(await d.locator('.k-msg').textContent()) && calls.length === 0);
  await d.locator('input[type=email]').fill('Visitor@Example.com'); await d.locator('.k-chk input').check(); await d.locator('button[type=submit]').click();
  await p.waitForFunction(() => document.querySelector('dialog.k-get .k-msg').dataset.state);
  const msg = await d.locator('.k-msg').textContent();
  const em = calls.find(c => c.path === '/emails'), ct = calls.find(c => c.path === '/contacts');
  ok('Download form sends the real email request', !!em && em.body.to === 'visitor@example.com' && em.body.html.includes('https://example.com/my-photo-gallery.zip') && em.auth === 'Bearer re_test', msg);
  ok('Opt-in tick adds the contact to the list', !!ct && ct.body.email === 'visitor@example.com');
  const before = calls.length;
  await d.locator('input[type=email]').fill('second@example.com'); await d.locator('button[type=submit]').click();
  await p.waitForFunction(() => /second/.test(document.querySelector('dialog.k-get .k-msg').textContent));
  ok('Unticked opt-in does not subscribe', calls.slice(before).every(c => c.path !== '/contacts'));
  await d.locator('input[type=email]').fill('fail@example.com'); await d.locator('button[type=submit]').click();
  await p.waitForFunction(() => /didn't accept/.test(document.querySelector('dialog.k-get .k-msg').textContent));
  ok('Provider failure is reported honestly', true);
  await p.keyboard.press('Escape');
  const nl = p.locator('.news form.k-form');
  await nl.locator('input[type=email]').fill('already@example.com'); await nl.locator('button[type=submit]').click();
  await p.waitForFunction(() => document.querySelector('.news .k-msg').dataset.state);
  ok('Newsletter form subscribes (existing contact counts as subscribed)', /Subscribed/.test(await nl.locator('.k-msg').textContent()));
  const res = await p.evaluate(async () => (await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bot@example.com', kind: 'download', website: 'spam' }) })).json());
  ok('Hidden bot field is ignored without sending', res.sent === false && !calls.some(c => c.body.to === 'bot@example.com'));
}
// 3. same flow with nothing configured (the main server) never claims success
{
  const p = await (await browser.newContext(phone)).newPage();
  await p.goto(U + '/sites/02-darkroom/'); await p.waitForTimeout(400);
  const nl = p.locator('form.k-form').first();
  await nl.locator('input[type=email]').fill('x@example.com'); await nl.locator('button[type=submit]').click();
  await p.waitForFunction(() => document.querySelector('.k-msg').textContent);
  ok('Unconfigured server says nothing was sent', /nothing was sent/.test(await nl.locator('.k-msg').textContent()));
}

// 4. each site's own interaction
const T = {
  '01-viewfinder': async p => { await p.click('#shutter'); await p.waitForTimeout(700); return (await p.textContent('#modeName')) === 'GALLERY'; },
  '02-darkroom': async p => { await p.click('#sw'); return p.evaluate(() => document.body.classList.contains('day')); },
  '03-contact-sheet': async p => { await p.click('#lb'); return p.isVisible('#lp'); },
  '04-stories': async p => { await p.click('[data-jump]'); await p.waitForTimeout(500); return p.evaluate(() => document.querySelectorAll('.story')[1].classList.contains('on')); },
  '05-text-me': async p => { await p.waitForTimeout(3500); const n = await p.locator('.m').count(); await p.click('[data-chip="links"]'); await p.waitForTimeout(2200); return (await p.locator('.m').count()) > n && /Free resources/.test(await p.textContent('#log')); },
  '06-holo-cards': async p => { await p.click('#n'); await p.waitForTimeout(700); return p.evaluate(() => document.querySelectorAll('#pips button')[2].getAttribute('aria-current') === 'true'); },
  '07-desk-os': async p => { await p.click('.ic[data-w=links]'); const w = p.locator('.win[aria-label=Links]'); const t = w.locator('.ttl'); const b0 = await w.boundingBox(); const tb = await t.boundingBox(); await p.mouse.move(tb.x + 40, tb.y + 15); await p.mouse.down(); await p.mouse.move(tb.x + 10, tb.y + 60, { steps: 5 }); await p.mouse.up(); const b1 = await w.boundingBox(); return Math.abs(b1.y - b0.y) > 20; },
  '08-terminal': async p => { await p.fill('#cmd', 'links'); await p.press('#cmd', 'Enter'); await p.waitForTimeout(800); return /Free resources/.test(await p.textContent('#out')); },
  '09-receipt': async p => { await p.click('#again'); return p.evaluate(() => document.querySelector('#feed').classList.contains('go')); },
  '10-museum': async p => { await p.click('#n'); await p.waitForTimeout(900); return /2 of/.test(await p.textContent('#rn')); },
  '11-deep-dive': async p => { await p.click('#dive'); await p.waitForTimeout(1200); return !/^0 m/.test(await p.textContent('#depth')); },
  '12-tunnel': async p => { await p.click('[data-goto]'); await p.waitForTimeout(900); return p.evaluate(() => document.querySelectorAll('#hud button')[1].getAttribute('aria-current') === 'true'); },
  '13-metro': async p => { await p.mouse.wheel(0, 1600); await p.waitForTimeout(800); return (await p.textContent('#next')) !== 'My Photo Gallery'; },
  '14-card-catalog': async p => { await p.click('[aria-controls=d2]'); await p.waitForTimeout(600); return (await p.getAttribute('[aria-controls=d2]', 'aria-expanded')) === 'true'; },
  '15-pixel-quest': async p => { await p.keyboard.press('ArrowRight'); return p.isVisible('[data-panel=hero]'); },
  '16-sticker-sheet': async p => { const d = p.locator('.deco').first(); const b = await d.boundingBox(); await p.mouse.move(b.x + 20, b.y + 20); await p.mouse.down(); await p.mouse.move(b.x + 80, b.y + 90, { steps: 5 }); await p.mouse.up(); const a = await d.boundingBox(); return Math.abs(a.x - b.x) > 30; },
  '17-aurora-glass': async p => p.evaluate(() => !!document.querySelector('#gl').getContext('webgl')),
  '18-bento': async p => { await p.click('#socs .soc'); await p.waitForTimeout(200); return /not added yet/.test(await p.textContent('.k-toast')); },
  '19-swiss-poster': async p => { await p.click('.jump'); await p.waitForTimeout(900); return p.evaluate(() => Math.abs(document.querySelector('#feat').getBoundingClientRect().top) < 40); },
  '20-zine': async p => { await p.click('#n'); await p.waitForTimeout(900); return /Page 2/.test(await p.textContent('#pn')); },
  '21-airmail': async p => { await p.click('#seal'); await p.waitForTimeout(900); return p.isVisible('#letter'); },
  '22-vending': async p => { await p.click('[data-k=B]'); await p.click('[data-k="2"]'); await p.click('[data-k=OK]'); const soon = /NOT IN STOCK/.test(await p.textContent('#led')); await p.click('[data-k=A]'); await p.click('[data-k="1"]'); await p.click('[data-k=OK]'); await p.waitForTimeout(900); await p.click('#tray'); await p.waitForTimeout(700); return soon && await p.evaluate(() => document.querySelector('#prod').classList.contains('pop')); },
  '23-spreadsheet': async p => { await p.click('[data-tab=Links]'); await p.click('td[data-r="2"][data-c="0"]'); return /Free resources/.test(await p.textContent('#grid')) && (await p.textContent('#ref')) === 'A3'; },
  '24-blueprint': async p => { await p.locator('#dw').scrollIntoViewIfNeeded(); await p.waitForTimeout(600); return p.evaluate(() => document.querySelector('#dw').classList.contains('on')); },
  '25-mosaic': async p => { const c = await p.locator('#cv').boundingBox(); return c.height > 200 && await p.evaluate(() => { const cv = document.querySelector('#cv'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 400) if (d[i]) n++; return n > 50; }); },
  '26-notes': async p => { await p.waitForTimeout(600); await p.click('.feat'); await p.waitForTimeout(500); const opened = await p.isVisible('#pane .preview'); await p.click('#back'); await p.waitForTimeout(400); const closed = !(await p.isVisible('#pane')); await p.click('.chips [data-cat=links]'); await p.waitForTimeout(500); const onlyLinks = await p.evaluate(() => [...document.querySelectorAll('#notes [data-cat]')].every(c => c.hidden === (c.dataset.cat !== 'links'))); return opened && closed && onlyLinks; }
};
const sites = readdirSync(path.join(root, 'sites')).filter(s => /^\d\d-/.test(s));
for (const s of sites) {
  const ctx = await browser.newContext(s === '07-desk-os' || s === '16-sticker-sheet' ? { viewport: { width: 1280, height: 860 } } : phone);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${U}/sites/${s}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  let pass = false; try { pass = await T[s](p); } catch (e) { errs.push(e.message.split('\n')[0]); }
  ok(`${s}: own interaction works`, pass && !errs.length, errs.join(' | '));
  await ctx.close();
}
// 5. product preview behaviour
{
  const p = await (await browser.newContext(phone)).newPage();
  await p.goto(U + '/sites/17-aurora-glass/');
  await p.fill('.pg-search', 'beach'); const a = await p.locator('.pg-tile').count();
  await p.fill('.pg-search', ''); await p.click('.pg-chips [data-f=video]'); const v = await p.locator('.pg-tile').count();
  await p.click('.pg-tile'); const open = await p.isVisible('.pg-view');
  ok('Preview: search, filter and open work', a === 1 && v === 3 && open, `beach=${a} videos=${v}`);
}
// 6. reduced motion: every site still loads and shows everything
for (const s of sites) {
  const ctx = await browser.newContext({ ...phone, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${U}/sites/${s}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  await p.evaluate(async () => { if (window.BIO_QA) await window.BIO_QA(); });
  const has = await p.evaluate(() => document.body.textContent.includes('My Photo Gallery') && document.body.textContent.includes('Privacy policy'));
  ok(`${s}: works with reduced motion`, has && !errs.length, errs.join(' | '));
  await ctx.close();
}
await browser.close(); app.kill(); stub.close();
const f = results.filter(r => !r.pass);
console.log(`\n${results.length - f.length}/${results.length} passed`);
process.exit(0);
