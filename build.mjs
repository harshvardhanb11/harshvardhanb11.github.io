/* Zero-dependency static export. Run: node build.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'glossary.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'render.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'decisions.js'), 'utf8'), context);
const data = context.window.PORTFOLIO,
  terms = context.window.GLOSSARY,
  templates = context.window.PortfolioTemplates;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const site = process.env.SITE_URL?.replace(/\/$/, '');
if (site && !/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/[^\s?#]*)?$/i.test(site))
  throw new Error('SITE_URL must be an HTTPS URL without query or fragment.');
fs.mkdirSync(output, { recursive: true });
const files = [
  'index.html',
  'styles.css',
  'content.js',
  'glossary.js',
  'decisions.js',
  'render.js',
  'app.js',
  'lab-core.js',
  'labs.js',
  'visuals.js',
  'resume.html',
  '404.html',
  '.nojekyll',
  'detail.js',
];
for (const name of files) fs.copyFileSync(path.join(root, name), path.join(output, name));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
const date = new Date().toISOString().slice(0, 10);
if (site) {
  const notFound = path.join(output, '404.html');
  fs.writeFileSync(
    notFound,
    fs
      .readFileSync(notFound, 'utf8')
      .replace('href="/" id="home-link"', () => `href="${esc(site + '/')}" id="home-link"`),
  );
}
function page({
  title,
  description,
  content,
  rel = '../',
  urlPath = '',
  kind = 'article',
  socialImage = 'social-card.png',
}) {
  const canonical = site
    ? `<link rel="canonical" href="${esc(site + '/' + urlPath)}"><meta property="og:url" content="${esc(site + '/' + urlPath)}">`
    : '';
  const image = site
    ? `<meta property="og:image" content="${esc(site + '/assets/' + socialImage)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(title + ' — Harshvardhan Birla')}">`
    : '';
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101815"><title>${esc(title)} — Harshvardhan Birla</title><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)} — Harshvardhan Birla"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${kind}"><meta name="twitter:card" content="summary_large_image">${canonical}${image}<link rel="icon" href="${rel}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${rel}styles.css"><link rel="stylesheet" href="${rel}detail.css"><script src="${rel}detail.js" defer></script></head><body><a class="skip-link" href="#article-content">Skip to article</a><header class="site-header"><a class="wordmark" href="${rel}index.html"><span class="monogram">h<span>·</span>b</span><span class="wordmark-name">Harshvardhan<br><b>Birla</b></span></a><nav class="desktop-nav" aria-label="Primary"><a href="${rel}index.html#work">All projects</a><a href="${rel}index.html#playground">Playground</a><a href="${rel}index.html#glossary">Glossary</a></nav><div class="header-actions"><button class="icon-button" id="detail-theme" aria-label="Switch to light theme">◐</button><a class="underlined" href="mailto:harshvardhanb11@gmail.com">Say hello ↗</a></div></header><main class="standalone-main">${content}</main><footer class="site-footer section-shell"><a href="${rel}index.html">← Portfolio home</a><span>Harshvardhan Birla / Engineering the invisible</span><a href="${rel}index.html#contact">Contact ↗</a></footer></body></html>`;
}
const detailCSS = `.standalone-main{max-width:1140px;margin:auto}.standalone-main .reader-hero{padding-top:65px}.standalone-main .reader-hero h1{max-width:800px}.standalone-main .reader-toc{top:125px}.standalone-main .reader-layout{padding-bottom:80px}.standalone-main .reader-chapter{scroll-margin-top:120px}.detail-breadcrumb{font:9px var(--mono);color:var(--muted);margin-bottom:30px}.detail-breadcrumb a{text-decoration:none}.article-bottom{border-top:1px solid var(--line);padding-top:20px;margin-top:30px;font-size:11px;display:flex;justify-content:space-between;gap:25px}.detail-terms h3{font-size:11px;margin:15px 0 6px}.detail-terms p{font-size:11px!important}.standalone-main .note-body{max-width:850px}.project-at-glance{border-top:1px solid var(--line);padding-top:20px;margin-bottom:30px}.project-at-glance .eyebrow{font-size:8px;color:var(--accent);margin-bottom:10px}.project-at-glance p{font-size:13px;line-height:1.8;color:var(--muted)}@media(max-width:640px){.standalone-main .reader-hero{padding-top:35px}.article-bottom{font-size:10px}.standalone-main .reader-toc{display:none}.standalone-main .reader-layout{padding-bottom:45px}}`;
fs.writeFileSync(path.join(output, 'detail.css'), detailCSS);
for (let index = 0; index < data.projects.length; index++) {
  const p = data.projects[index],
    dir = path.join(output, 'projects', p.id);
  fs.mkdirSync(dir, { recursive: true });
  const next = data.projects[(index + 1) % data.projects.length];
  const glossary = terms.filter((t) => t.project === p.id).slice(0, 4);
  const content = `<header class="reader-hero"><div class="detail-breadcrumb"><a href="../../index.html">Home</a> / <a href="../../index.html#work">Work</a> / ${esc(p.short)}</div><p class="eyebrow">${p.number} / ${esc(p.type)} / ${esc(p.evidence)}</p><h1 id="article-title">${esc(p.name.replace('\n', ' '))}</h1><p class="reader-subtitle">${esc(p.subtitle)}</p><div class="reader-facts">${p.facts.map((f) => `<div><span>${esc(f[0])}</span><b>${esc(f[1])}</b></div>`).join('')}</div></header><div class="reader-layout"><aside class="reader-toc" aria-label="Article contents"><span>IN THIS STORY</span>${p.sections.map((s, i) => `<a href="#chapter-${i}">${esc(s[0])}</a>`).join('')}${p.repo ? `<a href="${data.github}/${p.repo}" target="_blank" rel="noopener noreferrer">Repository ↗</a>` : ''}</aside><article class="reader-article" id="article-content"><p class="reader-intro">${esc(p.intro)}</p><div class="project-at-glance"><p class="eyebrow">The practical idea</p><p>${esc(p.description)}</p></div>${templates.architecture(p.id)}${glossary.length ? `<details class="reader-terms detail-terms"><summary>Key terms in plain English <span>+</span></summary>${glossary.map((t) => `<h3>${esc(t.name)}</h3><p>${esc(t.definition)}</p>`).join('')}</details>` : ''}${p.sections.map((s, i) => `<section class="reader-chapter" id="chapter-${i}"><h2>${esc(s[0])}</h2><p>${esc(s[1])}</p></section>`).join('')}${templates.decisions(context.window.DESIGN_DECISIONS[p.id])}<blockquote class="reader-question">${esc(p.question)}</blockquote>${p.lab ? `<a class="button button-lime" href="../../index.html?lab=${p.lab}#playground">Explore the interactive lab ↗</a>` : ''}${p.sources.length ? `<section class="reader-sources"><h2>Go to the evidence</h2>${p.sources.map((s) => `<a href="${data.github}/${p.repo}/blob/main/${s[1]}" target="_blank" rel="noopener noreferrer">${esc(s[0])} ↗</a>`).join('')}</section>` : ''}<p class="reader-provenance">${esc(p.provenance)}</p><div class="article-bottom"><a href="../../index.html#work">← All projects</a><a href="../${next.id}/">Next: ${esc(next.short)} →</a></div></article></div>`;
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    page({
      title: p.short,
      description: p.description,
      rel: '../../',
      urlPath: `projects/${p.id}/`,
      socialImage: p.id + '-social.png',
      content,
    }),
  );
}
for (const n of data.notes) {
  const dir = path.join(output, 'notes', n.id);
  fs.mkdirSync(dir, { recursive: true });
  const content = `<header class="reader-hero"><div class="detail-breadcrumb"><a href="../../index.html">Home</a> / <a href="../../index.html#notes">Field notes</a></div><p class="eyebrow">${esc(n.category)}</p><h1>${esc(n.title)}</h1><p class="reader-subtitle">${esc(n.intro)}</p></header><article class="note-body" id="article-content">${n.paragraphs.map((p, i) => `<p${i === 0 ? ' class="reader-intro"' : ''}>${esc(p)}</p>`).join('')}<div class="article-bottom"><a href="../../index.html#notes">← All field notes</a><a href="../../projects/${n.related}/">Explore the related project ↗</a></div></article>`;
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    page({
      title: n.title,
      description: n.intro,
      rel: '../../',
      urlPath: `notes/${n.id}/`,
      content,
    }),
  );
}
function prerender(html, portable = false) {
  return html
    .replace(
      /(<div\b[^>]*\bid="project-grid"[^>]*>)\s*<\/div>/,
      (_, open) => open + templates.projects(data.projects, portable) + '</div>',
    )
    .replace(
      /(<div\b[^>]*\bid="notes-grid"[^>]*>)\s*<\/div>/,
      (_, open) => open + templates.notes(data.notes, portable) + '</div>',
    )
    .replace(
      /(<div\b[^>]*\bid="glossary-grid"[^>]*>)\s*<\/div>/,
      (_, open) => open + templates.glossary(terms, portable) + '</div>',
    );
}
let index = prerender(fs.readFileSync(path.join(output, 'index.html'), 'utf8'));
if (site)
  index = index.replace(
    '</head>',
    `<link rel="canonical" href="${esc(site + '/')}"><meta property="og:url" content="${esc(site + '/')}"><meta property="og:image" content="${esc(site + '/assets/social-card.png')}"></head>`,
  );
fs.writeFileSync(path.join(output, 'index.html'), index);
if (site) {
  const locations = [
    '',
    'resume.html',
    ...data.projects.map((p) => `projects/${p.id}/`),
    ...data.notes.map((n) => `notes/${n.id}/`),
  ];
  fs.writeFileSync(
    path.join(output, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map((p) => `<url><loc>${esc(site + '/' + p)}</loc><lastmod>${date}</lastmod></url>`).join('')}</urlset>`,
  );
  fs.writeFileSync(
    path.join(output, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`,
  );
} else {
  fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  for (const stale of ['sitemap.xml'])
    if (fs.existsSync(path.join(output, stale))) fs.unlinkSync(path.join(output, stale));
}
// Portable single-file version: no imports, fonts, images, build step, or server needed.
let portable = prerender(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), true);
for (const p of data.projects)
  portable = portable.replaceAll('href="projects/' + p.id + '/"', 'href="#project/' + p.id + '"');
portable = portable.replace(
  /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="styles\.css")[^>]*>/,
  () => `<style>${fs.readFileSync(path.join(root, 'styles.css'), 'utf8')}</style>`,
);
let inlineScripts = '<script>window.PORTABLE=true;</script>';
for (const name of [
  'content.js',
  'glossary.js',
  'decisions.js',
  'render.js',
  'app.js',
  'lab-core.js',
  'labs.js',
  'visuals.js',
]) {
  portable = portable.replace(`<script src="${name}" defer></script>`, '');
  inlineScripts += `<script>${fs.readFileSync(path.join(root, name), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`;
}
const favicon = fs.readFileSync(path.join(root, 'assets/favicon.svg'), 'utf8');
portable = portable.replace(
  'href="assets/favicon.svg"',
  `href="data:image/svg+xml,${encodeURIComponent(favicon)}"`,
);
const resumeJSON = JSON.stringify(fs.readFileSync(path.join(root, 'resume.html'), 'utf8')).replace(
  /</g,
  '\\u003c',
);
portable = portable.replace(
  '</body>',
  () =>
    `${inlineScripts}<script>(()=>{const resume=${resumeJSON};const self=location.href.split('#')[0].split('?')[0];const html=resume.replaceAll('href="index.html','href="'+self).replace('href="assets/favicon.svg"','href="data:image/svg+xml,${encodeURIComponent(favicon)}"');document.querySelectorAll('a[href="resume.html"]').forEach(a=>{a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));});})();</script></body>`,
);
fs.writeFileSync(path.join(root, 'Harshvardhan-Birla-Portfolio.html'), portable);
console.log(
  `Built ${data.projects.length} project pages, ${data.notes.length} articles, the deployment folder, and a portable single-file website.`,
);
console.log(
  site
    ? `Canonical URLs configured for ${site}`
    : 'No public URL configured. No deployment or publication is claimed.',
);
