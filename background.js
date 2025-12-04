// خلفية الامتداد المحسّنة - Fluent Arabic Web v3.0
// يتضمن: إدارة محسّنة، دعم الخطوط، اختصارات لوحة المفاتيح

(function () {
  "use strict";

  // ===============================================
  // الإعدادات الافتراضية
  // ===============================================

  const DEFAULT_SETTINGS = {
    isEnabled: true,
    autoDetectArabic: true,
    minArabicTextPercentage: 15,
    whitelistedDomains: [],
    blacklistedDomains: [],
    selectedFont: "Noto Naskh Arabic",
    theme: "auto",
  };

  // ===============================================
  // تهيئة الامتداد
  // ===============================================

  /**
   * تهيئة الإعدادات عند التثبيت
   */
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      // تثبيت جديد
      chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
        console.log("Fluent Arabic Web: Settings initialized");
      });
    } else if (details.reason === "update") {
      // تحديث - دمج الإعدادات الجديدة مع الموجودة
      chrome.storage.sync.get(null, (existingSettings) => {
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...existingSettings,
        };
        chrome.storage.sync.set(mergedSettings, () => {
          console.log("Fluent Arabic Web: Settings migrated to v3.0");
        });
      });
    }
  });

  // ===============================================
  // معالجة الرسائل
  // ===============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error("Fluent Arabic Web - Error:", error);
        sendResponse({ error: error.message });
      });

    return true; // للرد غير المتزامن
  });

  /**
   * معالج الرسائل
   * @param {Object} message - الرسالة
   * @param {Object} sender - المُرسل
   * @returns {Promise<Object>} الرد
   */
  async function handleMessage(message, sender) {
    switch (message.action) {
      case "getSettings":
        return await getSettings();

      case "updateSettings":
        return await updateSettings(message.settings);

      case "reportArabicDetection":
        return await handleArabicDetection(message, sender);

      default:
        return { error: "Unknown action" };
    }
  }

  /**
   * الحصول على الإعدادات
   * @returns {Promise<Object>} الإعدادات
   */
  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (settings) => {
        if (chrome.runtime.lastError) {
          console.error("Error getting settings:", chrome.runtime.lastError);
          resolve(DEFAULT_SETTINGS);
        } else {
          resolve({ ...DEFAULT_SETTINGS, ...settings });
        }
      });
    });
  }

  /**
   * تحديث الإعدادات
   * @param {Object} newSettings - الإعدادات الجديدة
   * @returns {Promise<Object>} نتيجة التحديث
   */
  async function updateSettings(newSettings) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(newSettings, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        // إرسال التحديثات إلى جميع التبويبات
        broadcastSettingsUpdate(newSettings);
        resolve({ success: true });
      });
    });
  }

  /**
   * بث تحديثات الإعدادات
   * @param {Object} settings - الإعدادات الجديدة
   */
  function broadcastSettingsUpdate(settings) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              action: "settingsUpdated",
              settings: settings,
            })
            .catch(() => {
              // تجاهل الأخطاء للتبويبات غير المتوافقة
            });
        }
      });
    });
  }

  /**
   * معالجة تقرير الكشف عن المحتوى العربي
   * @param {Object} message - الرسالة
   * @param {Object} sender - المُرسل
   * @returns {Object} الرد
   */
  async function handleArabicDetection(message, sender) {
    if (!sender.tab) {
      return { received: false };
    }

    const tabId = sender.tab.id;

    try {
      const url = new URL(sender.tab.url);
      const domain = url.hostname;

      // حفظ معلومات التبويب
      await chrome.storage.local.set({
        [`tabInfo_${tabId}`]: {
          domain: domain,
          hasArabicContent: message.hasArabicContent,
          arabicPercentage: message.arabicPercentage,
          timestamp: Date.now(),
        },
      });

      // تحديث شارة الأيقونة
      updateBadge(tabId, message.hasArabicContent);

      return { received: true };
    } catch (error) {
      console.error("Error handling detection:", error);
      return { received: false };
    }
  }

  /**
   * تحديث شارة الأيقونة
   * @param {number} tabId - معرف التبويب
   * @param {boolean} hasArabicContent - هل يوجد محتوى عربي
   */
  function updateBadge(tabId, hasArabicContent) {
    try {
      if (hasArabicContent) {
        chrome.action.setBadgeText({ text: "✓", tabId });
        chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId });
      } else {
        chrome.action.setBadgeText({ text: "", tabId });
      }
    } catch (error) {
      // تجاهل الأخطاء إذا لم يكن التبويب موجوداً
    }
  }

  // ===============================================
  // اختصارات لوحة المفاتيح
  // ===============================================

  chrome.commands?.onCommand?.addListener(async (command) => {
    const settings = await getSettings();

    switch (command) {
      case "toggle-extension":
        settings.isEnabled = !settings.isEnabled;
        await updateSettings(settings);

        // إشعار المستخدم
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs
              .sendMessage(tabs[0].id, {
                action: "toggleEnhancement",
                isEnabled: settings.isEnabled,
              })
              .catch(() => {});
          }
        });
        break;

      case "toggle-auto-detect":
        settings.autoDetectArabic = !settings.autoDetectArabic;
        await updateSettings(settings);
        break;
    }
  });

  // ===============================================
  // تنظيف البيانات
  // ===============================================

  /**
   * تنظيف بيانات التبويب عند إغلاقه
   */
  chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(`tabInfo_${tabId}`).catch(() => {});
  });

  /**
   * تنظيف البيانات القديمة بشكل دوري
   */
  async function cleanupOldData() {
    const storage = await chrome.storage.local.get(null);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const keysToRemove = [];

    for (const [key, value] of Object.entries(storage)) {
      if (key.startsWith("tabInfo_") && value.timestamp) {
        if (now - value.timestamp > oneHour) {
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  }

  // تنظيف كل 30 دقيقة
  setInterval(cleanupOldData, 30 * 60 * 1000);

  // تنظيف عند بدء التشغيل
  cleanupOldData();

  // ===============================================
  // تحديث الأيقونة عند تغيير التبويب
  // ===============================================

  chrome.tabs.onActivated?.addListener(async (activeInfo) => {
    try {
      const data = await chrome.storage.local.get(
        `tabInfo_${activeInfo.tabId}`
      );
      const tabInfo = data[`tabInfo_${activeInfo.tabId}`];

      if (tabInfo) {
        updateBadge(activeInfo.tabId, tabInfo.hasArabicContent);
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  });
})();
