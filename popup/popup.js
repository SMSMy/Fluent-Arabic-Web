/**
 * popup.js — منطق واجهة الإضافة
 *
 * المسؤوليات:
 * 1. عرض حالة الصفحة الحالية
 * 2. تبديل RTL
 * 3. تعديل الإعدادات
 * 4. إدارة القوائم البيضاء/السوداء
 * 5. تصدير/استيراد الإعدادات
 */

(function () {
  'use strict';

  // === الحالة ===
  var currentSettings = null;
  var currentTabStatus = null;

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

  // === عناصر DOM ===
  var elements = {
    statusBar: document.getElementById('statusBar'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    arabicRatio: document.getElementById('arabicRatio'),

    mainToggle: document.getElementById('mainToggle'),
    toggleText: document.getElementById('toggleText'),
    powerHint: document.getElementById('powerHint'),

    autoDetect: document.getElementById('autoDetect'),
    threshold: document.getElementById('threshold'),
    thresholdValue: document.getElementById('thresholdValue'),
    fontSelect: document.getElementById('fontSelect'),

    siteHostname: document.getElementById('siteHostname'),
    addToWhitelist: document.getElementById('addToWhitelist'),
    addToBlacklist: document.getElementById('addToBlacklist'),
    removeFromLists: document.getElementById('removeFromLists'),

    whitelistContainer: document.getElementById('whitelistContainer'),
    blacklistContainer: document.getElementById('blacklistContainer'),
    whitelistInput: document.getElementById('whitelistInput'),
    blacklistInput: document.getElementById('blacklistInput'),
    addWhitelistBtn: document.getElementById('addWhitelistBtn'),
    addBlacklistBtn: document.getElementById('addBlacklistBtn'),

    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),

    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),

    resetBtn: document.getElementById('resetBtn'),

    // أدوات الموقع (محددات + طبيب)
    pickElementBtn: document.getElementById('pickElementBtn'),
    doctorBtn: document.getElementById('doctorBtn'),
    doctorOutput: document.getElementById('doctorOutput'),
    selectorsBlock: document.getElementById('selectorsBlock'),
    selectorsContainer: document.getElementById('selectorsContainer'),
    selectorInput: document.getElementById('selectorInput'),
    addSelectorBtn: document.getElementById('addSelectorBtn')
  };

  // =========================================================================
  // 1. التهيئة
  // =========================================================================

  async function init() {
    loadTheme();
    currentSettings = await getSettings();
    currentTabStatus = await getTabStatus();
    updateUI();
    bindEvents();
  }

  // =========================================================================
  // 2. التواصل مع background.js
  // =========================================================================

  function sendMessage(message) {
    return new Promise(function (resolve) {
      chrome.runtime.sendMessage(message, function (response) {
        resolve(response);
      });
    });
  }

  async function getSettings() {
    const response = await sendMessage({ type: 'fluent-rtl-get-settings' });
    return normalizeSettings(response || DEFAULT_SETTINGS, DEFAULT_SETTINGS);
  }

  async function getTabStatus() {
    const response = await sendMessage({ type: 'fluent-rtl-get-tab-status' });
    return response || { active: false, arabicRatio: 0, hostname: '' };
  }

  async function saveSettings(settings) {
    await sendMessage({ type: 'fluent-rtl-save-settings', settings: settings });
    currentSettings = settings;
  }

  // =========================================================================
  // 3. تحديث الواجهة
  // =========================================================================

  function updateUI() {
    updateStatusUI();
    updateSettingsUI();
    updateSiteUI();
    updateListsUI();
    updateSelectorsUI();
  }

  function updateStatusUI() {
    const isActive = currentTabStatus && currentTabStatus.active;

    elements.statusDot.className = 'status-dot ' + (isActive ? 'active' : 'inactive');
    elements.statusText.textContent = isActive ? 'مفعّل' : 'غير مفعّل';

    if (currentTabStatus && currentTabStatus.arabicRatio > 0) {
      const percent = Math.round(currentTabStatus.arabicRatio * 100);
      elements.arabicRatio.textContent = percent + '% عربي';
      elements.arabicRatio.style.display = '';
    } else {
      elements.arabicRatio.style.display = 'none';
    }

    elements.toggleText.textContent = isActive ? 'إيقاف RTL' : 'تفعيل RTL';
    if (elements.powerHint) {
      elements.powerHint.textContent = isActive ? 'مفعّل — اضغط للإيقاف' : 'اضغط للتفعيل';
    }
    if (isActive) {
      elements.mainToggle.classList.add('active');
    } else {
      elements.mainToggle.classList.remove('active');
    }
  }

  function updateSettingsUI() {
    if (!currentSettings) return;

    elements.autoDetect.checked = currentSettings.autoDetect !== false;

    const thresholdPercent = Math.round((currentSettings.detectionThreshold || 0.15) * 100);
    elements.threshold.value = thresholdPercent;
    elements.thresholdValue.textContent = thresholdPercent + '%';

    elements.fontSelect.value = currentSettings.font || 'default';
  }

  function updateSiteUI() {
    const hostname = currentTabStatus ? currentTabStatus.hostname : '';
    elements.siteHostname.textContent = hostname || '—';

    if (!currentSettings || !hostname) return;

    const inWhitelist = currentSettings.whitelist && currentSettings.whitelist.includes(hostname);
    const inBlacklist = currentSettings.blacklist && currentSettings.blacklist.includes(hostname);

    elements.addToWhitelist.style.display = inWhitelist ? 'none' : '';
    elements.addToBlacklist.style.display = inBlacklist ? 'none' : '';
    elements.removeFromLists.style.display = (inWhitelist || inBlacklist) ? '' : 'none';
  }

  function updateListsUI() {
    renderList('whitelist', elements.whitelistContainer);
    renderList('blacklist', elements.blacklistContainer);
  }

  function renderList(type, container) {
    const items = currentSettings[type] || [];

    if (items.length === 0) {
      container.innerHTML = '<p class="empty-msg">لا توجد مواقع</p>';
      return;
    }

    container.innerHTML = items.map(function (item) {
      return '<div class="list-item">' +
        '<span class="list-item-text">' + escapeHtml(item) + '</span>' +
        '<button class="list-item-remove" data-type="' + type + '" data-value="' + escapeHtml(item) + '">✕</button>' +
        '</div>';
    }).join('');
  }

  // =========================================================================
  // 3ب. أدوات الموقع — محددات يدوية + منتقي عناصر + طبيب الموقع
  // =========================================================================

  function getCurrentHostname() {
    return currentTabStatus ? currentTabStatus.hostname : '';
  }

  function getPerSiteConfig() {
    var hostname = getCurrentHostname();
    if (!hostname || !currentSettings || !currentSettings.perSite) return null;
    return currentSettings.perSite[hostname] || null;
  }

  function updateSelectorsUI() {
    var hostname = getCurrentHostname();
    var config = getPerSiteConfig();
    var selectors = (config && config.selectors) || [];

    if (!hostname) {
      elements.selectorsBlock.style.display = 'none';
      return;
    }

    elements.selectorsBlock.style.display = '';

    if (selectors.length === 0) {
      elements.selectorsContainer.innerHTML = '<p class="empty-msg">لا توجد محددات لهذا الموقع — استخدم «التقاط عنصر» أو أضف يدوياً</p>';
      return;
    }

    elements.selectorsContainer.innerHTML = selectors.map(function (sel, index) {
      var mode = sel.mode || 'auto';
      var modeLabel = mode === 'rtl' ? 'فرض RTL' : (mode === 'ltr' ? 'استثناء LTR' : 'تلقائي');
      return '<div class="list-item selector-item" data-index="' + index + '">' +
        '<span class="list-item-text selector-text" title="' + escapeHtml(sel.selector) + '">' + escapeHtml(sel.selector) + '</span>' +
        '<select class="selector-mode" data-index="' + index + '" aria-label="وضع المحدد">' +
        '<option value="auto"' + (mode === 'auto' ? ' selected' : '') + '>تلقائي</option>' +
        '<option value="rtl"' + (mode === 'rtl' ? ' selected' : '') + '>فرض RTL</option>' +
        '<option value="ltr"' + (mode === 'ltr' ? ' selected' : '') + '>استثناء LTR</option>' +
        '</select>' +
        '<button class="list-item-remove" data-selector-index="' + index + '" title="حذف">✕</button>' +
        '</div>';
    }).join('');
  }

  async function handlePickElement() {
    var response = await sendMessage({ type: 'fluent-rtl-start-picker' });
    if (response && response.started) {
      // إغلاق الـ popup حتى يلتقط المستخدم العنصر من الصفحة
      window.close();
    } else {
      // #44: رسائل دقيقة حسب سبب الفشل
      if (response && response.error === 'no-receiver') {
        alert('الصفحة الحالية لا تستجيب — أعد تحميلها (F5) بعد إعادة تحميل الإضافة، ثم أعد المحاولة.');
      } else if (response && response.error === 'chrome-page') {
        alert('لا يمكن الالتقاط على صفحات كروم الداخلية (chrome://) — افتح موقعاً عادياً أولاً.');
      } else {
        alert('تعذر بدء الالتقاط — تأكد أن الصفحة الحالية تسمح بذلك (وليست صفحة كروم داخلية).');
      }
    }
  }

  async function handleDoctor() {
    elements.doctorOutput.style.display = '';
    elements.doctorOutput.innerHTML = '<p class="empty-msg">جاري التشخيص...</p>';

    var response = await sendMessage({ type: 'fluent-rtl-doctor' });

    if (!response || response.error || !response.findings) {
      // #44: رسائل دقيقة حسب سبب الفشل
      if (response && response.error === 'no-receiver') {
        elements.doctorOutput.innerHTML =
          '<p class="doctor-finding doctor-warn">⚠️ الصفحة لا تستجيب — أعد تحميلها (F5) بعد إعادة تحميل الإضافة ثم أعد المحاولة.</p>';
      } else if (response && response.error === 'chrome-page') {
        elements.doctorOutput.innerHTML =
          '<p class="doctor-finding doctor-warn">⚠️ صفحة كروم داخلية — افتح موقعاً عادياً أولاً.</p>';
      } else {
        elements.doctorOutput.innerHTML =
          '<p class="doctor-finding doctor-warn">⚠️ تعذر التشخيص — تأكد أن الصفحة ليست صفحة كروم داخلية.</p>';
      }
      return;
    }

    var html = '';
    response.findings.forEach(function (finding) {
      var cls = finding.level === 'ok' ? 'doctor-ok' : (finding.level === 'warn' ? 'doctor-warn' : 'doctor-info');
      var icon = finding.level === 'ok' ? '✅' : (finding.level === 'warn' ? '⚠️' : 'ℹ️');
      html += '<p class="doctor-finding ' + cls + '">' + icon + ' ' + escapeHtml(finding.text) + '</p>';
    });

    var meta = [];
    if (response.profile) meta.push('profile: ' + response.profile);
    meta.push('عربي: ' + Math.round(response.arabicRatio * 100) + '%');
    meta.push('معالج: ' + response.processedElements);
    if (response.mainWorldPatch === false) meta.push('MAIN patch: مفقود');
    if (meta.length > 0) {
      html += '<p class="doctor-meta">' + escapeHtml(meta.join(' · ')) + '</p>';
    }

    elements.doctorOutput.innerHTML = html;
  }

  async function persistSelectors(selectors) {
    var hostname = getCurrentHostname();
    if (!hostname) return;
    if (!currentSettings.perSite) currentSettings.perSite = {};
    var config = currentSettings.perSite[hostname] = currentSettings.perSite[hostname] || {};
    config.selectors = selectors;
    await saveSettings(currentSettings);
    updateSelectorsUI();
  }

  async function handleAddSelector() {
    var value = elements.selectorInput.value.trim();
    if (!value) return;

    // فحص صحة الـ selector — نتحقق أنه قابل للتحليل دون أخطاء قاتلة
    try {
      document.createDocumentFragment().querySelector(value);
    } catch (e) {
      elements.selectorInput.style.borderColor = 'var(--danger)';
      setTimeout(function () { elements.selectorInput.style.borderColor = ''; }, 1500);
      return;
    }

    var config = getPerSiteConfig();
    var selectors = (config && config.selectors) || [];
    if (!selectors.some(function (s) { return s.selector === value; })) {
      selectors.push({ selector: value, mode: 'auto' });
      await persistSelectors(selectors);
    }
    elements.selectorInput.value = '';
  }

  async function handleRemoveSelector(index) {
    var config = getPerSiteConfig();
    var selectors = (config && config.selectors) || [];
    selectors.splice(index, 1);
    await persistSelectors(selectors);
  }

  async function handleSelectorModeChange(index, mode) {
    var config = getPerSiteConfig();
    var selectors = (config && config.selectors) || [];
    if (selectors[index]) {
      selectors[index].mode = mode;
      await persistSelectors(selectors);
    }
  }

  // #18: دالة escapeHtml محسّنة — بدون إنشاء DOM element في كل استدعاء
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // #17: دالة للتحقق من صحة hostname
  function isValidHostname(value) {
    if (!value || typeof value !== 'string') return false;
    var trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > 253) return false;
    // #34: دعم localhost وعناوين IP (مثل 127.0.0.1 لصفحات DeepSeek Harness)
    if (/^localhost$/i.test(trimmed)) return true;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) {
      var parts = trimmed.split('.');
      for (var p = 0; p < parts.length; p++) {
        if (Number(parts[p]) > 255) return false;
      }
      return true;
    }
    // يسمح بـ hostname عادي أو بدء بـ * للـ wildcard
    return /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(trimmed);
  }

  function normalizeHostnameList(value) {
    if (!Array.isArray(value)) return [];
    var normalized = [];
    value.forEach(function (item) {
      if (typeof item !== 'string') return;
      var hostname = item.trim().toLowerCase();
      if (isValidHostname(hostname) && !normalized.includes(hostname)) {
        normalized.push(hostname);
      }
    });
    return normalized;
  }

  function normalizeSettings(input, fallback) {
    var source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    var base = Object.assign({}, DEFAULT_SETTINGS, fallback || {});
    var normalized = Object.assign({}, base);

    if (typeof source.enabled === 'boolean') normalized.enabled = source.enabled;
    if (typeof source.autoDetect === 'boolean') normalized.autoDetect = source.autoDetect;

    if (typeof source.detectionThreshold === 'number' && isFinite(source.detectionThreshold)) {
      normalized.detectionThreshold = Math.min(0.5, Math.max(0.05, source.detectionThreshold));
    }

    if (typeof source.font === 'string' && source.font.trim()) {
      normalized.font = source.font.trim();
    }

    normalized.whitelist = normalizeHostnameList(source.whitelist || base.whitelist);
    normalized.blacklist = normalizeHostnameList(source.blacklist || base.blacklist);
    normalized.customFonts = Array.isArray(source.customFonts) ? source.customFonts.filter(function (font) {
      return font && typeof font === 'object';
    }) : (Array.isArray(base.customFonts) ? base.customFonts : []);

    normalized.perSite = {};
    var perSite = source.perSite && typeof source.perSite === 'object' && !Array.isArray(source.perSite)
      ? source.perSite
      : (base.perSite || {});

    Object.keys(perSite).forEach(function (hostname) {
      var cleanHostname = hostname.trim().toLowerCase();
      var config = perSite[hostname];
      if (!isValidHostname(cleanHostname) || !config || typeof config !== 'object') return;
      normalized.perSite[cleanHostname] = {};
      if (typeof config.enabled === 'boolean') {
        normalized.perSite[cleanHostname].enabled = config.enabled;
      }
      // #30: الاحتفاظ بمحددات الموقع اليدوية
      if (Array.isArray(config.selectors)) {
        var cleanSelectors = [];
        config.selectors.forEach(function (sel) {
          if (!sel || typeof sel.selector !== 'string') return;
          var selector = sel.selector.trim();
          if (!selector || selector.length > 500) return;
          var mode = (sel.mode === 'rtl' || sel.mode === 'ltr' || sel.mode === 'auto') ? sel.mode : 'auto';
          cleanSelectors.push({ selector: selector, mode: mode });
        });
        if (cleanSelectors.length > 0) {
          normalized.perSite[cleanHostname].selectors = cleanSelectors;
        }
      }
    });

    return normalized;
  }

  // =========================================================================
  // 4. ربط الأحداث
  // =========================================================================

  function bindEvents() {
    elements.mainToggle.addEventListener('click', handleToggle);
    elements.autoDetect.addEventListener('change', handleAutoDetectChange);
    elements.threshold.addEventListener('input', handleThresholdChange);
    elements.fontSelect.addEventListener('change', handleFontChange);

    elements.addToWhitelist.addEventListener('click', function () { handleAddToList('whitelist'); });
    elements.addToBlacklist.addEventListener('click', function () { handleAddToList('blacklist'); });
    elements.removeFromLists.addEventListener('click', handleRemoveFromLists);

    elements.addWhitelistBtn.addEventListener('click', function () { handleAddToListInput('whitelist'); });
    elements.addBlacklistBtn.addEventListener('click', function () { handleAddToListInput('blacklist'); });
    elements.whitelistInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') handleAddToListInput('whitelist'); });
    elements.blacklistInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') handleAddToListInput('blacklist'); });

    // إزالة list items (delegated)
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('list-item-remove')) {
        if (e.target.dataset.selectorIndex !== undefined) {
          handleRemoveSelector(parseInt(e.target.dataset.selectorIndex, 10));
          return;
        }
        if (e.target.dataset.type) {
          handleRemoveListItem(e.target.dataset.type, e.target.dataset.value);
        }
      }
    });

    elements.exportBtn.addEventListener('click', handleExport);
    elements.importBtn.addEventListener('click', function () { elements.importFile.click(); });
    elements.importFile.addEventListener('change', handleImport);

    elements.themeToggle.addEventListener('click', toggleTheme);

    // أدوات الموقع
    elements.pickElementBtn.addEventListener('click', handlePickElement);
    elements.doctorBtn.addEventListener('click', handleDoctor);
    elements.addSelectorBtn.addEventListener('click', handleAddSelector);
    elements.selectorInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleAddSelector();
    });

    // تغيير وضع المحدد (delegated)
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('selector-mode')) {
        handleSelectorModeChange(parseInt(e.target.dataset.index, 10), e.target.value);
      }
    });

    // #20: تسجيل handleReset مرة واحدة فقط (كان مسجلاً مرتين سابقاً)
    elements.resetBtn.addEventListener('click', handleReset);
  }

  // =========================================================================
  // 5. معالجات الأحداث
  // =========================================================================

  async function handleToggle() {
    const response = await sendMessage({ type: 'fluent-rtl-toggle-tab' });
    if (response) {
      currentTabStatus.active = response.active;
      updateStatusUI();
    }
  }

  async function handleAutoDetectChange() {
    currentSettings.autoDetect = elements.autoDetect.checked;
    await saveSettings(currentSettings);
  }

  async function handleThresholdChange() {
    const value = parseInt(elements.threshold.value, 10);
    elements.thresholdValue.textContent = value + '%';
    currentSettings.detectionThreshold = value / 100;
    await saveSettings(currentSettings);
  }

  async function handleFontChange() {
    const font = elements.fontSelect.value;
    currentSettings.font = font;
    await saveSettings(currentSettings);
    await sendMessage({ type: 'fluent-rtl-update-font', font: font });
  }

  async function handleAddToList(type) {
    const hostname = currentTabStatus ? currentTabStatus.hostname : '';
    if (!hostname) return;

    if (!currentSettings[type]) currentSettings[type] = [];
    if (!currentSettings[type].includes(hostname)) {
      currentSettings[type].push(hostname);
      await saveSettings(currentSettings);
      updateSiteUI();
      updateListsUI();
    }
  }

  async function handleRemoveFromLists() {
    const hostname = currentTabStatus ? currentTabStatus.hostname : '';
    if (!hostname) return;

    currentSettings.whitelist = (currentSettings.whitelist || []).filter(function (h) { return h !== hostname; });
    currentSettings.blacklist = (currentSettings.blacklist || []).filter(function (h) { return h !== hostname; });
    await saveSettings(currentSettings);
    updateSiteUI();
    updateListsUI();
  }

  async function handleAddToListInput(type) {
    const inputEl = type === 'whitelist' ? elements.whitelistInput : elements.blacklistInput;
    const value = inputEl.value.trim();
    if (!value) return;

    // #17: التحقق من صحة الـ hostname قبل الإضافة
    if (!isValidHostname(value)) {
      inputEl.style.borderColor = 'var(--danger)';
      setTimeout(function () { inputEl.style.borderColor = ''; }, 1500);
      return;
    }

    if (!currentSettings[type]) currentSettings[type] = [];
    if (!currentSettings[type].includes(value)) {
      currentSettings[type].push(value);
      await saveSettings(currentSettings);
      updateListsUI();
    }
    inputEl.value = '';
    inputEl.style.borderColor = '';
  }

  async function handleRemoveListItem(type, value) {
    currentSettings[type] = (currentSettings[type] || []).filter(function (h) { return h !== value; });
    await saveSettings(currentSettings);
    updateSiteUI();
    updateListsUI();
  }

  function handleExport() {
    const data = JSON.stringify(currentSettings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluent-rtl-settings.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        // التحقق من أن الملف المستورد يبدو كإعدادات صالحة
        if (typeof imported !== 'object' || Array.isArray(imported)) {
          throw new Error('Invalid format');
        }
        currentSettings = normalizeSettings(imported, currentSettings);
        await saveSettings(currentSettings);
        updateUI();
      } catch (err) {
        alert('خطأ في قراءة الملف — تأكد أنه ملف إعدادات Fluent Arabic Web');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // #20: handleReset يتضمن e.preventDefault() بنفسه — لا حاجة لتسجيل مستمع إضافي
  async function handleReset(e) {
    e.preventDefault();
    if (!confirm('هل تريد إعادة تعيين كل الإعدادات؟')) return;

    const defaultSettings = Object.assign({}, DEFAULT_SETTINGS);

    await saveSettings(defaultSettings);
    currentSettings = defaultSettings;
    updateUI();
  }

  // =========================================================================
  // 6. المظهر (Theme)
  // =========================================================================

  // #15: استخدام chrome.storage.local بدل localStorage للاتساق مع بقية المشروع
  function loadTheme() {
    chrome.storage.local.get('fluentRTLTheme', function (result) {
      var theme = result.fluentRTLTheme;
      if (theme) {
        document.documentElement.setAttribute('data-theme', theme);
      }
      // تحديث الأيقونة بعد القراءة
      elements.themeIcon.textContent = (theme || _getSystemTheme()) === 'dark' ? '☀️' : '🌙';
    });
  }

  function _getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getCurrentTheme() {
    var dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme) return dataTheme;
    return _getSystemTheme();
  }

  function toggleTheme() {
    var current = getCurrentTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    // #15: حفظ في chrome.storage.local بدل localStorage
    chrome.storage.local.set({ fluentRTLTheme: next });
    elements.themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
  }

  // =========================================================================
  // 7. بدء التطبيق
  // =========================================================================

  init();
})();
