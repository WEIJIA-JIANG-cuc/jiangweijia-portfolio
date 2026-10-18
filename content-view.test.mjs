import test from 'node:test';
import assert from 'node:assert/strict';
import { contentMarkup, safeHref } from './content-view.js';

const pair = (zh, en) => ({ zh, en });
const record = {
  subtitle: pair('项目概括', 'Project overview'), intro: pair('分析，不是实验结果。', 'Analysis, not experiment results.'),
  entries: [{ id: 'sort', title: pair('水排序', 'Water Sort'), kind: pair('个人研究', 'Independent study'),
    summary: pair('诊断关卡体验。', 'Diagnosing level experience.'), bullets: [pair('提出测试方案。', 'Proposed a test.')],
    links: [{ href: './content/files/portfolio.pdf', label: pair('阅读原件', 'Read original'), type: 'pdf' }] }], resources: [],
};

test('the reading body keeps Chinese cases and original links without duplicate English', () => {
  const html = contentMarkup(record, {});
  assert.match(html, /水排序/);
  assert.match(html, /提出测试方案。/);
  for (const text of ['Water Sort','Project overview','Independent study','Proposed a test.','Read original']) assert.ok(!html.includes(text), text);
  assert.doesNotMatch(html, /lang="en"/);
  assert.match(html, /href="\.\/content\/files\/portfolio\.pdf"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('provided source text is escaped rather than becoming executable markup', () => {
  const unsafe = structuredClone(record);
  unsafe.entries[0].title.zh = '<img src=x onerror=alert(1)>';
  unsafe.entries[0].summary.zh = 'A & B "quoted"';
  unsafe.entries[0].links[0].href = 'javascript:alert(1)';
  const html = contentMarkup(unsafe, {});
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /A &amp; B &quot;quoted&quot;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('local originals and email are allowed but traversal and executable links are rejected', () => {
  assert.equal(safeHref('./content/files/resume.pdf'), './content/files/resume.pdf');
  assert.equal(safeHref('mailto:jiangweijia_cuc@163.com'), 'mailto:jiangweijia_cuc@163.com');
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//example.com', './content/../app.js', './content/%2e%2e/app.js', './content/files/x%00.pdf']) {
    assert.equal(safeHref(href), null, href);
  }
});

test('photography mounts the isolated original waterfall instead of cropped fixed-size tiles', () => {
  const html = contentMarkup({ ...record, gallery: true, entries: [] }, {
    views: {photography:'./content/photography-wall/index.html'},
  });
  assert.match(html, /src="\.\/content\/photography-wall\/index\.html"/);
  assert.match(html, /title="摄影瀑布流/);
  assert.match(html, /loading="lazy"/);
  assert.doesNotMatch(html, /<figure|photo-gallery|lang="en"/);
});

test('the wagtail opens the original physical lanyard and keeps accessible original-face links', () => {
  const html = contentMarkup({ ...record, badge: true, entries: [] }, {
    badge: { src: './content/badge/front.png', back: './content/badge/back.png', alt: pair('原工作证', 'Original badge') },
    views: {badge:'./content/lanyard/index.html'},
  });
  assert.match(html, /src="\.\/content\/lanyard\/index\.html"/);
  assert.match(html, /title="可拖拽互动工牌"/);
  assert.match(html, /href="\.\/content\/badge\/front\.png"/);
  assert.match(html, /href="\.\/content\/badge\/back\.png"/);
  assert.doesNotMatch(html, /badge-image|data-badge-flip/);
});

test('an empty section has a readable Chinese-only state', () => {
  const html = contentMarkup({ entries: [], resources: [] }, {});
  assert.doesNotMatch(html, /No items available|lang="en"/);
  assert.match(html, /暂无可展示/);
  assert.doesNotMatch(html, /undefined|null/);
});

test('untrusted frame paths cannot inject an external or executable embed', () => {
  const html = contentMarkup({badge:true}, {views:{badge:'javascript:alert(1)'}});
  assert.doesNotMatch(html, /<iframe|javascript:/);
});

test('the photography entrance puts the picture wall ahead of document-download controls', () => {
  const html = contentMarkup({...record,gallery:true,resources:[{href:'./content/files/portfolio.pdf',label:pair('作品集','Portfolio')}]}, {views:{photography:'./content/photography-wall/index.html'}});
  assert.ok(html.indexOf('class="photo-stage"') < html.indexOf('class="originals"'));
});
