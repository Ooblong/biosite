import { configured } from './_mail.js';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(configured()));
}
