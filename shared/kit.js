/* Shared behaviour for all the sites: content binding, forms, product preview,
   dialogs. Each site brings its own design; this file holds the parts that must
   work the same everywhere. */
(function () {
  const S = window.SITE;
  const script = document.currentScript;
  const ROOT = script ? script.src.replace(/shared\/kit\.js.*$/, '') : '/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const get = p => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
  const asset = p => (/^(https?:|data:|\/)/.test(p) ? p : ROOT + p);

  /* ── icons ─────────────────────────────────────────── */
  const ICONS = {
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1.3" fill="currentColor"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M14 3c.4 3 2.4 5 5.5 5.3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>',
    facebook: '<path d="M13.5 21v-7.6h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H8v3h2.5V21z" fill="currentColor"/>'
  };
  const icon = (id, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[id] || ''}</svg>`;

  /* ── procedural sample pictures, used only in illustrative previews ── */
  const PAL = [
    ['#ffb36b', '#ff6f6f', '#ffe9b0', '#a14a6b', '#5b2a55', '#3a7ca5'],
    ['#9fd8ff', '#e8f6ff', '#fff6c9', '#7d9fb6', '#46627c', '#6aa8c9'],
    ['#2a2f6e', '#c75c8a', '#ffd9a0', '#3d2b63', '#1c1838', '#4a4f96'],
    ['#b8e8c6', '#fdf3bf', '#fffbe0', '#5fa374', '#2f6b52', '#7cc2b1'],
    ['#ffd1dc', '#fff0e0', '#ffffff', '#c98aa5', '#7b5a86', '#a6c6e0'],
    ['#f7a34b', '#ffdb70', '#fff4c4', '#c9702e', '#74391f', '#d9a050'],
    ['#123a5a', '#2e7ea1', '#e8f4f8', '#1b5772', '#0b2638', '#3fa6b8'],
    ['#dfe7ee', '#f7f9fb', '#ffffff', '#a4b6c6', '#6c8296', '#c7d5e0'],
    ['#ff8f5a', '#7a3f9a', '#ffe08a', '#47306f', '#1f1a3f', '#b0568c']
  ];
  function art(i, w = 320, h = 320) {
    const p = PAL[i % PAL.length]; let s = (i + 1) * 9301;
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const ridge = (base, amp) => {
      let d = `M0 ${h}`; const n = 7;
      for (let k = 0; k <= n; k++) d += ` L${(k / n * w).toFixed(0)} ${(base + (r() - .5) * amp).toFixed(0)}`;
      return d + ` L${w} ${h}Z`;
    };
    const id = `g${i}x${Math.floor(Math.random() * 1e6)}`;
    const sun = `<circle cx="${w * (.25 + r() * .5)}" cy="${h * (.22 + r() * .2)}" r="${h * (.09 + r() * .07)}" fill="${p[2]}"/>`;
    const water = i % 3 === 0 ? `<rect y="${h * .76}" width="${w}" height="${h * .24}" fill="${p[5]}"/><rect y="${h * .8}" x="${w * .2}" width="${w * .4}" height="2" fill="${p[2]}" opacity=".6"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>${sun}<path d="${ridge(h * .58, h * .3)}" fill="${p[3]}"/><path d="${ridge(h * .74, h * .22)}" fill="${p[4]}"/>${water}</svg>`;
  }
  const artUri = (i, w, h) => 'data:image/svg+xml,' + encodeURIComponent(art(i, w, h));

  /* ── avatar ────────────────────────────────────────── */
  function avatar(el) {
    const p = S.person;
    if (p.avatar) el.innerHTML = `<img src="${esc(asset(p.avatar))}" alt="${esc(p.name)}">`;
    else { el.textContent = p.initials; el.setAttribute('role', 'img'); el.setAttribute('aria-label', `${p.name}, profile picture placeholder`); }
  }

  /* ── links ─────────────────────────────────────────── */
  function link(l, inner, cls = '') {
    const c = esc(cls);
    if (l.action === 'get') return `<button type="button" class="${c}" data-get>${inner}</button>`;
    if (l.url) return `<a class="${c}" href="${esc(l.url)}" target="_blank" rel="noopener">${inner}</a>`;
    return `<span class="${c} is-soon" aria-disabled="true">${inner}</span>`;
  }
  function socials(el) {
    const labelled = el.dataset.soc === 'label';
    el.innerHTML = S.socials.map(s => {
      const inner = `${icon(s.id)}<span class="${labelled ? '' : 'k-vh'}">${esc(s.label)}</span>`;
      return s.url
        ? `<a class="k-soc" href="${esc(s.url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<button type="button" class="k-soc" data-unset="${esc(s.label)} link">${inner}</button>`;
    }).join('');
  }
  function buildingLink(el) {
    if (S.building.url) { el.href = S.building.url; el.target = '_blank'; el.rel = 'noopener'; }
    else el.hidden = true;
  }

  /* ── toast ─────────────────────────────────────────── */
  let toastT;
  function toast(msg) {
    let t = $('.k-toast');
    if (!t) { t = document.createElement('div'); t.className = 'k-toast'; t.setAttribute('role', 'status'); (openDlg() || document.body).append(t); }
    else (openDlg() || document.body).append(t);
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800);
  }
  const openDlg = () => $('dialog.k-dlg[open]');

  /* ── forms: real POST, honest outcomes ─────────────── */
  let n = 0;
  const FAIL = {
    not_configured: 'Not connected yet. Email delivery still needs setting up, so nothing was sent.',
    invalid_email: 'That email address doesn\'t look right. Check it and try again.',
    rate_limited: 'Too many tries. Wait a few minutes and try again.',
    provider_error: 'The email service didn\'t accept that. Nothing was sent. Try again in a moment.',
    offline: 'Couldn\'t reach the server, so nothing was sent. Check your connection and try again.'
  };
  function form(el, opts = {}) {
    const kind = opts.kind || el.dataset.form;
    const id = `k${++n}`;
    const dl = kind === 'download';
    const btn = opts.button || el.dataset.btn || (dl ? 'Email me the app' : 'Subscribe');
    const ph = opts.placeholder || el.dataset.ph || 'you@email.com';
    const opt = dl ? S.download.optIn : S.newsletter.consent;
    el.innerHTML = `<form class="k-form" novalidate>
      <div class="k-row">
        <label class="k-vh" for="${id}">Email address</label>
        <input class="k-in" id="${id}" type="email" name="email" required autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="${esc(ph)}">
        <button class="k-btn" type="submit">${esc(btn)}</button>
      </div>
      <label class="k-chk"><input type="checkbox" name="opt"><span>${esc(opt)}</span></label>
      <input class="k-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="k-msg" role="status" aria-live="polite"></p>
    </form>`;
    const f = $('form', el), msg = $('.k-msg', f), sub = $('.k-btn', f);
    const say = (t, state) => { msg.textContent = t; msg.dataset.state = state; };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say(FAIL.invalid_email, 'err'); f.email.focus(); return; }
      sub.disabled = true; sub.dataset.label = sub.textContent; sub.textContent = 'Sending…'; say('', '');
      try {
        const body = { email, kind, website: f.website.value };
        if (dl) body.newsletter = f.opt.checked; else { body.newsletter = true; body.marketing = f.opt.checked; }
        const r = await fetch(ROOT + 'api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok && (d.sent || d.subscribed)) {
          if (dl) say(d.subscribeFailed ? `Sent to ${email}, but the newsletter sign-up didn't go through.` : `Sent to ${email}. Open it on your computer.`, 'ok');
          else say(`Subscribed ${email}.`, 'ok');
          f.reset(); f.dispatchEvent(new CustomEvent('bio:success', { bubbles: true, detail: { kind, email } }));
        } else say(FAIL[d.error] || (r.status === 404 ? FAIL.not_configured : FAIL.provider_error), 'err');
      } catch { say(FAIL.offline, 'err'); }
      sub.disabled = false; sub.textContent = sub.dataset.label;
    });
  }

  /* ── product preview ───────────────────────────────── */
  const ITEMS = [
    ['beach-sunset.jpg', 'photo', 'Trips'], ['mountain-hike.mp4', 'video', 'Trips'], ['city-night.jpg', 'photo', 'Trips'],
    ['garden-morning.jpg', 'photo', 'Home'], ['birthday-cake.jpg', 'photo', 'Home'], ['desert-road.mp4', 'video', 'Trips'],
    ['lake-house.jpg', 'photo', 'Home'], ['snow-day.mp4', 'video', 'Home'], ['festival-lights.jpg', 'photo', 'Trips']
  ];
  function demo(el) {
    const shot = S.product.screenshot;
    el.classList.add('pg');
    if (shot) { el.innerHTML = `<img class="pg-shot" src="${esc(asset(shot))}" alt="${esc(S.product.name)} screenshot">`; return; }
    const stars = new Set([0, 6]);
    const st = { q: '', type: 'all', open: -1 };
    const uid = ++n;
    el.innerHTML = `<div class="pg-top"><span class="pg-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="pg-title">${esc(S.product.name)}</span><span class="pg-tag">Illustrative preview</span></div>
      <div class="pg-tools"><label class="k-vh" for="pgq${uid}">Search sample files</label><input class="pg-search" id="pgq${uid}" type="search" placeholder="Search, try “beach”" autocomplete="off">
      <div class="pg-chips" role="group" aria-label="Filter sample files">${[['all', 'All'], ['photo', 'Photos'], ['video', 'Videos'], ['star', 'Starred']].map(([v, t]) => `<button type="button" data-f="${v}" aria-pressed="${v === 'all'}">${t}</button>`).join('')}</div></div>
      <div class="pg-grid"></div><p class="pg-count" role="status"></p>
      <div class="pg-view" hidden></div>`;
    const grid = $('.pg-grid', el), count = $('.pg-count', el), view = $('.pg-view', el);
    function list() {
      return ITEMS.map((x, i) => ({ i, name: x[0], type: x[1], folder: x[2] })).filter(x =>
        (st.type === 'all' || (st.type === 'star' ? stars.has(x.i) : x.type === st.type)) &&
        (!st.q || (x.name + ' ' + x.folder).toLowerCase().includes(st.q)));
    }
    function draw() {
      const L = list();
      grid.innerHTML = L.map(x => `<div class="pg-cell"><button type="button" class="pg-tile" data-i="${x.i}" aria-label="Open ${esc(x.name)}">${art(x.i)}${x.type === 'video' ? '<span class="pg-play" aria-hidden="true">▶</span>' : ''}</button><button type="button" class="pg-star" data-s="${x.i}" aria-pressed="${stars.has(x.i)}" aria-label="Star ${esc(x.name)}">${stars.has(x.i) ? '★' : '☆'}</button></div>`).join('') || `<p class="pg-empty">No sample files match. Try “trips”.</p>`;
      count.textContent = `${L.length} of ${ITEMS.length} sample files`;
    }
    function show(i) {
      const x = ITEMS[i]; st.open = i;
      view.hidden = false;
      view.innerHTML = `<div class="pg-art">${art(i, 640, 420)}</div><div class="pg-meta"><strong>${esc(x[0])}</strong><span>${esc(x[2])} · ${x[1]}</span></div><button type="button" class="pg-close">Back to grid</button>`;
      $('.pg-close', view).focus();
    }
    el.addEventListener('input', e => { if (e.target.matches('.pg-search')) { st.q = e.target.value.trim().toLowerCase(); draw(); } });
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      e.stopPropagation();
      if (t.dataset.f) { st.type = t.dataset.f; $$('[data-f]', el).forEach(b => b.setAttribute('aria-pressed', b === t)); draw(); }
      else if (t.dataset.s) { const i = +t.dataset.s; stars.has(i) ? stars.delete(i) : stars.add(i); draw(); }
      else if (t.dataset.i) show(+t.dataset.i);
      else if (t.matches('.pg-close')) { view.hidden = true; st.open = -1; }
    });
    draw();
  }

  /* ── dialogs ───────────────────────────────────────── */
  function dlg(cls, html) {
    const d = document.createElement('dialog');
    d.className = 'k-dlg ' + cls;
    d.innerHTML = `<button type="button" class="k-x" aria-label="Close">×</button>${html}`;
    document.body.append(d);
    $('.k-x', d).onclick = () => d.close();
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    return d;
  }
  let getD, prevD;
  function openGet() {
    const p = S.product;
    if (!getD) {
      getD = dlg('k-get', `<p class="k-lab"><span class="k-free">${esc(p.price)}</span> ${esc(p.kind)}</p>
        <h2>${esc(p.name)}</h2><p>${esc(S.download.intro)}</p><div data-form="download"></div>
        <p class="k-note">${esc(p.compatNote)}</p>`);
      form($('[data-form]', getD));
    }
    getD.showModal();
  }
  function openPreview() {
    if (!prevD) { prevD = dlg('k-prev', `<div class="k-demo"></div><button type="button" class="k-btn k-wide" data-get>Get it free</button>`); demo($('.k-demo', prevD)); }
    prevD.showModal();
  }

  /* ── binding ───────────────────────────────────────── */
  function hydrate(root = document) {
    $$('[data-t]', root).forEach(el => { el.textContent = get(el.dataset.t) ?? ''; });
    $$('[data-av]', root).forEach(avatar);
    $$('[data-soc]', root).forEach(socials);
    $$('[data-build-link]', root).forEach(buildingLink);
    $$('[data-form]', root).forEach(el => { if (!el.firstChild) form(el); });
    $$('[data-demo]', root).forEach(el => { if (!el.firstChild) demo(el); });
    $$('[data-privacy]', root).forEach(a => { a.href = ROOT + 'privacy.html'; });
    $$('[data-contact]', root).forEach(a => {
      if (S.footer.email) a.href = 'mailto:' + S.footer.email;
      else { a.href = '#'; a.dataset.unset = 'Contact email'; }
    });
    $$('[data-details]', root).forEach(el => {
      el.hidden = !S.product.details.length;
      el.innerHTML = S.product.details.map(d => `<li>${esc(d)}</li>`).join('');
    });
    $$('[data-links]', root).forEach(el => {
      el.innerHTML = S.links.map(l => link(l, `<span class="k-l">${esc(l.label)}</span><span class="k-n">${esc(l.note)}</span>`, 'k-link' + (l.featured ? ' is-featured' : ''))).join('');
    });
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-get],[data-preview],[data-unset]');
    if (!t) return;
    if (t.dataset.unset) { e.preventDefault(); toast(`${t.dataset.unset} not added yet`); return; }
    if ('get' in t.dataset) { e.preventDefault(); if (prevD && prevD.open) prevD.close(); openGet(); }
    if ('preview' in t.dataset) { e.preventDefault(); openPreview(); }
  });

  window.BIO = { $, $$, esc, art, artUri, icon, link, form, demo, avatar, hydrate, toast, openGet, openPreview, reduced, ROOT, S };
  hydrate();
})();
