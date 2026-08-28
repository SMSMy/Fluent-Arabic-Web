/**
 * tests/content-persite.test.mjs — اختبارات content.js: محددات perSite وطبيب الموقع
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupExtension, waitFor } from './helpers.mjs';

const PAGE_HTML = `
<html lang="en">
<head><title>Site</title></head>
<body>
  <div class="my-msg"><p>مرحبا بالعالم هذا نص عربي طويل للاختبار الآلي الشامل</p></div>
  <div class="other">Hello plain english</div>
</body>
</html>`;

const STORAGE = {
  fluentRTLSettings: {
    enabled: true,
    autoDetect: false,
    detectionThreshold: 0.15,
    font: 'default',
    customFonts: [],
    whitelist: [],
    blacklist: [],
    perSite: {
      'example.com': {
        enabled: true,
        selectors: [{ selector: '.my-msg', mode: 'auto' }]
      }
    }
  }
};

test('perSite selectors تُحقن كـ CSS عند التفعيل', async () => {
  const env = await setupExtension(PAGE_HTML, {
    url: 'https://example.com/page',
    storage: JSON.parse(JSON.stringify(STORAGE))
  });
  const { window } = env;

  await waitFor(() => window.document.getElementById('fluent-rtl-persite-style') !== null, 1500);
  const styleEl = window.document.getElementById('fluent-rtl-persite-style');
  assert.ok(styleEl, 'style#fluent-rtl-persite-style يجب أن يوجد');
  assert.match(styleEl.textContent, /\.my-msg\s*\{/);
  assert.match(styleEl.textContent, /unicode-bidi:\s*plaintext/);
  assert.match(styleEl.textContent, /text-align:\s*start/);

  // الإضافة مفعّلة فعلاً
  assert.equal(window.FluentRTL.isActive(), true);
  env.dom.window.close();
});

test('وضع rtl يولّد direction: rtl والوضع ltr يولّد استثناء', async () => {
  const storage = JSON.parse(JSON.stringify(STORAGE));
  storage.fluentRTLSettings.perSite['example.com'].selectors = [
    { selector: '.force', mode: 'rtl' },
    { selector: '.except', mode: 'ltr' }
  ];
  const env = await setupExtension(PAGE_HTML, {
    url: 'https://example.com/page',
    storage
  });
  const { window } = env;

  await waitFor(() => window.document.getElementById('fluent-rtl-persite-style') !== null, 1500);
  const css = window.document.getElementById('fluent-rtl-persite-style').textContent;
  assert.match(css, /\.force\s*\{\s*direction:\s*rtl/);
  assert.match(css, /\.except\s*\{\s*direction:\s*ltr/);
  env.dom.window.close();
});

test('deactivate يزيل style الـ perSite', async () => {
  const env = await setupExtension(PAGE_HTML, {
    url: 'https://example.com/page',
    storage: JSON.parse(JSON.stringify(STORAGE))
  });
  const { window } = env;

  await waitFor(() => window.document.getElementById('fluent-rtl-persite-style') !== null, 1500);
  assert.ok(window.document.getElementById('fluent-rtl-persite-style'));
  window.FluentRTL.deactivate();
  assert.equal(window.document.getElementById('fluent-rtl-persite-style'), null);
  env.dom.window.close();
});

test('#46: موت سياق الإضافة (Extension context invalidated) → انسحاب صامت وتنظيف', async () => {
  const env = await setupExtension(PAGE_HTML, {
    url: 'https://example.com/page',
    storage: JSON.parse(JSON.stringify(STORAGE))
  });
  const { window } = env;

  await waitFor(() => window.document.getElementById('fluent-rtl-base-css') !== null, 1500);
  assert.equal(window.FluentRTL.isActive(), true);

  // محاكاة إعادة تحميل الإضافة: سياق الكروم يموت
  window.chrome.runtime.id = undefined;
  window.chrome.runtime.getURL = function () { throw new Error('Extension context invalidated.'); };

  // أي mutation يُشغّل المراقب — يجب أن ينسحب بصمت وينظف أثره
  const el = window.document.createElement('div');
  window.document.body.appendChild(el);

  await waitFor(() => window.FluentRTL.isActive() === false, 1500);
  assert.equal(window.document.getElementById('fluent-rtl-base-css'), null, 'base css يُزال');
  assert.equal(window.document.getElementById('fluent-rtl-protection-css'), null);
  assert.equal(window.document.getElementById('fluent-rtl-fixes-css'), null);
  assert.equal(window.document.documentElement.classList.contains('fluent-rtl-active'), false);
  env.dom.window.close();
});
