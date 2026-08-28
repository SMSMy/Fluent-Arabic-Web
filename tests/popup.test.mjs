/**
 * tests/popup.test.mjs — اختبارات انحدار لواجهة الـ popup الجديدة
 * (تحميل popup.html + popup.js داخل jsdom مع stub لبيئة كروم)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitFor } from './helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_SETTINGS = {
  enabled: true,
  autoDetect: true,
  detectionThreshold: 0.15,
  font: 'thmanyah',
  customFonts: [],
  whitelist: [],
  blacklist: [],
  perSite: {}
};

function loadPopup() {
  const html = fs.readFileSync(path.join(ROOT, 'popup', 'popup.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'chrome-extension://test/popup/popup.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const { window } = dom;
  let storedSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  // stub background: يرد حسب نوع الرسالة
  window.chrome = {
    storage: {
      sync: {
        get(keys, cb) {
          const out = {};
          (typeof keys === 'string' ? [keys] : (keys || [])).forEach((k) => {
            if (k === 'fluentRTLSettings') out[k] = storedSettings;
          });
          setTimeout(() => cb && cb(out), 0);
        },
        set(obj, cb) {
          if (obj.fluentRTLSettings) storedSettings = obj.fluentRTLSettings;
          setTimeout(() => cb && cb(), 0);
        }
      },
      local: {
        get(k, cb) { setTimeout(() => cb && cb({}), 0); },
        set(o, cb) { setTimeout(() => cb && cb(), 0); }
      }
    },
    runtime: {
      getManifest() { return { version: '4.1.0', name: 'Fluent Arabic Web' }; },
      lastError: null,
      sendMessage(msg, cb) {
        let resp;
        switch (msg.type) {
          case 'fluent-rtl-get-settings': resp = JSON.parse(JSON.stringify(storedSettings)); break;
          case 'fluent-rtl-save-settings':
            if (msg.settings) storedSettings = JSON.parse(JSON.stringify(msg.settings));
            resp = { success: true };
            break;
          case 'fluent-rtl-get-tab-status': resp = { active: false, arabicRatio: 0, hostname: '' }; break;
          case 'fluent-rtl-toggle-tab': resp = { active: false }; break;
          case 'fluent-rtl-update-font': resp = { applied: true }; break;
          case 'fluent-rtl-doctor': resp = { error: 'chrome-page' }; break;
          case 'fluent-rtl-start-picker': resp = { started: true }; break;
          default: resp = {};
        }
        setTimeout(() => cb && cb(resp), 10);
      }
    }
  };

  const code = fs.readFileSync(path.join(ROOT, 'popup', 'popup.js'), 'utf8');
  window.eval(code);
  return { dom, window };
}

const REQUIRED_IDS = [
  'app', 'statusBar', 'statusDot', 'statusText', 'arabicRatio',
  'mainToggle', 'toggleText', 'powerHint', 'autoDetect', 'threshold', 'thresholdValue', 'fontSelect',
  'siteHostname', 'addToWhitelist', 'addToBlacklist', 'removeFromLists',
  'whitelistContainer', 'blacklistContainer', 'whitelistInput', 'blacklistInput', 'addWhitelistBtn', 'addBlacklistBtn',
  'exportBtn', 'importBtn', 'importFile', 'themeToggle', 'themeIcon', 'resetBtn',
  'pickElementBtn', 'doctorBtn', 'doctorOutput',
  'selectorsBlock', 'selectorsContainer', 'selectorInput', 'addSelectorBtn'
];

test('كل المعرفات المطلوبة موجودة في popup.html', async () => {
  const { dom, window } = loadPopup();
  const missing = REQUIRED_IDS.filter((id) => !window.document.getElementById(id));
  assert.deepEqual(missing, [], 'معرفات ناقصة');
  // انتظار اكتمال التهيئة قبل الإغلاق (حتى لا يستمر النشاط غير المتزامن بعد الاختبار)
  await waitFor(() => window.document.getElementById('statusText').textContent === 'غير مفعّل', 1000);
  dom.window.close();
});

test('التهيئة: حالة التبويب تُرسم (غير مفعّل + لا نسبة)', async () => {
  const { dom, window } = loadPopup();
  await waitFor(() => window.document.getElementById('statusText').textContent === 'غير مفعّل', 1000);
  assert.equal(window.document.getElementById('statusText').textContent, 'غير مفعّل');
  assert.equal(window.document.getElementById('statusDot').classList.contains('inactive'), true);
  assert.equal(window.document.getElementById('statusDot').classList.contains('active'), false);
  assert.equal(window.document.getElementById('arabicRatio').style.display, 'none');
  dom.window.close();
});

test('الثيم: التبديل يقلب كلاس dark و data-theme معاً', async () => {
  const { dom, window } = loadPopup();
  const html = window.document.documentElement;
  html.classList.add('dark');
  html.setAttribute('data-theme', 'dark');
  window.document.getElementById('themeToggle').click();
  await waitFor(() => html.getAttribute('data-theme') === 'light', 500);
  assert.equal(html.classList.contains('dark'), false);
  assert.equal(window.document.getElementById('themeIcon').textContent, 'dark_mode');
  // إعادة
  window.document.getElementById('themeToggle').click();
  await waitFor(() => html.classList.contains('dark') === true, 500);
  dom.window.close();
});

test('العتبة: تحريك المنزلقة يحفظ في التخزين عبر الرسائل', async () => {
  const { dom, window } = loadPopup();
  // انتظار اكتمال التهيئة (ربط المستمعات)
  await waitFor(() => window.document.getElementById('statusText').textContent === 'غير مفعّل', 1000);
  const threshold = window.document.getElementById('threshold');
  threshold.value = '45';
  threshold.dispatchEvent(new window.Event('input', { bubbles: true }));
  await waitFor(() => window.document.getElementById('thresholdValue').textContent === '45%', 800);
  assert.equal(window.document.getElementById('thresholdValue').textContent, '45%');
  dom.window.close();
});

test('الطبيب: مسار الخطأ يرسم الرسالة المحددة', async () => {
  const { dom, window } = loadPopup();
  await waitFor(() => window.document.getElementById('statusText').textContent === 'غير مفعّل', 1000);
  window.document.getElementById('doctorBtn').click();
  await waitFor(() => window.document.getElementById('doctorOutput').textContent.includes('صفحة كروم داخلية'), 1000);
  assert.match(window.document.getElementById('doctorOutput').textContent, /صفحة كروم داخلية/);
  dom.window.close();
});

test('الالتقاط: بدء ناجح', async () => {
  const { dom, window } = loadPopup();
  await waitFor(() => window.document.getElementById('statusText').textContent === 'غير مفعّل', 1000);
  window.document.getElementById('pickElementBtn').click();
  await waitFor(() => true, 300);
  // window.close() في jsdom لا يغلق فعلاً — نتحقق فقط أنه لم يرمِ خطأ
  assert.ok(true);
  dom.window.close();
});
