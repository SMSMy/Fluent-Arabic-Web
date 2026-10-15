/**
 * tests/error-hardening.test.mjs — اختبارات تحصين الأخطاء ومنع ظهور علامة الخطأ الحمراء في المتصفح
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSource } from './read-source.mjs';

test('background.js: updateBadge يحصن دوال chrome.action بفحص lastError', () => {
  const bg = readSource('background.js');
  assert.ok(bg.includes('chrome.action.setBadgeText'), 'must contain setBadgeText');
  assert.ok(
    bg.includes('function () {\n        if (chrome.runtime.lastError)') ||
    bg.includes('function () { if (chrome.runtime.lastError)'),
    'updateBadge must handle chrome.runtime.lastError to prevent red error badge'
  );
});

test('content.js: رسائل fluent-rtl-status تتضمن callbacks لفحص lastError', () => {
  const content = readSource('content.js');
  const occurrences = (content.match(/chrome\.runtime\.sendMessage\(\{\s*type:\s*'fluent-rtl-status'/g) || []).length;
  assert.ok(occurrences >= 2, 'must have at least 2 status messages');
  assert.ok(
    content.includes('if (chrome.runtime.lastError)') && content.includes('fluent-rtl-status'),
    'content.js status messages must check lastError'
  );
});

test('popup.js: sendMessage تفحص chrome.runtime.lastError بأمان', () => {
  const popup = readSource('popup/popup.js');
  assert.ok(
    popup.includes('chrome.runtime.lastError') && popup.includes('function sendMessage'),
    'popup.js sendMessage must check chrome.runtime.lastError'
  );
});
