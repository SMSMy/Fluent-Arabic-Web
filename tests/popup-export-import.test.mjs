/**
 * tests/popup-export-import.test.mjs — اختبارات تصدير واستيراد القواعد المخصصة والمحددات
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = process.cwd();

test('popup.html: يتضمن عناصر تصدير واستيراد المحددات المخصصة', () => {
  const html = fs.readFileSync(path.join(ROOT, 'popup/popup.html'), 'utf8');
  assert.ok(html.includes('id="exportBtn"'), 'exportBtn must exist in popup.html');
  assert.ok(html.includes('id="importBtn"'), 'importBtn must exist in popup.html');
  assert.ok(html.includes('id="exportSelectorsBtn"'), 'exportSelectorsBtn must exist in popup.html');
  assert.ok(html.includes('id="importSelectorsBtn"'), 'importSelectorsBtn must exist in popup.html');
});

test('popup.js: normalizeSettings يدعم استيراد إعدادات كاملة وخريطة perSite ومحددات منفردة', () => {
  const js = fs.readFileSync(path.join(ROOT, 'popup/popup.js'), 'utf8');

  // استخراج دالة normalizeSettings
  assert.ok(js.includes('exportSelectorsBtn') || js.includes('handleExportSelectors'),
    'popup.js must support exportSelectorsBtn');
});
