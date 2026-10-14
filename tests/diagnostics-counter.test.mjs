/**
 * tests/diagnostics-counter.test.mjs — اختبارات عداد العناصر المعالجة المباشر في الـ popup
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('content.js: رسالة fluent-rtl-get-status تُرجع processedCount و isTranslated', () => {
  const content = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  assert.ok(content.includes('processedCount'), 'content.js must return processedCount in get-status');
  assert.ok(content.includes('isTranslated'), 'content.js must return isTranslated in get-status');
});

test('popup.html و popup.js: يتضمنان عنصر processedCount ويعرضان عدد العناصر المعالجة', () => {
  const html = fs.readFileSync(path.join(ROOT, 'popup/popup.html'), 'utf8');
  assert.ok(html.includes('id="processedCount"'), 'popup.html must include processedCount');

  const js = fs.readFileSync(path.join(ROOT, 'popup/popup.js'), 'utf8');
  assert.ok(js.includes('processedCount'), 'popup.js must reference processedCount');
});
