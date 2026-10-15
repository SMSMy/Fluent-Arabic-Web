/**
 * tests/docs-site.test.mjs — حراسة الصفحة الرئيسية على GitHub Pages
 *
 * الصفحة تُنشر من مجلد docs/ وحده، فأي مسار نسبي يخرج منه (مثل ../icons/x.png)
 * يعمل محلياً ويسقط على الموقع المنشور. هذه الاختبارات تمنع ذلك قبل الدفع.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readSource } from './read-source.mjs';
import { renderPrivacyHtml } from '../scripts/build-privacy.mjs';
import { renderSiteHtml } from '../scripts/build-site.mjs';
import { readVersion } from '../scripts/version.mjs';

const SITE_DIR = path.join(ROOT, 'docs');
const PAGE = readSource('docs/index.html');
const POLICY_PAGE = readSource('docs/privacy.html');
const SITE_URL = 'https://smsmy.github.io/Fluent-Arabic-Web/';

test('أرقام الإصدارات مؤتمتة: manifest هو المصدر، ولا رقم مكتوب بخطّ اليد', () => {
  const manifest = JSON.parse(readSource('manifest.json'));
  const pkg = JSON.parse(readSource('package.json'));
  assert.equal(readVersion(), manifest.version, 'readVersion يجب أن يقرأ من manifest.json');
  assert.equal(pkg.version, manifest.version, 'package.json و manifest.json يجب أن يتطابقا');
  for (const page of [PAGE, POLICY_PAGE]) {
    assert.ok(page.includes(manifest.version), `رقم الإصدار ${manifest.version} غائب عن إحدى الصفحات`);
  }
  // أي رقم إصدار آخر ظاهر في نصّ الصفحتين يعني بقايا بناء قديم (نُجرّد الوسوم
  // لأن مسارات SVG تحتوي سلاسل رقمية بنقاط)
  const visibleText = `${PAGE}\n${POLICY_PAGE}`.replace(/<[^>]*>/g, ' ');
  const stale = [...visibleText.matchAll(/\b\d+\.\d+\.\d+\b/g)]
    .map((m) => m[0])
    .filter((v) => v !== manifest.version);
  assert.deepEqual([...new Set(stale)], [], `أرقام إصدار قديمة باقية في الصفحات: ${stale.join(', ')}`);
});

test('الصفحتان تبنيان من قوالبهما بلا فروق (بناء حتمي)', () => {
  const siteSource = readSource('site/index.template.html');
  assert.equal(renderSiteHtml(siteSource, readVersion()), PAGE, 'docs/index.html قديم — شغّل: npm run build:docs');
  assert.equal(
    renderPrivacyHtml(readSource('docs/PRIVACY.md')),
    POLICY_PAGE,
    'docs/privacy.html قديم — شغّل: npm run build:docs'
  );
});

test('لا اعتماد على خطّ أيقونات خارجي (كان يُظهر أسماء الأيقونات كنصّ دخيل عند الحجب)', () => {
  for (const [name, page] of [['index.html', PAGE], ['privacy.html', POLICY_PAGE]]) {
    assert.ok(!/material-symbols|material_symbols/i.test(page), `docs/${name}: خطّ Material Symbols ما زال مستخدماً`);
    assert.ok(page.includes('id="i-check"'), `docs/${name}: sprite الأيقونات المضمّن مفقود`);
  }
});

test('docs/index.html: كل أصل محلي موجود داخل docs/ ولا يخرج منه', () => {
  const refs = [...PAGE.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const local = refs.filter((r) => !/^(?:https?:|mailto:|#|data:)/.test(r));
  assert.ok(local.length >= 5, 'الصفحة يجب أن تشير إلى أصولها المحلية');
  for (const rel of local) {
    assert.ok(!rel.includes('..'), `مسار خارج docs/ لن يعمل على GitHub Pages: ${rel}`);
    assert.ok(fs.existsSync(path.join(SITE_DIR, rel)), `أصل مفقود: docs/${rel}`);
  }
});

test('docs/index.html: وسوم المشاركة (OG/Twitter) بروابط مطلقة', () => {
  for (const key of ['og:image', 'og:url', 'twitter:image']) {
    const m = PAGE.match(new RegExp(`(?:property|name)="${key}"\\s+content="([^"]+)"`));
    assert.ok(m, `الوسم ${key} مفقود من الصفحة`);
    assert.ok(m[1].startsWith('https://'), `الوسم ${key} يجب أن يكون رابطاً مطلقاً`);
  }
  assert.ok(PAGE.includes('rel="canonical"'), 'وسم canonical مفقود');
  assert.match(PAGE, /<html[^>]*lang="ar"[^>]*>/, 'الصفحة يجب أن تبقى عربية: lang="ar"');
  assert.match(PAGE, /<html[^>]*dir="rtl"[^>]*>/, 'الصفحة يجب أن تبقى عربية: dir="rtl"');
});

test('docs/site.css: كل ملف خطّ مدمج مُشار إليه موجود فعلاً', () => {
  const css = readSource('docs/site.input.css');
  const refs = [...css.matchAll(/url\(['"]?(fonts\/[^'")]+)/g)].map((m) => m[1]);
  assert.ok(refs.length >= 9, 'يجب تعريف الخطوط التسعة المدمجة في مدخل Tailwind');
  for (const rel of refs) {
    assert.ok(fs.existsSync(path.join(SITE_DIR, rel)), `ملف خطّ مفقود: docs/${rel}`);
  }
  assert.ok(fs.existsSync(path.join(SITE_DIR, 'site.css')), 'docs/site.css مفقود — شغّل npm run build:site');
});

test('docs/index.html: روابط المتجر والمستودع وسجل التغييرات حاضرة', () => {
  assert.match(PAGE, /chromewebstore\.google\.com\/detail\/fluent-arabic-web/);
  assert.match(PAGE, /github\.com\/SMSMy\/Fluent-Arabic-Web/);
  assert.match(PAGE, /CHANGELOG\.md/);
});

test('manifest.json: الصفحة الرئيسية للإضافة تشير إلى موقع المشروع', () => {
  const manifest = JSON.parse(readSource('manifest.json'));
  assert.equal(manifest.homepage_url, SITE_URL);
});

test('docs/PRIVACY.md: سياسة الخصوصية منشورة ومربوطة من الصفحة', () => {
  const policyPath = path.join(SITE_DIR, 'PRIVACY.md');
  assert.ok(fs.existsSync(policyPath), 'docs/PRIVACY.md مفقود — رابط سياسة الخصوصية في متجر كروم يعتمد عليه');
  const policy = readSource('docs/PRIVACY.md');
  assert.ok(policy.length > 800, 'ملف السياسة أقصر من أن يكون سياسة كاملة');
  assert.match(policy, /سياسة الخصوصية/, 'النسخة العربية مفقودة');
  assert.match(policy, /Privacy Policy/, 'النسخة الإنجليزية مفقودة');
  assert.match(PAGE, /href="privacy\.html"/, 'الصفحة الرئيسية يجب أن تربط صفحة الخصوصية');
});

test('docs/privacy.html: الصفحة المنسَّقة مطابقة لناتج التوليد من PRIVACY.md', () => {
  const policyPath = path.join(SITE_DIR, 'PRIVACY.md');
  if (!fs.existsSync(policyPath)) return; // يغطّيه الاختبار السابق
  assert.ok(fs.existsSync(path.join(SITE_DIR, 'privacy.html')), 'docs/privacy.html مفقود — شغّل npm run build:privacy');
  const generated = renderPrivacyHtml(readSource('docs/PRIVACY.md'));
  const actual = readSource('docs/privacy.html');
  assert.equal(actual, generated, 'صفحة الخصوصية قديمة — شغّل: npm run build:privacy');
  assert.match(actual, /href="PRIVACY\.md"/, 'الصفحة المنسَّقة يجب أن تربط النسخة النصية');
});
