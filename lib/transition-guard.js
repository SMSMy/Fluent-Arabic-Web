/**
 * lib/transition-guard.js — منع CSS Transitions أثناء تطبيق RTL
 * 
 * يوفر:
 * - freeze(): تجميد كل transitions في الصفحة
 * - unfreeze(): إعادة transitions بعد المدة المحسوبة
 * - calculateMaxTransitionDuration(): قراءة ديناميكية لأكبر مدة
 * 
 * النهج: قراءة ديناميكية للمدة الفعلية × 2 + 100ms هامش
 */
(function () {
  'use strict';

  window.FluentRTL = window.FluentRTL || {};

  var FREEZE_CLASS = 'fluent-rtl-freeze';
  var freezeStyleEl = null;
  var unfreezeTimer = null;

  /**
   * تحويل نص الوقت إلى ميلي ثانية
   * @param {string} timeStr - "0.3s", "300ms", "0s"
   * @returns {number} ميلي ثانية
   */
  function parseTimeToMs(timeStr) {
    if (!timeStr || timeStr === '0s' || timeStr === '0ms' || timeStr === 'initial' || timeStr === 'inherit') return 0;
    if (timeStr.endsWith('ms')) return parseFloat(timeStr) || 0;
    if (timeStr.endsWith('s')) return (parseFloat(timeStr) || 0) * 1000;
    return 0;
  }

  /**
   * حساب أكبر مدة transition فعلي في الصفحة
   * عينة ذكية: عناصر الـ layout الرئيسية فقط
   * @returns {number} ميلي ثانية
   */
  function calculateMaxTransitionDuration() {
    var LAYOUT_SELECTORS = [
      'header', 'nav', 'aside',
      '[class*="sidebar"]', '[class*="Sidebar"]',
      '[class*="menu"]', '[class*="Menu"]',
      '[class*="drawer"]', '[class*="Drawer"]',
      '[class*="panel"]', '[class*="Panel"]',
      '[class*="modal"]', '[class*="Modal"]',
      '[class*="tooltip"]', '[class*="Tooltip"]',
      '[class*="dropdown"]', '[class*="Dropdown"]',
      '[class*="popover"]', '[class*="Popover"]',
      '[class*="slide"]', '[class*="Slide"]',
      '[class*="fade"]', '[class*="Fade"]',
      '[class*="collapse"]', '[class*="Collapse"]',
      '[class*="expand"]', '[class*="Expand"]',
      '[class*="transition"]', '[class*="Transition"]',
      '[class*="animation"]', '[class*="Animation"]'
    ].join(', ');

    var maxDuration = 0;

    // عينة ذكية: عناصر الـ layout فقط
    var sample;
    try {
      sample = document.querySelectorAll(LAYOUT_SELECTORS);
    } catch (e) {
      sample = [];
    }

    // أضف body و html كمرجع
    var allElements = [];
    for (var _i = 0; _i < sample.length; _i++) { allElements.push(sample[_i]); }
    allElements.push(document.body, document.documentElement);
    allElements = allElements.filter(Boolean);

    for (var _j = 0; _j < allElements.length; _j++) {
      var el = allElements[_j];
      try {
        var style = getComputedStyle(el);
        var transitionDuration = style.transitionDuration || '0s';
        var transitionDelay = style.transitionDelay || '0s';

        // تحليل كل duration (قد يكون متعدد: "0.3s, 0.5s")
        var durations = transitionDuration.split(',').map(function (d) { return parseTimeToMs(d.trim()); });
        var delays = transitionDelay.split(',').map(function (d) { return parseTimeToMs(d.trim()); });

        for (var i = 0; i < durations.length; i++) {
          var total = durations[i] + (delays[i] || 0);
          if (total > maxDuration) maxDuration = total;
        }
      } catch (e) {
        // تجاهل العناصر التي لا يمكن قراءة أنماطها
      }
    }

    // المدة النهائية = أكبر مدة × 2 + 100ms هامش
    return (maxDuration * 2) + 100;
  }

  /**
   * تجميد كل transitions في الصفحة
   * يُستدعى قبل تطبيق RTL
   */
  function freeze() {
    // إزالة أي تجميد سابق فوراً بدون جدولة unfreeze جديد
    if (unfreezeTimer) {
      clearTimeout(unfreezeTimer);
      unfreezeTimer = null;
    }
    document.documentElement.classList.remove(FREEZE_CLASS);
    if (freezeStyleEl && freezeStyleEl.parentNode) {
      freezeStyleEl.parentNode.removeChild(freezeStyleEl);
    }
    freezeStyleEl = null;

    // إنشاء عنصر style لتجميد transitions
    freezeStyleEl = document.createElement('style');
    freezeStyleEl.id = 'fluent-rtl-freeze-style';
    freezeStyleEl.textContent = [
      'html.' + FREEZE_CLASS + ' *,',
      'html.' + FREEZE_CLASS + ' *::before,',
      'html.' + FREEZE_CLASS + ' *::after {',
      '  transition: none !important;',
      '  animation: none !important;',
      '}'
    ].join('\n');

    document.head.appendChild(freezeStyleEl);

    // إضافة class على html
    document.documentElement.classList.add(FREEZE_CLASS);

    // Force reflow لضمان تطبيق التجمد
    void document.documentElement.offsetHeight;
  }

  /**
   * إعادة transitions بعد المدة المحسوبة
   * @param {number} [customDuration] - مدة مخصصة (ميلي ثانية)
   */
  function unfreeze(customDuration) {
    // إلغاء أي مؤقت سابق
    if (unfreezeTimer) {
      clearTimeout(unfreezeTimer);
      unfreezeTimer = null;
    }

    // حساب المدة
    var duration = typeof customDuration === 'number'
      ? customDuration
      : calculateMaxTransitionDuration();

    // جدولة إزالة التجمد
    unfreezeTimer = setTimeout(function () {
      // Force reflow قبل إزالة التجمد
      void document.documentElement.offsetHeight;

      // استخدام requestAnimationFrame لضمان تطبيق التغييرات
      requestAnimationFrame(function () {
        // إزالة class التجمد
        document.documentElement.classList.remove(FREEZE_CLASS);

        // إزالة عنصر style
        if (freezeStyleEl && freezeStyleEl.parentNode) {
          freezeStyleEl.parentNode.removeChild(freezeStyleEl);
        }
        freezeStyleEl = null;
        unfreezeTimer = null;
      });
    }, Math.max(duration, 50)); // لا تقل عن 50ms
  }

  /**
   * إزالة التجمد فوراً بدون انتظار
   */
  function forceUnfreeze() {
    if (unfreezeTimer) {
      clearTimeout(unfreezeTimer);
      unfreezeTimer = null;
    }

    document.documentElement.classList.remove(FREEZE_CLASS);

    if (freezeStyleEl && freezeStyleEl.parentNode) {
      freezeStyleEl.parentNode.removeChild(freezeStyleEl);
    }
    freezeStyleEl = null;
  }

  // تصدير
  window.FluentRTL.transitionGuard = {
    freeze: freeze,
    unfreeze: unfreeze,
    forceUnfreeze: forceUnfreeze,
    calculateMaxTransitionDuration: calculateMaxTransitionDuration,
    FREEZE_CLASS: FREEZE_CLASS
  };
})();
