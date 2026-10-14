/**
 * tests/translator-detector.test.mjs — اختبارات كشف تعريب صفحات المترجمات التلقائي
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs } from './helpers.mjs';

test('isPageTranslated: يكتشف كلاسات وسمات Google Translate و Edge', () => {
  const { window } = createDom('<html class="translated-rtl"><head></head><body><p>نص مترجم</p></body></html>');
  const FluentRTL = loadLibs(window);
  const detector = FluentRTL.detector;

  assert.equal(detector.isPageTranslated(), true, 'يجب أن يكتشف كلاس translated-rtl');
});

test('isLikelyArabicNativeSite: لا يعتبر الصفحة المترجمة موقعاً عربياً أصلياً', () => {
  // حتى مع وجود lang="ar" و dir="rtl" اللتين يضيفهما المترجم
  const { window } = createDom('<html class="translated-rtl" lang="ar" dir="rtl"><head></head><body><p>محتوى مترجم</p></body></html>');
  const FluentRTL = loadLibs(window);
  const detector = FluentRTL.detector;

  assert.equal(detector.isPageTranslated(), true);
  assert.equal(detector.isLikelyArabicNativeSite(), false, 'الصفحة المترجمة لا يجب أن تُعامل كموقع عربي أصلي');
  assert.equal(detector.shouldActivate(0.15), true, 'يجب السماح بتفعيل الإضافة على الصفحة المترجمة');
});

test('isPageTranslated: صفحة إنجليزية عادية بدون ترجمة ترجع false', () => {
  const { window } = createDom('<html lang="en"><head></head><body><p>Hello world</p></body></html>');
  const FluentRTL = loadLibs(window);
  const detector = FluentRTL.detector;

  assert.equal(detector.isPageTranslated(), false);
});

test('content.js: تفعيل تلقائي عند ترجمة صفحة إنجليزية لاحقاً عبر standby observer', async () => {
  const { setupExtension, waitFor } = await import('./helpers.mjs');
  const html = '<html lang="en"><head><title>English Page</title></head><body><p id="content">This is a pure english page</p></body></html>';
  const { window, FluentRTL } = await setupExtension(html);

  // في البداية الإضافة غير مفعّلة
  assert.equal(FluentRTL.isActive(), false, 'يجب أن تكون غير مفعّلة عند فتح صفحة إنجليزية');

  // محاكاة Google Translate: إضافة كلاس الترجمة وترجمة المحتوى
  window.document.documentElement.classList.add('translated-rtl');
  window.document.getElementById('content').textContent = 'هذا نص عربي مترجم بالكامل الآن في الصفحة';

  // انتظار التفعيل التلقائي عبر الـ standby observer
  const activated = await waitFor(() => FluentRTL.isActive(), 1500);
  assert.equal(activated, true, 'يجب أن تتفعل تلقائياً بعد ترجمة الصفحة دون الحاجة لإيقاف وتشغيل يدوي');
});

test('content.js: GitHub: تفعيل تلقائي وتطبيق اتجاه الـ README والقوائم عند ترجمة الصفحة إلى العربية', async () => {
  const { setupExtension, waitFor } = await import('./helpers.mjs');
  const html = `
    <html lang="en">
      <head><title>SMSMy/HaramLite</title></head>
      <body>
        <article class="markdown-body">
          <h1 id="title">HaramLite</h1>
          <p id="desc">HaramLite is an open-source tool.</p>
          <ul id="list">
            <li id="item1">First feature item</li>
            <li id="item2">Second feature item</li>
          </ul>
        </article>
      </body>
    </html>
  `;
  const { window, FluentRTL } = await setupExtension(html, { url: 'https://github.com/SMSMy/HaramLite' });

  // على جيت هب: يوجد site profile فتكون الإضافة نشطة بعد اكتمال init
  await waitFor(() => FluentRTL.isActive(), 500);
  assert.equal(FluentRTL.isActive(), true, 'الإضافة يجب أن تكون نشطة لوجود profile');
  const descEl = window.document.getElementById('desc');
  const listEl = window.document.getElementById('list');
  const item1El = window.document.getElementById('item1');

  assert.equal(descEl.hasAttribute('data-fluent-rtl-dir'), false, 'النص الإنجليزي في البداية لا يحمل علامة RTL');
  assert.equal(listEl.hasAttribute('data-fluent-rtl-dir'), false, 'القائمة الإنجليزية لا تحمل dir=rtl');

  // محاكاة Google Translate في المتصفح: إضافة translated-rtl وترجمة محتوى الـ README
  window.document.documentElement.classList.add('translated-rtl');
  window.document.documentElement.setAttribute('lang', 'ar');
  descEl.innerHTML = '<font>حرم لايت هي أداة مفتوحة المصدر وخفيفة جداً.</font>';
  item1El.innerHTML = '<font>الميزة الأولى: دعم كامل وسريع.</font>';

  // انتظار تطبيق bidiFix التلقائي بعد الترجمة دون الحاجة لإيقاف وتشغيل يدوي
  const appliedDesc = await waitFor(() => descEl.getAttribute('data-fluent-rtl-dir') === 'rtl', 1500);
  assert.equal(appliedDesc, true, 'يجب أن يُعالج وصف الـ README إلى RTL تلقائياً بعد الترجمة');

  const appliedList = await waitFor(() => listEl.getAttribute('data-fluent-rtl-dir') === 'rtl' && listEl.getAttribute('dir') === 'rtl', 1500);
  assert.equal(appliedList, true, 'يجب أن تنقلب القائمة إلى RTL تلقائياً بعد ترجمة عناصرها');

  // محاكاة التراجع إلى النص الأصلي (Show Original)
  window.document.documentElement.classList.remove('translated-rtl');
  window.document.documentElement.setAttribute('lang', 'en');
  descEl.textContent = 'HaramLite is an open-source tool.';
  item1El.textContent = 'First feature item';

  const revertedDesc = await waitFor(() => !descEl.hasAttribute('data-fluent-rtl-dir'), 1500);
  assert.equal(revertedDesc, true, 'عند التراجع للإنجليزية (Show Original) يجب إزالة علامات RTL');
});

