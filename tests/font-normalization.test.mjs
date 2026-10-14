/**
 * tests/font-normalization.test.mjs — اختبارات ضبط ارتفاع الأسطر وتناسق الخطوط العربية
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('base.css: يتضمن line-height: 1.65 للفقرات العربية لمنع تداخل الحركات', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles/base.css'), 'utf8');
  assert.ok(css.includes('line-height: 1.65'), 'يجب أن يحتوي base.css على line-height: 1.65');
});

test('content.js: حقن الخط يتضمن ضبط line-height للفقرات والقوائم', () => {
  const contentCode = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  assert.ok(contentCode.includes('line-height: 1.65') || contentCode.includes('line-height:1.65'), 'يجب أن يضبط content.js ارتفاع السطر عند حقن الخط');
});
