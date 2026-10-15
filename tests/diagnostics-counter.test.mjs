/**
 * tests/diagnostics-counter.test.mjs — اختبارات عداد العناصر المعالجة المباشر في الـ popup
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSource } from './read-source.mjs';

test('content.js: رسالة fluent-rtl-get-status تُرجع processedCount و isTranslated', () => {
  const content = readSource('content.js');
  assert.ok(content.includes('processedCount'), 'content.js must return processedCount in get-status');
  assert.ok(content.includes('isTranslated'), 'content.js must return isTranslated in get-status');
});

test('popup.html و popup.js: يتضمنان عنصر processedCount ويعرضان عدد العناصر المعالجة', () => {
  const html = readSource('popup/popup.html');
  assert.ok(html.includes('id="processedCount"'), 'popup.html must include processedCount');

  const js = readSource('popup/popup.js');
  assert.ok(js.includes('processedCount'), 'popup.js must reference processedCount');
});
