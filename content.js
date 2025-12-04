// سكريبت المحتوى المحسّن - Fluent Arabic Web v3.0
// يتضمن: أداء محسّن، Debounce، كشف أسرع، دعم الخطوط المتعددة

(function () {
  "use strict";

  // ===============================================
  // الثوابت والتكوينات
  // ===============================================

  // نمط الكشف عن النص العربي (محسّن)
  const ARABIC_REGEX =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

  // مهلة Debounce (بالمللي ثانية)
  const DEBOUNCE_DELAY = 200;

  // الحد الأدنى لطول النص للفحص
  const MIN_TEXT_LENGTH = 100;

  // التخزين المؤقت لنتائج الفحص
  const cache = {
    lastTextLength: 0,
    lastResult: null,
    lastCheck: 0,
  };

  // مدة صلاحية التخزين المؤقت (5 ثوانٍ)
  const CACHE_DURATION = 5000;

  // ===============================================
  // المتغيرات
  // ===============================================

  let isEnabled = true;
  let autoDetectArabic = true;
  let minArabicTextPercentage = 15;
  let whitelistedDomains = [];
  let blacklistedDomains = [];
  let selectedFont = "Noto Naskh Arabic";
  let isTranslatedPage = false;
  let debounceTimer = null;
  let observer = null;
  let lastAppliedState = null;

  // ===============================================
  // دوال الأداء
  // ===============================================

  /**
   * دالة Debounce لتأخير التنفيذ
   * @param {Function} func - الدالة المراد تأخيرها
   * @param {number} wait - وقت الانتظار بالمللي ثانية
   * @returns {Function} الدالة المُؤجلة
   */
  function debounce(func, wait) {
    return function executedFunction(...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * التحقق من صلاحية التخزين المؤقت
   * @param {number} textLength - طول النص الحالي
   * @returns {boolean} هل التخزين المؤقت صالح
   */
  function isCacheValid(textLength) {
    const now = Date.now();
    return (
      cache.lastResult !== null &&
      Math.abs(cache.lastTextLength - textLength) < 50 &&
      now - cache.lastCheck < CACHE_DURATION
    );
  }

  /**
   * تحديث التخزين المؤقت
   * @param {Object} result - نتيجة الفحص
   * @param {number} textLength - طول النص
   */
  function updateCache(result, textLength) {
    cache.lastResult = result;
    cache.lastTextLength = textLength;
    cache.lastCheck = Date.now();
  }

  // ===============================================
  // دوال الكشف
  // ===============================================

  /**
   * الكشف عن النص العربي (محسّن)
   * @returns {Object} نتيجة الكشف
   */
  function detectArabicText() {
    const bodyText = document.body?.innerText || "";
    const textLength = bodyText.length;

    // إذا كان النص قصيراً جداً
    if (textLength < MIN_TEXT_LENGTH) {
      return { hasArabicContent: false, arabicPercentage: 0 };
    }

    // التحقق من التخزين المؤقت
    if (isCacheValid(textLength)) {
      return cache.lastResult;
    }

    // استخدام regex لحساب الأحرف العربية (أسرع من الحلقة)
    const matches = bodyText.match(ARABIC_REGEX);
    const arabicCharsCount = matches ? matches.length : 0;

    // حساب النسبة المئوية
    const arabicPercentage = (arabicCharsCount / textLength) * 100;
    const hasArabicContent = arabicPercentage >= minArabicTextPercentage;

    const result = { hasArabicContent, arabicPercentage };

    // تحديث التخزين المؤقت
    updateCache(result, textLength);

    return result;
  }

  /**
   * الكشف عن صفحات الترجمة
   * @returns {boolean} هل الصفحة مترجمة
   */
  function detectTranslatedPage() {
    // علامات ترجمة Google
    const isGoogleTranslated =
      document.documentElement.classList.contains("translated-rtl") ||
      document.documentElement.classList.contains("translated-ltr") ||
      document.querySelector(".goog-te-banner-frame") !== null ||
      document.querySelector(".skiptranslate") !== null ||
      document.documentElement.lang?.includes("ar");

    // علامات أخرى
    const hasTranslationMeta =
      document.querySelector('meta[name="translation"]') !== null ||
      document.querySelector(
        'meta[http-equiv="Content-Language"][content*="ar"]'
      ) !== null;

    return isGoogleTranslated || hasTranslationMeta;
  }

  // ===============================================
  // دوال تطبيق التحسينات
  // ===============================================

  /**
   * الحصول على CSS للخط المحدد
   * @param {string} fontName - اسم الخط
   * @returns {string} CSS الخط
   */
  function getFontCSS(fontName) {
    const fonts = {
      "Noto Naskh Arabic":
        "'Noto Naskh Arabic Local', 'Noto Naskh Arabic', serif",
      Amiri: "'Amiri', 'Noto Naskh Arabic Local', serif",
      Cairo: "'Cairo', 'Noto Naskh Arabic Local', sans-serif",
      Tajawal: "'Tajawal', 'Noto Naskh Arabic Local', sans-serif",
      Almarai: "'Almarai', 'Noto Naskh Arabic Local', sans-serif",
      "IBM Plex Sans Arabic":
        "'IBM Plex Sans Arabic', 'Noto Naskh Arabic Local', sans-serif",
    };

    return fonts[fontName] || fonts["Noto Naskh Arabic"];
  }

  /**
   * تطبيق تحسينات اللغة العربية
   * @param {boolean} force - تطبيق قسري
   */
  function applyArabicEnhancements(force = false) {
    const currentDomain = window.location.hostname;

    // التحقق من القوائم
    const isWhitelisted = whitelistedDomains.some((domain) =>
      currentDomain.includes(domain)
    );
    const isBlacklisted = blacklistedDomains.some((domain) =>
      currentDomain.includes(domain)
    );

    // الكشف عن الترجمة
    isTranslatedPage = detectTranslatedPage();

    // تحديد ما إذا كان يجب تطبيق التحسينات
    let shouldApply = isEnabled && !isBlacklisted;

    if (isWhitelisted) {
      shouldApply = isEnabled;
    } else if (autoDetectArabic && !force) {
      const { hasArabicContent, arabicPercentage } = detectArabicText();
      shouldApply = shouldApply && hasArabicContent;

      // إبلاغ الخلفية بنتيجة الكشف
      reportDetection(hasArabicContent, arabicPercentage);
    }

    // تجنب إعادة التطبيق غير الضرورية
    if (lastAppliedState === shouldApply && !force) {
      return;
    }

    lastAppliedState = shouldApply;

    // تطبيق أو إزالة التحسينات
    if (shouldApply) {
      document.documentElement.classList.add("arabic-enhancer-active");

      // تطبيق الخط المحدد
      applyCustomFont();

      // إصلاحات الترجمة
      if (isTranslatedPage) {
        applyTranslationFixes();
      }
    } else {
      document.documentElement.classList.remove("arabic-enhancer-active");
      document.documentElement.classList.remove("arabic-enhancer-translated");
      removeCustomStyles();
    }
  }

  /**
   * تطبيق الخط المخصص
   */
  function applyCustomFont() {
    let styleElement = document.getElementById("arabic-enhancer-custom-font");

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "arabic-enhancer-custom-font";
      document.head.appendChild(styleElement);
    }

    const fontFamily = getFontCSS(selectedFont);

    styleElement.textContent = `
            html.arabic-enhancer-active body,
            html.arabic-enhancer-active p,
            html.arabic-enhancer-active div,
            html.arabic-enhancer-active span,
            html.arabic-enhancer-active li,
            html.arabic-enhancer-active td,
            html.arabic-enhancer-active th,
            html.arabic-enhancer-active label,
            html.arabic-enhancer-active input:not([type="button"]):not([type="submit"]):not([type="reset"]),
            html.arabic-enhancer-active textarea,
            html.arabic-enhancer-active button,
            html.arabic-enhancer-active select {
                font-family: ${fontFamily} !important;
            }
        `;
  }

  /**
   * تطبيق إصلاحات الترجمة
   */
  function applyTranslationFixes() {
    document.documentElement.classList.add("arabic-enhancer-translated");

    let styleElement = document.getElementById(
      "arabic-enhancer-translation-fixes"
    );

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "arabic-enhancer-translation-fixes";
      styleElement.textContent = `
                /* إصلاحات الصفحات المترجمة */
                html.arabic-enhancer-active.arabic-enhancer-translated .skiptranslate,
                html.arabic-enhancer-active.arabic-enhancer-translated .goog-te-banner-frame {
                    direction: ltr !important;
                }

                html.arabic-enhancer-active.arabic-enhancer-translated input,
                html.arabic-enhancer-active.arabic-enhancer-translated textarea {
                    text-align: right !important;
                    direction: rtl !important;
                }
            `;
      document.head.appendChild(styleElement);
    }
  }

  /**
   * إزالة الأنماط المخصصة
   */
  function removeCustomStyles() {
    const customFont = document.getElementById("arabic-enhancer-custom-font");
    const translationFixes = document.getElementById(
      "arabic-enhancer-translation-fixes"
    );

    if (customFont) customFont.remove();
    if (translationFixes) translationFixes.remove();
  }

  /**
   * إبلاغ الخلفية بنتيجة الكشف
   * @param {boolean} hasArabicContent - هل يوجد محتوى عربي
   * @param {number} arabicPercentage - النسبة المئوية
   */
  function reportDetection(hasArabicContent, arabicPercentage) {
    chrome.runtime
      .sendMessage({
        action: "reportArabicDetection",
        hasArabicContent,
        arabicPercentage,
      })
      .catch(() => {
        // تجاهل أخطاء الاتصال
      });
  }

  // ===============================================
  // دوال الإعدادات
  // ===============================================

  /**
   * تحديث الإعدادات
   * @param {Object} newSettings - الإعدادات الجديدة
   */
  function updateSettings(newSettings) {
    if (newSettings.isEnabled !== undefined) isEnabled = newSettings.isEnabled;
    if (newSettings.autoDetectArabic !== undefined)
      autoDetectArabic = newSettings.autoDetectArabic;
    if (newSettings.minArabicTextPercentage !== undefined)
      minArabicTextPercentage = newSettings.minArabicTextPercentage;
    if (newSettings.whitelistedDomains !== undefined)
      whitelistedDomains = newSettings.whitelistedDomains;
    if (newSettings.blacklistedDomains !== undefined)
      blacklistedDomains = newSettings.blacklistedDomains;
    if (newSettings.selectedFont !== undefined)
      selectedFont = newSettings.selectedFont;

    // إبطال التخزين المؤقت عند تغيير الإعدادات
    cache.lastResult = null;
    lastAppliedState = null;

    // إعادة تطبيق التحسينات
    applyArabicEnhancements();
  }

  // ===============================================
  // مستمعي الرسائل
  // ===============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      switch (message.action) {
        case "settingsUpdated":
          updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case "toggleEnhancement":
          isEnabled = message.isEnabled;
          lastAppliedState = null;
          applyArabicEnhancements(true);
          sendResponse({ success: true });
          break;

        case "getPageInfo":
          const { hasArabicContent, arabicPercentage } = detectArabicText();
          sendResponse({
            domain: window.location.hostname,
            hasArabicContent,
            arabicPercentage,
            isTranslatedPage,
          });
          break;

        default:
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("Fluent Arabic Web - Message handling error:", error);
      sendResponse({ error: error.message });
    }

    return true; // للرد غير المتزامن
  });

  // ===============================================
  // مراقب DOM
  // ===============================================

  /**
   * معالج تغييرات DOM المُؤجل
   */
  const debouncedApply = debounce(() => {
    applyArabicEnhancements();
  }, DEBOUNCE_DELAY);

  /**
   * إعداد مراقب DOM
   */
  function setupMutationObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      // التحقق من التغييرات الكبيرة فقط
      let hasSignificantChanges = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tagName = node.tagName;
              if (
                ["DIV", "SECTION", "ARTICLE", "MAIN", "P", "SPAN"].includes(
                  tagName
                )
              ) {
                // التحقق من وجود نص
                if (node.innerText && node.innerText.length > 50) {
                  hasSignificantChanges = true;
                  break;
                }
              }
            }
          }
        }

        if (hasSignificantChanges) break;
      }

      if (hasSignificantChanges) {
        debouncedApply();
      }
    });

    // بدء المراقبة
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });
    }
  }

  // ===============================================
  // التهيئة
  // ===============================================

  /**
   * التهيئة الرئيسية
   */
  function init() {
    // الحصول على الإعدادات
    chrome.runtime.sendMessage({ action: "getSettings" }, (settings) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "Fluent Arabic Web - Could not get settings:",
          chrome.runtime.lastError
        );
        applyArabicEnhancements();
        return;
      }

      if (settings) {
        updateSettings(settings);
      } else {
        applyArabicEnhancements();
      }
    });

    // إعداد مراقب DOM
    setupMutationObserver();
  }

  // التنفيذ عند جاهزية الصفحة
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // تنظيف عند إغلاق الصفحة
  window.addEventListener("beforeunload", () => {
    if (observer) {
      observer.disconnect();
    }
    clearTimeout(debounceTimer);
  });
})();
