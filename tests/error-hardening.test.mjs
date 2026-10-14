/**
 * tests/error-hardening.test.mjs — اختبارات تحصين الأخطاء ومنع ظهور علامة الخطأ الحمراء في المتصفح
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('background.js: updateBadge يحصن دوال chrome.action بفحص lastError', () => {
  const bg = fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8');
  assert.ok(bg.includes('chrome.action.setBadgeText'), 'must contain setBadgeText');
  assert.ok(
    bg.includes('function () {\n        if (chrome.runtime.lastError)') ||
    bg.includes('function () { if (chrome.runtime.lastError)'),
    'updateBadge must handle chrome.runtime.lastError to prevent red error badge'
  );
});

test('content.js: رسائل fluent-rtl-status تتضمن callbacks لفحص lastError', () => {
  const content = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  const occurrences = (content.match(/chrome\.runtime\.sendMessage\(\{\s*type:\s*'fluent-rtl-status'/g) || []).length;
  assert.ok(occurrences >= 2, 'must have at least 2 status messages');
  assert.ok(
    content.includes('if (chrome.runtime.lastError)') && content.includes('fluent-rtl-status'),
    'content.js status messages must check lastError'
  );
});

test('popup.js: sendMessage تفحص chrome.runtime.lastError بأمان', () => {
  const popup = fs.readFileSync(path.join(ROOT, 'popup/popup.js'), 'utf8');
  assert.ok(
    popup.includes('chrome.runtime.lastError') && popup.includes('function sendMessage'),
    'popup.js sendMessage must check chrome.runtime.lastError'
  );
});
