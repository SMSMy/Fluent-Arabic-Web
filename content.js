/**
 * content.js — المنطق الرئيسي للإضافة (Content Script)
 *
 * المسؤوليات:
 * 1. استقبال الإعدادات من background.js
 * 2. كشف المحتوى العربي
 * 3. تجميد transitions
 * 4. تطبيق RTL على النصوص
 * 5. معالجة Shadow DOM
 * 6. حقن الخطوط والأنماط
 * 7. تطبيق إصلاحات الموقع
 * 8. إعداد MutationObserver + IntersectionObserver
 * 9. إزالة كل شيء عند التعطيل
 */
(function () {
  'use strict';

  // === المراجع ===
  var detector = window.FluentRTL.detector;
  var bidiFix = window.FluentRTL.bidiFix;
  var transitionGuard = window.FluentRTL.transitionGuard;
  var transformFixer = window.FluentRTL.transformFixer;
  var shadowDOMTraverser = window.FluentRTL.shadowDOMTraverser;
  var siteProfiles = window.FluentRTL.siteProfiles;

  // === الإعدادات الافتراضية المحلية ===
  var DEFAULT_SETTINGS = {
    enabled: true,
    autoDetect: true,
    detectionThreshold: 0.15,
    font: 'thmanyah',
    customFonts: [],
    whitelist: [],
    blacklist: [],
    perSite: {}
  };

  // === الحالة ===
  var isActive = false;
  var isManualOverride = false;
  var settings = Object.assign({}, DEFAULT_SETTINGS);

  // === عناصر DOM المُدارة ===
  var injectedElements = []; // عناصر style و link المحقونة
  var mainObserver = null;   // MutationObserver الرئيسي
  var lazyObserver = null;   // IntersectionObserver للمعالجة الكسولة
  var debounceTimer = null;  // Debounce timer
  // #16: تقليل الـ debounce من 300ms إلى 100ms لتحسين تجربة مواقع الـ streaming
  var DEBOUNCE_DELAY = 100;

  // #1: مصفوفة لتجميع mutations أثناء فترة الـ debounce
  var pendingMutations = [];

  // === CSS Class Marker ===
  var ACTIVE_CLASS = 'fluent-rtl-active';

  // مرجع مستمع Shadow DOM للتنظيف
  var _shadowAttachedHandler = null;

  // =========================================================================
  // 1. استقبال الإعدادات من background.js
  // =========================================================================

  function loadSettings() {
    return new Promise(function (resolve) {
      chrome.storage.sync.get('fluentRTLSettings', function (result) {
        // #4: إنشاء نسخة جديدة بالكامل بدل تعديل الـ object الأصلي
        // يضمن دائماً الحصول على قيم افتراضية للخصائص المفقودة
        settings = Object.assign({}, DEFAULT_SETTINGS, result.fluentRTLSettings || {});
        resolve(settings);
      });
    });
  }

  function applySettingsFromMessage(newSettings) {
    // #21: تطبيق الإعدادات مباشرة من الرسالة بدل قراءتها من storage
    settings = Object.assign({}, DEFAULT_SETTINGS, newSettings);
  }

  function matchesHostnamePattern(hostname, pattern) {
    if (!hostname || !pattern || typeof pattern !== 'string') return false;
    hostname = hostname.toLowerCase();
    pattern = pattern.trim().toLowerCase();

    if (pattern.indexOf('://') !== -1) {
      try {
        pattern = new URL(pattern).hostname.toLowerCase();
      } catch (e) {
        return false;
      }
    }

    if (pattern.indexOf('/') !== -1) return false;
    if (pattern.indexOf('*.') === 0) {
      var base = pattern.substring(2);
      return hostname === base || hostname.endsWith('.' + base);
    }

    return hostname === pattern;
  }

  function isHostnameInList(hostname, list) {
    if (!hostname || !Array.isArray(list)) return false;
    for (var i = 0; i < list.length; i++) {
      if (matchesHostnamePattern(hostname, list[i])) return true;
    }
    return false;
  }

  // =========================================================================
  // 2. حقن CSS
  // =========================================================================

  function injectCSS(filePath, id) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();

    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(filePath);
    link.setAttribute('data-fluent-rtl', 'true');
    document.head.appendChild(link);
    injectedElements.push(link);
  }

  function injectStyle(css, id) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();

    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    style.setAttribute('data-fluent-rtl', 'true');
    document.head.appendChild(style);
    injectedElements.push(style);
  }

  function injectFont(fontName) {
    if (!fontName || fontName === 'default') return;

    // ترميز المسافات في مسارات الخطوط
    function urlEncodePath(path) {
      return path.replace(/ /g, '%20');
    }

    // خريطة الخطوط المحلية
    var LOCAL_FONTS = {
      // ──────────────────────────────────────────
      // خط ثمانية تايبفيس
      // ──────────────────────────────────────────
      'thmanyah': {
        // يُعالج بشكل خاص — ثلاث عوائل بأدوار مختلفة
        special: 'thmanyah'
      },
      'al-masmak': {
        family: '"FluentAlMasmak"',
        faces: [
          { src: 'fonts/المصمك.otf', weight: 400, style: 'normal' }
        ]
      },
      'al-naseeb': {
        family: '"FluentAlNaseeb"',
        faces: [
          { src: 'fonts/النسيب.otf', weight: 400, style: 'normal' }
        ]
      },
      'al-watad': {
        family: '"FluentAlWatad"',
        faces: [
          { src: 'fonts/الوتد.otf', weight: 400, style: 'normal' }
        ]
      },
      'year-of-poetry': {
        family: '"FluentYearOfPoetry"',
        faces: [
          { src: 'fonts/خط عام الشعر العربي.otf', weight: 400, style: 'normal' }
        ]
      },
      'year-of-handicrafts': {
        family: '"FluentYearOfHandicrafts"',
        faces: [
          { src: 'fonts/OTF/TheYearofHandicrafts-Regular.otf', weight: 400, style: 'normal' },
          { src: 'fonts/OTF/TheYearofHandicrafts-Medium.otf', weight: 500, style: 'normal' },
          { src: 'fonts/OTF/TheYearofHandicrafts-SemiBold.otf', weight: 600, style: 'normal' },
          { src: 'fonts/OTF/TheYearofHandicrafts-Bold.otf', weight: 700, style: 'normal' },
          { src: 'fonts/OTF/TheYearofHandicrafts-Black.otf', weight: 900, style: 'normal' }
        ]
      },
      'al-awwal': {
        family: '"FluentAlAwwal"',
        faces: [
          { src: 'fonts/Al-Awwal for download page/Al-Awwal/Web fonts/WOFF-2-TT/Al-Awwal Web/Al-AwwalWeb-Regular.woff2', weight: 400, style: 'normal', format: 'woff2' },
          { src: 'fonts/Al-Awwal for download page/Al-Awwal/Web fonts/WOFF-2-TT/Al-Awwal Web/Al-AwwalWeb-Bold.woff2', weight: 700, style: 'normal', format: 'woff2' }
        ]
      },
      'saudi': {
        family: '"FluentSaudi"',
        faces: [
          { src: 'fonts/Saudi for download page/Saudi/Web fonts/WOFF-2-TT/Saudi Web/SaudiWeb-Regular.woff2', weight: 400, style: 'normal', format: 'woff2' },
          { src: 'fonts/Saudi for download page/Saudi/Web fonts/WOFF-2-TT/Saudi Web/SaudiWeb-Bold.woff2', weight: 700, style: 'normal', format: 'woff2' }
        ]
      },
      'year-of-camel': {
        family: '"FluentYearOfCamel"',
        faces: [
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-Thin.otf', weight: 100, style: 'normal' },
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-ExtraLight.otf', weight: 200, style: 'normal' },
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-Light.otf', weight: 300, style: 'normal' },
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-Regular.otf', weight: 400, style: 'normal' },
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-Medium.otf', weight: 500, style: 'normal' },
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-Bold.otf', weight: 700, style: 'normal' },
          { src: 'fonts/The Year of The Camel/TheYearofTheCamel-ExtraBold.otf', weight: 800, style: 'normal' }
        ]
      }
    };

    var fontConfig = LOCAL_FONTS[fontName];
    if (!fontConfig) return;

    // ──────────────────────────────────────────
    // معالجة خاصة لخط ثمانية
    // ──────────────────────────────────────────
    if (fontConfig.special === 'thmanyah') {
      var sansUrl     = function(w) { return chrome.runtime.getURL('fonts/thmanyah typeface/thmanyahsans/woff2/thmanyahsans-' + w + '.woff2'); };
      var textUrl     = function(w) { return chrome.runtime.getURL('fonts/thmanyah typeface/thmanyahseriftext/woff2/thmanyahseriftext-' + w + '.woff2'); };
      var displayUrl  = function(w) { return chrome.runtime.getURL('fonts/thmanyah typeface/thmanyahserifdisplay/woff2/thmanyahserifdisplay-' + w + '.woff2'); };

      var weights = [
        { name: 'Light',   w: 300 },
        { name: 'Regular', w: 400 },
        { name: 'Medium',  w: 500 },
        { name: 'Bold',    w: 700 },
        { name: 'Black',   w: 900 }
      ];

      // بناء @font-face لكل عائلة
      var css = '';
      for (var wi = 0; wi < weights.length; wi++) {
        var wt = weights[wi];
        // Sans
        css += '@font-face{font-family:"thmanyah Sans";src:url("' + sansUrl(wt.name) + '")format("woff2");font-weight:' + wt.w + ';font-style:normal;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;}';
        // Serif Text
        css += '@font-face{font-family:"thmanyah Serif Text";src:url("' + textUrl(wt.name) + '")format("woff2");font-weight:' + wt.w + ';font-style:normal;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;}';
        // Serif Display
        css += '@font-face{font-family:"thmanyah Serif Display";src:url("' + displayUrl(wt.name) + '")format("woff2");font-weight:' + wt.w + ';font-style:normal;font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;}';
      }

      // تطبيق الخطوط حسب دور كل عنصر
      // العناوين الرئيسية → Serif Display
      css += 'html.' + ACTIVE_CLASS + ' h1[data-fluent-rtl-dir="rtl"],' +
             'html.' + ACTIVE_CLASS + ' h2[data-fluent-rtl-dir="rtl"],' +
             'html.' + ACTIVE_CLASS + ' h3[data-fluent-rtl-dir="rtl"]{' +
             '  font-family:"thmanyah Serif Display","thmanyah Sans","Segoe UI",Tahoma,sans-serif !important;' +
             '  font-feature-settings:"calt" 1,"liga" 1,"salt" 1,"cswh" 1;' +  /* كشيدة + أحرف مرسلة */
             '}';

      // عناوين ثانوية → Serif Text
      css += 'html.' + ACTIVE_CLASS + ' h4[data-fluent-rtl-dir="rtl"],' +
             'html.' + ACTIVE_CLASS + ' h5[data-fluent-rtl-dir="rtl"],' +
             'html.' + ACTIVE_CLASS + ' h6[data-fluent-rtl-dir="rtl"]{' +
             '  font-family:"thmanyah Serif Text","thmanyah Sans","Segoe UI",Tahoma,sans-serif !important;' +
             '  font-feature-settings:"calt" 1,"liga" 1,"salt" 1;' +
             '}';

      // النصوص العامة (p, li, span, td ...) → Sans
      css += 'html.' + ACTIVE_CLASS + ' [data-fluent-rtl-dir="rtl"]:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6),' +
             'html.' + ACTIVE_CLASS + ' [data-fluent-rtl-dir="auto"]{' +
             '  font-family:"thmanyah Sans","Segoe UI",Tahoma,sans-serif !important;' +
             '  font-feature-settings:"calt" 1,"liga" 1;' +
             '}';

      injectStyle(css, 'fluent-rtl-font-style');
      return;
    }

    // ──────────────────────────────────────────
    // خطوط أخرى — المنطق الأصلي
    // ──────────────────────────────────────────

    // بناء @font-face declarations
    var css = '';
    for (var i = 0; i < fontConfig.faces.length; i++) {
      var face = fontConfig.faces[i];
      var fontUrl = chrome.runtime.getURL(urlEncodePath(face.src));
      var format = face.format || (face.src.endsWith('.ttf') ? 'truetype' : 'opentype');
      css += '@font-face {';
      css += '  font-family: ' + fontConfig.family + ';';
      css += '  src: url("' + fontUrl + '") format("' + format + '");';
      css += '  font-weight: ' + face.weight + ';';
      css += '  font-style: ' + face.style + ';';
      css += '  font-display: swap;';
      css += '  unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;';
      css += '}';
    }

    // تطبيق الخط على العناصر المعالجة
    css += 'html.' + ACTIVE_CLASS + ' [data-fluent-rtl-dir="rtl"],' +
           'html.' + ACTIVE_CLASS + ' [data-fluent-rtl-dir="auto"] {' +
           '  font-family: ' + fontConfig.family + ', "Segoe UI", Tahoma, sans-serif !important;' +
           '}';

    injectStyle(css, 'fluent-rtl-font-style');
  }

  // =========================================================================
  // 3. التفعيل
  // =========================================================================

  /**
   * @param {boolean} force - تجاوز فحص shouldActivate (للتبديل اليدوي)
   */
  function activate(force) {
    if (isActive) return;

    try {
      var hostname = window.location.hostname;

      // فحص القائمة السوداء
      if (isHostnameInList(hostname, settings.blacklist)) return;

      // فحص هل يوجد site profile لهذا الموقع
      var hasProfile = !!siteProfiles.getProfile(hostname);

      // كشف المحتوى العربي — نتخطاه إذا يوجد site profile أو كان تبديل يدوي
      if (!force && !hasProfile && settings.autoDetect) {
        var shouldActivateResult = detector.shouldActivate(settings.detectionThreshold);
        if (!shouldActivateResult) return;
      }

      isActive = true;

      // 1. تجميد transitions
      transitionGuard.freeze();

      // 2. إضافة class marker
      document.documentElement.classList.add(ACTIVE_CLASS);

      // 3. حقن CSS
      injectCSS('styles/base.css', 'fluent-rtl-base-css');
      injectCSS('styles/protection.css', 'fluent-rtl-protection-css');
      injectCSS('styles/fixes.css', 'fluent-rtl-fixes-css');

      // 4. حقن الخط
      injectFont(settings.font);

      // 5. تطبيق bidi fix
      bidiFix.apply(document, function () {
        try {
          // 6. فحص transform conflicts
          transformFixer.scanForTransformConflicts(document);

          // 7. تطبيق site profile
          var profile = siteProfiles.getProfile(hostname);
          if (profile) {
            siteProfiles.applyProfile(profile);
          }

          // 8. معالجة Shadow DOM
          setupShadowDOM();

          // 9. إعادة transitions بعد المدة المحسوبة
          transitionGuard.unfreeze();
        } catch (e) {
          console.warn('[FluentRTL] Post-processing error:', e.message);
          transitionGuard.forceUnfreeze();
        }
      });

      // 10. إعداد MutationObserver
      setupMutationObserver();

      // 11. إعداد IntersectionObserver
      setupLazyProcessing();

      // إعلام background.js
      chrome.runtime.sendMessage({
        type: 'fluent-rtl-status',
        active: true,
        url: window.location.href,
        arabicRatio: detector.getPageArabicRatio()
      });
    } catch (e) {
      console.error('[FluentRTL] Activation error:', e.message);
      transitionGuard.forceUnfreeze();
      document.documentElement.classList.remove(ACTIVE_CLASS);
      isActive = false;
    }
  }

  // =========================================================================
  // 4. التعطيل
  // =========================================================================

  function deactivate(preserveManualOverride) {
    if (!isActive) return;

    isActive = false;
    if (!preserveManualOverride) {
      isManualOverride = false;
    }

    // 1. تجميد transitions
    transitionGuard.freeze();

    // 2. إزالة class marker
    document.documentElement.classList.remove(ACTIVE_CLASS);

    // 3. إزالة bidi fix
    bidiFix.revert(document);

    // 4. إزالة site profile
    siteProfiles.removeProfile();

    // 5. إزالة Shadow DOM processing
    shadowDOMTraverser.disconnectAll();
    shadowDOMTraverser.revertAll();

    // 6. إزالة مستمع Shadow DOM
    if (_shadowAttachedHandler) {
      document.removeEventListener('fluent-shadow-attached', _shadowAttachedHandler);
      _shadowAttachedHandler = null;
    }

    // 7. إزالة MutationObserver
    if (mainObserver) {
      mainObserver.disconnect();
      mainObserver = null;
    }

    // 8. إزالة IntersectionObserver
    if (lazyObserver) {
      lazyObserver.disconnect();
      lazyObserver = null;
    }

    // 9. تنظيف مصفوفة الـ mutations المعلقة
    pendingMutations = [];
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // 10. إزالة العناصر المحقونة
    injectedElements.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    injectedElements = [];

    // 11. إزالة سمات skip
    document.querySelectorAll('[data-fluent-rtl-skip]').forEach(function (el) {
      el.removeAttribute('data-fluent-rtl-skip');
    });

    // 12. تصفية الكاش
    if (detector.invalidateCache) detector.invalidateCache();
    if (bidiFix.clearExcludedCache) bidiFix.clearExcludedCache();

    // 13. إعادة transitions
    transitionGuard.forceUnfreeze();

    // إعلام background.js
    chrome.runtime.sendMessage({
      type: 'fluent-rtl-status',
      active: false,
      url: window.location.href
    });
  }

  // =========================================================================
  // 5. التبديل
  // =========================================================================

  function toggle() {
    if (isActive) {
      deactivate();
    } else {
      isManualOverride = true;
      activate(true);
    }
  }

  // =========================================================================
  // 6. Shadow DOM
  // =========================================================================

  function setupShadowDOM() {
    // إزالة المستمع السابق لمنع التسرب
    if (_shadowAttachedHandler) {
      document.removeEventListener('fluent-shadow-attached', _shadowAttachedHandler);
    }

    // الاستماع لـ shadowRoots جديدة من Main World
    _shadowAttachedHandler = function (e) {
      if (!isActive) return;
      var shadowRoot = e.detail && e.detail.shadowRoot;
      if (shadowRoot) {
        shadowDOMTraverser.process(shadowRoot);
        shadowDOMTraverser.observe(shadowRoot);
      }
    };
    document.addEventListener('fluent-shadow-attached', _shadowAttachedHandler);

    // طلب shadowRoots الموجودة مسبقاً
    document.dispatchEvent(new CustomEvent('fluent-shadow-request-existing', {}));
  }

  // =========================================================================
  // 7. MutationObserver
  // =========================================================================

  function setupMutationObserver() {
    if (mainObserver) mainObserver.disconnect();
    pendingMutations = [];

    mainObserver = new MutationObserver(function (mutations) {
      if (!isActive) return;

      // #1: تجميع كل الدفعات في مصفوفة واحدة
      pendingMutations.push.apply(pendingMutations, mutations);

      // Debounce — يعيد ضبط الـ timer لكنه يحتفظ بكل الـ mutations
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var toProcess = pendingMutations;
        pendingMutations = [];
        debounceTimer = null;
        handleDOMMutations(toProcess);
      }, DEBOUNCE_DELAY);
    });

    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function handleDOMMutations(mutations) {
    for (var m = 0; m < mutations.length; m++) {
      var mutation = mutations[m];

      // معالجة العناصر المضافة
      for (var n = 0; n < mutation.addedNodes.length; n++) {
        var node = mutation.addedNodes[n];
        if (node.nodeType === Node.ELEMENT_NODE) {
          // #13: فحص مبكر — تخطي العناصر المعالجة مسبقاً دون استدعاء getComputedStyle
          if (node.hasAttribute(bidiFix.MARKER_ATTR)) continue;

          bidiFix.processElement(node);

          // معالجة الأبناء النصية
          try {
            var children = node.querySelectorAll(bidiFix.TEXT_SELECTORS);
            for (var c = 0; c < children.length; c++) {
              var child = children[c];
              // #13: فحص مبكر أيضاً للأبناء
              if (!child.hasAttribute(bidiFix.MARKER_ATTR)) {
                bidiFix.processElement(child);
              }
            }
          } catch (e) { /* ignore */ }

          // Shadow root جديدة
          if (node.shadowRoot) {
            shadowDOMTraverser.process(node.shadowRoot);
            shadowDOMTraverser.observe(node.shadowRoot);
          }
        }
      }

      // تغييرات النص
      if (mutation.type === 'characterData' && mutation.target.parentElement) {
        var parentEl = mutation.target.parentElement;
        // #13: فحص مبكر — تخطي المعالجة إذا لم يوجد تغيير محتمل
        if (!parentEl.hasAttribute(bidiFix.MARKER_ATTR)) {
          bidiFix.processElement(parentEl);
        }
      }
    }
  }

  // =========================================================================
  // 8. IntersectionObserver (Lazy Processing)
  // =========================================================================

  function setupLazyProcessing() {
    if (!('IntersectionObserver' in window)) return;

    if (lazyObserver) lazyObserver.disconnect();

    lazyObserver = new IntersectionObserver(function (entries) {
      if (!isActive) return;

      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) {
          var el = entry.target;
          bidiFix.processElement(el);
          lazyObserver.unobserve(el);
        }
      }
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });

    // مراقبة العناصر غير المرئية التي لم تُعالج
    try {
      var unprocessed = document.querySelectorAll(bidiFix.TEXT_SELECTORS);
      for (var i = 0; i < unprocessed.length; i++) {
        var el = unprocessed[i];
        if (!el.hasAttribute(bidiFix.MARKER_ATTR)) {
          lazyObserver.observe(el);
        }
      }
    } catch (e) { /* ignore */ }
  }

  // =========================================================================
  // 9. الرسائل من background.js / popup
  // =========================================================================

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
      case 'fluent-rtl-toggle':
        toggle();
        sendResponse({ active: isActive });
        return false; // sync response

      case 'fluent-rtl-activate':
        isManualOverride = true;
        activate(true);
        sendResponse({ active: isActive });
        return false;

      case 'fluent-rtl-deactivate':
        deactivate();
        sendResponse({ active: isActive });
        return false;

      case 'fluent-rtl-get-status':
        sendResponse({
          active: isActive,
          arabicRatio: detector.getPageArabicRatio(),
          url: window.location.href,
          hostname: window.location.hostname
        });
        return false;

      case 'fluent-rtl-settings-updated':
        var wasManualOverride = isManualOverride;

        // #21: استخدم الإعدادات الواردة في الرسالة مباشرة بدل قراءتها من storage
        if (message.settings) {
          applySettingsFromMessage(message.settings);
        } else {
          // fallback إلى القراءة من storage إذا لم تُرسل الإعدادات
          loadSettings().then(function () {
            if (isActive) {
              deactivate(true);
              if (settings.enabled) activate(wasManualOverride);
            } else if (settings.enabled) {
              activate(wasManualOverride);
            }
          });
          sendResponse({ received: true });
          return true; // async
        }
        if (isActive) {
          deactivate(true);
          if (settings.enabled) activate(wasManualOverride);
        } else if (settings.enabled) {
          activate(wasManualOverride);
        }
        sendResponse({ received: true });
        return false;

      case 'fluent-rtl-update-font':
        if (isActive) {
          injectFont(message.font);
          settings.font = message.font;
        }
        sendResponse({ applied: true });
        return false;

      default:
        // #3: لرسائل غير معروفة — لا نعيد true (لن نستدعي sendResponse لاحقاً)
        return false;
    }
  });

  // =========================================================================
  // 10. التهيئة
  // =========================================================================

  async function init() {
    try {
      await loadSettings();

      var hostname = window.location.hostname;

      // فحص القائمة السوداء — دائماً أولاً
      if (isHostnameInList(hostname, settings.blacklist)) {
        return;
      }

      // فحص القائمة البيضاء — تفعيل مباشر
      if (isHostnameInList(hostname, settings.whitelist)) {
        activate(true);
        return;
      }

      // فحص perSite إعدادات يدوية
      if (settings.perSite && settings.perSite[hostname]) {
        var perSiteConfig = settings.perSite[hostname];
        if (perSiteConfig.enabled === false) return;
        if (perSiteConfig.enabled === true) {
          activate(true);
          return;
        }
      }

      // فحص هل يوجد site profile — يُفعّل بغض النظر عن autoDetect
      var hasProfile = !!siteProfiles.getProfile(hostname);

      // تفعيل: إذا الإضافة مفعّلة AND (يوجد profile OR كشف تلقائي)
      if (settings.enabled && (hasProfile || settings.autoDetect)) {
        activate(false);
      }
    } catch (e) {
      console.warn('[FluentRTL] Init error:', e.message);
    }
  }

  // بدء التهيئة
  init();

  // تصدير حالة للـ debug
  window.FluentRTL.isActive = function () { return isActive; };
  window.FluentRTL.toggle = toggle;
  window.FluentRTL.activate = function () { activate(true); };
  window.FluentRTL.deactivate = deactivate;
})();
