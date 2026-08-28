/**
 * tests/helpers.mjs — بيئة اختبار مشتركة
 * تحمّل ملفات lib داخل jsdom مع stub كامل لواجهات chrome.*
 */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LIB_FILES = [
  'lib/detector.js',
  'lib/bidi-fix.js',
  'lib/transition-guard.js',
  'lib/transform-fixer.js',
  'lib/shadow-dom-traverser.js',
  'lib/site-profiles.js'
];

/**
 * إنشاء نافذة jsdom مع chrome stub
 * @param {string} html - محتوى الصفحة
 * @param {object} [opts]
 * @param {string} [opts.url] - عنوان الصفحة (لـ hostname)
 * @param {object} [opts.storage] - قيم chrome.storage.sync الأولية
 */
export function createDom(html, opts = {}) {
  const url = opts.url || 'https://example.com/page';
  const storageData = Object.assign({}, opts.storage || {});

  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    url,
    runScripts: 'dangerously'
  });
  const { window } = dom;

  window.FluentRTL = {};

  let messageListener = null;

  window.chrome = {
    storage: {
      sync: {
        get(keys, cb) {
          const out = {};
          if (typeof keys === 'string') {
            if (keys in storageData) out[keys] = storageData[keys];
          } else if (Array.isArray(keys)) {
            for (const k of keys) if (k in storageData) out[k] = storageData[k];
          } else if (keys && typeof keys === 'object') {
            Object.assign(out, storageData);
          }
          setTimeout(() => cb && cb(out), 0);
        },
        set(obj, cb) {
          Object.assign(storageData, obj);
          setTimeout(() => cb && cb(), 0);
        }
      },
      local: {
        get(keys, cb) { setTimeout(() => cb && cb({}), 0); },
        set(obj, cb) { setTimeout(() => cb && cb(), 0); }
      }
    },
    runtime: {
      getURL(p) { return 'chrome-extension://test/' + p; },
      onMessage: {
        addListener(fn) { messageListener = fn; }
      },
      sendMessage(msg, cb) {
        // محاكاة ردود background البسيطة
        setTimeout(() => cb && cb({}), 0);
      },
      lastError: null
    }
  };

  return { dom, window, storageData, url };
}

/** تحميل ملفات lib فقط */
export function loadLibs(window) {
  for (const rel of LIB_FILES) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    window.eval(code);
  }
  return window.FluentRTL;
}

/** تحميل content.js كاملاً (بعد libs) */
export function loadContentScript(window) {
  const code = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  window.eval(code);
}

/** انتظار شرط مع مهلة */
export async function waitFor(condition, timeoutMs = 1500, interval = 15) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (condition()) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return condition();
}

/** تحميل libs + content وإرجاع الأدوات */
export async function setupExtension(html, opts = {}) {
  const env = createDom(html, opts);
  const FluentRTL = loadLibs(env.window);
  loadContentScript(env.window);
  // انتظار init غير المتزامن (storage + rAF)
  await waitFor(() => env.window.FluentRTL.isActive !== undefined, 500);
  return { ...env, FluentRTL };
}
