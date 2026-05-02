/**
 * lib/detector.js — كشف المحتوى العربي
 *
 * يوفر:
 * - detectDirection(text): كشف اتجاه النص بناءً على نسبة الحروف العربية
 * - hasArabicContent(text): فحص سريع هل النص يحتوي عربي
 * - getPageArabicRatio(): نسبة العربية في الصفحة كاملة
 * - shouldActivate(): هل نفعل RTL على هذه الصفحة؟
 */
(function () {
  'use strict';

  window.FluentRTL = window.FluentRTL || {};

  // نطاق الحروف العربية في Unicode — بدون g flag لمنع مشاكل lastIndex
  var ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  // نسخة مع g flag للاستخدام مع match() فقط
  var ARABIC_RANGE_GLOBAL = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

  // كاش للنتائج لتجنب إعادة الحساب
  var _cachedPageRatio = null;
  var _cachedPageRatioDirty = true;

  /**
   * كشف اتجاه النص بناءً على نسبة الحروف العربية
   * @param {string} text - النص المراد فحصه
   * @returns {'rtl'|'auto'|null} - rtl (>30% عربي), auto (0-30%), null (لا حروف عربية)
   */
  function detectDirection(text) {
    if (!text || typeof text !== 'string') return null;

    var cleaned = text.trim();
    if (!cleaned) return null;

    // إزالة المسافات والأرقام والرموز — نحسب نسبة الحروف فقط
    var lettersOnly = cleaned.replace(/[^a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');

    if (lettersOnly.length === 0) return null;

    var arabicMatches = cleaned.match(ARABIC_RANGE_GLOBAL);
    var arabicCount = arabicMatches ? arabicMatches.length : 0;
    var ratio = arabicCount / lettersOnly.length;

    if (ratio > 0.3) return 'rtl';   // أكثر من 30% عربي → فرض RTL
    if (ratio > 0) return 'auto';    // 0-30% عربي → نترك المتصفح يقرر
    return null;                     // 0% عربي → لا نلمس العنصر
  }

  /**
   * فحص سريع هل النص يحتوي حروف عربية
   * @param {string} text
   * @returns {boolean}
   */
  function hasArabicContent(text) {
    if (!text || typeof text !== 'string') return false;
    // استخدام regex بدون g flag — لا يتأثر بـ lastIndex
    return ARABIC_RANGE.test(text);
  }

  /**
   * حساب نسبة الحروف العربية في نص
   * @param {string} text
   * @returns {number} نسبة من 0 إلى 1
   */
  function getArabicRatio(text) {
    if (!text || typeof text !== 'string') return 0;

    var lettersOnly = text.replace(/[^a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    if (lettersOnly.length === 0) return 0;

    var arabicMatches = text.match(ARABIC_RANGE_GLOBAL);
    var arabicCount = arabicMatches ? arabicMatches.length : 0;

    return arabicCount / lettersOnly.length;
  }

  /**
   * فحص سريع هل الصفحة تبدو كموقع عربي أصلي
   * يفحص عدة مؤشرات: HTML attributes + CSS direction + هيكل الصفحة
   * @returns {boolean}
   */
  function isLikelyArabicNativeSite() {
    // 1. فحص HTML dir
    var htmlDir = document.documentElement.getAttribute('dir');
    if (htmlDir === 'rtl' || htmlDir === 'RTL') return true;

    // 2. فحص HTML lang
    var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    var rtlLangs = ['ar', 'he', 'fa', 'ur', 'ku', 'ps', 'ckb', 'sd', 'ug'];
    for (var i = 0; i < rtlLangs.length; i++) {
      if (htmlLang.startsWith(rtlLangs[i])) return true;
    }

    // 3. فحص body direction عبر getComputedStyle (أرخص من innerText)
    try {
      var bodyStyle = getComputedStyle(document.body);
      if (bodyStyle && bodyStyle.direction === 'rtl') return true;
    } catch (e) { /* ignore */ }

    // 4. فحص وجود CSS rules مع direction: rtl
    try {
      var sheets = document.styleSheets;
      for (var s = 0; s < Math.min(sheets.length, 20); s++) {
        try {
          var rules = sheets[s].cssRules;
          if (!rules) continue;
          for (var r = 0; r < Math.min(rules.length, 50); r++) {
            var rule = rules[r];
            if (rule.style && rule.style.direction === 'rtl') {
              if (rule.selectorText &&
                  (rule.selectorText.indexOf('body') !== -1 || rule.selectorText.indexOf('html') !== -1)) {
                return true;
              }
            }
          }
        } catch (e) { /* cross-origin stylesheets */ }
      }
    } catch (e) { /* ignore */ }

    return false;
  }

  /**
   * حساب نسبة العربية في الصفحة كاملة
   * يستخدم textContent مع كاش لتجنب إعادة الحساب
   * @param {boolean} forceRefresh - تجاهل الكاش
   * @returns {number} نسبة من 0 إلى 1
   */
  function getPageArabicRatio(forceRefresh) {
    if (!forceRefresh && !_cachedPageRatioDirty && _cachedPageRatio !== null) {
      return _cachedPageRatio;
    }

    var textSources = [];
    textSources.push(document.title || '');

    var metaDesc = document.querySelector('meta[name="description"]');
    textSources.push(metaDesc ? (metaDesc.getAttribute('content') || '') : '');

    var metaOgTitle = document.querySelector('meta[property="og:title"]');
    textSources.push(metaOgTitle ? (metaOgTitle.getAttribute('content') || '') : '');

    var metaOgDesc = document.querySelector('meta[property="og:description"]');
    textSources.push(metaOgDesc ? (metaOgDesc.getAttribute('content') || '') : '');

    var htmlEl = document.querySelector('html');
    textSources.push(htmlEl ? (htmlEl.getAttribute('lang') || '') : '');

    // إضافة عينة من body textContent فقط (أول 5000 حرف)
    try {
      var bodyText = document.body ? (document.body.textContent || '') : '';
      if (bodyText.length > 5000) {
        bodyText = bodyText.substring(0, 5000);
      }
      textSources.push(bodyText);
    } catch (e) { /* ignore */ }

    var allText = textSources.join(' ');
    _cachedPageRatio = getArabicRatio(allText);
    _cachedPageRatioDirty = false;
    return _cachedPageRatio;
  }

  /**
   * هل نفعل RTL على هذه الصفحة؟
   * @param {number} threshold - عتبة الكشف (افتراضي 0.15 = 15%)
   * @returns {boolean}
   */
  function shouldActivate(threshold) {
    threshold = typeof threshold === 'number' ? threshold : 0.15;

    // ⚠️ إذا الصفحة أصلاً RTL — لا نتدخل أبداً
    if (isLikelyArabicNativeSite()) return false;

    var ratio = getPageArabicRatio();
    return ratio >= threshold;
  }

  /**
   * تصفية الكاش
   */
  function invalidateCache() {
    _cachedPageRatioDirty = true;
    _cachedPageRatio = null;
  }

  // #10: توحيد الأسلوب — استخدام var بدل const/let للاتساق مع بقية الملفات
  // تصدير
  window.FluentRTL.detector = {
    detectDirection: detectDirection,
    hasArabicContent: hasArabicContent,
    getArabicRatio: getArabicRatio,
    getPageArabicRatio: getPageArabicRatio,
    shouldActivate: shouldActivate,
    isLikelyArabicNativeSite: isLikelyArabicNativeSite,
    invalidateCache: invalidateCache,
    ARABIC_RANGE: ARABIC_RANGE_GLOBAL
  };
})();
