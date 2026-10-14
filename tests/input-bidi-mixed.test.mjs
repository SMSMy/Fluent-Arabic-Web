import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs, loadContentScript, waitFor } from './helpers.mjs';

test('input: textarea with mixed text starting with english is set to rtl', () => {
  const { dom, window } = createDom('<!DOCTYPE html><html><body><textarea id="box"></textarea></body></html>');
  const libs = loadLibs(window);
  const textarea = window.document.getElementById('box');

  textarea.value = 'System Partitions في المعلومات اريد تجربة اضافة هذا البارتشن كيف';
  libs.bidiFix.handleInput(textarea);

  assert.equal(textarea.getAttribute('dir'), 'rtl');
  assert.equal(textarea.getAttribute('data-fluent-rtl-input'), 'rtl');
  assert.equal(textarea.style.getPropertyValue('direction'), 'rtl');
  assert.equal(textarea.style.getPropertyValue('text-align'), 'right');
});

test('input: contenteditable starting with english is set to rtl', () => {
  const { dom, window } = createDom('<!DOCTYPE html><html><body><div id="editable" contenteditable="true"></div></body></html>');
  const libs = loadLibs(window);
  const editable = window.document.getElementById('editable');

  editable.textContent = 'Docker هو نظام مفتوح المصدر لتشغيل الحاويات الافتراضية بسهولة';
  libs.bidiFix.handleInput(editable);

  assert.equal(editable.getAttribute('dir'), 'rtl');
  assert.equal(editable.getAttribute('data-fluent-rtl-input'), 'rtl');
  assert.equal(editable.style.getPropertyValue('direction'), 'rtl');
  assert.equal(editable.style.getPropertyValue('text-align'), 'right');
});

test('input: pure english text is set to ltr', () => {
  const { dom, window } = createDom('<!DOCTYPE html><html><body><textarea id="box"></textarea></body></html>');
  const libs = loadLibs(window);
  const textarea = window.document.getElementById('box');

  textarea.value = 'Hello world, this is a pure english test prompt for the AI model';
  libs.bidiFix.handleInput(textarea);

  assert.equal(textarea.getAttribute('dir'), 'ltr');
  assert.equal(textarea.getAttribute('data-fluent-rtl-input'), 'ltr');
  assert.equal(textarea.style.getPropertyValue('direction'), 'ltr');
  assert.equal(textarea.style.getPropertyValue('text-align'), 'left');
});

test('input: clearing text removes data-fluent-rtl-input and restores original state', () => {
  const { dom, window } = createDom('<!DOCTYPE html><html><body><textarea id="box" dir="auto"></textarea></body></html>');
  const libs = loadLibs(window);
  const textarea = window.document.getElementById('box');

  textarea.value = 'System Partitions تجربة';
  libs.bidiFix.handleInput(textarea);
  assert.equal(textarea.getAttribute('data-fluent-rtl-input'), 'rtl');

  // مسح النص
  textarea.value = '';
  libs.bidiFix.handleInput(textarea);
  assert.equal(textarea.hasAttribute('data-fluent-rtl-input'), false);
  assert.equal(textarea.getAttribute('dir'), 'auto');
});

test('input: revertBidiFix cleans all input bidi modifications', () => {
  const { dom, window } = createDom('<!DOCTYPE html><html><body><textarea id="box"></textarea></body></html>');
  const libs = loadLibs(window);
  const textarea = window.document.getElementById('box');

  textarea.value = 'APK هو ملف حزمة أندرويد';
  libs.bidiFix.handleInput(textarea);
  assert.equal(textarea.getAttribute('data-fluent-rtl-input'), 'rtl');

  libs.bidiFix.revert(window.document);
  assert.equal(textarea.hasAttribute('data-fluent-rtl-input'), false);
  assert.equal(textarea.style.getPropertyValue('direction'), '');
});

test('content.js: input events trigger dynamic bidi direction in full environment', async () => {
  const html = `<!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <div id="composer">
        <textarea id="prompt"></textarea>
      </div>
    </body>
  </html>`;

  const { dom, window } = createDom(html, {
    url: 'https://chat.deepseek.com',
    storage: { enabled: true, autoDetect: true }
  });

  loadLibs(window);
  loadContentScript(window);

  await waitFor(() => window.FluentRTL && window.FluentRTL.isActive(), 1500);

  const textarea = window.document.getElementById('prompt');
  textarea.value = 'System Partitions في المعلومات اريد تجربة اضافة هذا البارتشن كيف';

  const inputEvent = new window.Event('input', { bubbles: true });
  textarea.dispatchEvent(inputEvent);

  assert.equal(textarea.getAttribute('data-fluent-rtl-input'), 'rtl');
  assert.equal(textarea.getAttribute('dir'), 'rtl');
});
