import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from './content.js';

// A missing renderer must not leave visitors without the seven public sections.
const {fallbackMarkup} = await import('./fallback-view.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});

test('fallback exposes all seven public sections when 3D is unavailable', () => {
  assert.equal(typeof fallbackMarkup, 'function', 'fallbackMarkup must exist');
  const html = fallbackMarkup(catalog);
  assert.deepEqual([...html.matchAll(/data-fallback-project="([^"]+)"/g)].map(match => match[1]),
    ['GameProduct', 'Photography', 'VibeCoding', 'Writing', 'Content', 'Experience', 'Contact']);
  assert.match(html, /Jiang Weijia/);
  assert.match(html, /当前浏览器无法显示3D小岛，仍可浏览完整作品。/);
});

test('fallback excludes private and unknown records', () => {
  assert.equal(typeof fallbackMarkup, 'function');
  const html = fallbackMarkup({...catalog, Badge: {title: 'Hidden badge'}, Unknown: {title: 'Unlisted project'}});
  assert.doesNotMatch(html, /Hidden badge|Unlisted project|data-fallback-project="Badge"/);
});

test('fallback escapes catalog text instead of injecting HTML', () => {
  assert.equal(typeof fallbackMarkup, 'function');
  const html = fallbackMarkup({...catalog, GameProduct: {title: '<img src=x onerror="alert(1)">&\'', subtitle: {zh: '<script>bad()</script>'}}});
  assert.doesNotMatch(html, /<img|<script>/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;&amp;&#39;/);
});
