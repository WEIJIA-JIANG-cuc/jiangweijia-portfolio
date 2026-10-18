const publicProjects = [
  ['GameProduct', '游戏与产品'], ['Photography', '摄影'],
  ['VibeCoding', '创意编程'], ['Writing', '写作'],
  ['Content', '内容与运营'], ['Experience', '个人经历'], ['Contact', '联系我']
];
const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));

export function fallbackMarkup(catalog = {}) {
  const buttons = publicProjects.filter(([id]) => Object.hasOwn(catalog, id)).map(([id, label]) =>
    `<button type="button" data-fallback-project="${id}" style="text-align:left;background:#fffdf1;color:#234943;border:1px solid #d4e1d6;border-radius:10px;padding:18px;cursor:pointer"><strong style="display:block;font-size:17px">${label}</strong><span style="display:block;margin-top:6px">${escape(catalog[id]?.title)}</span></button>`
  ).join('');
  return `<section aria-label="作品集" style="width:min(720px,100%);margin:auto;color:#234943"><h1>Jiang Weijia</h1><p style="color:#234943">当前浏览器无法显示3D小岛，仍可浏览完整作品。</p><nav aria-label="作品集分类" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">${buttons}</nav><button id="retry" type="button">重新加载小岛</button></section>`;
}
