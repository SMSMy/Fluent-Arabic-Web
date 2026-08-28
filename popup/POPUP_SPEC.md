# 📋 مرجع إعادة كتابة popup.html — Fluent Arabic Web (v4.1.0)

> هذا الملف هو **العقد الكامل** بين `popup.html` و`popup.js` وبيئة الإضافة.
> يمكنك إعادة بناء `popup.html` بحرية تامة (أي تصميم/تنسيق) **بشرط الحفاظ على
> التالي**: معرفات العناصر (IDs)، بنية البيانات، بروتوكول الرسائل، والسمات
> العامة للصفحة. `popup.css` يمكن إعادة تصميمه أيضاً — المهم هو المستهلكات أدناه.

---

## 1) بنية الملفات والتدفق

```
popup/popup.html   ← تعيد كتابته (التصميم)
popup/popup.css    ← التنسيق (أي إعادة تصميم حرة؛ استخدم نفس الـ class-based hooks)
popup/popup.js     ← المنطق (لا تعدّله؛ يقرأ من IDs والأحداث أدناه)
background.js      ← Service Worker (توصيل الرسائل + التخزين)
content.js + lib/* ← يعمل داخل الصفحات (لا يمسّ popup)
```

**التدفق الكلي:**

1. فتح الـ popup → `popup.js` يقرأ الإعدادات من **background** عبر رسالة
   `fluent-rtl-get-settings`، وحالة التبويب عبر `fluent-rtl-get-tab-status`.
2. أي تغيير يُحفظ عبر `fluent-rtl-save-settings` → background يخزن في
   `chrome.storage.sync` ثم **يبثها لكل التبويبات** (`fluent-rtl-settings-updated`).
3. التبديل والالتقاط والطبيب تمر عبر background إلى **التبويب النشط**.

---

## 2) العقد الإجباري في `<head>` / `body`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">          <!-- ⚠️ dir="rtl" إجباري (الواجهة عربية) -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluent Arabic Web</title>
  <link rel="stylesheet" href="popup.css">   <!-- نفس المسار -->
</head>
<body>
  <div id="app"> …كل المحتوى… </div>
  <script src="popup.js"></script>           <!-- في نهاية body ⚠️ -->
</body>
</html>
```

- **`dir="rtl"`** على `html` إجباري — بدونها تنقلب محاذاة الواجهة كلها.
- **`id="app"`** إجباري (الـ CSS تستخدمه والأنيميشن).
- **سكربت `popup.js` في نهاية `body`** إجباري (يستدعي `init()` فور التحميل).

---

## 3) العقد الكامل لعناصر DOM (IDs التي يبحث عنها popup.js)

> كل معرف أدناه **مطلوب** — يُنفَّذ `getElementById` عليها عند الإقلاع؛ أي ID مفقود
> = خطأ null وقت التشغيل. النوع (button/input/...) إن لم يُحدد فهو حر.

### أ) شريط الحالة (Status)
| ID | النوع | الوظيفة |
|---|---|---|
| `statusBar` | `<div class="status-pill">` | حاوية مؤشر الحالة |
| `statusDot` | `<span>` | نقطة الحالة — `popup.js` يضيف/يزيل class `active` / `inactive` |
| `statusText` | `<span>` | نص الحالة: «مفعّل» / «غير مفعّل» (يكتبه popup.js) |
| `arabicRatio` | `<span>` | «N% عربي» — popup.js يخفيه (display:none) إذا كانت نسبة 0 |

> ⚠️ `statusDot` يبدأ بلا class؛ يعيّنه popup.js عند أول `updateUI()`.

### ب) زر الطاقة الرئيسي
| ID | النوع | الوظيفة |
|---|---|---|
| `mainToggle` | `<button>` | تبديل RTL للتبويب النشط — مستمع click من popup.js |
| `toggleText` | `<span>` | نص الزر: «تفعيل RTL» / «إيقاف RTL» (يُكتب برمجياً) |
| `powerHint` | `<span>` | تلميح تحته («اضغط للتفعيل»…) — popup.js يكتب النص |

> popup.js يضيف/يزيل class `active` على `mainToggle` حسب الحالة.

### ج) الإعدادات السريعة
| ID | النوع | الوظيفة |
|---|---|---|
| `autoDetect` | `<input type="checkbox">` | الكشف التلقائي (مستمع `change`) |
| `threshold` | `<input type="range" min="5" max="50" step="5">` | حساسية الكشف (مستمع `input`) — القيمة % |
| `thresholdValue` | `<span>` | يعرض «15%» — popup.js يكتب النص |
| `fontSelect` | `<select>` | الخط العربي (مستمع `change`). يجب أن توفر خيار `value="default"` و`value="thmanyah"` على الأقل، وتحوي كل خيارات الخطوط (تحت) |

قيم `fontSelect` المدعومة (يجب ظهورها كلها):
`thmanyah` (ثمانية تايبفيس ✦) · `default` (افتراضي النظام) · `al-masmak` · `al-naseeb` · `al-watad` · `al-awwal` · `saudi` · `year-of-poetry` · `year-of-camel` · `year-of-handicrafts`

### د) بطاقة الموقع الحالي
| ID | النوع | الوظيفة |
|---|---|---|
| `siteHostname` | `<span>` | يعرض hostname التبويب النشط أو «—» |
| `addToWhitelist` | `<button>` | إضافة الموقع الحالي للقائمة البيضاء — يُخفى إذا موجود مسبقاً |
| `addToBlacklist` | `<button>` | إضافة للقائمة السوداء — يُخفى إذا موجود مسبقاً |
| `removeFromLists` | `<button>` | إزالة من القائمتين — يظهر فقط إذا كان الموقع في إحداهما |

> popup.js يتحكم بظهور/إخفاء هذه الأزرار الثلاثة تلقائياً (`style.display`). يجب أن تتواجد كلها.

### هـ) القوائم (White/Black lists) — قسم الإعدادات المتقدمة
| ID | النوع | الوظيفة |
|---|---|---|
| `whitelistContainer` | `<div>` | حاوية عناصر القائمة البيضاء |
| `blacklistContainer` | `<div>` | حاوية عناصر القائمة السوداء |
| `whitelistInput` | `<input type="text">` | إدخال hostname يدوياً — `keypress Enter` يعمل |
| `blacklistInput` | `<input type="text">` | نفس الشيء (سوداء) |
| `addWhitelistBtn` | `<button>` | إضافة من الـ input |
| `addBlacklistBtn` | `<button>` | إضافة من الـ input |

**HTML الذي يولّده popup.js داخل الحاويات (لا تشيئه بيدك — لكن يجب أن تفهمه، لأن popup.js يستمع لحذفه):**

```html
<div class="list-item">
  <span class="list-item-text">example.com</span>
  <button class="list-item-remove" data-type="whitelist" data-value="example.com">✕</button>
</div>
```
> ⚠️ **عقد الأحداث المُفوَّضة:** popup.js يستمع `click` على مستوى `document`
> للـ `.list-item-remove` — **قيمة السمة `data-type` و`data-value` إجبارية** وإلا
> لن يعمل الحذف. عند غياب العناصر: «لا توجد مواقع» `<p class="empty-msg">`.

### و) تصدير/استيراد
| ID | النوع | الوظيفة |
|---|---|---|
| `exportBtn` | `<button>` | تنزيل `fluent-rtl-settings.json` |
| `importBtn` | `<button>` | يفتح `importFile` تلقائياً (من popup.js) |
| `importFile` | `<input type="file" accept=".json" style="display:none">` | — |

### ز) المظهر
| ID | النوع | الوظيفة |
|---|---|---|
| `themeToggle` | `<button>` | تبديل فاتح/داكن (مخزّن في `chrome.storage.local` بمفتاح `fluentRTLTheme`) |
| `themeIcon` | `<span>` | يعرض 🌙/☀️ (يفعلها popup.js) |

### ح) أدوات الموقع (يجب أن تكون حاضرة)
| ID | النوع | الوظيفة |
|---|---|---|
| `pickElementBtn` | `<button>` | «🎯 التقاط عنصر» → رسالة `fluent-rtl-start-picker` |
| `doctorBtn` | `<button>` | «🔍 طبيب الموقع» → رسالة `fluent-rtl-doctor` |
| `doctorOutput` | `<div>` | يُفخَّخ بنتائج الطبيب — `style="display:none"` افتراضياً |
| `selectorsBlock` | `<div>` | قسم «محددات هذا الموقع» — `style="display:none"` افتراضياً |
| `selectorsContainer` | `<div>` | قائمة المحددات (يولّدها popup.js) |
| `selectorInput` | `<input type="text">` | إدخال محدد يدوياً — Enter يعمل |
| `addSelectorBtn` | `<button>` | إضافة محدد يدوي |

**HTML المحددات الذي يولّده popup.js (لا تشيئه):**
```html
<div class="list-item selector-item" data-index="0">
  <span class="list-item-text selector-text">div.gdEzaW_bubble</span>
  <select class="selector-mode" data-index="0">   <!-- ⚠️ مستمع change مفوّض -->
    <option value="auto">تلقائي</option>
    <option value="rtl">فرض RTL</option>
    <option value="ltr">استثناء LTR</option>
  </select>
  <button class="list-item-remove" data-selector-index="0">✕</button>  <!-- ⚠️ data-selector-index -->
</div>
```
> ⚠️ حذف محدد = زر `.list-item-remove` **تلك السمة `data-selector-index`** (وليست
> `data-type`). وضع المحدد = `select.selector-mode` مع `data-index`.

### ط) التذييل
| ID | النوع | الوظيفة |
|---|---|---|
| `resetBtn` | `<a href="#" id="resetBtn">` | إعادة تعيين (popup.js يضيف preventDefault + تأكيد) |
| (اختياري) `.shortcut-badge` | `<span>` | عرض «⌨ Alt+Shift+A» — عرض بحت |

---

## 4) بنية الإعدادات (العقد الكامل)

```js
DEFAULT_SETTINGS = {
  enabled: true,                 // boolean — التفعيل العام
  autoDetect: true,              // boolean — الكشف التلقائي
  detectionThreshold: 0.15,      // number 0.05..0.5 — عتبة النسبة
  font: 'thmanyah',              // string — أحد قيم fontSelect
  customFonts: [],               // array — غير مستعمل في الواجهة حالياً
  whitelist: [],                 // array<string> — hostnames / *.example.com
  blacklist: [],                 // array<string>
  perSite: {}                    // object<hostname, PerSiteConfig>
}
```

```js
PerSiteConfig = {
  enabled?: boolean,             // true=فرض التفعيل، false=قفل الموقع
  selectors?: [                  // محددات ملتقطة بالـ picker أو يدوية
    {
      selector: 'div.gdEzaW_bubble',  // string — محدّد CSS صالح
      mode: 'auto' | 'rtl' | 'ltr',   // auto=plaintext، rtl=فرض، ltr=استثناء
      addedAt?: 1760000000000          // timestamp (يضيفه content.js)
    }
  ]
}
```

**قواعد التحقق في popup.js (`normalizeSettings`):**
- hostname صالح: اسم نطاق عادي أو `*.example.com`، **أو** `localhost`، **أو** IPv4 مثل `127.0.0.1` (أجزاء ≤ 255). أي غير صالح يُسقط.
- كل `selectors`: `selector` نص ≤ 500 حرف بعد trim؛ `mode` يُعوّم إلى `auto` إن كان غير `rtl/ltr/auto`.
- الواجهة **تتجاهل إعدادات perSite لغير النطاقات الصالحة** — لو أضفت نطاقات جديدة انتبه لـ `isValidHostname`.

---

## 5) بروتوكول الرسائل (popup ⇄ background)

كل رسالة تُرسل بـ `chrome.runtime.sendMessage(message, callback)`؛ الرد يأتي في
`callback(response)`. **قاعدة:** إن كان رد أي أداة يحمل `{error: '...'}` فأظهر معنى الخطأ.

| الرسالة | الاتجاه | الطلب | الرد |
|---|---|---|---|
| `fluent-rtl-get-settings` | popup→bg | لا | كائن الإعدادات كاملاً (أو `undefined` — عوّمه |
| `fluent-rtl-save-settings` | popup→bg | `{settings}` | `{success:true}` |
| `fluent-rtl-toggle-tab` | popup→bg→تبويب | لا | `{active:boolean}` |
| `fluent-rtl-get-tab-status` | popup→bg→تبويب | لا | `{active, arabicRatio, url, hostname}` (أو `{active:false, arabicRatio:0}`) |
| `fluent-rtl-update-font` | popup→bg→تبويب | `{font}` | `{applied:boolean}` |
| `fluent-rtl-start-picker` | popup→bg→تبويب | لا | `{started:true}` أو `{error:'no-receiver'\|'chrome-page'\|'no-tab'}` |
| `fluent-rtl-stop-picker` | popup→bg→تبويب | لا | `{stopped:true}` أو error |
| `fluent-rtl-doctor` | popup→bg→تبويب | لا | `{active, hostname, url, enabled, autoDetect, arabicRatio, threshold, nativeRTL, profile, blacklisted, whitelisted, hasPerSite, perSiteSelectorCount, processedElements, mainWorldPatch, findings:[{level:'ok'\|'warn'\|'info', text}]}` أو error |

### أخطاء `fluent-rtl-doctor` / `start-picker` (مهم للواجهة!)
| `error` | المعنى | النص المناسب في الواجهة |
|---|---|---|
| `no-receiver` | التبويب قديم — content script ميت (بعد إعادة تحميل الإضافة) | «الصفحة لا تستجيب — أعد تحميلها (F5) بعد إعادة تحميل الإضافة ثم أعد المحاولة.» |
| `chrome-page` | التبويب `chrome://` / `edge://` / `chrome-extension://` | «صفحة كروم داخلية — افتح موقعاً عادياً أولاً.» |
| `no-tab` | لا يوجد تبويب نشط | الرسالة العامة لتعذر التشخيص. |

### بيان حالة `fluent-rtl-get-tab-status` للواجهة
- `arabicRatio > 0` → أظهر نسبة «N% عربي»؛ وإلا أخفِ `#arabicRatio`.
- `active` → نقطة خضراء + نص «مفعّل» + زر «إيقاف RTL»، وإلا عكس ذلك.

---

## 6) سلوكيات يجب أن تعرفها (أثناء التصميم)

1. **الالتقاط يغلق الـ popup** (`window.close()`) — لأن الالتقاط يتم بالصفحة.
   بعد الإغلاق يظهر توست أخضر في الصفحة «✓ حُفظ المحدد: …» (من content.js).
2. **الطبيب لا يغلق الـ popup** — النتائج تُرسم داخل `#doctorOutput`:
   ```html
   <p class="doctor-finding doctor-ok">✅ …</p>    <!-- ok |
   <p class="doctor-finding doctor-warn">⚠️ …</p>  <!-- warn -->
   <p class="doctor-finding doctor-info">ℹ️ …</p>   <!-- info -->
   <p class="doctor-meta">profile: dsh · عربي: 40% · معالج: 89</p>
   ```
3. **الخطوط** — popup.js لا يحمّل الخطوط؛ الإضافة تحقنها في الصفحات فقط.
   لا تضع `<link>` لخطوط خارجية (سياسة CSP/مستهدفات كروم).
4. **نجمة الإصدار** — text «الإصدار 4.1.0» مجرد عرض؛ لو غيّرت الإصدار في
   `manifest.json` حدّث النص يدوياً (أو اجعلة عنصراً فارغاً).
5. **إعادة التعيين** — `confirm()` قبل التنفيذ (من popup.js). لا تضف مزدوجة.
6. **الارتفاع** — Chrome يفرض حداً أقصى لحجم الـ popup (~600px)؛ صمّم بقابلية
   تمرير (`overflow-y: auto`) داخل `#app` إن طال المحتوى.
7. **التصدير** — `fluent-rtl-settings.json` يصدّر `currentSettings` كاملاً؛
   الاستيراد يتحقق أنه `object` غير مصفوفة ثم يمرر عبر `normalizeSettings`.

---

## 7) الفئات (classes) التي يعتمد عليها popup.js أو popup.css

**يستخدمها popup.js منطقياً:**
`active` / `inactive` (على `#statusDot` و`#mainToggle`) · `list-item` · `list-item-text` ·
`list-item-remove` · `empty-msg` · `selector-item` · `selector-text` · `selector-mode` ·
`doctor-finding` · `doctor-ok` · `doctor-warn` · `doctor-info` · `doctor-meta` ·
`btn btn-primary` / `btn btn-secondary` (سطر الأدوات).

**يستخدمها popup.css (عرض فقط — حر في إعادة التصميم):**
`#app`, `.header .header-bg .header-content .logo .logo-icon-wrap .logo-img .logo-text .logo-title .logo-version`,
`.icon-btn`, `.status-pill-wrap .status-pill .status-dot .status-divider .arabic-ratio`,
`.power-section .power-btn .power-ring .power-icon .power-label .power-hint`,
`.site-card .site-card-info .site-card-icon .site-card-details .site-card-label .site-hostname .site-card-actions`,
`.pill-btn--allow|--block|--remove`, `.section .section-title .section-title-icon`,
`.advanced-section`, `.setting-row .vertical`, `.setting-label .setting-desc .setting-header .setting-badge`,
`.switch .slider`, `.range-labels`, `.list-block .list-block-header .list-badge--allow|--block`,
`.list-container .add-item .input-sm .add-btn--allow|--block`, `.export-row .btn`,
`.footer .shortcut-badge .link-btn`, `.tool-row`, `.selectors-block`, `.doctor-output`.

> إن أردت أن تكون منطقة معينة بلا مظهر خلفي — فقط احذفها من HTML؛ لا توجد
> قواعد CSS تطبق على عناصر غير موجودة.

---

## 8) كيف تختبر بعد إعادة الكتابة

1. `npm test` — 37 اختباراً (لا تختبر popup؛ يضمن أن لا شيء كُسر في الأساسات).
2. افتح `chrome://extensions` → reload → أيقونة الإضافة → تحقق:
   - الحالة تعرض «مفعّل» على صفحة عربية، والنسبة تظهر.
   - تبديل RTL يعمل (زر الطاقة + اختصار Alt+Shift+A يعمل).
   - القائمة البيضاء/السوداء: إضافة/حذف/يدوي/Enter.
   - تغيير الخط يبدل الخط في الصفحة فوراً.
   - التصدير/الاستيراد/إعادة التعيين.
   - **طبيب الموقع** و**التقاط عنصر** على 127.0.0.1:3080 (بعد F5 للتبويب).
   - المظهر الداكن/الفاتح ثابت بعد إغلاق/فتح الـ popup.
3. إن أضفت **عنصراً جديداً** للواجهة — أضف له حقل في `elements` داخل
   popup.js أو استخدم مستمعاً مفوَّضاً على `document` (مثل ما هو قائم).
4. **لا** تُغيّر: أسماء الرسائل، مفاتيح storage، بنية `perSite`، خانات
   `normalizeSettings` — أي تغيير يفكك توافق التبويبات/الإصدارات السابقة.

---

## 9) ملخص «لا تُمس»

```
✅ أنت حر: HTML كامل، CSS كامل، الفئات العرضية، الأقواس، الأيقونات، الصور
❌ ممنوع: إزالة/إعادة تسمية أي ID في الجداول أعلاه
❌ ممنوع: إزالة dir="rtl" أو lang="ar" أو id="app"
❌ ممنوع: تغيير مسار/ترتيب سكربت popup.js أو popup.css
❌ ممنوع: تحريك HTML إلى ما بعد popup.js (يجب أن يبقى قبل التحقق من العناصر)
```

---

## 10) خط أنابيب CSS المحلي (لا CDN — ممنوع في إضافة MV3)

التصميم الحالي مبني بـ **Tailwind v3 محلياً** (سكربتات CDN محجوبة بسياسة `script-src 'self'`):

| الملف | الدور |
|---|---|
| `popup/input.css` | المصدر: `@tailwind` + الفئات الديناميكية (`#45`) |
| `popup/tailwind.config.js` | الـ config (الألوان/المسافات/الخطوط) — مسارات content نسبية لجذر المستودع |
| `popup/popup.css` | **الناتج المبنّى — لا تحرره يدوياً أبداً** |
| `popup/fonts/material-symbols-outlined.css` + `MaterialSymbolsOutlined.woff2` | أيقونات Material محلية (تعمل بدون إنترنت) |

**البناء بعد أي تعديل على `popup.html` أو `input.css`:**

```bash
npx tailwindcss -c popup/tailwind.config.js -i popup/input.css -o popup/popup.css --minify
```

**قاعدتان حرجتان للفئات الديناميكية:**
1. الفئات التي يضيفها `popup.js` وقت التشغيل (`.status-dot.active/inactive`، `#mainToggle.active`، `.list-item*`، `.selector-*`، `.doctor-*`، `.empty-msg`، `.glow-active`، `.status-pulse`) **يجب أن تعيش خارج `@layer`** في `input.css` — وإلا جرّدها Tailwind من البناء لأنها غير ظاهرة في المحتوى الساكن.
2. أي فئة Tailwind جديدة تستخدمها في HTML أعد البناء — الناتج لا يتحدث ذاتياً.

**تغيّرات popup.js المتعلقة بالتصميم الجديد (لا تلغِها):**
- `statusDot` يبدّل `active`/`inactive` عبر `classList` (يحافظ على كلاسات الحجم/اللون في HTML).
- الثيم يزامن `data-theme` **و** `class="dark"` معاً؛ أيقونة الثيم بأسماء Material (`light_mode`/`dark_mode`).
- `logoVersion` نص ساكن؛ للتحديث الديناميكي: `chrome.runtime.getManifest().version`.

**نظام الثيم (فاتح/داكن) — بالمتغيرات:**
- كل ألوان `tailwind.config.js` تشير إلى `rgb(var(--c-*) / <alpha-value>)`.
- `input.css` يعرّف `:root` (فاتح) و`.dark` (داكن) — **نفس الكلاسات تتبدل تلقائياً مع الثيم، لا حاجة لـ `dark:` variants في HTML**.
- متغيرات الزجاج: `--glass-bg` و`--glass-border` لكل وضع (`.glass-panel` يستهلكها).
- لإضافة لون جديد: أضف `--c-xxx` في الكتلتين + مفتاح اللون في الـ config — فيعمل في الوضعين فوراً.

---

*آخر تحديث: v4.1.0 — تصميم جديد مبني محلياً، أيقونات محلية، 43 اختباراً آلياً.*
