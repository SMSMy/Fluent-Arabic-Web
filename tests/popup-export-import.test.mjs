/**
 * tests/popup-export-import.test.mjs — اختبارات سلوكية تكاملية لتصدير واستيراد الإعدادات والمحددات
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { waitFor } from './helpers.mjs';
import { readSource } from './read-source.mjs';

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

async function createReadyPopupEnv(initialSettings = DEFAULT_SETTINGS, tabHostname = 'example.com') {
  const html = readSource('popup/popup.html');
  const dom = new JSDOM(html, {
    url: 'chrome-extension://test/popup/popup.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const { window } = dom;

  let storedSettings = JSON.parse(JSON.stringify(initialSettings));
  window.__storedSettings = storedSettings;

  let exportedPayload = null;
  let downloadedFileName = null;
  const objectUrls = new Map();
  const alerts = [];

  // اعتراض كائنات Blob وتنزيل الروابط
  const RealBlob = window.Blob;
  window.Blob = class MockBlob extends RealBlob {
    constructor(parts, options) {
      super(parts, options);
      this._dataString = parts ? parts.join('') : '';
    }
  };

  window.URL.createObjectURL = (blob) => {
    const id = 'blob:mock-' + Math.random();
    objectUrls.set(id, blob);
    return id;
  };
  window.URL.revokeObjectURL = (id) => {
    // حفظ الكائن حتى نهاية الفحص
  };

  window.HTMLAnchorElement.prototype.click = function () {
    downloadedFileName = this.download;
    const blob = objectUrls.get(this.href);
    if (blob && blob._dataString) {
      exportedPayload = blob._dataString;
    }
  };

  window.alert = (msg) => {
    alerts.push(msg);
  };

  // محاكي موثوق لـ FileReader
  window.FileReader = class MockFileReader {
    readAsText(file) {
      setTimeout(() => {
        let content = '';
        if (typeof file === 'string') {
          content = file;
        } else if (file && file._content !== undefined) {
          content = file._content;
        } else if (file && file.text) {
          content = file.text;
        }
        if (this.onload) {
          this.onload({ target: { result: content } });
        }
      }, 5);
    }
  };

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
          if (obj.fluentRTLSettings) {
            storedSettings = obj.fluentRTLSettings;
            window.__storedSettings = storedSettings;
          }
          setTimeout(() => cb && cb(), 0);
        }
      },
      local: {
        get(k, cb) { setTimeout(() => cb && cb({}), 0); },
        set(o, cb) { setTimeout(() => cb && cb(), 0); }
      }
    },
    runtime: {
      getManifest() { return { version: '4.3.0', name: 'Fluent Arabic Web' }; },
      lastError: null,
      sendMessage(msg, cb) {
        let resp;
        switch (msg.type) {
          case 'fluent-rtl-get-settings':
            resp = JSON.parse(JSON.stringify(storedSettings));
            break;
          case 'fluent-rtl-save-settings':
            if (msg.settings) {
              storedSettings = JSON.parse(JSON.stringify(msg.settings));
              window.__storedSettings = storedSettings;
            }
            resp = { success: true };
            break;
          case 'fluent-rtl-get-tab-status':
            resp = { active: false, arabicRatio: 0, hostname: tabHostname };
            break;
          case 'fluent-rtl-toggle-tab':
            resp = { active: false };
            break;
          case 'fluent-rtl-update-font':
            resp = { applied: true };
            break;
          case 'fluent-rtl-doctor':
            resp = { error: null };
            break;
          default:
            resp = {};
        }
        setTimeout(() => cb && cb(resp), 5);
      }
    }
  };

  const code = readSource('popup/popup.js');
  window.eval(code);

  // انتظار انتهاء init() وربط الأحداث بالكامل
  await waitFor(() => {
    const statusText = window.document.getElementById('statusText');
    return statusText && statusText.textContent !== 'جاري التحميل...';
  }, 2000);

  return {
    dom,
    window,
    getStoredSettings: () => storedSettings,
    getExportedPayload: () => exportedPayload,
    getDownloadedFileName: () => downloadedFileName,
    getAlerts: () => alerts
  };
}

test('عناصر الاستيراد والتصدير موجودة في الواجهة', () => {
  const html = readSource('popup/popup.html');
  assert.ok(html.includes('id="exportBtn"'), 'exportBtn must exist');
  assert.ok(html.includes('id="importBtn"'), 'importBtn must exist');
  assert.ok(html.includes('id="importFile"'), 'importFile must exist');
  assert.ok(html.includes('id="exportSelectorsBtn"'), 'exportSelectorsBtn must exist');
  assert.ok(html.includes('id="importSelectorsBtn"'), 'importSelectorsBtn must exist');
  assert.ok(html.includes('id="importSelectorsFile"'), 'importSelectorsFile must exist');
});

test('سلوكياً: تصدير الإعدادات الكاملة يولد ملف JSON صالحاً ومطابقاً للحالة', async () => {
  const customConfig = {
    ...DEFAULT_SETTINGS,
    enabled: true,
    autoDetect: false,
    detectionThreshold: 0.25,
    font: 'amiri',
    whitelist: ['github.com', 'news.ycombinator.com'],
    blacklist: ['example.com'],
    perSite: {
      'github.com': {
        enabled: true,
        selectors: [{ selector: '.markdown-body', mode: 'rtl' }]
      }
    }
  };

  const env = await createReadyPopupEnv(customConfig, 'github.com');

  const exportBtn = env.window.document.getElementById('exportBtn');
  exportBtn.click();

  assert.equal(env.getDownloadedFileName(), 'fluent-rtl-settings.json');
  const payloadStr = env.getExportedPayload();
  assert.ok(payloadStr, 'Exported payload must not be null');

  const parsed = JSON.parse(payloadStr);
  assert.equal(parsed.enabled, true);
  assert.equal(parsed.autoDetect, false);
  assert.equal(parsed.detectionThreshold, 0.25);
  assert.equal(parsed.font, 'amiri');
  assert.deepEqual(parsed.whitelist, ['github.com', 'news.ycombinator.com']);
  assert.deepEqual(parsed.blacklist, ['example.com']);
  assert.equal(parsed.perSite['github.com'].selectors[0].selector, '.markdown-body');

  env.dom.window.close();
});

test('سلوكياً: استيراد ملف إعدادات صالح يحدث التخزين وعناصر الواجهة', async () => {
  const env = await createReadyPopupEnv(DEFAULT_SETTINGS, 'chat.deepseek.com');

  const importedData = {
    enabled: true,
    autoDetect: true,
    detectionThreshold: 0.35,
    font: 'kufi',
    whitelist: ['chat.deepseek.com'],
    blacklist: ['unwanted.com'],
    perSite: {
      'chat.deepseek.com': {
        enabled: true,
        selectors: [
          { selector: '.ds-markdown', mode: 'rtl' },
          { selector: 'pre code', mode: 'ltr' }
        ]
      }
    }
  };

  const importFileInput = env.window.document.getElementById('importFile');
  const mockFile = { _content: JSON.stringify(importedData) };
  Object.defineProperty(importFileInput, 'files', {
    value: [mockFile],
    configurable: true
  });

  importFileInput.dispatchEvent(new env.window.Event('change'));

  await waitFor(() => {
    const s = env.getStoredSettings();
    return s && s.font === 'kufi' && s.detectionThreshold === 0.35;
  }, 2000);

  const finalSettings = env.getStoredSettings();
  assert.equal(finalSettings.font, 'kufi');
  assert.equal(finalSettings.detectionThreshold, 0.35);
  assert.deepEqual(finalSettings.whitelist, ['chat.deepseek.com']);
  assert.deepEqual(finalSettings.blacklist, ['unwanted.com']);
  assert.equal(finalSettings.perSite['chat.deepseek.com'].selectors.length, 2);

  env.dom.window.close();
});

test('سلوكياً: التحقق من صحة المدخلات وضبط حدود threshold وتطهير أسماء النطاقات عند الاستيراد', async () => {
  const env = await createReadyPopupEnv(DEFAULT_SETTINGS, 'example.com');

  // إعدادات بقيم متطرفة وأسماء نطاقات تحتاج تطهير
  const maliciousData = {
    enabled: true,
    detectionThreshold: 0.99, // يجب أن يقيد إلى 0.5
    whitelist: ['  VALID-SITE.ORG  ', 'invalid host with spaces', ''],
    perSite: {
      'VALID-SITE.ORG': {
        selectors: [
          { selector: '  .content-body  ', mode: 'invalid_mode' }
        ]
      }
    }
  };

  const importFileInput = env.window.document.getElementById('importFile');
  const mockFile = { _content: JSON.stringify(maliciousData) };
  Object.defineProperty(importFileInput, 'files', { value: [mockFile], configurable: true });

  importFileInput.dispatchEvent(new env.window.Event('change'));

  await waitFor(() => {
    const s = env.getStoredSettings();
    return s && s.detectionThreshold === 0.5;
  }, 2000);

  const s = env.getStoredSettings();
  assert.equal(s.detectionThreshold, 0.5, 'Threshold must be clamped to 0.5 max');
  assert.ok(s.whitelist.includes('valid-site.org'), 'Hostname must be trimmed and lowercased');
  assert.equal(s.whitelist.includes('invalid host with spaces'), false, 'Invalid hostnames must be excluded');
  assert.equal(s.perSite['valid-site.org'].selectors[0].mode, 'auto', 'Invalid mode should fallback to auto');

  env.dom.window.close();
});

test('سلوكياً: رفض ملف JSON غير صالح أو مصفوفة دون إتلاف الإعدادات المخزنة', async () => {
  const initial = { ...DEFAULT_SETTINGS, font: 'noto-sans' };
  const env = await createReadyPopupEnv(initial, 'example.com');

  const importFileInput = env.window.document.getElementById('importFile');

  // استيراد مصفوفة بدلاً من كائن
  const invalidArrayFile = { _content: JSON.stringify(['malicious', 'array']) };
  Object.defineProperty(importFileInput, 'files', { value: [invalidArrayFile], configurable: true });
  importFileInput.dispatchEvent(new env.window.Event('change'));

  await waitFor(() => env.getAlerts().length > 0, 1000);

  assert.equal(env.getStoredSettings().font, 'noto-sans', 'Settings must remain untouched after array import attempt');
  assert.ok(env.getAlerts().length > 0, 'Must show alert on invalid format');

  // استيراد نص تالف ليس JSON
  const corruptFile = { _content: '{ "broken_json": ' };
  Object.defineProperty(importFileInput, 'files', { value: [corruptFile], configurable: true });
  importFileInput.dispatchEvent(new env.window.Event('change'));

  await new Promise((r) => setTimeout(r, 100));
  assert.equal(env.getStoredSettings().font, 'noto-sans', 'Settings must remain untouched after corrupted import attempt');

  env.dom.window.close();
});

test('سلوكياً: تصدير محددات الموقع يولد ملف محددات خاص بالنطاق الحالي', async () => {
  const siteConfig = {
    ...DEFAULT_SETTINGS,
    perSite: {
      'grok.com': {
        selectors: [
          { selector: 'div[class*="message-bubble"]', mode: 'rtl' }
        ]
      }
    }
  };

  const env = await createReadyPopupEnv(siteConfig, 'grok.com');

  const exportSelectorsBtn = env.window.document.getElementById('exportSelectorsBtn');
  exportSelectorsBtn.click();

  assert.equal(env.getDownloadedFileName(), 'fluent-rtl-grok.com-selectors.json');
  const payloadStr = env.getExportedPayload();
  assert.ok(payloadStr, 'Exported selectors payload must exist');

  const parsed = JSON.parse(payloadStr);
  assert.equal(parsed.hostname, 'grok.com');
  assert.ok(Array.isArray(parsed.selectors));
  assert.equal(parsed.selectors[0].selector, 'div[class*="message-bubble"]');
  assert.equal(parsed.selectors[0].mode, 'rtl');

  env.dom.window.close();
});

test('سلوكياً: استيراد محددات الموقع يدمج المحددات الجديدة مع القائمة الحالية ويحدث التخزين', async () => {
  const siteConfig = {
    ...DEFAULT_SETTINGS,
    perSite: {
      'grok.com': {
        selectors: [
          { selector: '.existing-selector', mode: 'auto' }
        ]
      }
    }
  };

  const env = await createReadyPopupEnv(siteConfig, 'grok.com');

  const importSelectorsFile = env.window.document.getElementById('importSelectorsFile');
  const newSelectorsPayload = {
    hostname: 'grok.com',
    selectors: [
      { selector: '.existing-selector', mode: 'rtl' }, // تحديث النمط
      { selector: '.new-selector', mode: 'ltr' }        // عنصر جديد
    ]
  };

  const mockFile = { _content: JSON.stringify(newSelectorsPayload) };
  Object.defineProperty(importSelectorsFile, 'files', { value: [mockFile], configurable: true });
  importSelectorsFile.dispatchEvent(new env.window.Event('change'));

  await waitFor(() => {
    const s = env.getStoredSettings();
    const sels = s?.perSite?.['grok.com']?.selectors;
    return sels && sels.length === 2 && sels[0].mode === 'rtl';
  }, 2000);

  const finalSelectors = env.getStoredSettings().perSite['grok.com'].selectors;
  assert.equal(finalSelectors.length, 2);
  assert.equal(finalSelectors[0].selector, '.existing-selector');
  assert.equal(finalSelectors[0].mode, 'rtl');
  assert.equal(finalSelectors[1].selector, '.new-selector');
  assert.equal(finalSelectors[1].mode, 'ltr');

  env.dom.window.close();
});
