# 🔍 تقرير فحص شامل — Fluent Arabic Web v4.0

تم فحص المشروع سطراً سطراً. فيما يلي كل المشاكل ونقاط الضعف مصنّفة حسب الخطورة.

---

## 🔴 مشاكل حرجة (Critical)

### 1. تسريب ذاكرة في `MutationObserver` — الـ debounce يمرّر mutations قديمة

**الملف:** [content.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/content.js#L400-L418)

```javascript
mainObserver = new MutationObserver(function (mutations) {
  if (!isActive) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function () {
    handleDOMMutations(mutations); // ← الربط الأخير فقط!
  }, DEBOUNCE_DELAY);
});
```

> [!CAUTION]
> **المشكلة:** كل استدعاء لـ callback الـ `MutationObserver` يستبدل الـ timer بآخر جديد. لكن المتغير `mutations` في الـ closure يشير فقط للدفعة الأخيرة — كل الدفعات السابقة **تُفقد ولا تُعالج أبداً**.
> 
> **مثال:** إذا أضاف الموقع 10 عناصر في 300ms، فقط الدفعة الأخيرة تُعالج. العناصر الـ 9 الأولى تبقى بدون RTL.

**الحل:** تجميع كل الـ mutations في مصفوفة:

```javascript
var pendingMutations = [];
mainObserver = new MutationObserver(function (mutations) {
  if (!isActive) return;
  pendingMutations.push.apply(pendingMutations, mutations);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function () {
    handleDOMMutations(pendingMutations);
    pendingMutations = [];
  }, DEBOUNCE_DELAY);
});
```

---

### 2. نفس المشكلة في Shadow DOM Traverser

**الملف:** [shadow-dom-traverser.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/lib/shadow-dom-traverser.js#L63-L72)

```javascript
var observer = new MutationObserver(function (mutations) {
  var timerId = debounceTimers.get(shadowRoot);
  if (timerId) clearTimeout(timerId);
  debounceTimers.set(shadowRoot, setTimeout(function () {
    handleMutations(mutations, shadowRoot); // ← نفس المشكلة
  }, DEBOUNCE_DELAY));
});
```

> [!CAUTION]
> نفس المشكلة بالضبط: التجميع يفقد الدفعات السابقة.

---

### 3. `return true` غير مشروط في message listener

**الملف:** [content.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/content.js#L545)

```javascript
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    // ... cases ...
  }
  return true; // ← يُرجع true لكل الرسائل حتى غير المعروفة!
});
```

> [!WARNING]
> **المشكلة:** `return true` يُخبر Chrome أن `sendResponse` سيُستدعى لاحقاً (asynchronous). لكن إذا وصلت رسالة بنوع غير معروف (لا تطابق أي case)، فلن يُستدعى `sendResponse` أبداً — مما يسبب **تسريب ذاكرة** في Chrome (الاتصال يبقى مفتوحاً).

**الحل:** إرجاع `true` فقط من الـ cases التي تحتاجه، أو إضافة `default` case:

```javascript
default:
  return false; // لا نحتاج async response
```

---

### 4. `loadSettings()` في content.js لا ينشئ نسخة جديدة

**الملف:** [content.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/content.js#L57-L66)

```javascript
function loadSettings() {
  return new Promise(function (resolve) {
    chrome.storage.sync.get('fluentRTLSettings', function (result) {
      if (result.fluentRTLSettings) {
        settings = Object.assign(settings, result.fluentRTLSettings);
      }
      resolve(settings);
    });
  });
}
```

> [!WARNING]
> **المشكلة:** `Object.assign(settings, ...)` يُعدّل الـ object الأصلي **في مكانه**. هذا يعني:
> 
> 1. أي خاصية في `DEFAULT_SETTINGS` لا تُرسل مرة أخرى من storage → تبقى بقيمتها المعدّلة السابقة
> 2. إذا حذف المستخدم خاصية من الإعدادات → لا تُحذف (merge أحادي الاتجاه)

**الحل:**

```javascript
settings = Object.assign({}, DEFAULT_SETTINGS_LOCAL, result.fluentRTLSettings || {});
```

---

### 5. Site Profiles: الـ key لا يطابق pattern الـ hostname

**الملف:** [site-profiles.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/lib/site-profiles.js#L162-L296)

```javascript
'youtube.com': { selectors: ['www.youtube.com', 'youtube.com', 'm.youtube.com'], ... },
'twitter.com': { selectors: ['twitter.com', 'x.com', 'mobile.twitter.com'], ... },
'facebook.com': { selectors: ['facebook.com', 'm.facebook.com', 'web.facebook.com'], ... },
```

> [!WARNING]
> **المشكلة:** دالة `getProfile()` تفحص `hostname === key` أولاً ثم `hostname.endsWith('.' + selector)`.
> 
> - `youtube.com` لن يطابق لأن المتصفح يعطي `www.youtube.com` عادةً
> - `twitter.com` لن يُطابق مع `x.com` لأن `'x.com'.endsWith('.twitter.com')` = false
> - لكنه مغطى في `selectors` ← **لكن** الفحص يمر على كل key بالتسلسل ويتوقف عند أول match
> 
> **المشكلة الأدق:** `x.com` موجود في selectors الـ `twitter.com`، لكن `hostname === 'twitter.com'` يفشل لـ `x.com` والفحص الصحيح يحدث فقط بالـ selectors loop. **هذا يعمل** ← لكنه يجعل key `twitter.com` مضللاً.

---

## 🟠 مشاكل متوسطة (Medium)

### 6. `getComputedStyle` يُستدعى على كل عنصر في `isSafeToApplyRTL`

**الملف:** [bidi-fix.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/lib/bidi-fix.js#L185-L227)

> [!WARNING]
> `getComputedStyle()` يُشغّل **Reflow/Layout** في المتصفح. استدعاؤه لكل عنصر نصي (حتى 10,000 عنصر) يُسبب **تباطؤ شديد** خاصة في الصفحات الكبيرة. هذا أحد أثقل العمليات في الـ DOM.

**الحل:** تخزين النتائج مؤقتاً، أو تأخير الفحص لما بعد الرسم:

```javascript
// Use a batch approach with requestIdleCallback
```

---

### 7. `applyDirectionToElement` في site-profiles.js يستدعي أيضاً `getComputedStyle`

**الملف:** [site-profiles.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/lib/site-profiles.js#L445-L461)

> [!NOTE]
> نفس مشكلة الأداء: `getComputedStyle` يُستدعى لكل عنصر يطابق target selector. على مواقع مثل Slack (loadDelay: 8000) قد يكون عدد العناصر كبيراً.

---

### 8. `woff2` مفقود لمعظم الخطوط

**الملف:** [content.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/content.js#L112-L173)

```javascript
'al-masmak': { faces: [{ src: 'fonts/المصمك.otf', ... }] },
'al-naseeb': { faces: [{ src: 'fonts/النسيب.otf', ... }] },
'al-watad':  { faces: [{ src: 'fonts/الوتد.otf', ... }] },
```

> [!WARNING]
> **المشكلة:** معظم الخطوط تُقدّم بصيغة OTF فقط. ملفات OTF أكبر بكثير من WOFF2 (عادةً 40-70% أكبر). هذا يُبطئ تحميل الخطوط بشكل ملحوظ. فقط `al-awwal` و `saudi` يقدمان WOFF2.

**الحل:** تحويل ملفات OTF إلى WOFF2 باستخدام أدوات مثل `woff2_compress` أو _Google Fonts Helper_.

---

### 9. ملف `newico.png` ضخم (5.6 ميجابايت!)

**الملف:** `newico.png` — 5,889,370 bytes

> [!WARNING]
> ملف بحجم 5.6 MB غير مقبول لإضافة متصفح. حتى لو لم يكن مُضمناً في الحزمة النهائية، وجوده في المجلد يزيد حجم الإضافة. أيقونات الإضافات يجب أن تكون < 100KB.

---

### 10. خلط `const` و `let` مع `var` عبر الملفات

**الملفات:** detector.js, transform-fixer.js تستخدم `const/let`، بينما بقية الملفات تستخدم `var`

> [!NOTE]
> **المشكلة:** الاتساق مهم. الخلط بين `const/let` و `var` يجعل الكود غير متناسق. إذا كان الهدف دعم متصفحات قديمة → استخدم `var` في كل مكان. إذا لا → استخدم `const/let` في كل مكان.

---

### 11. CSS Protection rules فارغة (بدون خصائص)

**الملف:** [protection.css](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/styles/protection.css#L147-L174) و [fixes.css](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/styles/fixes.css#L122-L136)

```css
html.fluent-rtl-active header:not([data-fluent-rtl-dir]),
html.fluent-rtl-active nav:not([data-fluent-rtl-dir]),
... {
  /* لا نطبق direction مباشرة على عناصر الـ layout */
}
```

> [!WARNING]
> **المشكلة:** هذه القواعد فارغة تماماً — لا تحتوي أي خصائص CSS. المتصفح يُعالجها لكنها لا تفعل شيئاً. هي مجرد وزن إضافي على الصفحة وتزيد وقت CSS parsing.
> 
> القواعد الفارغة موجودة في:
> 
> - `protection.css` سطر 147-154, 156-163, 165-174
> - `fixes.css` سطر 122-136

**الحل:** إما إضافة خاصية حقيقية (مثل `direction: ltr !important`) أو حذفها.

---

### 12. تكرار كبير بين `fixes.css` و `protection.css`

**الملفات:** [fixes.css](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/styles/fixes.css) و [protection.css](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/styles/protection.css)

> [!NOTE]
> 
> - كلاهما يحمي sidebar, toolbar, navbar
> - كلاهما يستخدم `unicode-bidi: isolate` على نفس العناصر
> - `fixes.css` سطر 127-134 = تقريباً نفس `protection.css` سطر 157-173
> - هذا يُسبب ارتباك في الصيانة: أي ملف يجب تعديله؟

---

### 13. `handleDOMMutations` لا يتفحص `data-fluent-rtl-dir` قبل المعالجة

**الملف:** [content.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/content.js#L420-L453)

```javascript
function handleDOMMutations(mutations) {
  // ...
  bidiFix.processElement(node); // ← لا يفحص هل تم معالجته
}
```

> [!NOTE]
> بالرغم من أن `processElement` يفحص داخلياً `el.hasAttribute(MARKER_ATTR)`، إلا أن استدعاء `isExcluded()` و `isSafeToApplyRTL()` يحدث أولاً — وكلاهما يستدعي `getComputedStyle()`. إضافة فحص مبكر قبل الاستدعاء يوفر أداء.

---

## 🟡 مشاكل خفيفة (Low)

### 14. `onActivated` listener فارغ

**الملف:** [background.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/background.js#L203-L207)

```javascript
chrome.tabs.onActivated.addListener(function (activeInfo) {
  // لا نستطيع معرفة حالة RTL بدون سؤال content script
  // لكن يمكننا إزالة الشارة مؤقتاً
  // سيتم تحديثها عند أول رسالة من content script
});
```

> [!NOTE]
> **المشكلة:** listener مسجّل لكنه لا يفعل شيئاً. الأفضل إما تنفيذه (سؤال content script عن الحالة) أو حذفه.

---

### 15. `localStorage` في popup لتخزين المظهر

**الملف:** [popup.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/popup/popup.js#L389-L410)

```javascript
var theme = localStorage.getItem('fluent-rtl-theme');
```

> [!NOTE]
> **المشكلة:** popup الإضافة لديها `localStorage` خاص بها (مرتبط بالـ extension origin)، لكن `chrome.storage.local` أكثر اتساقاً مع بقية المشروع الذي يستخدم `chrome.storage.sync`. `localStorage` لا يتزامن بين الأجهزة.

---

### 16. Debounce بقيمة ثابتة 300ms

**الملفات:** content.js و shadow-dom-traverser.js

> [!NOTE]
> 300ms قد يكون مرتفعاً جداً لمواقع مثل ChatGPT التي تعرض النص حرفاً حرفاً (streaming). المستخدم سيرى النص يظهر بدون RTL لمدة 300ms ثم يُصلح فجأة — مما يُسبب **وميض (FOUC)**.

**الحل:** تقليله لـ 100ms أو استخدام `requestAnimationFrame` بدلاً من `setTimeout`.

---

### 17. عدم التحقق من صلاحية hostname في القوائم

**الملف:** [popup.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/popup/popup.js#L313-L325)

```javascript
async function handleAddToListInput(type) {
  const value = inputEl.value.trim();
  if (!value) return;
  // ← لا يوجد تحقق من صحة الـ hostname
  currentSettings[type].push(value);
}
```

> [!NOTE]
> المستخدم يمكنه إدخال أي نص (مثل `"Hello World"` أو `"<script>..."`) في القائمة البيضاء/السوداء.

---

### 18. `escapeHtml` يُستخدم لكن الدالة بطيئة

**الملف:** [popup.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/popup/popup.js#L202-L206)

```javascript
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

> [!NOTE]
> كل استدعاء ينشئ عنصر DOM جديد. يمكن استبداله بدالة نصية بسيطة:

```javascript
function escapeHtml(str) {
  return str.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
}
```

---

### 19. `ARABIC_LETTERS_ONLY` regex مُعرّف لكنه غير مُستخدم

**الملف:** [detector.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/lib/detector.js#L22)

```javascript
const ARABIC_LETTERS_ONLY = /[...]/g; // ← لا يُستخدم في أي مكان
```

---

### 20. `handleReset` مسجّل مرتين

**الملف:** [popup.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/popup/popup.js#L252-L253)

```javascript
elements.resetBtn.addEventListener('click', handleReset);
elements.resetBtn.addEventListener('click', function (e) { e.preventDefault(); });
```

> [!NOTE]
> `handleReset` بداخله `e.preventDefault()` في السطر 367. التسجيل الثاني زائد.

---

### 21. `settings-updated` handler يعيد تحميل الإعدادات بدل استخدام الرسالة

**الملف:** [content.js](file:///c:/Code-backup/fluent-arabic-web/testing/rtl-extension%20zAi%20-%20testing/content.js#L524-L534)

```javascript
case 'fluent-rtl-settings-updated':
  loadSettings().then(function () { // ← يقرأ من storage مرة أخرى!
    // ...
  });
```

> [!NOTE]
> الرسالة `message.settings` تحتوي الإعدادات الجديدة بالفعل (من background.js `broadcastSettings`). لكن content.js يتجاهلها ويقرأ من storage → طلب إضافي غير ضروري.

---

## 🔵 نقاط ضعف هيكلية (Architecture)

### 22. الاعتماد على `window.FluentRTL` كـ namespace عالمي

> كل الموديولات تُصدّر عبر `window.FluentRTL`. هذا يعني:
> 
> - ترتيب تحميل الملفات في `manifest.json` **حرج** — تغيير الترتيب يكسر كل شيء
> - لا يوجد dependency injection أو module system
> - أي إضافة أخرى يمكنها الكتابة على `window.FluentRTL` وتخريب الإضافة

---

### 23. عدم وجود آلية لتحديث Site Profiles

> الـ profiles مكتوبة hardcoded في الكود. إذا غيّر ChatGPT أو Claude أسماء الـ CSS classes → يجب تحديث الإضافة كاملة. لا توجد آلية لتحديث الـ profiles عن بُعد أو من المستخدم.

---

### 24. عدم وجود Error Reporting أو Telemetry

> كل الأخطاء تُمسك بـ `catch(e) { /* ignore */ }` أو `console.warn`. لا توجد آلية لمعرفة:
> 
> - كم مرة فشل التفعيل؟
> - أي مواقع تُسبب مشاكل؟
> - هل الإضافة تعمل فعلاً في المستخدمين؟

---

### 25. عدم وجود Unit Tests

> لا يوجد أي اختبار آلي للإضافة. كل التغييرات يجب اختبارها يدوياً على كل موقع مدعوم.

---

## 📊 ملخص

| الخطورة     | العدد  | الأهم                                                |
| ----------- | ------ | ---------------------------------------------------- |
| 🔴 حرج      | 5      | تسريب mutations, تسريب message channels, خلط إعدادات |
| 🟠 متوسط    | 8      | أداء `getComputedStyle`, خطوط OTF كبيرة, CSS فارغ    |
| 🟡 خفيف     | 8      | listeners فارغة, regex غير مستخدم, debounce عالي     |
| 🔵 هيكلي    | 4      | لا tests, لا module system, profiles hardcoded       |
| **المجموع** | **25** |                                                      |

---

## 🎯 أولويات الإصلاح المقترحة

1. **الأولى:** إصلاح تسريب الـ mutations (المشكلة #1 و #2) — تُفقد عناصر بدون معالجة
2. **الثانية:** إصلاح `return true` غير المشروط (المشكلة #3) — تسريب ذاكرة
3. **الثالثة:** إصلاح `loadSettings` merge (المشكلة #4) — خلط إعدادات
4. **الرابعة:** تحسين أداء `getComputedStyle` (المشكلة #6 و #7) — بطء الصفحات الكبيرة
5. **الخامسة:** حذف CSS الفارغ وتوحيد fixes.css/protection.css (المشكلة #11 و #12)
6. **السادسة:** تقليل الـ debounce لمواقع streaming (المشكلة #16)

> [!TIP]
> أفضل استراتيجية: ابدأ بإصلاح المشاكل الحرجة (#1-#4) أولاً لأنها تؤثر مباشرة على وظيفة الإضافة، ثم انتقل لتحسينات الأداء.
