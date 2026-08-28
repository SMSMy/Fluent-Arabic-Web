/**
 * tests/bidi-fix.test.mjs — اختبارات معالجة الاتجاه على صفحة ثابتة (fixture شبيه بقروك)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs, waitFor } from './helpers.mjs';

const GROK_FIXTURE = `
<html lang="en">
<head><title>Grok fixture</title></head>
<body>
  <div class="message-bubble">
    <p id="arabic-msg">مرحبا بالعالم، هذا رد طويل باللغة العربية يشرح الفكرة بوضوح تام.</p>
  </div>
  <div class="message-bubble">
    <p id="english-msg">Hello world, this is a plain English message.</p>
  </div>
  <div class="response-content-markdown">
    <p id="mixed-msg">هذا رد عربي مع كود</p>
    <pre id="code-block"><code>if (x) { return y; }</code></pre>
    <p id="katex-line" class="katex">x = \\frac{a}{b} عربي</p>
    <p id="flex-line" style="display:flex">نص داخل flex لا يجب لمسه</p>
    <blockquote id="quote">اقتباس عربي طويل بما يكفي للاختبار الحقيقي هنا</blockquote>
    <ul><li id="list-item">عنصر قائمة عربي واضح ومفهوم للاختبار</li></ul>
  </div>
</body>
</html>`;

const { window } = createDom(GROK_FIXTURE, { url: 'https://grok.com/chat' });
const FluentRTL = loadLibs(window);
const bidiFix = FluentRTL.bidiFix;

async function runApply() {
  await new Promise((resolve) => {
    bidiFix.apply(window.document, resolve);
    // مهلة أمان إذا لم يستدعِ rAF الـ callback
    setTimeout(resolve, 300);
  });
}

test('النص العربي يحصل على dir=rtl مع marker', async () => {
  await runApply();
  const p = window.document.getElementById('arabic-msg');
  assert.equal(p.getAttribute('dir'), 'rtl');
  assert.equal(p.getAttribute('data-fluent-rtl-dir'), 'rtl');
});

test('النص الإنجليزي الخالص لا يُلمس', async () => {
  await runApply();
  const p = window.document.getElementById('english-msg');
  assert.equal(p.hasAttribute('data-fluent-rtl-dir'), false);
  assert.equal(p.hasAttribute('dir'), false);
});

test('كتلة الكود تبقى LTR وغير معالجة', async () => {
  await runApply();
  const pre = window.document.getElementById('code-block');
  assert.equal(pre.hasAttribute('data-fluent-rtl-dir'), false);
  assert.equal(pre.hasAttribute('dir'), false);
});

test('كلاسات katex مستثناة حتى مع وجود عربي', async () => {
  await runApply();
  const el = window.document.getElementById('katex-line');
  assert.equal(el.hasAttribute('data-fluent-rtl-dir'), false);
});

test('عنصر flex (inline) لا يُلمس — حماية التخطيط', async () => {
  await runApply();
  const el = window.document.getElementById('flex-line');
  assert.equal(el.hasAttribute('data-fluent-rtl-dir'), false);
});

test('الاقتباس وعناصر القائمة العربية تُعالج', async () => {
  await runApply();
  assert.equal(window.document.getElementById('quote').getAttribute('data-fluent-rtl-dir'), 'rtl');
  assert.equal(window.document.getElementById('list-item').getAttribute('data-fluent-rtl-dir'), 'rtl');
});

test('ul/ol المحتوية عربي تنقلب إلى dir=rtl (النقاط لليمين)', async () => {
  const container = window.document.createElement('div');
  container.innerHTML =
    '<ul id="test-ul"><li><p>عنصر أول بالعربية</p></li><li><p>عنصر ثانٍ بالعربية</p></li></ul>' +
    '<ol id="test-ol"><li><p>مرقّم أول بالعربية</p></li><li><p>مرقّم ثانٍ بالعربية</p></li></ol>' +
    '<ul id="en-ul"><li>English only list item</li></ul>';
  window.document.body.appendChild(container);

  bidiFix.processElement(container);
  assert.equal(window.document.getElementById('test-ul').getAttribute('dir'), 'rtl');
  assert.equal(window.document.getElementById('test-ol').getAttribute('dir'), 'rtl');
  // قائمة إنجليزية لا تُلمس
  assert.equal(window.document.getElementById('en-ul').hasAttribute('data-fluent-rtl-dir'), false);
  // li داخل القائمة يرث rtl
  assert.equal(window.document.getElementById('test-ul').querySelector('li').getAttribute('data-fluent-rtl-dir') !== null ||
    window.document.getElementById('test-ul').querySelector('li p').getAttribute('data-fluent-rtl-dir') === 'rtl', true);
});

test('revert يستعيد القوائم كما كانت', async () => {
  const ul = window.document.getElementById('test-ul');
  bidiFix.revert(window.document);
  assert.equal(ul.hasAttribute('data-fluent-rtl-dir'), false);
  assert.equal(ul.hasAttribute('dir'), false);
});

test('revert يعيد كل شيء كما كان', async () => {
  await runApply();
  const p = window.document.getElementById('arabic-msg');
  assert.equal(p.getAttribute('dir'), 'rtl');
  bidiFix.revert(window.document);
  assert.equal(p.hasAttribute('data-fluent-rtl-dir'), false);
  assert.equal(p.hasAttribute('dir'), false);
});

test('processElement على عنصر جديد (محاكاة mutation)', async () => {
  const p = window.document.createElement('p');
  p.id = 'new-msg';
  p.textContent = 'رسالة عربية جديدة وصلت عبر البث الحي للاختبار الآلي';
  window.document.body.appendChild(p);
  bidiFix.processElement(p);
  await waitFor(() => p.getAttribute('data-fluent-rtl-dir') === 'rtl', 300);
  assert.equal(p.getAttribute('dir'), 'rtl');
});

test('عنصر div هيكلي (غير نصي) لا يُعالج عبر processElement', async () => {
  const div = window.document.createElement('div');
  div.textContent = 'نص عربي داخل div هيكلي يجب ألا يعالج مباشرة';
  window.document.body.appendChild(div);
  bidiFix.processElement(div);
  assert.equal(div.hasAttribute('data-fluent-rtl-dir'), false);
});
