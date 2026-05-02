/**
 * shadow-patch.js — يُحمَّل في document_start مع world: MAIN
 * يعمل في Main World → يُعدّل attachShadow فعلياً للصفحة
 * 
 * الوظيفة:
 * 1. Patch Element.prototype.attachShadow لتسجيل كل shadow root
 * 2. تخزين shadowRoots في window.__fluentShadowRoots (Main World)
 * 3. إرسال CustomEvent عند كل shadow root جديدة (يعبر الـ worlds)
 * 4. الاستجابة لطلبات content.js لمعالجة shadowRoots الموجودة
 * 5. تنظيف shadowRoots الميتة تلقائياً
 */
(function () {
  'use strict';

  // Set عالمي في Main World — content.js (Isolated) لا يستطيع الوصول مباشرة
  window.__fluentShadowRoots = new Set();

  // حفظ الدالة الأصلية
  var originalAttachShadow = Element.prototype.attachShadow;

  // تعديل attachShadow لتسجيل كل shadow root
  Element.prototype.attachShadow = function (init) {
    var shadowRoot = originalAttachShadow.call(this, init);
    window.__fluentShadowRoots.add(shadowRoot);

    // تنظيف shadowRoots الميتة
    _cleanupDeadRoots();

    // CustomEvent على document — يعبر الـ worlds تلقائياً!
    // content.js في Isolated World يستطيع الاستماع لهذا الحدث
    try {
      if (document && document.dispatchEvent) {
        document.dispatchEvent(new CustomEvent('fluent-shadow-attached', {
          detail: { hostTagName: this.tagName, shadowRoot: shadowRoot }
        }));
      }
    } catch (e) {
      // تجاهل الأخطاء (مثلاً في صفحات مقيدة)
    }

    return shadowRoot;
  };

  /**
   * تنظيف shadowRoots التي لم تعد متصلة بالـ DOM
   * يُستدعى عند كل attachShadow جديد
   */
  function _cleanupDeadRoots() {
    var toRemove = [];
    window.__fluentShadowRoots.forEach(function (root) {
      try {
        // إذا host لا يزال في الـ DOM
        if (root.host && root.host.isConnected) return;
        toRemove.push(root);
      } catch (e) {
        // root ميت أو غير قابل للوصول
        toRemove.push(root);
      }
    });
    for (var i = 0; i < toRemove.length; i++) {
      window.__fluentShadowRoots.delete(toRemove[i]);
    }
  }

  // الاستجابة لطلب content.js لمعالجة shadowRoots الموجودة مسبقاً
  if (document) {
    document.addEventListener('fluent-shadow-request-existing', function () {
      window.__fluentShadowRoots.forEach(function (root) {
        try {
          // فحص هل الـ root لا يزال حياً
          if (!root.host || !root.host.isConnected) return;

          document.dispatchEvent(new CustomEvent('fluent-shadow-attached', {
            detail: {
              hostTagName: root.host ? root.host.tagName : 'UNKNOWN',
              shadowRoot: root
            }
          }));
        } catch (e) {
          // تجاهل الأخطاء
        }
      });
    });
  }
})();
