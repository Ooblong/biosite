// Real email delivery through Resend (https://resend.com/docs). No credentials, no sending.
const API = () => process.env.RESEND_API_BASE || 'https://api.resend.com';
const hits = new Map();

export function configured() {
  const e = process.env;
  return { email: !!(e.RESEND_API_KEY && e.EMAIL_FROM), download: !!e.PRODUCT_DOWNLOAD_URL };
}

function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = Number(process.env.RATE_LIMIT_MAX || 8);
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > max;
}

const validEmail = s => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function resend(path, body, extra = {}) {
  return fetch(API() + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(body)
  });
}

async function addContact(email, marketing) {
  const segments = [];
  if (process.env.RESEND_NEWSLETTER_SEGMENT_ID) segments.push({ id: process.env.RESEND_NEWSLETTER_SEGMENT_ID });
  if (marketing && process.env.RESEND_MARKETING_SEGMENT_ID) segments.push({ id: process.env.RESEND_MARKETING_SEGMENT_ID });
  const r = await resend('/contacts', { email, unsubscribed: false, ...(segments.length ? { segments } : {}) });
  return r.ok || r.status === 409;      // already on the list still counts as subscribed
}

async function sendDownload(email) {
  const url = process.env.PRODUCT_DOWNLOAD_URL;
  const day = new Date().toISOString().slice(0, 10);
  const r = await resend('/emails', {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your My Photo Gallery download link',
    text: `Here is your download link for My Photo Gallery:\n\n${url}\n\nIt is a desktop app, so open this link on your computer.\n\nSairah González`,
    html: `<p>Here is your download link for My Photo Gallery:</p><p><a href="${esc(url)}">Download My Photo Gallery</a></p><p>It is a desktop app, so open this link on your computer.</p><p>Sairah González</p>`
  }, { 'Idempotency-Key': `download-${email}-${day}`.slice(0, 256) });
  return r.ok;
}

export async function subscribe({ email, kind, newsletter, marketing, website }, ip = 'local') {
  if (website) return [200, { ok: true, sent: false }];           // hidden field, only bots fill it
  if (limited(ip)) return [429, { ok: false, error: 'rate_limited' }];
  email = String(email || '').trim().toLowerCase();
  if (!validEmail(email)) return [400, { ok: false, error: 'invalid_email' }];
  if (!['download', 'newsletter'].includes(kind)) return [400, { ok: false, error: 'invalid_kind' }];

  const c = configured();
  if (!c.email || (kind === 'download' && !c.download)) return [503, { ok: false, error: 'not_configured' }];

  try {
    if (kind === 'newsletter') {
      const ok = await addContact(email, marketing === true);
      return ok ? [200, { ok: true, subscribed: true }] : [502, { ok: false, error: 'provider_error' }];
    }
    if (!(await sendDownload(email))) return [502, { ok: false, error: 'provider_error' }];
    let subscribed = false, subscribeFailed = false;
    if (newsletter === true) { subscribed = await addContact(email, false); subscribeFailed = !subscribed; }
    return [200, { ok: true, sent: true, subscribed, subscribeFailed }];
  } catch {
    return [502, { ok: false, error: 'provider_error' }];
  }
}
