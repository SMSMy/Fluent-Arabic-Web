import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs, loadContentScript, waitFor } from './helpers.mjs';

test('response: list item starting with english technical term gets rtl', () => {
  const html = `<!DOCTYPE html>
  <html>
    <body>
      <ul id="list">
        <li id="item1">DeepFilterNet3 (~2M parameters) خفيف جداً ومناسب لإزالة الضوضاء على الهاتف في الزمن الحقيقي</li>
        <li id="item2">Samsone (99M–356) أكبر بكثير ومخصص للأداء العالي</li>
      </ul>
    </body>
  </html>`;

  const { dom, window } = createDom(html);
  const libs = loadLibs(window);

  libs.bidiFix.apply(window.document);

  const item1 = window.document.getElementById('item1');
  const item2 = window.document.getElementById('item2');
  const list = window.document.getElementById('list');

  assert.equal(item1.getAttribute('dir'), 'rtl');
  assert.equal(item1.getAttribute('data-fluent-rtl-dir'), 'rtl');
  assert.equal(item2.getAttribute('dir'), 'rtl');
  assert.equal(list.getAttribute('dir'), 'rtl');
});

test('response: streaming text promotion from auto to rtl', () => {
  const html = `<!DOCTYPE html>
  <html>
    <body>
      <p id="msg">DeepFilterNet3</p>
    </body>
  </html>`;

  const { dom, window } = createDom(html);
  const libs = loadLibs(window);

  const msg = window.document.getElementById('msg');
  // في البداية إنجليزي فقط
  libs.bidiFix.processElement(msg);
  assert.equal(msg.hasAttribute('data-fluent-rtl-dir'), false);

  // تدفق النص مع قليل من العربي (نسبة قليلة -> auto)
  msg.textContent = 'DeepFilterNet3 (~2M) خفيف';
  libs.bidiFix.processElement(msg);
  assert.equal(msg.getAttribute('data-fluent-rtl-dir'), 'auto');

  // تدفق باقي الجملة العربية (ترقية auto -> rtl)
  msg.textContent = 'DeepFilterNet3 (~2M) خفيف جداً ومناسب لإزالة الضوضاء بجودة عالية';
  libs.bidiFix.processElement(msg);
  assert.equal(msg.getAttribute('data-fluent-rtl-dir'), 'rtl');
  assert.equal(msg.getAttribute('dir'), 'rtl');
});

test('response: markdown bullet with nested strong tag starting with english gets rtl on li', () => {
  const html = `<!DOCTYPE html>
  <html>
    <body>
      <ul>
        <li id="bullet"><strong>DeepFilterNet3</strong> خفيف جداً ومناسب للعمل المباشر</li>
      </ul>
    </body>
  </html>`;

  const { dom, window } = createDom(html);
  const libs = loadLibs(window);

  libs.bidiFix.apply(window.document);

  const bullet = window.document.getElementById('bullet');
  assert.equal(bullet.getAttribute('dir'), 'rtl');
  assert.equal(bullet.getAttribute('data-fluent-rtl-dir'), 'rtl');
});
