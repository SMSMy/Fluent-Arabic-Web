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

