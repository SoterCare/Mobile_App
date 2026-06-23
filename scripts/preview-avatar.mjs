// Desktop preview for the patient avatar GLB — no phone/build needed.
// Run from the project root:  node scripts/preview-avatar.mjs
// Serves the project so the browser can load three.js (from node_modules) and
// the GLB (from assets/models), then opens scripts/avatar-preview.html.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { exec } from 'node:child_process';

const ROOT = process.cwd();
const PORT = 8090;
const PAGE = '/scripts/avatar-preview.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = PAGE;
    const filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT + sep)) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found: ' + req.url);
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}${PAGE}`;
  console.log('\n  ✅ Avatar preview running at:\n     ' + url + '\n');
  const cmd =
    process.platform === 'win32' ? `cmd /c start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => {});
});
