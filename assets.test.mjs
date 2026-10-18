import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { open, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import { assets } from './assets-manifest.js';
import { catalog } from './content.js';

const localPaths = new Set();
function collect(value) {
  if (typeof value === 'string' && value.startsWith('./')) localPaths.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
collect(assets);
collect(catalog);

let child;
let port;
before(async () => {
  // Keep the actual HTTP handler; only substitute an ephemeral listening port.
  const bootstrap = `import http from 'node:http';
    const listen = http.Server.prototype.listen;
    http.Server.prototype.listen = function () {
      this.once('listening', () => console.log(this.address().port));
      return listen.call(this, 0, '127.0.0.1');
    };
    await import(${JSON.stringify(new URL('./server.mjs', import.meta.url).href)});`;
  child = spawn(process.execPath, ['--input-type=module', '-e', bootstrap], { stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stderr.on('data', chunk => { errors += chunk; });
  const ready = once(child.stdout, 'data').then(([chunk]) => { port = Number(String(chunk).trim()); });
  await Promise.race([ready, once(child, 'exit').then(() => { throw new Error(`Test server exited: ${errors}`); }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Test server startup timed out')), 5000); timer.unref(); })]);
  assert.ok(port > 0);
});
after(async () => {
  if (child && child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }
});

function request(path, method = 'HEAD') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(5000, () => req.destroy(new Error('HTTP request timed out')));
    req.on('error', reject);
    req.end();
  });
}

test('all local catalog and manifest resources exist as nonempty files', async () => {
  assert.equal(localPaths.size, 18);
  for (const href of localPaths) {
    const info = await stat(new URL(href, import.meta.url));
    assert.ok(info.isFile() && info.size > 0, href);
  }
});

test('four PDFs and ten images contain actual format headers', async () => {
  const media = [...Object.values(assets.files), assets.badge.src, assets.badge.back, ...assets.gallery.map(item => item.src)];
  assert.equal(Object.keys(assets.files).length, 4);
  assert.equal(media.length, 14);
  for (const href of media) {
    const file = await open(new URL(href, import.meta.url), 'r');
    try {
      const bytes = Buffer.alloc(8);
      await file.read(bytes, 0, bytes.length, 0);
      if (href.endsWith('.pdf')) assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', href);
      else if (href.endsWith('.png')) assert.equal(bytes.toString('hex'), '89504e470d0a1a0a', href);
      else assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff', href);
    } finally { await file.close(); }
  }
});

test('HTTP HEAD serves every referenced asset with its browser-readable MIME and size', async () => {
  const expected = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', html: 'text/html; charset=utf-8' };
  for (const href of localPaths) {
    const response = await request(new URL(href, 'http://localhost/').pathname);
    assert.equal(response.status, 200, href);
    assert.equal(response.headers['content-type'], expected[href.split('.').at(-1)], href);
    assert.equal(Number(response.headers['content-length']), (await stat(new URL(href, import.meta.url))).size, href);
    assert.equal(response.body.length, 0, href);
  }
});

test('HTTP GET preserves health and local demo delivery', async () => {
  const health = await request('/health', 'GET');
  assert.equal(health.body.toString(), 'observatory-v10');
  const demo = await request('/content/demos/oc-dice.html', 'GET');
  assert.equal(demo.status, 200);
  assert.match(demo.body.toString(), /<!doctype html>/i);
});

test('GitHub project subpaths serve the entry page and real GLB', async () => {
  const page = await request('/jiangweijia-portfolio/', 'GET');
  assert.equal(page.status, 200);
  assert.match(page.body.toString(), /<!doctype html>/i);
  const model = await request('/jiangweijia-portfolio/assets/island.glb', 'HEAD');
  assert.equal(model.status, 200);
  assert.equal(model.headers['content-type'], 'model/gltf-binary');
});

test('encoded traversal cannot escape the V8 root', async () => {
  for (const href of ['/%2e%2e%2fserver.mjs', '/%2e%2e%5cserver.mjs', '/%2e%2e%5cweb-v8-sibling%5cserver.mjs']) {
    assert.equal((await request(href)).status, 403, href);
  }
});

test('malformed and null-byte paths return 400 without crashing the service', async () => {
  for (const href of ['/%ZZ', '/content/%00.pdf']) assert.equal((await request(href)).status, 400, href);
  assert.equal((await request('/health')).status, 200);
});
