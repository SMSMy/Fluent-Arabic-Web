/**
 * lib/site-profiles.js — إعدادات مخصصة لكل موقع
 *
 * يوفر:
 * - getProfile(hostname): الحصول على إعدادات الموقع
 * - applyProfile(profile): تطبيق إصلاحات الموقع (CSS + selectors)
 * - removeProfile(): إزالة إصلاحات الموقع
 *
 * المواقع المدعومة:
 * - Slack, ChatGPT, Claude, Gemini, NotebookLM, WhatsApp, Perplexity
 * - YouTube, Twitter/X, Facebook, Google, Gmail, Reddit, LinkedIn, GitHub
 *
 * ⚠️ ملاحظة الصيانة:
 * الـ selectors هي CSS/data selectors الخاصة بكل موقع وقد تتغير عند تحديث المواقع.
 * عند فشل profile معين، افحص المحدد في devtools وحدّث الـ targetSelectors هنا.
 *
 * ⚠️ مفاتيح PROFILES:
 * المفتاح الرئيسي يُستخدم كـ fallback match فقط — البحث الفعلي يعتمد على حقل selectors.
 * استخدم أي قيمة وصفية كمفتاح (يفضل أن يكون hostname نموذجي للموقع).
 */
(function () {
  'use strict';

  window.FluentRTL = window.FluentRTL || {};

  var activeProfileId = null;
  var profileStyleEl = null;
  var profileObserver = null;
  var profileTimer = null;
  var appliedElements = [];

  // #7: كاش لنتائج getComputedStyle في applyDirectionToElement
  var _displayCache = new WeakMap();

  // === ملفات المواقع ===
  // ⚠️ المفتاح الرئيسي مجرد معرف — البحث يتم عبر حقل selectors
  var PROFILES = {

    'app.slack.com': {
      id: 'slack',
      loadDelay: 8000,
      selectors: ['www.slack.com', 'app.slack.com'],
      targetSelectors: [
        { selector: '.p-rich_text_block', applyTextAlign: true },
        { selector: '.c-message_kit__gutter', applyTextAlign: true, forceRTL: true },
        { selector: '.ql-editor', applyTextAlign: true }
      ],
      css: ''
    },

    'chatgpt.com': {
      id: 'chatgpt',
      selectors: ['chatgpt.com', 'chat.openai.com'],
      targetSelectors: [
        { selector: '[id^="prompt-textarea"]', applyTextAlign: false },
        { selector: 'span.katex-display', applyTextAlign: true },
        { selector: 'a[data-sidebar-item="true"]', applyTextAlign: true }
      ],
      css: [
        '/* ChatGPT: إصلاح الكود داخل الرسائل */',
        '.markdown-body pre,',
        '.markdown-body code {',
        '  direction: ltr !important;',
        '  text-align: left !important;',
        '}',
        '/* ChatGPT: حماية الـ sidebar */',
        '[data-sidebar-item="true"] {',
        '  unicode-bidi: isolate;',
        '}'
      ].join('\n')
    },

    'claude.ai': {
      id: 'claude',
      loadDelay: 3500,
      selectors: ['claude.ai', 'www.claude.ai'],
      targetSelectors: [
        { selector: '.font-claude-response-body p', applyTextAlign: true },
        { selector: '.font-claude-response-body li', applyTextAlign: true },
        { selector: '.font-claude-response-body blockquote', applyTextAlign: true },
        { selector: '[data-testid="chat-title-button"] span', applyTextAlign: true },
        { selector: 'a[data-dd-action-name="sidebar-project-item"] span', applyTextAlign: true },
        { selector: 'a[data-dd-action-name="sidebar-chat-item"] span', applyTextAlign: true },
        { selector: '.standard-markdown p', applyTextAlign: true },
        { selector: '.standard-markdown li', applyTextAlign: true },
        { selector: '[data-testid="user-message"] p', applyTextAlign: true },
        { selector: '[data-testid="user-message"] li', applyTextAlign: true }
      ],
      css: [
        '/* Claude: حماية عناصر الـ layout */',
        '[data-testid="chat-title-button"] {',
        '  unicode-bidi: isolate;',
        '}',
        '/* Claude: حماية الـ sidebar */',
        'a[data-dd-action-name="sidebar-project-item"],',
        'a[data-dd-action-name="sidebar-chat-item"] {',
        '  unicode-bidi: isolate;',
        '}',
        '/* Claude: حماية textarea */',
        'textarea.can-focus {',
        '  unicode-bidi: plaintext;',
        '}',
        '/* Claude: حماية الكود في الردود */',
        '.font-claude-response-body pre,',
        '.font-claude-response-body code {',
        '  direction: ltr !important;',
        '  text-align: left !important;',
        '}'
      ].join('\n')
    },

    'gemini.google.com': {
      id: 'gemini',
      loadDelay: 3000,
      selectors: ['gemini.google.com'],
      targetSelectors: [
        { selector: '[id^="model-response-message"] p', applyTextAlign: true },
        { selector: '[id^="model-response-message"] li', applyTextAlign: true }
      ],
      css: [
        '/* Gemini: إصلاح الكود */',
        '.message-content pre,',
        '.message-content code {',
        '  direction: ltr !important;',
        '  text-align: left !important;',
        '}'
      ].join('\n')
    },

    'notebooklm.google.com': {
      id: 'notebooklm',
      selectors: ['notebooklm.google.com'],
      targetSelectors: [
        { selector: 'h1.notebook-title', applyTextAlign: true },
        { selector: 'div.message-text-content p', applyTextAlign: true }
      ],
      css: ''
    },

    'web.whatsapp.com': {
      id: 'whatsapp',
      selectors: ['web.whatsapp.com'],
      targetSelectors: [
        { selector: 'span.selectable-text', applyTextAlign: true }
      ],
      css: ''
    },

    'www.perplexity.ai': {
      id: 'perplexity',
      selectors: ['www.perplexity.ai', 'perplexity.ai'],
      targetSelectors: [
        { selector: '[class*="prose"] p', applyTextAlign: true },
        { selector: '[class*="prose"] li', applyTextAlign: true }
      ],
      css: [
        '/* Perplexity: إصلاح الكود */',
        'div.prose pre,',
        'div.prose code {',
        '  direction: ltr !important;',
        '  text-align: left !important;',
        '}'
      ].join('\n')
    },

    // #5: مفاتيح YouTube/Twitter/Facebook/Google تُعبّر عن معرف الـ profile
    // البحث الفعلي يتم عبر حقل selectors أدناه → يشمل كل sub-domains

    'youtube': {
      id: 'youtube',
      selectors: ['www.youtube.com', 'youtube.com', 'm.youtube.com'],
      targetSelectors: [],
      css: [
        '/* YouTube: حماية شريط البحث */',
        'ytd-searchbox,',
        'ytd-searchbox[role="search"],',
        '#search-form,',
        '#search,',
        'ytd-masthead #search,',
        '[class*="searchbox"] {',
        '  unicode-bidi: isolate !important;',
        '}',
        '',
        '/* YouTube: إصلاح عناوين الفيديو */',
        'ytd-video-primary-info-renderer h1,',
        'ytd-watch-metadata h1 {',
        '  text-align: start !important;',
        '}',
        '',
        '/* YouTube: إصلاح الوصف */',
        '#description-inner,',
        'ytd-expandable-video-description-body-renderer {',
        '  text-align: start !important;',
        '}',
        '',
        '/* YouTube: إصلاح التعليقات */',
        'ytd-comment-renderer #content-text {',
        '  text-align: start !important;',
        '}',
        '',
        '/* YouTube: حماية الـ header و sidebar */',
        'ytd-masthead,',
        'ytd-guide-section-renderer,',
        'ytd-mini-guide-renderer {',
        '  unicode-bidi: isolate;',
        '}',
        '',
        '/* YouTube: حماية أزرار التحكم */',
        'ytd-menu-renderer,',
        'ytd-button-renderer,',
        'ytd-toggle-button-renderer {',
        '  unicode-bidi: isolate;',
        '}',
        '',
        '/* YouTube: حماية شريط الـ chips */',
        'ytd-chip-cloud-renderer {',
        '  unicode-bidi: isolate;',
        '}'
      ].join('\n')
    },

    'twitter': {
      id: 'twitter',
      // #5: يشمل x.com وtwitter.com ومتغيراتهما عبر selectors
      selectors: ['twitter.com', 'x.com', 'mobile.twitter.com', 'www.x.com'],
      targetSelectors: [
        { selector: '[data-testid="tweetText"]', applyTextAlign: true }
      ],
      css: [
        '/* Twitter/X: أسماء المستخدمين */',
        '[data-testid="User-Name"] span {',
        '  unicode-bidi: isolate !important;',
        '}'
      ].join('\n')
    },

    'facebook': {
      id: 'facebook',
      selectors: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
      targetSelectors: [],
      css: [
        '/* Facebook: المنشورات */',
        '[data-ad-preview="message"] span {',
        '  unicode-bidi: isolate;',
        '}'
      ].join('\n')
    },

    'google': {
      id: 'google',
      selectors: ['google.com', 'www.google.com'],
      targetSelectors: [],
      css: [
        '/* Google: نتائج البحث */',
        '.g .VwiC3b,',
        '.g .st {',
        '  text-align: start !important;',
        '}',
        '/* Google: ترجمة */',
        '.ryNqvb {',
        '  text-align: start !important;',
        '}'
      ].join('\n')
    },

    'mail.google.com': {
      id: 'gmail',
      selectors: ['mail.google.com'],
      targetSelectors: [],
      css: [
        '/* Gmail: محتوى البريد */',
        '.ii .a3s {',
        '  text-align: start !important;',
        '}'
      ].join('\n')
    },

    'reddit': {
      id: 'reddit',
      selectors: ['reddit.com', 'www.reddit.com', 'old.reddit.com'],
      targetSelectors: [],
      css: [
        '/* Reddit: المنشورات */',
        '[data-testid="post-container"] [slot="text-body"],',
        '.md-text {',
        '  text-align: start !important;',
        '}'
      ].join('\n')
    },

    'linkedin': {
      id: 'linkedin',
      selectors: ['linkedin.com', 'www.linkedin.com'],
      targetSelectors: [],
      css: [
        '/* LinkedIn: المنشورات */',
        '.feed-shared-text {',
        '  text-align: start !important;',
        '}'
      ].join('\n')
    },

    'github.com': {
      id: 'github',
      selectors: ['github.com', 'www.github.com'],
      targetSelectors: [],
      css: [
        '/* GitHub: README والتعليقات */',
        '.markdown-body {',
        '  text-align: start !important;',
        '}',
        '/* GitHub: الكود يبقى LTR */',
        '.markdown-body pre,',
        '.markdown-body code {',
        '  direction: ltr !important;',
        '  text-align: left !important;',
        '}'
      ].join('\n')
    }
  };

  /**
   * الحصول على ملف الموقع بناءً على hostname
   * @param {string} hostname
   * @returns {Object|null}
   */
  function getProfile(hostname) {
    if (!hostname) return null;

    for (var key in PROFILES) {
      var profile = PROFILES[key];
      // فحص المفتاح المباشر أولاً
      if (hostname === key) return profile;
      // فحص قائمة selectors
      if (profile.selectors) {
        for (var i = 0; i < profile.selectors.length; i++) {
          var selector = profile.selectors[i];
          if (hostname === selector || hostname.endsWith('.' + selector)) {
            return profile;
          }
        }
      }
    }

    return null;
  }

  /**
   * تطبيق إصلاحات الموقع
   * @param {Object} profile
   */
  function applyProfile(profile) {
    if (!profile) return;

    removeProfile();

    // 1. حقن CSS
    if (profile.css && profile.css.trim()) {
      profileStyleEl = document.createElement('style');
      profileStyleEl.id = 'fluent-rtl-site-profile';
      profileStyleEl.setAttribute('data-profile', profile.id);
      profileStyleEl.textContent = profile.css;
      document.head.appendChild(profileStyleEl);
    }

    activeProfileId = profile.id;

    // 2. تطبيق target selectors (مع تأخير إذا لزم)
    var delay = profile.loadDelay || 0;

    if (delay > 0) {
      profileTimer = setTimeout(function () {
        applyTargetSelectors(profile);
      }, delay);
    } else {
      applyTargetSelectors(profile);
    }

    // 3. مراقبة DOM للتطبيق الديناميكي
    if (profile.targetSelectors && profile.targetSelectors.length > 0) {
      profileObserver = new MutationObserver(function (mutations) {
        if (!activeProfileId) return;
        for (var i = 0; i < mutations.length; i++) {
          for (var j = 0; j < mutations[i].addedNodes.length; j++) {
            var node = mutations[i].addedNodes[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              applySelectorsToElement(node, profile);
            }
          }
        }
      });

      profileObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * تطبيق target selectors على الصفحة
   * @param {Object} profile
   */
  function applyTargetSelectors(profile) {
    if (!profile.targetSelectors) return;

    for (var i = 0; i < profile.targetSelectors.length; i++) {
      var config = profile.targetSelectors[i];
      if (config.enabled === false) continue;

      try {
        var elements = document.querySelectorAll(config.selector);
        for (var j = 0; j < elements.length; j++) {
          applyDirectionToElement(elements[j], config);
        }
      } catch (e) {
        // selector غير صالح — تجاهل
      }
    }
  }

  /**
   * تطبيق selector config على عنصر جديد
   * @param {Element} node
   * @param {Object} profile
   */
  function applySelectorsToElement(node, profile) {
    for (var i = 0; i < profile.targetSelectors.length; i++) {
      var config = profile.targetSelectors[i];
      if (config.enabled === false) continue;

      try {
        if (node.matches && node.matches(config.selector)) {
          applyDirectionToElement(node, config);
        }
        var children = node.querySelectorAll(config.selector);
        for (var j = 0; j < children.length; j++) {
          applyDirectionToElement(children[j], config);
        }
      } catch (e) {
        // تجاهل
      }
    }
  }

  /**
   * #7: فحص آمن للـ display/transform بكاش لتقليل استدعاءات getComputedStyle
   * @param {Element} el
   * @returns {boolean} true = آمن للتطبيق
   */
  function _isSafeForProfile(el) {
    var cached = _displayCache.get(el);
    if (cached !== undefined) return cached;

    try {
      var style = getComputedStyle(el);
      var display = style.display;
      if (display === 'flex' || display === 'inline-flex' ||
          display === 'grid' || display === 'inline-grid') {
        _displayCache.set(el, false);
        return false;
      }
      var transform = style.transform;
      if (transform && transform !== 'none') {
        _displayCache.set(el, false);
        return false;
      }
      _displayCache.set(el, true);
      return true;
    } catch (e) {
      _displayCache.set(el, false);
      return false;
    }
  }

  /**
   * تطبيق direction على عنصر محدد
   * @param {Element} el
   * @param {Object} config
   */
  function applyDirectionToElement(el, config) {
    if (!el || el.hasAttribute('data-fluent-profile-applied')) return;

    // #7: استخدام الكاش بدل استدعاء getComputedStyle مباشرة
    if (!_isSafeForProfile(el)) return;

    // لا نطبق إذا كان bidi-fix قد عالجه بالفعل
    if (el.hasAttribute('data-fluent-rtl-dir')) return;

    // حفظ القيم الأصلية
    var originalDir = el.getAttribute('dir') || '';
    var originalTextAlign = el.style.textAlign || '';
    el.setAttribute('data-fluent-profile-original-dir', originalDir);
    el.setAttribute('data-fluent-profile-original-text-align', originalTextAlign);
    el.setAttribute('data-fluent-profile-applied', config.forceRTL ? 'force' : 'auto');

    // تطبيق direction
    el.setAttribute('dir', 'rtl');

    // تطبيق text-align
    if (config.applyTextAlign) {
      el.style.setProperty('text-align', 'start', 'important');
    }

    appliedElements.push(el);
  }

  /**
   * إزالة إصلاحات الموقع
   */
  function removeProfile() {
    // إزالة CSS
    if (profileStyleEl && profileStyleEl.parentNode) {
      profileStyleEl.parentNode.removeChild(profileStyleEl);
    }
    profileStyleEl = null;

    // إزالة timer
    if (profileTimer) {
      clearTimeout(profileTimer);
      profileTimer = null;
    }

    // إزالة observer
    if (profileObserver) {
      profileObserver.disconnect();
      profileObserver = null;
    }

    // #7: تصفية كاش الـ display عند إزالة الـ profile
    _displayCache = new WeakMap();

    // إزالة التغييرات من العناصر
    for (var i = 0; i < appliedElements.length; i++) {
      var el = appliedElements[i];
      if (!el || !el.parentNode) continue;

      var originalDir = el.getAttribute('data-fluent-profile-original-dir');
      var originalTextAlign = el.getAttribute('data-fluent-profile-original-text-align');

      // لا نستعيد إذا كان bidi-fix قد عالجه بعد ذلك
      if (el.hasAttribute('data-fluent-rtl-dir')) continue;

      if (originalDir) {
        el.setAttribute('dir', originalDir);
      } else {
        el.removeAttribute('dir');
      }

      if (originalTextAlign) {
        el.style.textAlign = originalTextAlign;
      } else {
        el.style.removeProperty('text-align');
      }

      el.removeAttribute('data-fluent-profile-applied');
      el.removeAttribute('data-fluent-profile-original-dir');
      el.removeAttribute('data-fluent-profile-original-text-align');
    }

    appliedElements = [];
    activeProfileId = null;
  }

  /**
   * الحصول على كل الملفات
   * @returns {Object}
   */
  function getAllProfiles() {
    return PROFILES;
  }

  // تصدير
  window.FluentRTL.siteProfiles = {
    getProfile: getProfile,
    applyProfile: applyProfile,
    removeProfile: removeProfile,
    getAllProfiles: getAllProfiles
  };
})();
