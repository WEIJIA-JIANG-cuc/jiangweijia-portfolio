const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function safeHref(value) {
  if (typeof value !== 'string') return null;
  if (/^mailto:[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value)) return value;
  if (!value.startsWith('./content/')) return null;
  try {
    const path = decodeURIComponent(value);
    if (/[\u0000-\u001f\\?#]/.test(path) || path.split('/').slice(2).some(part => part === '..' || part === '.')) return null;
    return value;
  } catch { return null; }
}

function paired(value, className = 'copy') {
  if (!value?.zh) return '';
  return `<p class="${className}" lang="zh-CN">${escape(value.zh)}</p>`;
}

function linkMarkup(link) {
  const href = safeHref(link?.href);
  if (!href) return '';
  return `<a class="resource-link" href="${escape(href)}" target="_blank" rel="noopener noreferrer"><span lang="zh-CN">${escape(link.label?.zh || '查看原件')}</span><span aria-hidden="true">↗</span></a>`;
}

function frameMarkup(src, title, className) {
  const href = safeHref(src);
  if (!href || !href.endsWith('/index.html')) return '';
  return `<iframe class="original-frame ${className}" data-original-frame src="${escape(href)}" title="${escape(title)}" loading="lazy" referrerpolicy="same-origin"></iframe>`;
}

export function contentMarkup(record = {}, assets = {}) {
  const globalLinks = new Set((record.resources || []).map(link => link.href));
  const resources = (record.resources || []).map(linkMarkup).join('');
  const intro = paired(record.subtitle, 'subtitle') + paired(record.intro);
  const entries = (record.entries || []).map(entry => {
    const bullets = (entry.bullets || []).map(item => `<li>${paired(item)}</li>`).join('');
    const links = (entry.links || []).filter(link => !globalLinks.has(link.href)).map(linkMarkup).join('');
    return `<article class="case"><div class="case-heading"><h2 lang="zh-CN">${escape(entry.title?.zh)}</h2></div>${paired(entry.kind, 'case-kind')}${paired(entry.summary)}${bullets ? `<ul class="case-points">${bullets}</ul>` : ''}${links ? `<div class="resource-links">${links}</div>` : ''}</article>`;
  }).join('');
  let gallery = '';
  if (record.gallery) {
    const frame = frameMarkup(assets.views?.photography, '摄影瀑布流：悬停停驻，点击放大照片', 'photo-frame');
    if (frame) gallery = `<section class="photo-stage" aria-label="摄影作品"><p class="interaction-hint">悬停停驻 · 点击放大</p>${frame}</section>`;
  }
  let badge = '';
  if (record.badge) {
    const front = safeHref(assets.badge?.src), back = safeHref(assets.badge?.back);
    const frame = frameMarkup(assets.views?.badge, '可拖拽互动工牌', 'badge-frame');
    const faces = [front && {href:front,label:{zh:'正面'}},back && {href:back,label:{zh:'背面'}}].filter(Boolean).map(linkMarkup).join('');
    if (frame) badge = `<section class="badge-stage" aria-label="个人互动工牌"><p class="interaction-hint">拖动工牌 · 松手摆动</p>${frame}${faces ? `<details class="card-fallback"><summary>查看工牌正反面</summary><div class="resource-links">${faces}</div></details>` : ''}</section>`;
  }
  const originals = resources ? `<section class="originals" aria-label="原始资料"><h2>原始资料</h2><div class="resource-links">${resources}</div></section>` : '';
  const empty = !entries && !gallery && !badge && !resources ? '<p class="empty-state">暂无可展示的条目。</p>' : '';
  const visualContent = record.gallery ? gallery + originals : originals + gallery;
  return `<div class="reading-intro">${intro}</div>${visualContent}${badge}<div class="case-list">${entries}</div>${empty}`;
}
