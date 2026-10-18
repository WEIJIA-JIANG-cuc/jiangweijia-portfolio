import {catalog} from './content.js';
import {safeHref} from './content-view.js';

const badge = {
  label: 'A LITTLE DISCOVERY', title: 'Hello, I’m Acha', badge: true,
  subtitle: {zh: '你发现了白鹡鸰藏着的小彩蛋', en: 'You found the wagtail’s little secret'},
  entries: [], resources: []
};

export function readingRecord(id) {
  if (id === 'Badge') return badge;
  if (!Object.hasOwn(catalog, id)) return null;
  return {...catalog[id], gallery: id === 'Photography'};
}

export function badgeView(asset, side = 'front') {
  const back = side === 'back', src = safeHref(back ? asset?.back : asset?.src);
  if (!src || !src.startsWith('./content/')) return null;
  return {src, alt: `${asset.alt?.zh || '个人联系工牌'} · ${back ? '背面' : '正面'} / ${asset.alt?.en || 'Personal contact card'} · ${back ? 'Back' : 'Front'}`};
}
