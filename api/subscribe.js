import { subscribe } from './_mail.js';

// Works as a Vercel function and through the local server.js
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('{"ok":false}'); }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0];
  const [code, body] = await subscribe(req.body || {}, ip);
  res.statusCode = code;
  res.end(JSON.stringify(body));
}
