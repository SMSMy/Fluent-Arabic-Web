// سكريبت واجهة المستخدم المحسّن - Fluent Arabic Web v3.0
// يتضمن: أمان محسّن، أداء أفضل، ميزات جديدة

(function () {
  "use strict";

  // ===============================================
  // المتغيرات والثوابت
  // ===============================================

  // التحقق من صحة النطاق باستخدام regex
  const DOMAIN_REGEX =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  // عناصر DOM
  const elements = {};

  // الإعدادات الافتراضية
  const defaultSettings = {
    isEnabled: true,
    autoDetectArabic: true,
    minArabicTextPercentage: 15,
    whitelistedDomains: [],
    blacklistedDomains: [],
    selectedFont: "Noto Naskh Arabic",
    theme: "auto",
  };

  // الإعدادات الحالية
  let settings = { ...defaultSettings };

  // معلومات الصفحة الحالية
  let currentPageInfo = {
    domain: "",
    hasArabicContent: false,
    arabicPercentage: 0,
    isTranslatedPage: false,
  };

  // متغير لتخزين مؤقت التوست
  let toastTimeout = null;

  // ===============================================
  // دوال الأمان
  // ===============================================

  /**
   * تنظيف النص لمنع XSS
   * @param {string} text - النص المراد تنظيفه
   * @returns {string} النص النظيف
   */
  function sanitizeText(text) {
    if (typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * التحقق من صحة النطاق
   * @param {string} domain - النطاق المراد التحقق منه
   * @returns {boolean} صحة النطاق
   */
  function isValidDomain(domain) {
    if (!domain || typeof domain !== "string") return false;
    const trimmed = domain.trim().toLowerCase();
    return DOMAIN_REGEX.test(trimmed) && trimmed.length <= 253;
  }

  /**
   * تنظيف النطاق
   * @param {string} domain - النطاق المراد تنظيفه
   * @returns {string} النطاق النظيف
   */
  function sanitizeDomain(domain) {
    if (!domain) return "";
    return domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
  }

  // ===============================================
  // دوال واجهة المستخدم
  // ===============================================

  /**
   * تهيئة عناصر DOM
   */
  function initElements() {
    elements.isEnabledCheckbox = document.getElementById("isEnabled");
    elements.autoDetectArabicCheckbox =
      document.getElementById("autoDetectArabic");
    elements.minArabicTextPercentageSlider = document.getElementById(
      "minArabicTextPercentage"
    );
    elements.percentageDisplay = document.getElementById("percentageDisplay");
    elements.whitelistedDomainsContainer =
      document.getElementById("whitelistedDomains");
    elements.blacklistedDomainsContainer =
      document.getElementById("blacklistedDomains");
    elements.whitelistDomainInput = document.getElementById("whitelistDomain");
    elements.blacklistDomainInput = document.getElementById("blacklistDomain");
    elements.addToWhitelistButton = document.getElementById("addToWhitelist");
    elements.addToBlacklistButton = document.getElementById("addToBlacklist");
    elements.blacklistCurrentSiteButton = document.getElementById(
      "blacklistCurrentSite"
    );
    elements.whitelistCurrentSiteButton = document.getElementById(
      "whitelistCurrentSite"
    );
    elements.pageDomain = document.getElementById("pageDomain");
    elements.percentageValue = document.getElementById("percentageValue");
    elements.percentageProgress = document.getElementById("percentageProgress");
    elements.statusBadges = document.getElementById("statusBadges");
    elements.themeToggle = document.getElementById("themeToggle");
    elements.fontSelect = document.getElementById("fontSelect");
    elements.exportSettings = document.getElementById("exportSettings");
    elements.importSettings = document.getElementById("importSettings");
    elements.importFile = document.getElementById("importFile");
    elements.whitelistError = document.getElementById("whitelistError");
    elements.blacklistError = document.getElementById("blacklistError");
    elements.toast = document.getElementById("toast");
    elements.statusDot = document.getElementById("statusDot");
  }

  /**
   * عرض رسالة Toast
   * @param {string} message - الرسالة
   * @param {number} duration - المدة بالمللي ثانية
   */
  function showToast(message, duration = 2000) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, duration);
  }

  /**
   * عرض رسالة خطأ
   * @param {HTMLElement} element - عنصر رسالة الخطأ
   * @param {string} message - الرسالة
   */
  function showError(element, message) {
    element.textContent = message;
    element.classList.add("show");
    setTimeout(() => {
      element.classList.remove("show");
    }, 3000);
  }

  /**
   * تحديث مؤشر النسبة المئوية الدائري
   * @param {number} percentage - النسبة المئوية
   */
  function updatePercentageRing(percentage) {
    const circumference = 2 * Math.PI * 22; // r = 22
    const offset = circumference - (percentage / 100) * circumference;
    elements.percentageProgress.style.strokeDashoffset = offset;
    elements.percentageValue.textContent = `${Math.round(percentage)}%`;

    // تغيير اللون بناءً على النسبة
    if (percentage >= settings.minArabicTextPercentage) {
      elements.percentageProgress.style.stroke = "var(--success)";
    } else if (percentage >= settings.minArabicTextPercentage / 2) {
      elements.percentageProgress.style.stroke = "var(--warning)";
    } else {
      elements.percentageProgress.style.stroke = "var(--danger)";
    }
  }

  /**
   * إنشاء عنصر نطاق آمن
   * @param {string} domain - النطاق
   * @param {number} index - الفهرس
   * @param {string} type - النوع (whitelist/blacklist)
   * @returns {HTMLElement} عنصر النطاق
   */
  function createDomainElement(domain, index, type) {
    const div = document.createElement("div");
    div.className = "domain-item";

    const span = document.createElement("span");
    span.textContent = sanitizeText(domain);

    const button = document.createElement("button");
    button.className = "domain-remove-btn";
    button.textContent = "حذف";
    button.dataset.index = index;
    button.dataset.type = type;

    button.addEventListener("click", function () {
      removeDomain(type, parseInt(this.dataset.index));
    });

    div.appendChild(span);
    div.appendChild(button);

    return div;
  }

  /**
   * تحديث قائمة النطاقات
   * @param {HTMLElement} container - الحاوية
   * @param {Array} domains - قائمة النطاقات
   * @param {string} type - النوع
   */
  function updateDomainList(container, domains, type) {
    container.innerHTML = "";

    if (domains.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "domain-item domain-item-empty";
      emptyDiv.textContent = "لا توجد مواقع في القائمة";
      container.appendChild(emptyDiv);
    } else {
      domains.forEach((domain, index) => {
        container.appendChild(createDomainElement(domain, index, type));
      });
    }
  }

  /**
   * تحديث واجهة المستخدم بالكامل
   */
  function updateUI() {
    // تحديث عناصر التحكم
    elements.isEnabledCheckbox.checked = settings.isEnabled;
    elements.autoDetectArabicCheckbox.checked = settings.autoDetectArabic;
    elements.minArabicTextPercentageSlider.value =
      settings.minArabicTextPercentage;
    elements.percentageDisplay.textContent = `${settings.minArabicTextPercentage}%`;
    elements.fontSelect.value = settings.selectedFont;

    // تحديث قوائم النطاقات
    updateDomainList(
      elements.whitelistedDomainsContainer,
      settings.whitelistedDomains,
      "whitelist"
    );
    updateDomainList(
      elements.blacklistedDomainsContainer,
      settings.blacklistedDomains,
      "blacklist"
    );

    // تحديث أزرار الإجراءات السريعة
    updateQuickActionButtons();
  }

  /**
   * تحديث حالة أزرار الإجراءات السريعة
   */
  function updateQuickActionButtons() {
    if (!currentPageInfo.domain) return;

    const isWhitelisted = settings.whitelistedDomains.some((d) =>
      currentPageInfo.domain.includes(d)
    );
    const isBlacklisted = settings.blacklistedDomains.some((d) =>
      currentPageInfo.domain.includes(d)
    );

    elements.whitelistCurrentSiteButton.disabled = isWhitelisted;
    elements.blacklistCurrentSiteButton.disabled = isBlacklisted;
  }

  /**
   * تحديث عرض معلومات الصفحة
   */
  function updatePageInfoDisplay() {
    const { domain, hasArabicContent, arabicPercentage, isTranslatedPage } =
      currentPageInfo;

    elements.pageDomain.textContent = sanitizeText(domain) || "غير متاح";
    updatePercentageRing(arabicPercentage);

    // تحديث مؤشر الحالة
    if (elements.statusDot) {
      if (hasArabicContent && settings.isEnabled) {
        elements.statusDot.classList.add("active");
      } else {
        elements.statusDot.classList.remove("active");
      }
    }

    const isWhitelisted = settings.whitelistedDomains.some((d) =>
      domain.includes(d)
    );
    const isBlacklisted = settings.blacklistedDomains.some((d) =>
      domain.includes(d)
    );

    // بناء الشارات
    let badgesHTML = "";

    if (isBlacklisted) {
      badgesHTML += `
                <span class="badge badge-danger">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
                    محظور
                </span>`;
    } else if (isWhitelisted) {
      badgesHTML += `
                <span class="badge badge-success">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    مسموح
                </span>`;
    } else if (hasArabicContent) {
      badgesHTML += `
                <span class="badge badge-success">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    محتوى عربي
                </span>`;
    } else {
      badgesHTML += `
                <span class="badge badge-warning">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    غير عربي
                </span>`;
    }

    if (isTranslatedPage) {
      badgesHTML += `
                <span class="badge badge-info">
                    <svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04z"/></svg>
                    مترجم
                </span>`;
    }

    elements.statusBadges.innerHTML = badgesHTML;
    updateQuickActionButtons();
  }

  // ===============================================
  // دوال الإعدادات
  // ===============================================

  /**
   * تحميل الإعدادات
   */
  function loadSettings() {
    chrome.storage.sync.get(null, (loadedSettings) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading settings:", chrome.runtime.lastError);
        return;
      }

      settings = {
        ...defaultSettings,
        ...loadedSettings,
      };

      updateUI();
      applyTheme();
    });
  }

  /**
   * حفظ الإعدادات
   */
  function saveSettings() {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving settings:", chrome.runtime.lastError);
        showToast("حدث خطأ أثناء حفظ الإعدادات");
        return;
      }

      // إرسال الإعدادات إلى الخلفية
      chrome.runtime
        .sendMessage({
          action: "updateSettings",
          settings: settings,
        })
        .catch(() => {});
    });
  }

  /**
   * إضافة نطاق إلى قائمة
   * @param {string} type - نوع القائمة
   * @param {string} domain - النطاق
   */
  function addDomain(type, domain) {
    const cleanDomain = sanitizeDomain(domain);
    const errorElement =
      type === "whitelist" ? elements.whitelistError : elements.blacklistError;
    const inputElement =
      type === "whitelist"
        ? elements.whitelistDomainInput
        : elements.blacklistDomainInput;
    const listKey =
      type === "whitelist" ? "whitelistedDomains" : "blacklistedDomains";
    const oppositeListKey =
      type === "whitelist" ? "blacklistedDomains" : "whitelistedDomains";

    // التحقق من صحة النطاق
    if (!cleanDomain) {
      showError(errorElement, "الرجاء إدخال نطاق");
      return;
    }

    if (!isValidDomain(cleanDomain)) {
      showError(errorElement, "صيغة النطاق غير صحيحة (مثال: example.com)");
      return;
    }

    // التحقق من عدم وجود النطاق مسبقاً
    if (settings[listKey].includes(cleanDomain)) {
      showError(errorElement, "النطاق موجود بالفعل في القائمة");
      return;
    }

    // التحقق من الحد الأقصى (100)
    if (settings[listKey].length >= 100) {
      showError(errorElement, "تم الوصول للحد الأقصى (100 موقع). يرجى حذف بعض المواقع.");
      return;
    }

    // إزالة من القائمة المعاكسة إذا كان موجوداً
    const oppositeIndex = settings[oppositeListKey].indexOf(cleanDomain);
    if (oppositeIndex !== -1) {
      settings[oppositeListKey].splice(oppositeIndex, 1);
    }

    // إضافة النطاق
    settings[listKey].push(cleanDomain);
    saveSettings();
    updateUI();
    inputElement.value = "";
    showToast("تمت إضافة النطاق بنجاح");
  }

  /**
   * إزالة نطاق من قائمة
   * @param {string} type - نوع القائمة
   * @param {number} index - فهرس النطاق
   */
  function removeDomain(type, index) {
    const listKey =
      type === "whitelist" ? "whitelistedDomains" : "blacklistedDomains";

    if (index >= 0 && index < settings[listKey].length) {
      settings[listKey].splice(index, 1);
      saveSettings();
      updateUI();
      showToast("تمت إزالة النطاق");
    }
  }

  /**
   * إضافة الموقع الحالي إلى القائمة السوداء
   */
  function blacklistCurrentSite() {
    if (currentPageInfo.domain) {
      try {
        addDomain("blacklist", currentPageInfo.domain);
        notifyContentScript({ action: "settingsUpdated", settings });
      } catch (e) {
        // Handle error specifically if addDomain fails (though it shows toast)
      }
    }
  }

  /**
   * إضافة الموقع الحالي إلى القائمة البيضاء
   */
  function whitelistCurrentSite() {
    if (currentPageInfo.domain) {
      try {
        addDomain("whitelist", currentPageInfo.domain);
        notifyContentScript({ action: "settingsUpdated", settings });
      } catch (e) {
        // Handle error
      }
    }
  }

  // ===============================================
  // دوال الثيم
  // ===============================================

  /**
   * تطبيق الثيم
   */
  function applyTheme() {
    const savedTheme = settings.theme || "auto";
    let theme = savedTheme;

    if (savedTheme === "auto") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }

  /**
   * تحديث أيقونة الثيم
   * @param {string} theme - الثيم الحالي
   */
  function updateThemeIcon(theme) {
    const sunIcon = elements.themeToggle.querySelector(".sun-icon");
    const moonIcon = elements.themeToggle.querySelector(".moon-icon");

    if (theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }

  /**
   * تبديل الثيم
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    settings.theme = newTheme;
    saveSettings();

    document.documentElement.setAttribute("data-theme", newTheme);
    updateThemeIcon(newTheme);
  }

  // ===============================================
  // دوال التصدير والاستيراد
  // ===============================================

  /**
   * تصدير الإعدادات
   */
  function exportSettings() {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fluent-arabic-web-settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("تم تصدير الإعدادات بنجاح");
  }

  /**
   * استيراد الإعدادات
   * @param {Event} event - حدث تغيير الملف
   */
  function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);

        // التحقق من صحة البيانات المستوردة
        if (typeof imported !== "object") {
          throw new Error("Invalid format");
        }

        // دمج الإعدادات المستوردة مع الافتراضية
        settings = {
          ...defaultSettings,
          ...imported,
          // التأكد من أن القوائم مصفوفات
          whitelistedDomains: Array.isArray(imported.whitelistedDomains)
            ? imported.whitelistedDomains.filter((d) => isValidDomain(d))
            : [],
          blacklistedDomains: Array.isArray(imported.blacklistedDomains)
            ? imported.blacklistedDomains.filter((d) => isValidDomain(d))
            : [],
        };

        saveSettings();
        updateUI();
        applyTheme();
        showToast("تم استيراد الإعدادات بنجاح");
      } catch (error) {
        console.error("Import error:", error);
        showToast("فشل استيراد الإعدادات: ملف غير صالح");
      }
    };

    reader.readAsText(file);
    event.target.value = ""; // إعادة تعيين الإدخال
  }

  // ===============================================
  // دوال التواصل
  // ===============================================

  /**
   * إرسال رسالة إلى سكريبت المحتوى
   * @param {Object} message - الرسالة
   */
  function notifyContentScript(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {});
      }
    });
  }

  /**
   * الحصول على معلومات الصفحة الحالية
   */
  function getCurrentPageInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      const currentTab = tabs[0];

      try {
        const url = new URL(currentTab.url);
        currentPageInfo.domain = url.hostname;

        // طلب معلومات من سكريبت المحتوى
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "getPageInfo" },
          (response) => {
            if (chrome.runtime.lastError) {
              // سكريبت المحتوى غير متاح
              currentPageInfo.hasArabicContent = false;
              currentPageInfo.arabicPercentage = 0;
              currentPageInfo.isTranslatedPage = false;
            } else if (response) {
              currentPageInfo.hasArabicContent = response.hasArabicContent;
              currentPageInfo.arabicPercentage = response.arabicPercentage || 0;
              currentPageInfo.isTranslatedPage = response.isTranslatedPage;
            }

            updatePageInfoDisplay();
          }
        );
      } catch (e) {
        // رابط غير صالح
        currentPageInfo.domain = "غير متاح";
        updatePageInfoDisplay();
      }
    });
  }

  // ===============================================
  // اختصارات لوحة المفاتيح
  // ===============================================

  /**
   * معالج اختصارات لوحة المفاتيح
   * @param {KeyboardEvent} event - حدث المفتاح
   */
  function handleKeyboardShortcuts(event) {
    // Alt + A: تبديل الكشف التلقائي
    if (event.altKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      elements.autoDetectArabicCheckbox.checked =
        !elements.autoDetectArabicCheckbox.checked;
      settings.autoDetectArabic = elements.autoDetectArabicCheckbox.checked;
      saveSettings();
      showToast(
        settings.autoDetectArabic
          ? "تم تفعيل الكشف التلقائي"
          : "تم تعطيل الكشف التلقائي"
      );
    }

    // Alt + T: تبديل الثيم
    if (event.altKey && event.key.toLowerCase() === "t") {
      event.preventDefault();
      toggleTheme();
    }

    // Alt + E: تفعيل/تعطيل الإضافة
    if (event.altKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      elements.isEnabledCheckbox.checked = !elements.isEnabledCheckbox.checked;
      settings.isEnabled = elements.isEnabledCheckbox.checked;
      saveSettings();
      notifyContentScript({
        action: "toggleEnhancement",
        isEnabled: settings.isEnabled,
      });
      showToast(settings.isEnabled ? "تم تفعيل الإضافة" : "تم تعطيل الإضافة");
    }
  }

  // ===============================================
  // التهيئة
  // ===============================================

  /**
   * تهيئة مستمعي الأحداث
   */
  function initEventListeners() {
    // تفعيل/تعطيل الإضافة
    elements.isEnabledCheckbox.addEventListener("change", function () {
      settings.isEnabled = this.checked;
      saveSettings();
      notifyContentScript({
        action: "toggleEnhancement",
        isEnabled: settings.isEnabled,
      });
    });

    // الكشف التلقائي
    elements.autoDetectArabicCheckbox.addEventListener("change", function () {
      settings.autoDetectArabic = this.checked;
      saveSettings();
    });

    // شريط النسبة المئوية
    elements.minArabicTextPercentageSlider.addEventListener(
      "input",
      function () {
        elements.percentageDisplay.textContent = `${this.value}%`;
      }
    );

    elements.minArabicTextPercentageSlider.addEventListener(
      "change",
      function () {
        settings.minArabicTextPercentage = parseInt(this.value);
        saveSettings();
      }
    );

    // اختيار الخط
    elements.fontSelect.addEventListener("change", function () {
      settings.selectedFont = this.value;
      saveSettings();
      notifyContentScript({ action: "settingsUpdated", settings });
    });

    // أزرار إضافة النطاقات
    elements.addToWhitelistButton.addEventListener("click", () => {
      addDomain("whitelist", elements.whitelistDomainInput.value);
    });

    elements.addToBlacklistButton.addEventListener("click", () => {
      addDomain("blacklist", elements.blacklistDomainInput.value);
    });

    // Enter للإضافة
    elements.whitelistDomainInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addDomain("whitelist", elements.whitelistDomainInput.value);
      }
    });

    elements.blacklistDomainInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addDomain("blacklist", elements.blacklistDomainInput.value);
      }
    });

    // أزرار الإجراءات السريعة
    elements.blacklistCurrentSiteButton.addEventListener(
      "click",
      blacklistCurrentSite
    );
    elements.whitelistCurrentSiteButton.addEventListener(
      "click",
      whitelistCurrentSite
    );

    // تبديل الثيم
    elements.themeToggle.addEventListener("click", toggleTheme);

    // تصدير واستيراد
    elements.exportSettings.addEventListener("click", exportSettings);
    elements.importSettings.addEventListener("click", () =>
      elements.importFile.click()
    );
    elements.importFile.addEventListener("change", importSettings);

    // اختصارات لوحة المفاتيح
    document.addEventListener("keydown", handleKeyboardShortcuts);

    // الاستماع لتغييرات الثيم التلقائي
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (settings.theme === "auto") {
          applyTheme();
        }
      });
  }

  /**
   * التهيئة الرئيسية
   */
  function init() {
    initElements();
    initEventListeners();
    loadSettings();
    getCurrentPageInfo();
  }

  // بدء التنفيذ عند تحميل الصفحة
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
