/**
 * tests/font-normalization.test.mjs — اختبارات ضبط ارتفاع الأسطر وتناسق الخطوط العربية
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSource } from './read-source.mjs';

test('base.css: يتضمن line-height: 1.65 للفقرات العربية لمنع تداخل الحركات', () => {
  const css = readSource('styles/base.css');
  assert.ok(css.includes('line-height: 1.65'), 'يجب أن يحتوي base.css على line-height: 1.65');
});

test('content.js: حقن الخط يتضمن ضبط line-height للفقرات والقوائم', () => {
  const contentCode = readSource('content.js');
  assert.ok(contentCode.includes('line-height: 1.65') || contentCode.includes('line-height:1.65'), 'يجب أن يضبط content.js ارتفاع السطر عند حقن الخط');
});
