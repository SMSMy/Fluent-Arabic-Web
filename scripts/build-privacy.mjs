/**
 * scripts/build-privacy.mjs — توليد صفحة الخصوصية من docs/PRIVACY.md
 *
 * المصدر الواحد هو `docs/PRIVACY.md` (وهو الرابط المُعلن في متجر كروم)، والصفحة
 * تُبنى منه آليًّا فلا تتفرّع النسختان: عدّل الـ Markdown ثم شغّل
 * `npm run build:privacy` (وهو يعيد بناء docs/site.css أيضاً لأن الصفحة تستخدم
 * أصناف Tailwind نفسها التي يستخدمها الموقع).
 *
 * واختبار في tests/docs-site.test.mjs يفشل إن اختلفت الصفحة عن ناتج التوليد.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT, readVersion, majorMinor } from './version.mjs';

const SOURCE = 'docs/PRIVACY.md';
const TARGET = 'docs/privacy.html';
const SITE_URL = 'https://smsmy.github.io/Fluent-Arabic-Web/';
const STORE_URL = 'https://chromewebstore.google.com/detail/fluent-arabic-web/gofhnecgeianjadhjmlkpmfjmflmolag';
const REPO_URL = 'https://github.com/SMSMy/Fluent-Arabic-Web';

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

const SHELL = `<!DOCTYPE html>
<!-- مُولَّد آليًّا من docs/PRIVACY.md — لا تُحرّر هذا الملف يدويًّا. شغّل: npm run build:privacy -->
<html class="dark" dir="rtl" lang="ar"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>سياسة الخصوصية — Fluent Arabic Web</title>
<meta name="description" content="سياسة خصوصية إضافة Fluent Arabic Web: صفر نداءات شبكة، صفر تتبّع، وشرح كل صلاحية وما يُحفظ على جهازك."/>
<meta name="theme-color" content="#07100d"/>
<link rel="canonical" href="__SITE__privacy.html"/>
<link rel="icon" type="image/png" href="assets/icon-128.png"/>
<link rel="apple-touch-icon" href="assets/icon-128.png"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="سياسة الخصوصية — Fluent Arabic Web"/>
<meta property="og:description" content="لا جمع بيانات، ولا نداء شبكة، وشرح كل صلاحية وما يُحفظ على جهازك."/>
<meta property="og:url" content="__SITE__privacy.html"/>
<meta property="og:image" content="__SITE__assets/store-banner.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="سياسة الخصوصية — Fluent Arabic Web"/>
<meta name="twitter:description" content="صفر نداءات شبكة · صفر تتبّع · رخصة MIT."/>
<meta name="twitter:image" content="__SITE__assets/store-banner.png"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&amp;family=Tajawal:wght@300;400;500;700;800;900&amp;display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="site.css"/>
</head>
<body class="font-sans antialiased bg-[#07100d] text-text-primary min-h-screen selection:bg-primary selection:text-on-primary relative overflow-x-hidden">
<!-- رموز الأيقونات: SVG مضمّن بدل خطّ أيقونات خارجي (لا طلبات شبكة ولا نصّ دخيل عند الحجب) -->
<svg width="0" height="0" class="hidden" aria-hidden="true" focusable="false">
  <defs>
    <g id="i-puzzle" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3a2 2 0 0 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 0 1 0 4h-1v3a1 1 0 0 1-1 1h-3v1a2 2 0 0 1-4 0v-1H6a1 1 0 0 1-1-1v-3H4a2 2 0 0 1 0-4h1V5a1 1 0 0 1 1-1h4z"/></g>
    <g id="i-check" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></g>
    <g id="i-check-circle" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></g>
    <g id="i-cross" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></g>
    <g id="i-ban" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></g>
    <g id="i-warning" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 4.3 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></g>
    <g id="i-verified" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/><path d="m9 12 2 2 4-4"/></g>
    <g id="i-shield-lock" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9.5a2 2 0 0 1 4 0V11"/></g>
    <g id="i-lock" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></g>
    <g id="i-cloud-off" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 8.2 4 4 0 0 1 17.5 18"/><path d="M3 3l18 18"/></g>
    <g id="i-database" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></g>
    <g id="i-eye-off" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 4l16 16"/></g>
    <g id="i-terminal" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/></g>
    <g id="i-download" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11"/><path d="m8 11 4 4 4-4"/><path d="M5 20h14"/></g>
    <g id="i-code" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 8-5 4 5 4M15 8l5 4-5 4"/></g>
    <g id="i-bug" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="7" width="8" height="12" rx="4"/><path d="M8 11H4M20 11h-4M8 16H5M19 16h-3M9 7 7.5 5M15 7l1.5-2"/></g>
    <g id="i-picker" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></g>
    <g id="i-tune" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></g>
    <g id="i-rule" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h7"/><circle cx="17" cy="16" r="3"/></g>
    <g id="i-save" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 2-2h9l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z"/><path d="M9 3v6h6V3M9 21v-6h6v6"/></g>
    <g id="i-font" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18 11 6l6 12M7.5 14h7"/><path d="M17 18h4"/></g>
    <g id="i-chevron-down" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></g>
    <g id="i-tool" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 1 0 5 5L21 12l-9 9-3-3 9-9z"/><path d="m6 18 3-3"/></g>
    <g id="i-laptop" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 19h20"/></g>
  </defs>
</svg>
<div class="fixed inset-0 pointer-events-none -z-10 bg-grid-technical opacity-80"></div>
<div class="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.14),transparent_80%)]"></div>

<aside class="w-full border-b border-border-subtle bg-surface-dim/95 text-[11px] font-mono text-text-muted py-1 px-4 tracking-wider flex items-center justify-between z-50 relative select-none">
  <div class="flex items-center gap-4">
    <span class="flex items-center gap-1.5 text-accent-mint font-semibold">
      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
      FAW · PRIVACY DOCUMENT
    </span>
    <span class="hidden md:inline text-text-muted/60">│</span>
    <span class="hidden md:inline">SOURCE: docs/PRIVACY.md</span>
  </div>
  <div class="flex items-center gap-4 text-text-muted">
    <span class="font-mono text-accent-mint/80 bg-surface-container px-2 py-0.5 rounded border border-border-subtle">MANIFEST V3 · MIT</span>
    <span class="hidden sm:inline">ZERO-TELEMETRY</span>
  </div>
</aside>

<header class="sticky top-0 inset-x-0 z-40 backdrop-blur-xl bg-surface-dim/85 border-b border-border-subtle">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
    <a class="flex items-center gap-3.5 group" href="./">
      <span class="w-9 h-9 rounded-lg bg-surface-container-high border border-border-strong flex items-center justify-center group-hover:border-primary transition-colors">
        <img src="assets/icon-128.png" width="128" height="128" alt="" class="w-6 h-6 rounded"/>
      </span>
      <span class="flex flex-col">
        <span class="flex items-center gap-2">
          <span class="font-bold text-base tracking-tight text-text-primary">Fluent Arabic Web</span>
          <span class="font-mono text-[10px] text-accent-mint px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">v__VERSION__</span>
        </span>
        <span class="font-mono text-[10px] text-text-muted tracking-tight">سياسة الخصوصية · Privacy Policy</span>
      </span>
    </a>
    <nav class="hidden lg:flex items-center gap-1 font-mono text-xs">
      <a class="px-3.5 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-surface-container transition-all" href="./">الصفحة الرئيسية</a>
      <a class="px-3.5 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-surface-container transition-all" href="PRIVACY.md">نسخة Markdown</a>
      <a class="px-3.5 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-surface-container transition-all" href="__REPO__" rel="noopener noreferrer" target="_blank">GitHub ↗</a>
      <a class="px-3.5 py-1.5 rounded-md text-text-secondary hover:text-white hover:bg-surface-container transition-all" href="__STORE__" rel="noopener noreferrer" target="_blank">تثبيت الإضافة ↗</a>
    </nav>
  </div>
</header>

<main class="w-full relative z-10 flex flex-col">

  <!-- الصدر: الميثاق والتحقق -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12 w-full">
    <div class="flex flex-wrap items-center justify-between gap-3 pb-5 mb-8">
      <div class="flex items-center gap-2.5">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-surface text-primary font-mono text-label-mono font-semibold">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          ZERO-NETWORK-SURFACE
        </span>
        <span class="font-mono text-caption text-text-muted">DOC_REF: PRIVACY_CHARTER_v__VERSION_MM__</span>
      </div>
      <div class="flex flex-wrap items-center gap-3 font-mono text-caption text-text-muted">
        <span>آخر تحديث: 15 أكتوبر 2026</span>
        <span>·</span>
        <span>ترخيص MIT المفتوح</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-8 space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-accent-mint font-mono text-label-mono">
          <svg class="text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-verified"/></svg>
          <span>ميثاق الأمان وسلامة البيانات</span>
        </div>
        <h1 class="text-headline-hero text-text-primary tracking-tight">
          لا نجمع أي بيانات.<br/>
          <span class="text-primary">ولا نرسل أي بايت خارج متصفحك.</span>
        </h1>
        <p class="text-body-lead text-text-muted max-w-2xl">
          وثيقة صريحة: لا خوادم وسيطة، ولا ملفات تعريف ارتباط، ولا تحليلات، ولا بصمات أجهزة. معالجة النص العربي تجري كاملةً
          داخل بيئة المتصفح المعزولة، والإعدادات تُحفظ في تخزين المتصفح على جهازك — وهذا الرابط نفسه هو المُعلن في صفحة المتجر.
        </p>
      </div>
      <div class="lg:col-span-4 bg-surface-container rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div class="flex items-center justify-between gap-2 pb-3">
          <span class="font-mono text-label-mono text-text-muted uppercase tracking-wider">التحقق البرمجي المباشر</span>
          <span class="px-2 py-0.5 rounded bg-primary/20 text-accent-mint font-mono text-caption font-bold">SAME SOURCE</span>
        </div>
        <p class="text-body-sm text-text-muted">
          هذه الصفحة مبنيّة آليًّا من ملفّ <code class="font-mono text-code-inline text-accent-mint">docs/PRIVACY.md</code> —
          فالنسخة المنشورة والنسخة التي يقرأها مدقّق المتجر واحدة.
        </p>
        <div class="flex flex-col gap-2 pt-2">
          <a class="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-headline-sm hover:brightness-105 transition-all shadow-md" href="__REPO__/blob/main/docs/PRIVACY.md" rel="noopener noreferrer" target="_blank">
            <svg class="text-lg w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-code"/></svg>
            <span>فحص النصّ على GitHub</span>
          </a>
          <button class="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-surface-solid text-text-primary font-mono text-caption hover:bg-surface-variant transition-colors" id="copy-btn" onclick="copyMarkdownDoc()" type="button">
            <svg class="text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-download"/></svg>
            <span id="copy-btn-text">نسخ نص Markdown للتدقيق</span>
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
      <div class="bg-surface-container rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
        <div class="flex items-center justify-between text-caption font-mono text-text-muted">
          <span>NETWORK CALLS</span>
          <svg class="text-primary text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-cloud-off"/></svg>
        </div>
        <span class="font-mono text-headline-md text-text-primary">0 Requests</span>
        <span class="text-caption text-accent-mint">No HTTP, WS, or Beacons</span>
      </div>
      <div class="bg-surface-container rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
        <div class="flex items-center justify-between text-caption font-mono text-text-muted">
          <span>STORAGE ENGINE</span>
          <svg class="text-primary text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-database"/></svg>
        </div>
        <span class="font-mono text-headline-md text-text-primary">chrome.storage</span>
        <span class="text-caption text-text-muted">Local / User-Managed Sync</span>
      </div>
      <div class="bg-surface-container rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
        <div class="flex items-center justify-between text-caption font-mono text-text-muted">
          <span>TRACKING / TELEMETRY</span>
          <svg class="text-primary text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-eye-off"/></svg>
        </div>
        <span class="font-mono text-headline-md text-text-primary">ZERO (0%)</span>
        <span class="text-caption text-accent-mint">No Analytics, No Ads SDK</span>
      </div>
      <div class="bg-surface-container rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
        <div class="flex items-center justify-between text-caption font-mono text-text-muted">
          <span>AUDIT STATUS</span>
          <svg class="text-primary text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-check-circle"/></svg>
        </div>
        <span class="font-mono text-headline-md text-text-primary">MV3 · MIT</span>
        <span class="text-caption text-text-muted">Published on Chrome Web Store</span>
      </div>
    </div>
  </section>

  <!-- تدقيق DRY-RUN -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
    <div class="bg-surface-code rounded-2xl overflow-hidden shadow-2xl">
      <div class="bg-surface-solid px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-error-container"></div>
          <div class="w-3 h-3 rounded-full bg-surface-variant"></div>
          <div class="w-3 h-3 rounded-full bg-primary/40"></div>
          <span class="font-mono text-caption text-text-muted mr-3">audit-cli — zero-network-assertion</span>
        </div>
        <span class="font-mono text-caption text-accent-mint bg-surface-container px-2.5 py-0.5 rounded-full">EXECUTION: DRY-RUN AUDIT</span>
      </div>
      <div class="p-6 font-mono text-code-block text-text-primary space-y-4">
        <div class="text-text-muted text-caption"># تحقّق بنفسك على الكود المصدري المستنسخ من GitHub:</div>
        <div class="bg-surface-container rounded-lg p-3 text-accent-mint flex flex-wrap items-center justify-between gap-2 select-all overflow-x-auto" dir="ltr">
          <code class="text-code-block">grep -rn "fetch(\\|XMLHttpRequest\\|WebSocket\\|sendBeacon" content.js background.js lib/ shadow-patch.js</code>
          <span class="text-caption text-text-muted font-sans font-normal">أمر الفحص الصريح</span>
        </div>
        <div class="text-text-muted text-caption space-y-1">
          <p class="text-primary flex items-center gap-2">
            <svg class="text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-terminal"/></svg>
            <span>Exit Code: 0 · Matches: 0 files · 0 lines · 0 bytes transmitted.</span>
          </p>
          <p class="text-text-muted pr-6">
            النتيجة فارغة تماماً: لا واجهة شبكة واحدة مدمجة في أي ملف تنفيذي يتبع الإضافة.
          </p>
        </div>
        <div class="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-surface-solid rounded-xl p-3 flex items-center gap-3">
            <svg class="text-error text-xl w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-cross"/></svg>
            <div>
              <div class="text-caption font-bold text-text-primary">HTTP Fetch / XHR</div>
              <div class="text-caption text-text-muted">غير موجود في الشيفرة</div>
            </div>
          </div>
          <div class="bg-surface-solid rounded-xl p-3 flex items-center gap-3">
            <svg class="text-error text-xl w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-cross"/></svg>
            <div>
              <div class="text-caption font-bold text-text-primary">WebSockets / SSE</div>
              <div class="text-caption text-text-muted">لا قنوات حيّة ولا خوادم ربط</div>
            </div>
          </div>
          <div class="bg-surface-solid rounded-xl p-3 flex items-center gap-3">
            <svg class="text-error text-xl w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-cross"/></svg>
            <div>
              <div class="text-caption font-bold text-text-primary">sendBeacon</div>
              <div class="text-caption text-text-muted">غير مستخدم إطلاقاً</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- الحدود: ما لا يخرج / ما يُحفظ -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
    <div class="mb-8">
      <h2 class="text-headline-lg text-text-primary">حدود حركة البيانات</h2>
      <p class="text-body-md text-text-muted">ما تلمسه الإضافة، وما لا تلمسه أبداً — على مستوى الشيفرة لا على مستوى الوعود.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-surface-container rounded-2xl p-6 flex flex-col justify-between shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-danger-surface text-danger-text">
              <svg class="text-2xl w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-shield-lock"/></svg>
            </span>
            <div>
              <h3 class="text-headline-sm text-text-primary">ما لا تفعله الإضافة مطلقاً</h3>
              <span class="font-mono text-caption text-danger-text">STRICTLY PROHIBITED BY ARCHITECTURE</span>
            </div>
          </div>
          <ul class="space-y-3 pt-3">
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-danger-text text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-ban"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">لا جمع لمحتوى النصوص أو العناوين</strong>
                <span class="text-text-muted text-body-sm">لا يُرسل نصّ صفحة، ولا عنوانها، ولا رابطها إلى أي جهة.</span>
              </div>
            </li>
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-danger-text text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-ban"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">لا بصمات أجهزة ولا ملفات ارتباط</strong>
                <span class="text-text-muted text-body-sm">لا Canvas Fingerprinting ولا أدوات تتبّع من أي نوع.</span>
              </div>
            </li>
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-danger-text text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-ban"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">لا حسابات ولا قواعد بيانات مركزية</strong>
                <span class="text-text-muted text-body-sm">لا تسجيل دخول، ولا كلمات سر، ولا قائمة زوار عندنا.</span>
              </div>
            </li>
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-danger-text text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-ban"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">لا بيع ولا استخدام لأغراض أخرى</strong>
                <span class="text-text-muted text-body-sm">لا تُستخدم البيانات لغير وظيفة الإضافة، ولا لتحديد الجدارة الائتمانية — وهذا نصّ إقرار المتجر.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div class="bg-surface-container rounded-2xl p-6 flex flex-col justify-between shadow-lg">
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-success-surface text-primary">
              <svg class="text-2xl w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-laptop"/></svg>
            </span>
            <div>
              <h3 class="text-headline-sm text-text-primary">ما يُحفظ حصراً على جهازك</h3>
              <span class="font-mono text-caption text-primary">MANAGED WITHIN LOCAL CHROME SANDBOX</span>
            </div>
          </div>
          <ul class="space-y-3 pt-3">
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-primary text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">تفضيلات الخطّ والحساسية</strong>
                <span class="text-text-muted text-body-sm">حالة التفعيل، وعتبة كشف العربية، والخطّ العربي المختار.</span>
              </div>
            </li>
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-primary text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">قوائم المواقع والمحدّدات</strong>
                <span class="text-text-muted text-body-sm">النطاقات المسموحة والممنوعة، والمحدّدات التي تلتقطها بنفسك.</span>
              </div>
            </li>
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-primary text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">مزامنة المتصفح (إن فعّلتها)</strong>
                <span class="text-text-muted text-body-sm">يتكفّل متصفحك بنقل التفضيلات بين أجهزتك، ولا تمرّ بنا.</span>
              </div>
            </li>
            <li class="flex items-start gap-3 bg-surface-solid rounded-xl p-3.5">
              <svg class="text-primary text-lg mt-0.5 w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>
              <div>
                <strong class="text-text-primary text-body-sm block">تصدير واستيراد محلي</strong>
                <span class="text-text-muted text-body-sm">ملفّ JSON أنت من يحفظه، وإلغاء التثبيت يحذف كل شيء.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- النصّ الكامل المُولَّد -->
  <section class="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
    <div class="mb-6">
      <h2 class="text-headline-lg text-text-primary">النصّ الكامل للسياسة</h2>
      <p class="text-body-md text-text-muted">
        مُولَّد آليًّا من <span class="isolate-bidi font-mono text-caption text-accent-mint">docs/PRIVACY.md</span> — وهو الملفّ
        الذي يشير إليه زرّ «privacy policy» في صفحة متجر كروم.
      </p>
    </div>
    <div class="bg-surface-solid border border-border-subtle rounded-2xl p-6 sm:p-8">
      <div class="policy">
__BODY__
      </div>
    </div>
  </section>

  <!-- الخاتمة -->
  <section class="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 w-full">
    <div class="rounded-2xl bg-surface-solid border border-border-strong p-8 sm:p-12 text-center shadow-2xl">
      <div class="inline-flex items-center gap-2 font-mono text-xs text-accent-mint px-3 py-1 rounded bg-surface-code border border-border-subtle mb-6">
        <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
        MIT OPEN SOURCE · AUDITABLE
      </div>
      <h2 class="text-headline-lg text-text-primary mb-4">لا تصدّق الوعد… اقرأ الشيفرة</h2>
      <p class="text-body-lead text-text-secondary max-w-2xl mx-auto mb-8">
        كل ما في هذه الصفحة يمكن التحقق منه بأمر واحد على نسخة المستودع. وإن وجدت أي مخالفة، فهي مسألة علنية في المستودع لا رسالة خاصة.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs">
        <a class="w-full sm:w-auto px-6 py-3.5 rounded bg-primary text-on-primary font-bold hover:bg-accent-mint transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_25px_-5px_rgba(78,222,163,0.5)]" href="__STORE__" rel="noopener noreferrer" target="_blank">
          <svg class="text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-puzzle"/></svg>
          <span>تثبيت الإضافة من المتجر</span>
        </a>
        <a class="w-full sm:w-auto px-6 py-3.5 rounded bg-surface-code hover:bg-surface-container border border-border-subtle text-text-primary font-semibold transition-all flex items-center justify-center gap-2 text-sm" href="__REPO__/issues" rel="noopener noreferrer" target="_blank">
          <svg class="text-base w-[1em] h-[1em] shrink-0 inline-block align-[-0.125em]" aria-hidden="true" focusable="false"><use href="#i-bug"/></svg>
          <span>الإبلاغ عن ملاحظة أمنية</span>
        </a>
      </div>
    </div>
  </section>
</main>

<footer class="w-full bg-surface-dim border-t border-border-subtle py-8 text-xs font-mono text-text-muted">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-text-primary font-bold">Fluent Arabic Web</span>
      <span>—</span>
      <span>MIT Open Source · v__VERSION__</span>
    </div>
    <div class="flex flex-wrap items-center gap-6">
      <a class="hover:text-primary transition-colors" href="./">الصفحة الرئيسية</a>
      <a class="hover:text-primary transition-colors" href="PRIVACY.md">النسخة النصية</a>
      <a class="hover:text-primary transition-colors" href="__REPO__/blob/main/CHANGELOG.md" rel="noopener noreferrer" target="_blank">Changelog</a>
      <a class="hover:text-primary transition-colors" href="__REPO__/issues" rel="noopener noreferrer" target="_blank">Issues</a>
      <span class="text-text-muted/60">© 2026</span>
    </div>
  </div>
</footer>

<script>
  // نسخ نصّ Markdown للتدقيق (يُجلب من الملف نفسه على الموقع)
  async function copyMarkdownDoc() {
    const label = document.getElementById('copy-btn-text');
    const original = label.innerText;
    try {
      const res = await fetch('PRIVACY.md', { cache: 'no-cache' });
      if (!res.ok) throw new Error('fetch failed');
      await navigator.clipboard.writeText(await res.text());
      label.innerText = 'تم نسخ النصّ ✓';
    } catch (err) {
      label.innerText = 'تعذّر النسخ — افتح PRIVACY.md';
    }
    setTimeout(() => { label.innerText = original; }, 2500);
  }
</script>
</body>
</html>
`;

/**
 * توليد صفحة HTML كاملة من نص سياسة الخصوصية (Markdown).
 * @param {string} markdown محتوى docs/PRIVACY.md
 * @returns {string} محتوى docs/privacy.html
 */
export function renderPrivacyHtml(markdown) {
  const version = readVersion();
  const blocks = toBlocks(markdown);

  // أول عنوان رئيسي بلا حروف عربية يبدأ القسم الإنجليزي ⇒ يُعرض LTR
  const ltrStart = blocks.findIndex((b) => /^<h1>(?![^<]*[\u0600-\u06FF])/.test(b));
  const arabic = ltrStart === -1 ? blocks : blocks.slice(0, ltrStart);
  const english = ltrStart === -1 ? [] : blocks.slice(ltrStart);

  const body = [
    arabic.map((b) => '        ' + b).join('\n'),
    english.length
      ? `        <section class="ltr-block" lang="en">\n${english.map((b) => '          ' + b).join('\n')}\n        </section>`
      : ''
  ]
    .filter(Boolean)
    .join('\n');

  return SHELL
    .replace('__BODY__', body)
    .replace(/__SITE__/g, SITE_URL)
    .replace(/__REPO__/g, REPO_URL)
    .replace(/__STORE__/g, STORE_URL)
    .replace(/__VERSION__/g, version)
    .replace(/__VERSION_MM__/g, majorMinor(version));
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
