/**
 * tests/streaming-stability.test.mjs — اختبارات استقرار تدفق التوكنز في مواقع الذكاء الاصطناعي
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createDom, loadLibs } from './helpers.mjs';

const ROOT = process.cwd();
const { window } = createDom('<html><body></body></html>');
const FluentRTL = loadLibs(window);
const siteProfiles = FluentRTL.siteProfiles;

test('ChatGPT profile CSS: يتضمن plaintext للفقرات الحية لمنع وميض الاتجاه أثناء البث', () => {
  const p = siteProfiles.getProfile('chatgpt.com');
  assert.ok(p, 'chatgpt profile must exist');
  assert.match(p.css, /\.markdown-body p[\s\S]*?unicode-bidi:\s*plaintext/);
});

test('Claude profile CSS: يتضمن plaintext للفقرات الحية', () => {
  const p = siteProfiles.getProfile('claude.ai');
  assert.ok(p, 'claude profile must exist');
  assert.match(p.css, /\.font-claude-response-body p[\s\S]*?unicode-bidi:\s*plaintext/);
});

test('Gemini profile CSS: يتضمن plaintext لردود النموذج الحية', () => {
  const p = siteProfiles.getProfile('gemini.google.com');
  assert.ok(p, 'gemini profile must exist');
  assert.match(p.css, /(?:model-response-message|\.message-content p)[\s\S]*?unicode-bidi:\s*plaintext/);
});

test('Perplexity profile CSS: يتضمن plaintext للفقرات الحية', () => {
  const p = siteProfiles.getProfile('www.perplexity.ai');
  assert.ok(p, 'perplexity profile must exist');
  assert.match(p.css, /prose[\s\S]*?unicode-bidi:\s*plaintext/);
});

test('content.js: حماية دالة selfHealInjectedStyles من throw عند انعدام getElementById', () => {
  const code = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  assert.ok(
    code.includes('if (!document || !document.getElementById) return;') ||
    code.includes('if (typeof document === \'undefined\' || !document || !document.getElementById) return;'),
    'يجب التأكد من وجود document.getElementById قبل استدعائها'
  );
});

test('content.js: معالجة characterData تسمح بإعادة تقييم عناصر streaming دون إيقافها بـ MARKER_ATTR مبكر', () => {
  const code = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  assert.ok(
    code.includes('prof.streaming') || code.includes('profile.streaming') || code.includes('isStreamingSite'),
    'يجب فحص streaming في characterData mutation handler'
  );
});
