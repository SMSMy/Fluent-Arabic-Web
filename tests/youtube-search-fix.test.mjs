/**
 * tests/youtube-search-fix.test.mjs — اختبار حماية وإصلاح اقتراحات بحث يوتيوب من الانقلاب
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs } from './helpers.mjs';

test('YouTube search suggestions: inline spans inside .sbqs_c are excluded from bidiFix isolation', () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head></head>
    <body class="fluent-rtl-active">
      <div class="gstl_50 sbdd_a">
        <div class="sbdd_b">
          <ul class="sbsb_b" role="listbox">
            <li class="sbsb_c" role="presentation">
              <div class="sbqs_c">
                <span class="sbpqs_a">لب</span><b>س الخف للعمره</b>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  const { window } = createDom(html);
  const document = window.document;
  const FluentRTL = loadLibs(window);

  // Apply bidiFix
  FluentRTL.bidiFix.apply(document, () => {});

  const span = document.querySelector('.sbqs_c span');
  const b = document.querySelector('.sbqs_c b');
  const li = document.querySelector('li.sbsb_c');

  // Neither the inline span nor b should have data-fluent-rtl-dir or isolated dir="rtl"
  assert.equal(span.getAttribute('data-fluent-rtl-dir'), null, 'Child span must not be marked with data-fluent-rtl-dir');
  assert.equal(span.getAttribute('dir'), null, 'Child span must not have dir attribute');
  assert.equal(b.getAttribute('data-fluent-rtl-dir'), null, 'Child b must not be marked with data-fluent-rtl-dir');
  assert.equal(li.getAttribute('data-fluent-rtl-dir'), null, 'Suggestion li must be excluded from direct bidi modification');
});

test('YouTube site profile contains rules for search suggestion containers and children', () => {
  const { window } = createDom('<html><body></body></html>');
  const FluentRTL = loadLibs(window);
  const profile = FluentRTL.siteProfiles.getProfile('www.youtube.com');

  assert.ok(profile, 'YouTube profile must exist');
  assert.ok(profile.css.includes('.sbqs_c'), 'YouTube CSS must target .sbqs_c');
  assert.ok(profile.css.includes('unicode-bidi: plaintext'), 'YouTube suggestions must use unicode-bidi: plaintext');
  assert.ok(profile.css.includes('unicode-bidi: normal'), 'Child tokens must reset unicode-bidi to normal');
});
