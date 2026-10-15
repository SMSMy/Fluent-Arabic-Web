/**
 * scripts/build-privacy.mjs — توليد صفحة الخصوصية المنسَّقة من docs/PRIVACY.md
 *
 * المصدر الواحد هو `docs/PRIVACY.md` (وهو الرابط المُعلن في متجر كروم)، وهذه
 * الصفحة تُبنى منه آليًّا حتى لا تتفرّع النسختان: عدّل الـ Markdown ثم شغّل
 * `npm run build:privacy`. واختبار في tests/docs-site.test.mjs يفشل إن اختلفت
 * الصفحة عن ناتج التوليد.
 *
 * الهوية البصرية هنا هي هوية الموقع: ورق كريمي وحبر أخضر، بلا ظلال ولا زوايا مدوّرة.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'docs/PRIVACY.md';
const TARGET = 'docs/privacy.html';
const SITE_URL = 'https://smsmy.github.io/Fluent-Arabic-Web/';

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
      blocks.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
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
    --paper: #f7f2e8;
    --paper-2: #efe7d7;
    --ink: #1b2a24;
    --ink-2: #3f5249;
    --muted: #6d7c74;
    --green: #0f5132;
    --green-tint: #e3ece5;
    --rust: #9a3b1f;
    --rule: rgba(27, 42, 36, 0.18);
    --rule-2: rgba(27, 42, 36, 0.45);
    --measure: 66ch;
  }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background-color: var(--paper);
    color: var(--ink);
    font-family: 'Amiri', 'Times New Roman', Times, serif;
    font-size: 19px;
    line-height: 1.9;
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: "";
    position: fixed; inset: 0; z-index: 3; pointer-events: none;
    opacity: 0.16; mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E");
  }
  img { max-width: 100%; height: auto; }
  a { color: var(--green); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.22em; }
  a:hover { color: var(--ink); text-decoration-thickness: 2px; }
  :focus-visible { outline: 2px dashed var(--rust); outline-offset: 3px; }
  .sheet { position: relative; z-index: 2; width: 100%; max-width: 900px; margin-inline: auto; padding-inline: clamp(1.1rem, 4vw, 2.5rem); }

  .masthead { position: sticky; top: 0; z-index: 10; background: var(--paper); border-bottom: 3px double var(--rule-2); }
  .masthead-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem 1.5rem; padding-block: 0.85rem 0.5rem; }
  .wordmark { display: inline-flex; align-items: center; gap: 0.6rem; font-family: 'Amiri', serif; font-weight: 700; font-size: 1.3rem; line-height: 1; color: var(--ink); text-decoration: none; }
  .wordmark img { width: 30px; height: 30px; border-radius: 2px; }
  .wordmark:hover { color: var(--green); }
  .edition { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.06em; color: var(--muted); }
  .masthead-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 1.1rem; padding-block: 0.35rem 0.6rem; border-top: 1px solid var(--rule); font-family: 'Reem Kufi', sans-serif; font-size: 0.88rem; }
  .masthead-nav a { color: var(--ink-2); text-decoration: none; }
  .masthead-nav a:hover { color: var(--green); text-decoration: underline; text-decoration-thickness: 2px; }
  .masthead-nav .sep { color: var(--rule-2); }

  main { padding-block: clamp(2rem, 5vw, 3.2rem) 0; }
  .kicker { font-family: 'Reem Kufi', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--rust); margin: 0 0 0.75rem; }
  h1.page-title { font-size: clamp(1.9rem, 5vw, 2.9rem); line-height: 1.3; font-weight: 700; margin: 0 0 0.6rem; text-wrap: balance; }
  .doc-dateline { display: flex; flex-wrap: wrap; gap: 0.3rem 1.2rem; padding-block: 0.7rem; border-block: 1px solid var(--rule); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 1.8rem; }
  .doc-dateline span { direction: ltr; unicode-bidi: isolate; }
  .note { background: var(--paper-2); border-inline-start: 3px solid var(--green); padding: 1rem 1.15rem; margin-bottom: 2rem; font-size: 0.98rem; color: var(--ink-2); }
  .note p { margin: 0; }

  article h1 { font-size: clamp(1.4rem, 3.6vw, 1.9rem); font-weight: 700; margin: 2.4rem 0 0.8rem; padding-top: 0.6rem; border-top: 2px solid var(--rust); }
  article h2 { font-size: clamp(1.25rem, 3vw, 1.55rem); font-weight: 700; margin: 2rem 0 0.6rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--rule-2); }
  article h3 { font-size: 1.12rem; font-weight: 700; margin: 1.5rem 0 0.4rem; }
  article p { margin: 0 0 1rem; max-width: var(--measure); }
  article ul, article ol { padding-inline-start: 1.4rem; margin: 0 0 1.15rem; max-width: var(--measure); }
  article li { margin-bottom: 0.4rem; }
  article strong { font-weight: 700; }
  article hr { border: 0; border-top: 1px solid var(--rule); margin: 2.2rem 0; }
  article code { font-family: 'JetBrains Mono', monospace; font-size: 0.84em; background: rgba(27, 42, 36, 0.07); border: 0; padding: 0 0.22rem; direction: ltr; unicode-bidi: isolate; }
  article pre { margin: 0 0 1.25rem; padding: 0.85rem 1rem; background: var(--paper-2); border: 1px solid var(--rule-2); overflow-x: auto; direction: ltr; text-align: left; }
  article pre code { background: none; border: 0; padding: 0; display: block; font-size: 0.78rem; line-height: 1.75; }
  article table { width: 100%; border-collapse: collapse; margin: 0 0 1.4rem; font-size: 0.98rem; }
  article th, article td { text-align: start; padding: 0.6rem 0.8rem; border-bottom: 1px solid var(--rule); vertical-align: top; }
  article th { font-weight: 700; border-bottom: 2px solid var(--rule-2); }
  article td code { white-space: nowrap; }

  .ltr-block { direction: ltr; text-align: left; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 3px double var(--rule-2); }
  .ltr-block article, .ltr-block h1 { border-top: 0; }

  .colophon { margin-top: clamp(3rem, 7vw, 4.5rem); border-top: 3px double var(--rule-2); padding-block: 1.6rem 3rem; color: var(--ink-2); font-size: 0.95rem; }
  .colophon ul { list-style: none; display: flex; flex-wrap: wrap; gap: 0.3rem 1.1rem; margin: 0.6rem 0 0; padding: 0; font-family: 'Reem Kufi', sans-serif; font-size: 0.86rem; }
  .colophon .imprint { font-style: italic; color: var(--muted); font-size: 0.92rem; margin: 1rem 0 0; }

  @media print {
    body { background: #fff; font-size: 11pt; }
    body::before, .masthead, .colophon ul { display: none; }
    a { color: #000; text-decoration: none; }
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
<meta name="theme-color" content="#f7f2e8">
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
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Reem+Kufi:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>
<header class="masthead">
  <div class="sheet">
    <div class="masthead-top">
      <a class="wordmark" href="./">
        <img src="assets/icon-128.png" width="128" height="128" alt="">
        <span>Fluent Arabic Web</span>
      </a>
      <p class="edition">وثيقة — سياسة الخصوصية · الإصدار 4.3.0</p>
    </div>
    <nav class="masthead-nav" aria-label="روابط">
      <a href="./">الصفحة الرئيسية</a><span class="sep">·</span>
      <a href="PRIVACY.md">نسخة Markdown</a><span class="sep">·</span>
      <a href="https://github.com/SMSMy/Fluent-Arabic-Web" rel="noopener">GitHub ↗</a><span class="sep">·</span>
      <a href="https://chromewebstore.google.com/detail/fluent-arabic-web/gofhnecgeianjadhjmlkpmfjmflmolag" rel="noopener">التثبيت من المتجر ↗</a>
    </nav>
  </div>
</header>

<main class="sheet">
  <p class="kicker">وثيقة</p>
  <h1 class="page-title">سياسة الخصوصية</h1>
  <div class="doc-dateline">
    <span>FLUENT ARABIC WEB · BROWSER EXTENSION</span>
    <span>MIT LICENSE</span>
    <span>NO NETWORK CALLS</span>
  </div>
  <div class="note">
    <p>
      <strong>الخلاصة:</strong> لا نجمع أي بيانات ولا نرسلها إلى أي مكان. وهذه الصفحة مبنيّة آليًّا من
      <a href="PRIVACY.md">ملفّ السياسة</a> — وهو الرابط ذاته المُعلن في متجر كروم، فتجدان النسختين متطابقتين دائماً.
    </p>
  </div>
  <article>
${body}
  </article>
</main>

<footer class="colophon">
  <div class="sheet">
    <ul>
      <li><a href="./">الصفحة الرئيسية</a></li>
      <li><a href="PRIVACY.md">النسخة النصية</a></li>
      <li><a href="https://github.com/SMSMy/Fluent-Arabic-Web/blob/main/CHANGELOG.md" rel="noopener">سجلّ التغييرات</a></li>
      <li><a href="https://github.com/SMSMy/Fluent-Arabic-Web/issues" rel="noopener">المشاكل</a></li>
    </ul>
    <p class="imprint">مُولَّد من docs/PRIVACY.md — لا تُحرّره يدويًّا. طُبعت بـ Amiri وReem Kufi. © 2026 — رخصة MIT.</p>
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
