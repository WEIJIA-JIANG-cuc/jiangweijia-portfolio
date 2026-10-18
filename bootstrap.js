import {catalog} from './content.js';
import {readingRecord} from './reading.js';
import {contentMarkup} from './content-view.js';
import {assets} from './assets-manifest.js';
import {fallbackMarkup} from './fallback-view.js';

function showFallback() {
  const byId = id => document.getElementById(id);
  const loading = byId('loading');
  const preview = byId('preview');
  const workList = byId('work-list');
  let returnFocus = null;
  for (const id of ['world', 'leaders', 'portals', 'view-toggle', 'label']) byId(id).hidden = true;
  loading.hidden = false;
  loading.removeAttribute('role');
  Object.assign(loading.style, {display: 'block', overflow: 'auto', padding: '32px 20px', background: '#eaf1e9', boxSizing: 'border-box'});
  loading.innerHTML = fallbackMarkup(catalog);
  byId('retry').onclick = () => location.reload();

  function openProject(id) {
    const record = readingRecord(id);
    if (!record) return false;
    if (!preview.open) returnFocus = document.activeElement;
    byId('category').textContent = record.label;
    byId('title').textContent = record.title;
    workList.innerHTML = contentMarkup(record, assets);
    if (!preview.open) preview.showModal();
    byId('close').focus({preventScroll: true});
    workList.scrollTop = 0;
    return true;
  }

  function closePreview() {
    if (!preview.open) return;
    preview.close();
    workList.replaceChildren();
    returnFocus?.focus({preventScroll: true});
  }

  loading.addEventListener('click', event => {
    const button = event.target.closest('[data-fallback-project]');
    if (button && loading.contains(button)) openProject(button.dataset.fallbackProject);
  });
  byId('close').onclick = closePreview;
  byId('back').onclick = closePreview;
  byId('back').textContent = '返回作品集';
  preview.addEventListener('cancel', event => { event.preventDefault(); closePreview(); });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'portfolio-close') return;
    const frames = workList.querySelectorAll('[data-original-frame]');
    if ([...frames].some(frame => event.source === frame.contentWindow)) closePreview();
  });
  window.observatory = {ready: true, fallback: true, openProject};
}

import('./app.js').catch(showFallback);
