/* Tiny local static server that behaves like the live host: a missing URL answers 404 with /404.html.
   (VS Code "Live Server" can't do that - it prints "Cannot GET /...".)
   Run:  node dev-server.js        -> http://127.0.0.1:5501
         node dev-server.js 8080   -> another port
   No dependencies. Not used in production (Vercel serves 404.html by itself). */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2]) || 5501;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8',
};

const send404 = (res) => {
  const page = path.join(root, '404.html');
  res.writeHead(404, { 'content-type': types['.html'], 'cache-control': 'no-store' });
  fs.existsSync(page) ? fs.createReadStream(page).pipe(res) : res.end('404 Not Found');
};

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]); } catch (e) { return send404(res); }
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.resolve(path.join(root, rel));
  if (!file.startsWith(root + path.sep) && file !== root) return send404(res);          // no escaping the project folder
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';              // /results -> results.html
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send404(res);
    const type = types[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {                                               // videos need ranges to seek / loop
      const start = range[1] ? parseInt(range[1], 10) : Math.max(st.size - parseInt(range[2], 10), 0);
      const end = range[1] && range[2] ? Math.min(parseInt(range[2], 10), st.size - 1) : st.size - 1;
      res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1, 'cache-control': 'no-store' });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`Positiv dev server: http://127.0.0.1:${port}  (404 page: any missing URL, e.g. /nothing-here)`));
