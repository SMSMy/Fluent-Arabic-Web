/**
 * tests/detector.test.mjs — اختبارات كاشف الاتجاه والنسبة العربية
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs } from './helpers.mjs';

const { window } = createDom('<html><head><title>اختبار</title></head><body><p>مرحبا بالعالم</p></body></html>');
const FluentRTL = loadLibs(window);
const detector = FluentRTL.detector;

test('detectDirection: نص عربي خالص → rtl', () => {
  assert.equal(detector.detectDirection('مرحبا بالعالم هذا نص طويل للاختبار'), 'rtl');
});

test('detectDirection: نص إنجليزي خالص → null', () => {
  assert.equal(detector.detectDirection('Hello world, this is a test'), null);
});

test('detectDirection: نص مختلط أغلبية عربية → rtl', () => {
  const mixed = 'هذا نص عربي مع بعض english words هنا لتوضيح الفكرة بشكل كامل';
  assert.equal(detector.detectDirection(mixed), 'rtl');
});

test('detectDirection: عربي قليل داخل إنجليزي → auto', () => {
  const mixed = 'Mostly english text with قليل من العربية words inside it for testing purposes';
  assert.equal(detector.detectDirection(mixed), 'auto');
});

test('detectDirection: نص فارغ → null', () => {
  assert.equal(detector.detectDirection(''), null);
  assert.equal(detector.detectDirection('   '), null);
  assert.equal(detector.detectDirection(null), null);
});

test('hasArabicContent: يكتشف العربية ويميز الإنجليزية', () => {
  assert.equal(detector.hasArabicContent('لا عربي هنا'), true);
  assert.equal(detector.hasArabicContent('no arabic here'), false);
});

test('getArabicRatio: نسبة صحيحة', () => {
  assert.ok(detector.getArabicRatio('مرحبا بالعالم') > 0.9);
  assert.equal(detector.getArabicRatio('hello world'), 0);
});

test('getPageArabicRatio: يقرأ من الصفحة', () => {
  assert.ok(detector.getPageArabicRatio(true) > 0);
});

test('shouldActivate: صفحة عربية فوق العتبة', () => {
  assert.equal(detector.shouldActivate(0.15), true);
});
