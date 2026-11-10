// Local server, no dependencies. Run with: node server.js
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(root, '.env'))) {
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const { default: subscribe } = await import('./api/subscribe.js');
const { default: status } = await import('./api/status.js');

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json'
};
const port = Number(process.env.PORT || 4173);

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/status') return status(req, res);
  if (url.pathname === '/api/subscribe') {
    let raw = '';
    for await (const c of req) { raw += c; if (raw.length > 4096) break; }
    try { req.body = JSON.parse(raw || '{}'); } catch { req.body = {}; }
    return subscribe(req, res);
  }
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  const rel = file.slice(root.length);
  if (!file.startsWith(root) || /^[\\/](api|tools|\.env|server\.js|package\.json)/.test(rel)) { res.writeHead(403); return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
}).listen(port, () => console.log(`Gallery running: http://localhost:${port}`));
