/**
 * scripts/build-privacy.mjs — توليد صفحة الخصوصية المنسَّقة من docs/PRIVACY.md
 *
 * المصدر الواحد هو `docs/PRIVACY.md` (وهو الرابط المُعلن في متجر كروم)، وهذه
 * الصفحة تُبنى منه آليًّا حتى لا تتفرّع النسختان: عدّل الـ Markdown ثم شغّل
 * `npm run build:privacy`. واختبار في tests/docs-site.test.mjs يفشل إن اختلفت
 * الصفحة عن ناتج التوليد.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'docs/PRIVACY.md';
const TARGET = 'docs/privacy.html';
const SITE_URL = 'https://smsmy.github.io/Fluent-Arabic-Web/';

const ARABIC = /[\u0600-\u06FF]/;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** تحويل التنسيق السطري: كود، عريض، روابط، وعناوين URL بين <> */
function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" rel="noopener">$1</a>');
}

function renderTable(rows) {
  const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const headHtml = head.map((c) => `<th>${inline(c)}</th>`).join('');
  const bodyHtml = body
    .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
    .join('\n');
  return `<table>\n<thead><tr>${headHtml}</tr></thead>\n<tbody>\n${bodyHtml}\n</tbody>\n</table>`;
}

/**
 * محوّل Markdown مختصر يغطّي ما يستخدمه ملف السياسة فعلاً:
 * عناوين، فقرات، قوائم، جداول، كتل كود، خط فاصل، وتنسيق سطري.
 * @param {string} markdown
 * @returns {string[]} كتل HTML بترتيبها
 */
function toBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;
  let table = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const tag = list.ordered ? 'ol' : 'ul';
      blocks.push(`<${tag}>\n${list.items.map((i) => `<li>${inline(i)}</li>`).join('\n')}\n</${tag}>`);
      list = null;
    }
  };
  const flushTable = () => {
    if (table) {
      blocks.push(renderTable(table));
      table = null;
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushTable();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      flushAll();
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        body.push(lines[i]);
        i += 1;
      }
      blocks.push(`<pre dir="ltr"><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushAll();
      blocks.push('<hr>');
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\|/.test(trimmed)) {
      flushParagraph();
      flushList();
      table = table || [];
      table.push(trimmed);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || ordered) {
      flushParagraph();
      flushTable();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((bullet || ordered)[1]);
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks;
}

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --bg: #07100d;
    --card: #101b18;
    --border: #1e2f29;
    --border-strong: #2b4239;
    --primary: #10b981;
    --primary-bright: #34d399;
    --on-primary: #04231a;
    --text: #eef5f2;
    --muted: #9fb4ac;
    --radius: 16px;
    --maxw: 820px;
  }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: radial-gradient(900px 420px at 50% -12%, rgba(16, 185, 129, 0.14), transparent 70%), var(--bg);
    color: var(--text);
    font-family: 'Tajawal', system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 17px;
    line-height: 1.9;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--primary-bright); }
  a:hover { color: #6ee7b7; }
  :focus-visible { outline: 3px solid var(--primary-bright); outline-offset: 3px; border-radius: 6px; }
  .wrap { width: 100%; max-width: var(--maxw); margin-inline: auto; padding-inline: 1.25rem; }
  .site-header {
    border-bottom: 1px solid var(--border);
    background: rgba(7, 16, 13, 0.86);
    backdrop-filter: blur(14px);
    position: sticky; top: 0; z-index: 10;
  }
  .site-header .wrap { display: flex; flex-wrap: wrap; gap: 0.6rem 1.25rem; align-items: center; justify-content: space-between; padding-block: 0.8rem; }
  .brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; color: var(--text); font-weight: 800; }
  .brand img { width: 34px; height: 34px; border-radius: 9px; }
  .header-links { display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; font-size: 0.92rem; }
  .header-links a { color: var(--muted); text-decoration: none; }
  .header-links a:hover { color: var(--text); }
  main { padding-block: clamp(2rem, 5vw, 3rem) 3.5rem; }
  .page-title { margin: 0 0 0.4rem; font-size: clamp(1.7rem, 4.4vw, 2.4rem); font-weight: 800; text-wrap: balance; }
  .page-meta { color: var(--muted); font-size: 0.95rem; margin: 0 0 1.5rem; }
  .notice {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: var(--radius);
    padding: 1rem 1.15rem;
    color: var(--muted);
    font-size: 0.95rem;
    margin-bottom: 2rem;
  }
  .notice strong { color: var(--text); }
  article h1 { font-size: clamp(1.45rem, 3.6vw, 1.9rem); margin: 2.25rem 0 0.75rem; font-weight: 800; }
  article h2 { font-size: clamp(1.25rem, 3vw, 1.55rem); margin: 2rem 0 0.6rem; font-weight: 800; color: var(--text); }
  article h3 { font-size: 1.1rem; margin: 1.6rem 0 0.5rem; font-weight: 700; }
  article p { margin: 0 0 1rem; }
  article ul, article ol { padding-inline-start: 1.5rem; margin: 0 0 1.15rem; }
  article li { margin-bottom: 0.45rem; }
  article strong { color: #ffffff; }
  article hr { border: 0; border-top: 1px solid var(--border); margin: 2.25rem 0; }
  article code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.88em;
    background: #0b1512;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.1rem 0.35rem;
    direction: ltr;
    unicode-bidi: isolate;
    display: inline-block;
  }
  article pre {
    direction: ltr;
    text-align: left;
    background: #060d0b;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.9rem 1rem;
    overflow-x: auto;
    margin: 0 0 1.25rem;
  }
  article pre code { background: none; border: 0; padding: 0; display: block; color: #cde7dd; font-size: 0.86rem; }
  article table { width: 100%; border-collapse: collapse; margin: 0 0 1.35rem; font-size: 0.95rem; }
  article th, article td { border: 1px solid var(--border); padding: 0.55rem 0.7rem; text-align: start; vertical-align: top; }
  article th { background: #0d1a16; font-weight: 700; }
  article td code { white-space: nowrap; }
  .ltr-block { direction: ltr; text-align: left; }
  footer.site-footer { border-top: 1px solid var(--border); padding-block: 1.75rem 2.25rem; color: var(--muted); font-size: 0.92rem; }
  footer.site-footer a { color: var(--muted); }
  footer.site-footer a:hover { color: var(--primary-bright); }
  footer.site-footer ul { list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; }
  @media print {
    body { background: #fff; color: #111; }
    .site-header, .notice, footer.site-footer { display: none; }
    article code, article pre, article th { background: #f4f4f4; border-color: #ccc; }
    a { color: #064e3b; }
  }
`;

/**
 * توليد صفحة HTML كاملة من نص سياسة الخصوصية (Markdown).
 * @param {string} markdown محتوى docs/PRIVACY.md
 * @returns {string} محتوى docs/privacy.html
 */
export function renderPrivacyHtml(markdown) {
  const blocks = toBlocks(markdown);

  // أول عنوان رئيسي بلا حروف عربية يبدأ القسم الإنجليزي ⇒ يُعرض LTR
  const ltrStart = blocks.findIndex((b) => /^<h1>(?![^<]*[\u0600-\u06FF])/.test(b));
  const arabic = ltrStart === -1 ? blocks : blocks.slice(0, ltrStart);
  const english = ltrStart === -1 ? [] : blocks.slice(ltrStart);

  const body = [
    arabic.join('\n'),
    english.length ? `<section class="ltr-block" lang="en">\n${english.join('\n')}\n</section>` : ''
  ]
    .filter(Boolean)
    .join('\n');

  return `<!DOCTYPE html>
<!-- مُولَّد آليًّا من docs/PRIVACY.md — لا تُحرّر هذا الملف يدويًّا. شغّل: npm run build:privacy -->
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>سياسة الخصوصية — Fluent Arabic Web</title>
<meta name="description" content="سياسة خصوصية إضافة Fluent Arabic Web: لا جمع بيانات، ولا نداء شبكة، وشرح كل صلاحية وما يُحفظ على جهازك.">
<meta name="theme-color" content="#07100d">
<link rel="canonical" href="${SITE_URL}privacy.html">
<link rel="icon" type="image/png" href="assets/icon-128.png">
<meta property="og:type" content="article">
<meta property="og:title" content="سياسة الخصوصية — Fluent Arabic Web">
<meta property="og:description" content="لا جمع بيانات، ولا نداء شبكة، وشرح كل صلاحية وما يُحفظ على جهازك.">
<meta property="og:url" content="${SITE_URL}privacy.html">
<meta property="og:image" content="${SITE_URL}assets/store-banner.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="./">
      <img src="assets/icon-128.png" width="128" height="128" alt="">
      <span>Fluent Arabic Web</span>
    </a>
    <nav class="header-links" aria-label="روابط">
      <a href="./">الصفحة الرئيسية</a>
      <a href="PRIVACY.md">نسخة Markdown</a>
      <a href="https://github.com/SMSMy/Fluent-Arabic-Web" rel="noopener">GitHub ↗</a>
      <a href="https://chromewebstore.google.com/detail/fluent-arabic-web/gofhnecgeianjadhjmlkpmfjmflmolag" rel="noopener">تثبيت الإضافة</a>
    </nav>
  </div>
</header>

<main class="wrap">
  <h1 class="page-title">سياسة الخصوصية</h1>
  <p class="page-meta">Fluent Arabic Web — إضافة المتصفح وموقع المشروع.</p>
  <p class="notice">
    <strong>الخلاصة:</strong> لا نجمع أي بيانات ولا نرسلها إلى أي مكان. هذه الصفحة مبنيّة آليًّا من
    <a href="PRIVACY.md">ملف السياسة</a> — وهو الرابط ذاته المُعلن في متجر كروم، فتجدان النسختان متطابقتين دائماً.
  </p>
  <article>
${body}
  </article>
</main>

<footer class="site-footer">
  <div class="wrap">
    <p style="margin: 0;">© 2026 Fluent Arabic Web — رخصة MIT. هذه الصفحة مُولَّدة من <a href="PRIVACY.md">docs/PRIVACY.md</a>.</p>
    <ul>
      <li><a href="./">الصفحة الرئيسية</a></li>
      <li><a href="PRIVACY.md">النسخة النصية</a></li>
      <li><a href="https://github.com/SMSMy/Fluent-Arabic-Web/blob/main/CHANGELOG.md" rel="noopener">سجل التغييرات</a></li>
      <li><a href="https://github.com/SMSMy/Fluent-Arabic-Web/issues" rel="noopener">المشاكل</a></li>
    </ul>
  </div>
</footer>
</body>
</html>
`;
}

function main() {
  const sourcePath = path.join(ROOT, SOURCE);
  const targetPath = path.join(ROOT, TARGET);
  const html = renderPrivacyHtml(fs.readFileSync(sourcePath, 'utf8'));
  fs.writeFileSync(targetPath, html, 'utf8');
  console.log(`[Privacy] ${SOURCE} -> ${TARGET} (${html.length} chars)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
