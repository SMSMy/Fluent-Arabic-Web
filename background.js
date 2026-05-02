/**
 * background.js — Service Worker
 *
 * المسؤوليات:
 * 1. إدارة الإعدادات (chrome.storage.sync)
 * 2. بث الإعدادات لكل التبويبات عند التغيير
 * 3. اختصارات لوحة المفاتيح
 * 4. تنظيف البيانات القديمة
 * 5. تحديث شارة الأيقونة
 */

// === الإعدادات الافتراضية ===
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

// كاش حالة RTL لكل تبويب (tabId → boolean)
var tabRTLStatus = {};

// #24: تتبع بسيط للأخطاء في الـ service worker
var _errorLog = [];
var MAX_ERROR_LOG = 50;

function logError(context, message) {
  _errorLog.push({
    context: context,
    message: String(message).substring(0, 200),
    time: new Date().toISOString()
  });
  if (_errorLog.length > MAX_ERROR_LOG) _errorLog.shift();
  console.warn('[FluentRTL] Error in ' + context + ':', message);
}

// =========================================================================
// 1. إدارة الإعدادات
// =========================================================================

/**
 * تحميل الإعدادات
 * @returns {Promise<Object>}
 */
function loadSettings() {
  return new Promise(function (resolve) {
    chrome.storage.sync.get('fluentRTLSettings', function (result) {
      const settings = Object.assign({}, DEFAULT_SETTINGS, result.fluentRTLSettings || {});
      resolve(settings);
    });
  });
}

/**
 * حفظ الإعدادات
 * @param {Object} newSettings
 * @returns {Promise<void>}
 */
function saveSettings(newSettings) {
  return new Promise(function (resolve) {
    chrome.storage.sync.set({ fluentRTLSettings: newSettings }, resolve);
  });
}

/**
 * بث الإعدادات لكل التبويبات
 * @param {Object} settings
 */
function broadcastSettings(settings) {
  chrome.tabs.query({}, function (tabs) {
    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, {
          type: 'fluent-rtl-settings-updated',
          settings: settings  // نُرسل الإعدادات مع الرسالة لتجنب قراءة إضافية من storage
        }, function () {
          if (chrome.runtime.lastError) { /* تجاهل — التبويب قد لا يحتوي على content script */ }
        });
      } catch (e) {
        // تجاهل
      }
    }
  });
}

// =========================================================================
// 2. اختصارات لوحة المفاتيح
// =========================================================================

chrome.commands.onCommand.addListener(function (command) {
  if (command === 'toggle') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'fluent-rtl-toggle'
        }, function (response) {
          if (chrome.runtime.lastError) { return; }
          if (response) {
            updateBadge(tabs[0].id, response.active);
          }
        });
      }
    });
  }
});

// =========================================================================
// 3. تحديث شارة الأيقونة
// =========================================================================

function updateBadge(tabId, active) {
  // تحديث الكاش المحلي
  if (tabId) tabRTLStatus[tabId] = !!active;

  if (active) {
    chrome.action.setBadgeText({ text: 'RTL', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tabId });
    chrome.action.setBadgeTextColor({ color: '#FFFFFF', tabId: tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

// =========================================================================
// 4. استقبال الرسائل من content scripts و popup
// =========================================================================

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'fluent-rtl-status':
      // تحديث الشارة بناءً على حالة التبويب
      if (sender.tab) {
        updateBadge(sender.tab.id, message.active);
      }
      sendResponse({ received: true });
      return false;

    case 'fluent-rtl-get-settings':
      loadSettings().then(function (settings) {
        sendResponse(settings);
      });
      return true; // async

    case 'fluent-rtl-save-settings':
      saveSettings(message.settings).then(function () {
        broadcastSettings(message.settings);
        sendResponse({ success: true });
      });
      return true; // async

    case 'fluent-rtl-toggle-tab':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'fluent-rtl-toggle'
          }, function (response) {
            if (chrome.runtime.lastError) {
              sendResponse({ active: false });
              return;
            }
            if (response) {
              updateBadge(tabs[0].id, response.active);
              sendResponse(response);
            } else {
              sendResponse({ active: false });
            }
          });
        }
      });
      return true; // async

    case 'fluent-rtl-get-tab-status':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'fluent-rtl-get-status'
          }, function (response) {
            if (chrome.runtime.lastError) {
              sendResponse({ active: false, arabicRatio: 0 });
              return;
            }
            sendResponse(response || { active: false, arabicRatio: 0 });
          });
        } else {
          sendResponse({ active: false, arabicRatio: 0 });
        }
      });
      return true; // async

    case 'fluent-rtl-update-font':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'fluent-rtl-update-font',
            font: message.font
          }, function (response) {
            if (chrome.runtime.lastError) {
              sendResponse({ applied: false });
              return;
            }
            sendResponse(response || { applied: false });
          });
        } else {
          sendResponse({ applied: false });
        }
      });
      return true; // async

    default:
      return false;
  }
});

// =========================================================================
// 5. تحديث الشارة عند تبديل التبويبات
// =========================================================================

// #14: تطبيق فعلي لـ onActivated — نستعلم عن الحالة من content script
chrome.tabs.onActivated.addListener(function (activeInfo) {
  var tabId = activeInfo.tabId;

  // إذا يوجد حالة محفوظة في الكاش — نطبقها فوراً
  if (typeof tabRTLStatus[tabId] !== 'undefined') {
    updateBadge(tabId, tabRTLStatus[tabId]);
    return;
  }

  // وإلا نسأل content script عن الحالة الحالية
  chrome.tabs.sendMessage(tabId, { type: 'fluent-rtl-get-status' }, function (response) {
    if (chrome.runtime.lastError) {
      // التبويب لا يحتوي على content script (صفحة عادية)
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      return;
    }
    if (response) {
      updateBadge(tabId, response.active);
    }
  });
});

// تنظيف كاش التبويبات المغلقة
chrome.tabs.onRemoved.addListener(function (tabId) {
  delete tabRTLStatus[tabId];
});

// =========================================================================
// 6. تنظيف البيانات القديمة عند التثبيت
// =========================================================================

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // تثبيت جديد — حفظ الإعدادات الافتراضية
    saveSettings(DEFAULT_SETTINGS);
  } else if (details.reason === 'update') {
    // تحديث — دمج الإعدادات القديمة مع الجديدة
    loadSettings().then(function (settings) {
      const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
      saveSettings(merged);
    });
  }
});

// =========================================================================
// 7. تهيئة Service Worker
// =========================================================================

console.log('[FluentRTL] Background service worker initialized');
