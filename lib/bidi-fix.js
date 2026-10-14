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

  // === عناصر القوائم ===
  // #37: ul/ol ليست في TEXT_SELECTORS (لا نص مباشر) لكنها تحتاج dir=rtl
  // حتى تنقلب النقاط إلى اليمين — تُعالج بمنطق خاص يفحص المحتوى العربي
  var LIST_SELECTORS = 'ul, ol';

  // #43: وسوم «فقرة» — تُوسم بالغالبية حتى بدون نص مباشر
  // (بنى مثل p > ms-cmark-node > span لا تحتوي نصاً مباشراً في p)
  var PARAGRAPH_TAGS = {
    P: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
    LI: 1, BLOCKQUOTE: 1, TD: 1, TH: 1, DD: 1, DT: 1,
    CAPTION: 1, FIGCAPTION: 1, SUMMARY: 1, LABEL: 1
  };

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
    '[class*="CodeMirror"]',
    '[class*="highlight"]',
    '[class*="prism"]',
    // #33: استثناء ذكي لكتل الرياضيات — المعادلات تبقى LTR دائماً
    '[class*="katex"]', '[class*="KaTeX"]',
    '[class*="math"]', '[class*="MathJax"]', '[class*="mathjax"]',
    '[class*="math-inline"]', '[class*="math-display"]',
    '.ace_editor', '[class*="ace_"]', '[class*="ace-editor"]',
    '[class*="emoji"]',
    '[class*="badge"]', '[class*="Badge"]',
    '[class*="tag"]', '[class*="Tag"]',
    '[class*="count"]', '[class*="number"]',
    '[class*="date"]', '[class*="time"]',
    '[class*="breadcrumb"]',
    '[class*="pagination"]',
    '[class*="tooltip"]', '[class*="Tooltip"]',
    'img', 'picture', 'source',
    // #49: استثناء حاويات واقتراحات البحث لمنع تفكيك وانقلاب نصوص الإكمال التلقائي
    '.sbqs_c', '[class*="sbqs_"]',
    '.sbsb_c', '[class*="sbsb_"]',
    '.sbdd_a', '.sbdd_b',
    '[class*="SearchboxComponentSuggestion"]',
    '[class*="searchbox-suggestion"]',
    '#suggestions'
  ].join(', ');

  // كاش للنتائج السابقة — تجنب إعادة الفحص
  var _excludedCache = new WeakMap();
  var _excludedCacheVersion = 1;

  // #6: كاش منفصل لنتائج isSafeToApplyRTL — تجنب إعادة استدعاء getComputedStyle
  var _safeCache = new WeakMap();
  var _safeCacheVersion = 1;

  // سمة لتعليم العناصر المعالجة
  var MARKER_ATTR = 'data-fluent-rtl-dir';
  var ORIGINAL_DIR_ATTR = 'data-fluent-rtl-original-dir';
  var ORIGINAL_STYLE_ATTR = 'data-fluent-rtl-original-style';
  var INPUT_MARKER_ATTR = 'data-fluent-rtl-input';

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

      // #49: فحص هرمي سريع لحاويات اقتراحات البحث
      if (el.closest && el.closest('.sbqs_c, [class*="sbqs_"], [class*="SearchboxComponentSuggestion"], .sbsb_c, #suggestions')) {
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
      var getCS = (typeof window !== 'undefined' && window.getComputedStyle) ? window.getComputedStyle : (typeof getComputedStyle !== 'undefined' ? getComputedStyle : null);
      if (!getCS) return true;
      var style = getCS(el);
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
   * #37: معالجة قائمة — تُقلب إلى RTL إذا كان محتواها عربياً
   * (النقاط والأرقام تنقلب لليمين مع direction: rtl على الحاوية)
   * @param {Element} el
   */
  function processListEl(el) {
    if (!el || el.hasAttribute(MARKER_ATTR) || el.hasAttribute('data-fluent-rtl-skip')) return;

    // فلتر الأمان
    if (!isSafeToApplyRTL(el)) return;

    // فحص هل القائمة فيها محتوى عربي فعلي
    var text = el.textContent || '';
    if (!text.trim() || !detector.hasArabicContent(text)) return;

    // ليست قائمة إلا إذا فيها عناصر li فعلياً
    var hasItems = false;
    try {
      hasItems = !!(el.querySelector && el.querySelector(':scope > li'));
    } catch (e) {
      hasItems = el.children && el.children.length > 0;
    }
    if (!hasItems) return;

    // حفظ القيمة الأصلية ثم التطبيق
    var originalDir = el.getAttribute('dir') || '';
    el.setAttribute(ORIGINAL_DIR_ATTR, originalDir);
    el.setAttribute(MARKER_ATTR, 'rtl');
    el.setAttribute('dir', 'rtl');
    el.style.setProperty('unicode-bidi', 'isolate', '');
  }

  /**
   * معالجة كل القوائم داخل جذر معين
   * @param {Element|Document} root
   */
  function processListsIn(root) {
    if (!root || !root.querySelectorAll) return;
    var lists = root.querySelectorAll(LIST_SELECTORS);
    for (var i = 0; i < lists.length; i++) {
      processListEl(lists[i]);
    }
  }

  /**
   * حفظ أنماط CSS المباشرة الأصلية لحقل الإدخال قبل تعديلها
   * @param {Element} el
   */
  function saveInputStyles(el) {
    if (!el || !el.style) return;
    try {
      var origStyles = {
        direction: el.style.getPropertyValue('direction') || '',
        directionPriority: el.style.getPropertyPriority('direction') || '',
        textAlign: el.style.getPropertyValue('text-align') || '',
        textAlignPriority: el.style.getPropertyPriority('text-align') || '',
        unicodeBidi: el.style.getPropertyValue('unicode-bidi') || '',
        unicodeBidiPriority: el.style.getPropertyPriority('unicode-bidi') || ''
      };
      el.setAttribute(ORIGINAL_STYLE_ATTR, JSON.stringify(origStyles));
    } catch (e) {
      /* ignore */
    }
  }

  /**
   * استعادة أنماط CSS المباشرة الأصلية لحقل الإدخال
   * @param {Element} el
   */
  function restoreInputStyles(el) {
    if (!el || !el.style) return;
    var savedStyleStr = el.getAttribute(ORIGINAL_STYLE_ATTR);
    if (savedStyleStr) {
      try {
        var savedStyles = JSON.parse(savedStyleStr);
        if (savedStyles.direction) {
          el.style.setProperty('direction', savedStyles.direction, savedStyles.directionPriority || '');
        } else {
          el.style.removeProperty('direction');
        }
        if (savedStyles.textAlign) {
          el.style.setProperty('text-align', savedStyles.textAlign, savedStyles.textAlignPriority || '');
        } else {
          el.style.removeProperty('text-align');
        }
        if (savedStyles.unicodeBidi) {
          el.style.setProperty('unicode-bidi', savedStyles.unicodeBidi, savedStyles.unicodeBidiPriority || '');
        } else {
          el.style.removeProperty('unicode-bidi');
        }
      } catch (e) {
        el.style.removeProperty('direction');
        el.style.removeProperty('text-align');
        el.style.removeProperty('unicode-bidi');
      }
      el.removeAttribute(ORIGINAL_STYLE_ATTR);
    } else {
      el.style.removeProperty('direction');
      el.style.removeProperty('text-align');
      el.style.removeProperty('unicode-bidi');
    }
  }

  /**
   * معالجة حقل إدخال (input / textarea / contenteditable)
   * يضبط الاتجاه ديناميكياً بناءً على نسبة المحتوى العربي
   * حتى وإن بدأت الجملة بكلمة إنجليزية (مثل: System Partitions في المعلومات...)
   * @param {Element} el
   */
  function handleInputElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;

    var tagName = el.tagName ? el.tagName.toUpperCase() : '';
    var isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';
    var isEditable = el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === '';
    if (!isInput && !isEditable) return;

    if (tagName === 'INPUT') {
      var type = (el.getAttribute('type') || 'text').toLowerCase();
      if (type === 'password' || type === 'email' || type === 'url' || type === 'tel' || type === 'number') {
        return;
      }
    }

    var text = isInput ? (el.value || '') : (el.innerText || el.textContent || '');
    var trimmed = text.trim();

    if (!trimmed) {
      if (el.hasAttribute(INPUT_MARKER_ATTR)) {
        var originalDir = el.getAttribute(ORIGINAL_DIR_ATTR);
        if (originalDir !== null && originalDir !== '') {
          el.setAttribute('dir', originalDir);
        } else {
          el.removeAttribute('dir');
        }
        el.removeAttribute(INPUT_MARKER_ATTR);
        el.removeAttribute(ORIGINAL_DIR_ATTR);
        restoreInputStyles(el);
      }
      return;
    }

    if (!el.hasAttribute(ORIGINAL_DIR_ATTR)) {
      el.setAttribute(ORIGINAL_DIR_ATTR, el.getAttribute('dir') || '');
    }

    if (!el.hasAttribute(ORIGINAL_STYLE_ATTR)) {
      saveInputStyles(el);
    }

    var dir = detector.detectDirection(trimmed);
    var hasArabic = detector.hasArabicContent(trimmed);

    // إذا كانت النسبة عربية غالبة (>30%) أو نص هجين فيه عربي مع كلمات إنجليزية أولى
    if (dir === 'rtl' || (dir === 'auto' && hasArabic)) {
      el.setAttribute('dir', 'rtl');
      el.setAttribute(INPUT_MARKER_ATTR, 'rtl');
      el.style.setProperty('direction', 'rtl', 'important');
      el.style.setProperty('text-align', 'right', 'important');
      el.style.setProperty('unicode-bidi', 'isolate', 'important');
    } else {
      // إنجليزي خالص أو لا عربي فيه
      el.setAttribute('dir', 'ltr');
      el.setAttribute(INPUT_MARKER_ATTR, 'ltr');
      el.style.setProperty('direction', 'ltr', 'important');
      el.style.setProperty('text-align', 'left', 'important');
      el.style.setProperty('unicode-bidi', 'isolate', 'important');
    }
  }

  /**
   * معالجة كل حقول الإدخال داخل جذر معين
   * @param {Element|Document} root
   */
  function processInputsIn(root) {
    if (!root || !root.querySelectorAll) return;
    var inputs = root.querySelectorAll('textarea, input, [contenteditable="true"], [contenteditable=""]');
    for (var i = 0; i < inputs.length; i++) {
      handleInputElement(inputs[i]);
    }
  }

  /**
   * معالجة عنصر واحد
   * @param {Element} el
   * @param {boolean} skipDirectTextCheck - تخطي فحص النص المباشر
   */
  function processElement(el, skipDirectTextCheck) {
    if (!el || isExcluded(el)) return;
    var currentMarker = el.getAttribute(MARKER_ATTR);
    if (currentMarker === 'rtl') return;

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

    // إذا كان موسوماً بـ auto والاتجاه الجديد ليس rtl → لا داعي لإعادة العمل
    if (currentMarker === 'auto' && dir !== 'rtl') return;

    // حفظ القيمة الأصلية
    if (!el.hasAttribute(ORIGINAL_DIR_ATTR)) {
      var originalDir = el.getAttribute('dir') || '';
      el.setAttribute(ORIGINAL_DIR_ATTR, originalDir);
    }
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
        } else if (PARAGRAPH_TAGS[el.tagName] && isParagraphWithArabic(el)) {
          // #43: فقرة بلا نص مباشر (بنية متداخلة) — تُوسم ببالغية النسبة
          processElement(el, true);
        }
      }

      processed = end;

      if (processed < total) {
        requestAnimationFrame(processBatch);
      } else {
        // #37: معالجة القوائم بعد العناصر النصية (تنقلب النقاط لليمين)
        processListsIn(root);
        // معالجة حقول الإدخال الأولية
        processInputsIn(root);
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

    // استعادة حقول الإدخال
    var inputElements = root.querySelectorAll('[' + INPUT_MARKER_ATTR + ']');
    inputElements.forEach(function (el) {
      var originalDir = el.getAttribute(ORIGINAL_DIR_ATTR) || '';
      if (originalDir) {
        el.setAttribute('dir', originalDir);
      } else {
        el.removeAttribute('dir');
      }
      el.removeAttribute(INPUT_MARKER_ATTR);
      el.removeAttribute(ORIGINAL_DIR_ATTR);
      restoreInputStyles(el);
    });

    var leftoverStyledInputs = root.querySelectorAll('[' + ORIGINAL_STYLE_ATTR + ']');
    leftoverStyledInputs.forEach(function (el) {
      restoreInputStyles(el);
    });
  }

  /**
   * #43: فقرة (p/h1-6/li...) تحمل محتوى عربياً فعلياً — تُوسم بالغالبية
   * حتى لو لم يكن النص مباشراً داخل العنصر (بنى markdown متداخلة)
   * @param {Element} el
   */
  function isParagraphWithArabic(el) {
    var text = el.textContent || '';
    if (!text.trim()) return false;
    return detector.hasArabicContent(text);
  }

  /**
   * معالجة عنصر واحد (واجهة عامة) — يعالج النص والقوائم داخله
   * @param {Element} el
   */
  function processSingleElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;

    // #37: معالجة قوائم — العنصر نفسه أو أي ul/ol داخله
    try {
      if (el.matches && el.matches(LIST_SELECTORS)) {
        processListEl(el);
      }
    } catch (e) { /* ignore */ }

    try {
      var lists = el.querySelectorAll(LIST_SELECTORS);
      for (var li = 0; li < lists.length; li++) {
        processListEl(lists[li]);
      }
    } catch (e) { /* ignore */ }

    try {
      if (el.matches && el.matches(TEXT_SELECTORS) && hasDirectText(el)) {
        processElement(el, false);
      } else if (el.matches && el.matches(TEXT_SELECTORS) && PARAGRAPH_TAGS[el.tagName] && isParagraphWithArabic(el)) {
        // #43: فقرة بلا نص مباشر
        processElement(el, true);
      }
    } catch (e) { /* ignore */ }

    try {
      var children = el.querySelectorAll(TEXT_SELECTORS);
      children.forEach(function (child) {
        if (hasDirectText(child)) {
          processElement(child, false);
        } else if (PARAGRAPH_TAGS[child.tagName] && isParagraphWithArabic(child)) {
          processElement(child, true);
        }
      });
    } catch (e) { /* ignore */ }
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
    processList: processListEl,
    handleInput: handleInputElement,
    processInputs: processInputsIn,
    clearExcludedCache: clearExcludedCache,
    TEXT_SELECTORS: TEXT_SELECTORS,
    EXCLUDE_SELECTORS: EXCLUDE_SELECTORS,
    LIST_SELECTORS: LIST_SELECTORS,
    MARKER_ATTR: MARKER_ATTR,
    INPUT_MARKER_ATTR: INPUT_MARKER_ATTR
  };
})();
