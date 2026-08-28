/**
 * tests/content-aistudio.test.mjs — اختبارات المقاومة للتطبيقات الديناميكية
 * (Angular hydration يعيد كتابة dir ويمسح الأنماط بعد ثانية تقريباً)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupExtension, waitFor } from './helpers.mjs';

const AISTUDIO_HTML = `
<html lang="en">
<head><title>AI Studio fixture</title></head>
<body>
  <main>
    <div class="user-prompt-container">
      <p id="main-p">مرحبا، هذا نص عربي طويل يشرح الفرق بين الاتجاهين في الصفحات الحديثة ويدرس الاحتمالات الممكنة</p>
    </div>
    <div class="text-wrapper">
      <p id="second-p">هنا رد النموذج باللغة العربية بوضوح تام ليكون الاختبار قادراً على التمييز</p>
      <ul id="list-ul"><li>عنصر قائمة عربي أول</li><li>عنصر قائمة عربي ثان</li></ul>
      <pre><code>const x = 5; // code stays LTR</code></pre>
    </div>
  </main>
</body>
</html>`;

const STORAGE = {
  fluentRTLSettings: {
    enabled: true,
    autoDetect: true,
    detectionThreshold: 0.15,
    font: 'default',
    customFonts: [],
    whitelist: [],
    blacklist: [],
    perSite: {}
  }
};

test('المعالجة الأساسية: النص العربي يُفعَّل وقائمة ul تنقلب', async () => {
  const env = await setupExtension(AISTUDIO_HTML, {
    url: 'https://aistudio.google.com/prompts/xyz',
    storage: JSON.parse(JSON.stringify(STORAGE))
  });
  const { window } = env;

  await waitFor(() => window.document.getElementById('main-p').getAttribute('data-fluent-rtl-dir') === 'rtl', 2000);
  assert.equal(window.document.getElementById('main-p').getAttribute('dir'), 'rtl');
  await waitFor(() => window.document.getElementById('list-ul').getAttribute('dir') === 'rtl', 2000);
  assert.ok(window.document.getElementById('fluent-rtl-site-profile'), 'CSS الـ profile يجب أن يُحقن');
  env.dom.window.close();
});

test('#38: إذا أعاد التطبيق كتابة dir="ltr" نعيد فرض قيمة علامتنا', async () => {
  const env = await setupExtension(AISTUDIO_HTML, {
    url: 'https://aistudio.google.com/prompts/xyz',
    storage: JSON.parse(JSON.stringify(STORAGE))
  });
  const { window } = env;
  const p = window.document.getElementById('main-p');

  await waitFor(() => p.getAttribute('data-fluent-rtl-dir') === 'rtl', 2000);
  assert.equal(p.getAttribute('dir'), 'rtl');

  // محاكاة Angular hydration: يعيد كتابة dir ويحذف style
  p.setAttribute('dir', 'ltr');
  p.style.removeProperty('unicode-bidi');

  // انتظار دورة الـ MutationObserver (debounce streaming = 100ms)
  await waitFor(() => p.getAttribute('dir') === 'rtl', 1500);
  assert.equal(p.getAttribute('dir'), 'rtl', 'يجب أن يعود dir إلى rtl');
  assert.equal(p.style.getPropertyValue('unicode-bidi'), 'isolate', 'يجب استعادة unicode-bidi');
  env.dom.window.close();
});

test('#39: إذا حذف التطبيق نمط الـ profile يُعاد حقنه تلقائياً', async () => {
  const env = await setupExtension(AISTUDIO_HTML, {
    url: 'https://aistudio.google.com/prompts/xyz',
    storage: JSON.parse(JSON.stringify(STORAGE))
  });
  const { window } = env;

  await waitFor(() => window.document.getElementById('fluent-rtl-site-profile') !== null, 1500);

  // التطبيق يحذف النمط (تنظيف head)
  const removed = window.document.getElementById('fluent-rtl-site-profile');
  removed.remove();
  assert.equal(window.document.getElementById('fluent-rtl-site-profile'), null);

  // أي تغيير في body يُشغّل فحص السلامة
  const trigger = window.document.createElement('div');
  window.document.body.appendChild(trigger);

  await waitFor(() => window.document.getElementById('fluent-rtl-site-profile') !== null, 1500);
  assert.ok(window.document.getElementById('fluent-rtl-site-profile'), 'يجب إعادة حقن النمط');
  env.dom.window.close();
});
