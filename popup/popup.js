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

    resetBtn: document.getElementById('resetBtn')
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
    return response || {
      enabled: true,
      autoDetect: true,
      detectionThreshold: 0.15,
      font: 'thmanyah',
      whitelist: [],
      blacklist: []
    };
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
    // يسمح بـ hostname عادي أو بدء بـ * للـ wildcard
    return /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(trimmed);
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
        handleRemoveListItem(e.target.dataset.type, e.target.dataset.value);
      }
    });

    elements.exportBtn.addEventListener('click', handleExport);
    elements.importBtn.addEventListener('click', function () { elements.importFile.click(); });
    elements.importFile.addEventListener('change', handleImport);

    elements.themeToggle.addEventListener('click', toggleTheme);

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
        currentSettings = Object.assign(currentSettings, imported);
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

    const defaultSettings = {
      enabled: true,
      autoDetect: true,
      detectionThreshold: 0.15,
      font: 'thmanyah',
      customFonts: [],
      whitelist: [],
      blacklist: [],
      perSite: {}
    };

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
