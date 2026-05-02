/**
 * lib/transform-fixer.js — إصلاح CSS Transforms
 *
 * النهج: لا نلمس layout المواقع.
 * إذا اكتشفنا أن عنصر نصي لديه transform، نتجاهله ولا نطبق عليه RTL.
 *
 * يوفر:
 * - hasTransform(el): فحص هل العنصر لديه transform
 * - scanForTransformConflicts(root): فحص العناصر المعالجة
 */
(function () {
  'use strict';

  window.FluentRTL = window.FluentRTL || {};

  /**
   * فحص هل العنصر لديه transform فعلي (ليس none)
   * @param {Element} el
   * @returns {boolean}
   */
  function hasTransform(el) {
    if (!el || !el.nodeType || el.nodeType !== Node.ELEMENT_NODE) return false;
    try {
      var style = getComputedStyle(el);
      return style.transform && style.transform !== 'none';
    } catch (e) {
      return false;
    }
  }

  /**
   * فحص هل العنصر لديه translateX قد يتعارض مع RTL
   * @param {Element} el
   * @returns {boolean}
   */
  function hasTranslateX(el) {
    if (!el || !el.nodeType || el.nodeType !== Node.ELEMENT_NODE) return false;
    try {
      var style = getComputedStyle(el);
      var transform = style.transform;
      if (!transform || transform === 'none') return false;

      // matrix(a, b, c, d, tx, ty) — tx is the X translation
      if (transform.startsWith('matrix(')) {
        var values = transform.match(/matrix\(([^)]+)\)/);
        if (values) {
          var parts = values[1].split(',').map(function (v) { return parseFloat(v.trim()); });
          // parts[4] is tx (translateX)
          if (parts.length >= 6 && Math.abs(parts[4]) > 1) {
            return true;
          }
        }
      }

      // matrix3d: tx at index 12
      if (transform.startsWith('matrix3d(')) {
        var values3d = transform.match(/matrix3d\(([^)]+)\)/);
        if (values3d) {
          var parts3d = values3d[1].split(',').map(function (v) { return parseFloat(v.trim()); });
          if (parts3d.length >= 16 && Math.abs(parts3d[12]) > 1) {
            return true;
          }
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * فحص العناصر المعالجة هل لديها تعارضات transform
   * يُستدعى بعد applyBidiFix
   * @param {Element|Document} root
   * @returns {number} عدد العناصر التي تم إلغاء معالجتها
   */
  function scanForTransformConflicts(root) {
    root = root || document;
    if (!root.querySelectorAll) return 0;

    var MARKER_ATTR = 'data-fluent-rtl-dir';
    var processed = root.querySelectorAll('[' + MARKER_ATTR + ']');
    var reverted = 0;

    processed.forEach(function (el) {
      if (hasTranslateX(el)) {
        var originalDir = el.getAttribute('data-fluent-rtl-original-dir') || '';
        if (originalDir) {
          el.setAttribute('dir', originalDir);
        } else {
          el.removeAttribute('dir');
        }

        if (el.style.getPropertyValue('unicode-bidi')) {
          el.style.removeProperty('unicode-bidi');
        }

        el.removeAttribute(MARKER_ATTR);
        el.removeAttribute('data-fluent-rtl-original-dir');
        el.setAttribute('data-fluent-rtl-skip', 'transform');
        reverted++;
      }
    });

    return reverted;
  }

  // تصدير
  window.FluentRTL.transformFixer = {
    hasTransform: hasTransform,
    hasTranslateX: hasTranslateX,
    scanForTransformConflicts: scanForTransformConflicts
  };
})();
