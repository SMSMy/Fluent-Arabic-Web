/**
 * lib/shadow-dom-traverser.js — Recursive traversal لـ Shadow DOM
 *
 * يوفر:
 * - process(shadowRoot): معالجة shadow root كامل
 * - observe(shadowRoot): مراقبة تغييرات DOM داخل shadow root
 * - disconnectAll(): إيقاف كل المراقبين
 *
 * الآلية:
 * - يستمع لـ CustomEvent 'fluent-shadow-attached' من Main World
 * - يعالج كل shadowRoot بنفس منطق bidi-fix
 * - يُعدّ MutationObserver لكل shadowRoot
 */
(function () {
  'use strict';

  window.FluentRTL = window.FluentRTL || {};

  var bidiFix = window.FluentRTL.bidiFix;

  // مراقبو MutationObserver لكل shadowRoot
  var observers = new Map();

  // #2: مصفوفات لتجميع mutations لكل shadowRoot أثناء فترة الـ debounce
  var debounceTimers = new Map();
  var pendingMutationsMap = new Map();
  // #16: تقليل الـ debounce من 300ms إلى 100ms
  var DEBOUNCE_DELAY = 100;

  /**
   * معالجة shadow root كامل (recursive)
   * @param {ShadowRoot} shadowRoot
   */
  function process(shadowRoot) {
    if (!shadowRoot) return;

    try {
      // تطبيق bidi fix على العناصر داخل shadowRoot
      if (bidiFix && bidiFix.apply) {
        bidiFix.apply(shadowRoot, null);
      }

      // البحث عن shadow roots متداخلة (nested)
      var allElements = shadowRoot.querySelectorAll('*');
      for (var i = 0; i < allElements.length; i++) {
        if (allElements[i].shadowRoot) {
          process(allElements[i].shadowRoot);
        }
      }
    } catch (e) {
      console.warn('[FluentRTL] Shadow DOM traversal error:', e.message);
    }
  }

  /**
   * مراقبة تغييرات DOM داخل shadow root
   * @param {ShadowRoot} shadowRoot
   */
  function observe(shadowRoot) {
    if (!shadowRoot || observers.has(shadowRoot)) return;

    try {
      var observer = new MutationObserver(function (mutations) {
        // #2: تجميع كل الدفعات في مصفوفة واحدة per shadow root
        var existing = pendingMutationsMap.get(shadowRoot) || [];
        existing.push.apply(existing, mutations);
        pendingMutationsMap.set(shadowRoot, existing);

        var timerId = debounceTimers.get(shadowRoot);
        if (timerId) clearTimeout(timerId);

        debounceTimers.set(shadowRoot, setTimeout(function () {
          debounceTimers.delete(shadowRoot);
          var toProcess = pendingMutationsMap.get(shadowRoot) || [];
          pendingMutationsMap.delete(shadowRoot);
          handleMutations(toProcess, shadowRoot);
        }, DEBOUNCE_DELAY));
      });

      observer.observe(shadowRoot, {
        childList: true,
        subtree: true,
        characterData: true
      });

      observers.set(shadowRoot, observer);
    } catch (e) {
      console.warn('[FluentRTL] Shadow DOM observe error:', e.message);
    }
  }

  /**
   * معالجة mutations داخل shadow root
   * @param {MutationRecord[]} mutations
   * @param {ShadowRoot} shadowRoot
   */
  function handleMutations(mutations, shadowRoot) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      for (var j = 0; j < mutation.addedNodes.length; j++) {
        var node = mutation.addedNodes[j];
        if (node.nodeType === Node.ELEMENT_NODE) {
          // #13: فحص مبكر للتخطي
          if (bidiFix && bidiFix.processElement && !node.hasAttribute(bidiFix.MARKER_ATTR)) {
            bidiFix.processElement(node);
          }
          // فحص shadow roots جديدة
          if (node.shadowRoot) {
            process(node.shadowRoot);
            observe(node.shadowRoot);
          }
        }
      }

      // معالجة تغييرات النص
      if (mutation.type === 'characterData' && mutation.target.parentElement) {
        var parentEl = mutation.target.parentElement;
        if (bidiFix && bidiFix.processElement && !parentEl.hasAttribute(bidiFix.MARKER_ATTR)) {
          bidiFix.processElement(parentEl);
        }
      }
    }
  }

  /**
   * إيقاف كل المراقبين وتنظيف الـ timers والـ pending mutations
   */
  function disconnectAll() {
    observers.forEach(function (observer) {
      try {
        observer.disconnect();
      } catch (e) {
        // تجاهل
      }
    });
    observers.clear();

    debounceTimers.forEach(function (timerId) {
      clearTimeout(timerId);
    });
    debounceTimers.clear();

    // #2: تنظيف مصفوفات الـ mutations المعلقة
    pendingMutationsMap.clear();
  }

  /**
   * إزالة RTL من كل shadow roots
   * ⚠️ تجمع الـ roots قبل disconnectAll — وإلا observers.clear() يفرغ الخريطة
   */
  function revertAll() {
    // جمع كل shadowRoots من الـ observers المسجلة BEFORE disconnectAll
    var processedRoots = [];
    observers.forEach(function (_observer, root) {
      processedRoots.push(root);
    });

    // الآن افصل المراقبين
    disconnectAll();

    // معالجة كل shadowRoot
    for (var i = 0; i < processedRoots.length; i++) {
      try {
        bidiFix.revert(processedRoots[i]);
      } catch (e) {
        // تجاهل
      }
    }

    // فحص nested shadows داخل الـ roots المعالجة فقط
    for (var j = 0; j < processedRoots.length; j++) {
      try {
        var allElements = processedRoots[j].querySelectorAll('*');
        for (var k = 0; k < allElements.length; k++) {
          if (allElements[k].shadowRoot) {
            bidiFix.revert(allElements[k].shadowRoot);
          }
        }
      } catch (e) {
        // تجاهل
      }
    }
  }

  // تصدير
  window.FluentRTL.shadowDOMTraverser = {
    process: process,
    observe: observe,
    disconnectAll: disconnectAll,
    revertAll: revertAll
  };
})();