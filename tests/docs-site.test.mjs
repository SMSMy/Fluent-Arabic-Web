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

const SITE_DIR = path.join(ROOT, 'docs');
const PAGE = readSource('docs/index.html');
const SITE_URL = 'https://smsmy.github.io/Fluent-Arabic-Web/';

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
  assert.ok(PAGE.includes(`<html lang="ar" dir="rtl">`), 'الصفحة يجب أن تبقى عربية RTL');
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
