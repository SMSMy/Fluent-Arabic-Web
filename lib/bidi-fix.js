/**
 * lib/bidi-fix.js — إصلاح النصوص المختلطة BiDi
 *
 * يوفر:
 * - applyBidiFix(root): تطبيق RTL على العناصر النصية داخل root
 * - revertBidiFix(root): إزالة كل التغييرات
 * - processElement(el): معالجة عنصر واحد
 *
 * النهج: Text-Only RTL — لا نلمس layout المواقع
 */
(function () {
  'use strict';

  window.FluentRTL = window.FluentRTL || {};

  var detector = window.FluentRTL.detector;

  // === العناصر المستهدفة ===
  // ⚠️ لا نضمّن div أو span العامة — عناصر هيكلية تسبب كسر layout عند dir="rtl"
  var TEXT_SELECTORS = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'li', 'td', 'th', 'blockquote', 'figcaption',
    'label', 'summary', 'caption', 'dt', 'dd',
    'a',
    'span',
    '[role="article"]', '[role="paragraph"]',
    '[role="listitem"]', '[role="heading"]',
    '[role="textbox"]', '[role="document"]',
    'article', 'section'
  ].join(', ');

  // === العناصر المستثناة ===
  var EXCLUDE_SELECTORS = [
    'code', 'pre', 'kbd', 'samp', 'var',
    'svg', 'canvas', 'video', 'audio', 'iframe',
    '[class*="icon"]', '[class*="Icon"]',
    '[class*="material"]', '.material-icons',
    '.fa', '.fas', '.far', '.fab', '.fal', '.fad',
    '.fa-solid', '.fa-regular', '.fa-brands', '.fa-light', '.fa-duotone',
    '.monaco-editor', '[contenteditable]',
    'script', 'style', 'noscript', 'template',
    'input', 'textarea', 'select', 'button',
    '[data-fluent-rtl-skip]',
    '[data-fluent-rtl-dir]',
    '[class*="CodeMirror"]',
    '[class*="highlight"]',
    '[class*="prism"]',
    '[class*="ace-"]',
    '[class*="emoji"]',
    '[class*="badge"]', '[class*="Badge"]',
    '[class*="tag"]', '[class*="Tag"]',
    '[class*="count"]', '[class*="number"]',
    '[class*="date"]', '[class*="time"]',
    '[class*="breadcrumb"]',
    '[class*="pagination"]',
    '[class*="tooltip"]', '[class*="Tooltip"]',
    '[class*="avatar"]', '[class*="Avatar"]',
    'img', 'picture', 'source'
  ].join(', ');

  // كاش للنتائج السابقة — تجنب إعادة الفحص
  var _excludedCache = new WeakMap();
  var _excludedCacheVersion = 0;

  // #6: كاش منفصل لنتائج isSafeToApplyRTL — تجنب إعادة استدعاء getComputedStyle
  var _safeCache = new WeakMap();
  var _safeCacheVersion = 0;

  // سمة لتعليم العناصر المعالجة
  var MARKER_ATTR = 'data-fluent-rtl-dir';
  var ORIGINAL_DIR_ATTR = 'data-fluent-rtl-original-dir';

  // حدود الأداء
  var MAX_ELEMENTS = 10000;
  var BATCH_SIZE = 500;

  /**
   * فحص سريع وخفيف هل العنصر مستثنى
   * لا يستخدم getComputedStyle — للفلترة الأولى فقط
   * @param {Element} el
   * @returns {boolean|null}
   */
  function isExcludedLight(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;

    // فحص الكاش
    var cached = _excludedCache.get(el);
    if (cached === _excludedCacheVersion) return true;
    if (cached === -_excludedCacheVersion) return false;

    // فحص الماركر
    if (el.hasAttribute(MARKER_ATTR)) return true;
    if (el.hasAttribute('data-fluent-rtl-skip')) return true;

    // فحص اسم التاغ
    var tag = el.tagName.toLowerCase();
    var excludedTags = ['code', 'pre', 'kbd', 'samp', 'var', 'svg', 'canvas',
      'video', 'audio', 'iframe', 'script', 'style', 'noscript', 'template',
      'input', 'textarea', 'select', 'button', 'img', 'picture', 'source'];
    for (var i = 0; i < excludedTags.length; i++) {
      if (tag === excludedTags[i]) {
        _excludedCache.set(el, _excludedCacheVersion);
        return true;
      }
    }

    // فحص contenteditable
    if (el.isContentEditable || el.getAttribute('contenteditable')) {
      _excludedCache.set(el, _excludedCacheVersion);
      return true;
    }

    return null; // يحتاج فحص أعمق
  }

  /**
   * فحص عميق هل العنصر مستثنى
   * يستخدم closest() للفحص الهرمي
   * @param {Element} el
   * @returns {boolean}
   */
  function isExcludedDeep(el) {
    if (!el) return true;

    try {
      if (el.matches && el.matches(EXCLUDE_SELECTORS)) {
        _excludedCache.set(el, _excludedCacheVersion);
        return true;
      }

      // فحص هل العنصر داخل عنصر مستثنى (فحص أب واحد فقط — أرخص)
      var parent = el.parentElement;
      if (parent && parent.matches && parent.matches(EXCLUDE_SELECTORS)) {
        _excludedCache.set(el, _excludedCacheVersion);
        return true;
      }
    } catch (e) {
      return true;
    }

    _excludedCache.set(el, -_excludedCacheVersion);
    return false;
  }

  /**
   * فحص شامل هل العنصر مستثنى
   * @param {Element} el
   * @returns {boolean}
   */
  function isExcluded(el) {
    var light = isExcludedLight(el);
    if (light !== null) return light;
    return isExcludedDeep(el);
  }

  /**
   * فحص هل العنصر يحتوي نص مباشر (ليس فقط عناصر فرعية)
   * @param {Element} el
   * @returns {boolean}
   */
  function hasDirectText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * فحص هل العنصر يحتوي نص عربي فعلي
   * @param {Element} el
   * @returns {boolean}
   */
  function hasArabicTextContent(el) {
    var text = el.textContent || '';
    return text.length > 0 && detector.hasArabicContent(text);
  }

  /**
   * #6: فحص آمن لـ display/transform بدون استدعاء getComputedStyle غير ضروري
   * يتحقق أولاً من الـ style inline قبل اللجوء لـ getComputedStyle
   * يُخزّن النتائج في كاش لتجنب إعادة الاستدعاء
   *
   * @param {Element} el
   * @returns {boolean}
   */
  function isSafeToApplyRTL(el) {
    // فحص الكاش أولاً
    var cached = _safeCache.get(el);
    if (cached !== undefined && cached.version === _safeCacheVersion) {
      return cached.safe;
    }

    var safe = _computeSafeToApplyRTL(el);
    _safeCache.set(el, { safe: safe, version: _safeCacheVersion });
    return safe;
  }

  function _computeSafeToApplyRTL(el) {
    try {
      var style = getComputedStyle(el);
      var display = style.display;

      // ❌ لا تلمس عناصر Flexbox — dir يقلب flex-direction
      if (display === 'flex' || display === 'inline-flex') {
        return false;
      }

      // ❌ لا تلمس عناصر Grid — dir يقلب grid-auto-flow
      if (display === 'grid' || display === 'inline-grid') {
        return false;
      }

      // ❌ لا تلمس عناصر table-row/table-header-group إلخ
      if (display === 'table-row' || display === 'table-row-group' ||
          display === 'table-header-group' || display === 'table-footer-group' ||
          display === 'table-column' || display === 'table-column-group' ||
          display === 'table-cell') {
        return false;
      }

      // ❌ لا تلمس عناصر position: fixed بـ z-index عالي (overlay)
      var position = style.position;
      if (position === 'fixed') {
        var zIndex = parseInt(style.zIndex, 10);
        if (!isNaN(zIndex) && zIndex > 100) return false;
      }

      // ❌ لا تلمس عناصر عليها transform (تتعارض مع RTL)
      var transform = style.transform;
      if (transform && transform !== 'none') return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * معالجة عنصر واحد
   * @param {Element} el
   * @param {boolean} skipDirectTextCheck - تخطي فحص النص المباشر
   */
  function processElement(el, skipDirectTextCheck) {
    if (!el || isExcluded(el)) return;
    if (el.hasAttribute(MARKER_ATTR)) return;

    // ⚠️ فلتر الأمان — لا نطبق dir على عناصر flex/grid أو حاويات هيكلية
    if (!isSafeToApplyRTL(el)) return;

    // الحصول على النص
    var text = el.textContent || '';
    if (!text.trim()) return;

    // فحص هل فيه نص عربي فعلي
    if (!detector.hasArabicContent(text)) return;

    // ⚠️ فلتر النص المباشر
    if (!skipDirectTextCheck && !hasDirectText(el)) return;

    // كشف الاتجاه
    var dir = detector.detectDirection(text);
    if (!dir) return;

    // حفظ القيمة الأصلية
    var originalDir = el.getAttribute('dir') || '';
    el.setAttribute(ORIGINAL_DIR_ATTR, originalDir);
    el.setAttribute(MARKER_ATTR, dir);

    // تطبيق الاتجاه
    if (dir === 'rtl') {
      el.setAttribute('dir', 'rtl');
      el.style.setProperty('unicode-bidi', 'isolate', '');
    } else if (dir === 'auto') {
      el.setAttribute('dir', 'auto');
    }
  }

  /**
   * تطبيق RTL على كل العناصر النصية
   * @param {Element|Document} root - العنصر الجذر
   * @param {Function} onComplete - دالة تُستدعى عند الانتهاء
   */
  function applyBidiFix(root, onComplete) {
    root = root || document;
    if (!root.querySelectorAll) return;

    // تفعيل كاش جديد
    _excludedCacheVersion++;
    _safeCacheVersion++;

    var elements = root.querySelectorAll(TEXT_SELECTORS);
    var total = Math.min(elements.length, MAX_ELEMENTS);

    var processed = 0;

    function processBatch() {
      var end = Math.min(processed + BATCH_SIZE, total);

      for (var i = processed; i < end; i++) {
        var el = elements[i];
        if (hasDirectText(el)) {
          processElement(el);
        }
      }

      processed = end;

      if (processed < total) {
        requestAnimationFrame(processBatch);
      } else {
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    }

    processBatch();
  }

  /**
   * إزالة كل تغييرات RTL
   * @param {Element|Document} root
   */
  function revertBidiFix(root) {
    root = root || document;
    if (!root.querySelectorAll) return;

    // تصفية الكاش
    _excludedCache = new WeakMap();
    _excludedCacheVersion++;
    _safeCache = new WeakMap();
    _safeCacheVersion++;

    var elements = root.querySelectorAll('[' + MARKER_ATTR + ']');

    elements.forEach(function (el) {
      var originalDir = el.getAttribute(ORIGINAL_DIR_ATTR) || '';
      if (originalDir) {
        el.setAttribute('dir', originalDir);
      } else {
        el.removeAttribute('dir');
      }

      if (el.style.getPropertyValue('unicode-bidi')) {
        el.style.removeProperty('unicode-bidi');
      }

      el.removeAttribute(MARKER_ATTR);
      el.removeAttribute(ORIGINAL_DIR_ATTR);
    });
  }

  /**
   * معالجة عنصر واحد (واجهة عامة)
   * @param {Element} el
   */
  function processSingleElement(el) {
    if (el && el.nodeType === Node.ELEMENT_NODE) {
      processElement(el, true);
      try {
        var children = el.querySelectorAll(TEXT_SELECTORS);
        children.forEach(function (child) {
          if (hasDirectText(child)) {
            processElement(child, false);
          }
        });
      } catch (e) { /* ignore */ }
    }
  }

  /**
   * تصفية كاش الاستبعاد والأمان
   */
  function clearExcludedCache() {
    _excludedCache = new WeakMap();
    _excludedCacheVersion++;
    _safeCache = new WeakMap();
    _safeCacheVersion++;
  }

  // تصدير
  window.FluentRTL.bidiFix = {
    apply: applyBidiFix,
    revert: revertBidiFix,
    processElement: processSingleElement,
    clearExcludedCache: clearExcludedCache,
    TEXT_SELECTORS: TEXT_SELECTORS,
    EXCLUDE_SELECTORS: EXCLUDE_SELECTORS,
    MARKER_ATTR: MARKER_ATTR
  };
})();
