# خطة إضافة متصفح RTL متكاملة للغة العربية
## "Fluent Arabic Web v4.0"

---

## 1. نظرة عامة على المشروع

إضافة متصفح (Chrome Extension) تحوّل أي موقع LTR إلى تجربة RTL عربية سلسة، مع حل مشاكل CSS transitions و transforms التي عطلت المحاولات السابقة.

**الهدف:** إضافة تُفعَّل بزر واحد، تعمل على أي موقع، بدون تحريك نصوص أو كسر تخطيط.

---

## 2. تحليل المشاريع السابقة

### 2.1 المشروع الأول: Fluent-Arabic-Web-main (v3.0)

**ما نجح:**
- بنية Manifest V3 نظيفة واكتمال
- كشف تلقائي للمحتوى العربي (regex + نسبة مئوية)
- حماية ممتازة للأيقونات (Material Icons, Font Awesome)
- MutationObserver + Debounce للأداء
- BiDi fix بـ `dir="auto"` لكل عنصر
- واجهة popup جميلة مع داكن/فاتح
- قائمة بيضاء/سوداء للمواقع
- اختيار خطوط عربية

**ما فشل/مشاكل:**
- ❌ **المشكلة الأساسية:** `direction: rtl` على `<html>` يكسر الـ layout بالكامل (flex, grid, transforms)
- ❌ استخدام `!important` بشكل مفرط يتعارض مع أنماط المواقع
- ❌ لا يتعامل مع `transform: translateX()` و `left/right` في الـ CSS
- ❌ القواعد الخاصة بالمواقع (YouTube, Claude, ChatGPT) هشة — أي تحديث للـ DOM يكسرها
- ❌ `unicode-bidi: plaintext` يُحدث مشاكل في النصوص المختلطة
- ❌ لا يوجد نهج منظم لـ transitions/animations

### 2.2 المشروع الثاني: Multi-RTL (v7.0)

**ما نجح:**
- نهج ذكي: selector builder يتيح للمستخدم اختيار عناصر محددة
- يطبق RTL فقط على العناصر المحددة (نهج دقيق بدل شامل)
- يكتشف العبرية تلقائياً (`startsWithHebrew`)
- يدعم content-based detection (يختبر محتوى العنصر قبل تطبيق RTL)
- واجهة inspector متقدمة

**ما فشل/مشاكل:**
- ❌ معقد جداً للمستخدم العادي (يتطلب معرفة CSS selectors)
- ❌ لا يتعامل مع transitions/transforms تلقائياً
- ❌ الكود minified ومحير (صعب الصيانة والتطوير)
- ❌ لا يدعم العربية بشكل أساسي (مصمم للعبرية أولاً)
- ❌ لا يوجد كشف تلقائي شامل

### 2.3 المشروع الثالث: extension-folder (v2.0)

**ما نجح:**
- نسخة مبكرة وبسيطة — أساس جيد
- نفس مفهوم الكشف التلقائي

**ما فشل/مشاكل:**
- ❌ إصدار قديم (v2.0) — أقل تطوراً من v3.0
- ❌ نفس مشاكل layout عند تطبيق RTL
- ❌ أنماط CSS عامة جداً بدون استثناءات ذكية

### 2.4 الدرس المستفاد

**المشكلة الجذرية في كل المشاريع الثلاثة:** تطبيق `direction: rtl` على `<html>` أو عناصر واسعة يُحدث cascade من الأضرار:
1. `flex-direction: row` يبقى row لكن الاتجاه ينقلب → عناصر تتحرك
2. `transform: translateX(100px)` لا يعكس تلقائياً → عناصر خارج الشاشة
3. `left: 0` لا يتحول لـ `right: 0` → تخطيط مكسور
4. CSS transitions تُشغَّل عند تغيير الاتجاه → تحرك مفاجئ
5. `position: absolute/fixed` مع `left/right` تنكسر

**الحل:** نهج "Minimal Touch" — لا نلمس layout المواقع، نعالج النصوص فقط.

---

## 3. الميزات الكاملة للإضافة الجديدة (v4.0)

### 3.1 الميزات الأساسية
- **كشف تلقائي** للمحتوى العربي (نسبة مئوية قابلة للتعديل)
- **زر تبديل سريع** (Alt+Shift+A) — تشغيل/إيقاف
- **خطوط عربية متعددة** قابلة للتحميل من Google Fonts
- **قائمة بيضاء/سوداء** للمواقع
- **تصدير/استيراد** الإعدادات

### 3.2 الميزات المتقدمة (الجديدة)
- **نهج "Text-Only RTL"** — لا نعكس الـ layout، فقط اتجاه النصوص
- **CSS Transition Guard** — قراءة ديناميكية للمدة الفعلية قبل تجميد الحركات
- **Smart Transform Fix** — يتعامل مع `translateX` في CSS/JS
- **Per-Element Direction** — كشف ذكي يعتمد على نسبة الحروف العربية، لا أول حرف فقط
- **Dynamic Style Observer** — يراقب الأنماط الجديدة المُضافة ويصلحها
- **Site Profiles** — إعدادات مختلفة لكل موقع (محفوظة تلقائياً)
- **Undo System** — التراجع عن أي تغيير بزر واحد
- **Shadow DOM Support** — patch لـ `attachShadow` + traversal لـ `shadowRoot` (document_start)
- **Lazy Processing** — IntersectionObserver لمعالجة 10000+ عنصر

---

## 4. البنية التقنية

### 4.1 هيكل الملفات

```
fluent-arabic-web-v4/
├── manifest.json              # Manifest V3
├── background.js              # Service Worker
├── shadow-patch.js            # document_start — patch attachShadow قبل بناء DOM
├── content.js                 # Content Script (المنطق الرئيسي)
├── styles/
│   ├── base.css              # أنماط أساسية (خطوط، تباعد)
│   ├── protection.css        # حماية الأيقونات والعناصر الخاصة
│   └── fixes.css             # إصلاحات per-site
├── popup/
│   ├── popup.html            # واجهة الإضافة
│   ├── popup.js              # منطق الواجهة
│   └── popup.css             # أنماط الواجهة
├── lib/
│   ├── detector.js           # كشف المحتوى العربي (نسبة حروف، لا أول حرف)
│   ├── bidi-fix.js           # إصلاح النصوص المختلطة
│   ├── transition-guard.js   # منع transitions (قراءة ديناميكية من عينة ذكية)
│   ├── transform-fixer.js    # إصلاح transforms
│   ├── site-profiles.js      # ملفات المواقع
│   └── shadow-dom-traverser.js # traversal لكل shadowRoots مسجّلة
├── fonts/                     # خطوط عربية
└── icons/                     # أيقونات الإضافة
```

### 4.2 manifest.json

```json
{
  "manifest_version": 3,
  "name": "Fluent Arabic Web",
  "version": "4.0.0",
  "description": "تجربة تصفح عربية مثالية - بدون تحريك أو كسر التخطيط",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
  },
  "background": { "service_worker": "background.js" },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["shadow-patch.js"],
      "run_at": "document_start",
      "world": "MAIN",
      "all_frames": false
    },
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],
  "commands": {
    "toggle": { "suggested_key": { "default": "Alt+Shift+A" }, "description": "تبديل RTL" }
  },
  "web_accessible_resources": [{
    "resources": ["fonts/*.woff2"],
    "matches": ["<all_urls>"]
  }]
}
```

**ملاحظات:**
- `shadow-patch.js` يُحمَّل في `document_start` مع `"world": "MAIN"` لpatch `attachShadow` في نفس الـ execution context للصفحة (Chrome 111+)
- `content.js` يُحمَّل في `document_idle` بعد اكتمال DOM
- لا نُرسل CSS عبر content_scripts (نتحقق أولاً ثم نحقن)
- `all_frames: false` — نعالج الصفحة الرئيسية فقط
- نستخدم `scripting` permission للحقن الديناميكي عند الحاجة

---

## 5. آلية عمل RTL (النهج الجديد)

### 5.1 المبادئ الأساسية

| المبدأ | الشرح |
|--------|-------|
| **لا تعكس الـ Layout** | لا نغير `direction` على `<html>` أبداً |
| **Text-Only** | نطبق RTL فقط على عناصر النص (p, span, div.text, h1-h6, li, td, label) |
| **كشف ذكي** | نستخدم نسبة الحروف العربية لتحديد الاتجاه، لا أول حرف فقط |
| **Force RTL للعناصر المختلطة** | إذا كان العنصر يحتوي عربي+إنجليزي بنسبة عربية > 30%، نضبط `dir="rtl"` مع `unicode-bidi: isolate` |
| **لا تلمس CSS الموجود** | لا نُعدّل أنماط الموقع، نُضيف فقط |
| **Transition Guard** | نقرأ أكبر مدة transition فعلي ونُجمّد لضعفها + هامش |

### 5.2 خطوات التطبيق

```
0. Shadow Patch (document_start): patch attachShadow قبل بناء DOM
1. الكشف → هل الصفحة تحتوي عربي؟
2. لو لا → لا نفعل شيئاً
3. لو نعم →
   a. Transition Guard: قراءة أكبر transition-duration فعلي × 2 + 100ms هامش، ثم تجميد
   b. Snapshot: حفظ حالة الـ DOM الحالية
   c. Bidi Fix: تطبيق كشف نسبة الحروف العربية (>30% → dir=rtl, 0-30% → dir=auto) على العناصر النصية
   d. Shadow DOM Traversal: معالجة كل shadowRoots مسجّلة
   e. Font Injection: حقن خط عربي
   f. Transform Fix: فحص وإصلاح transforms إن لزم
   g. Restore: إعادة transitions بعد المدة المحسوبة
   h. IntersectionObserver: إعداد lazy processing للعناصر غير المرئية
```

### 5.3 ما لا نفعله (مقارنة بالسابق)

| الفعل | v3.0 (قديم) | v4.0 (جديد) |
|-------|-------------|-------------|
| `direction: rtl` على `<html>` | ✅ يُفعل | ❌ لا يُفعل أبداً |
| `text-align: right !important` شامل | ✅ يُفعل | ❌ لا يُفعل أبداً |
| `flex-direction: row-reverse` | كان يُفعل | ❌ لا يُفعل |
| تغيير `float` direction | ✅ يُفعل | ❌ لا يُفعل |
| تغيير `left/right` positioning | ✅ يُفعل | ❌ لا يُفعل |
| `dir="auto"` على العناصر النصية | ✅ | ✅ (نهج أساسي) |
| كشف نسبة الحروف العربية | ❌ | ✅ (جديد — بدل أول حرف) |
| حقن خطوط عربية | ✅ | ✅ (محسّن) |
| حماية الأيقونات | ✅ | ✅ |
| إصلاح transitions | ❌ | ✅ (محسّن — قراءة ديناميكية) |
| Shadow DOM Support | ❌ | ✅ (جديد) |
| Lazy Processing (10000+) | ❌ | ✅ (جديد) |

---

## 6. حل مشاكل transitions/transforms مع RTL

### 6.1 مشكلة CSS Transitions

**السبب:** عند تغيير `direction` أو `text-align`، إذا كان العنصر لديه `transition: all 0.3s`، فإن المتصفح يُشغّل الانتقال على كل الخصائص المتغيرة → تحرك مفاجئ.

**الحل — Transition Guard (قراءة ديناميكية):**

بدل استخدام 300ms ثابتة، نقرأ كل مدد transitions الفعلية في الصفحة ونحسب المدة المطلوبة:

```javascript
function calculateMaxTransitionDuration() {
  // عينة ذكية: عناصر الـ layout الرئيسية فقط (لديها transitions فعلية)
  // النصوص البسيطة نادراً ما لديها transitions → لا حاجة لفحص كل العناصر
  const LAYOUT_SELECTORS = 'header, nav, aside, [class*="sidebar"], [class*="menu"], [class*="drawer"], [class*="panel"], [class*="modal"], [class*="tooltip"], [class*="dropdown"], [class*="popover"]';
  const sample = document.querySelectorAll(LAYOUT_SELECTORS);
  let maxDuration = 0;

  // أضف body و html كمرجع
  const extraElements = [document.body, document.documentElement];
  const allElements = [...sample, ...extraElements];

  for (const el of allElements) {
    if (!el) continue;
    const style = getComputedStyle(el);
    const transitionDuration = style.transitionDuration;
    const transitionDelay = style.transitionDelay;

    // تحليل كل duration (قد يكون متعدد: "0.3s, 0.5s")
    const durations = transitionDuration.split(',').map(d => parseTimeToMs(d.trim()));
    const delays = transitionDelay.split(',').map(d => parseTimeToMs(d.trim()));

    for (let i = 0; i < durations.length; i++) {
      const total = durations[i] + (delays[i] || 0);
      if (total > maxDuration) maxDuration = total;
    }
  }

  // المدة النهائية = أكبر مدة × 2 + 100ms هامش
  return (maxDuration * 2) + 100;
}

function parseTimeToMs(timeStr) {
  if (!timeStr || timeStr === '0s' || timeStr === '0ms') return 0;
  if (timeStr.endsWith('ms')) return parseFloat(timeStr);
  if (timeStr.endsWith('s')) return parseFloat(timeStr) * 1000;
  return 0;
}
```

**خطوات التطبيق:**

1. **قبل التطبيق:** حساب المدة الديناميكية ثم حقن CSS يُجمّد كل transitions
   ```css
   html.fluent-rtl-active * {
     transition: none !important;
     animation: none !important;
   }
   ```

2. **بعد التطبيق (المدة المحسوبة):** إزالة التجمد تدريجياً
   ```css
   /* تُزال بعد المدة المحسوبة ديناميكياً */
   html.fluent-rtl-active * {
     transition: revert !important;
     animation: revert !important;
   }
   ```

3. **بديل أقوى:** استخدام `requestAnimationFrame` مع `getComputedStyle` لـ force reflow قبل إزالة التجمد، مما يمنع المتصفح من لعب transition على التغييرات.

### 6.2 مشكلة CSS Transforms

**السبب:** `transform: translateX(100px)` لا يعكس عند RTL. العنصر يبقى في نفس الموقع الفيزيائي لكن الاتجاه تغيّر → يخرج عن الشاشة أو يتداخل.

**الحل — لا نلمس الـ layout:**

بما أننا لا نُطبق RTL على عناصر الـ layout (header, sidebar, nav)، فإن transforms لن تتأثر. العناصر النصية التي نُطبق عليها RTL عادةً ليس لديها transforms.

**حالة خاصة:** إذا اكتشفنا أن عنصر نصي لديه `transform`، نتجاهله ولا نطبق عليه RTL.

### 6.3 مشكلة تحرك النصوص (Text Shifting)

**السبب:** تغيير `text-align: left → right` مع `transition` يُحدث حركة أفقية.

**الحل:**
- نستخدم `dir="auto"` بدل `text-align` — لا يُحدث حركة
- `dir="auto"` يكتشف الاتجاه من أول حرف قوي (عربي → RTL تلقائياً)
- نضيف `text-align: start` بدل `text-align: right` — `start` يتغير بدون transition

### 6.4 مشكلة Layout Shift

**السبب:** تغيير الهوامش والحشوات (margin, padding) عند عكس الاتجاه.

**الحل:** لا نغير الهوامش أبداً. نستخدم `dir="auto"` الذي يعكس تلقائياً فقط داخل العنصر، بدون تغيير الـ box model.

---

## 7. وحدة Bidi Fix (النصوص المختلطة)

### 7.1 آلية العمل

```
لكل عنصر نصي في الصفحة:
  1. هل النص يحتوي حروف عربية؟
     → نعم: احسب نسبة الحروف العربية
       → نسبة > 30%: ضبط dir="rtl"
       → نسبة 0-30%: ضبط dir="auto"
     → لا: تجاهل
  2. هل النص مختلط (عربي + إنجليزي + أرقام)؟
     → نعم: ضبط dir="rtl" + unicode-bidi: isolate
     → لا: dir حسب النسبة
  3. هل العنصر داخل عنصر كود؟
     → نعم: لا نلمسه (dir="ltr")
     → لا: تابع
  4. هل العنصر أيقونة (icon, svg, material-icon)؟
     → نعم: لا نلمسه
     → لا: طبّق
```

### 7.2 العناصر المستهدفة

**نطبق عليها:**
`p, h1-h6, li, td, th, blockquote, figcaption, label, summary, caption, span.text, div.text, a, dt, dd, [role="article"], [role="paragraph"]`

**لا نطبق عليها:**
`code, pre, kbd, samp, var, svg, canvas, video, audio, iframe, [class*="icon"], [class*="Icon"], .material-*, .fa-*, .monaco-editor, [contenteditable]`

### 7.3 خوارزمية الكشف الذكي

**المشكلة مع `dir="auto"`:** المتصفح يعتمد على أول حرف "قوي" (strong character) لتحديد الاتجاه. هذا يفشل مع النصوص المختلطة مثل:
- "Hello مرحبا World" → يُحدّد LTR (أول حرف قوي إنجليزي) رغم أن النص عربي بنسبة كبيرة
- "123 مرحبا" → يُحدّد LTR (الأرقام ليست حروف قوية) رغم أن النص عربي
- "AR" في بداية سطر عربي → يُحدّد LTR خطأ

**الحل:** دالة `detectDirection()` تحسب نسبة الحروف العربية في النص كامل:

```javascript
// نطاق الحروف العربية في Unicode
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

/**
 * كشف اتجاه النص بناءً على نسبة الحروف العربية
 * @param {string} text - النص المراد فحصه
 * @returns {'rtl'|'auto'|null} - rtl (>30% عربي), auto (0-30%), null (لا حروف عربية)
 */
function detectDirection(text) {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text.trim();
  if (!cleaned) return null;

  // إزالة المسافات والأرقام والرموز — نحسب نسبة الحروف فقط
  const lettersOnly = cleaned.replace(/[^a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');

  if (lettersOnly.length === 0) return null;

  const arabicMatches = cleaned.match(ARABIC_RANGE);
  const arabicCount = arabicMatches ? arabicMatches.length : 0;
  const ratio = arabicCount / lettersOnly.length;

  if (ratio > 0.3) return 'rtl';      // أكثر من 30% عربي → فرض RTL
  if (ratio > 0) return 'auto';       // 0-30% عربي → نترك المتصفح يقرر
  return null;                         // 0% عربي → لا نلمس العنصر
}

// استخدام:
// const dir = detectDirection(element.textContent);
// if (dir === 'rtl') element.setAttribute('dir', 'rtl');
// else if (dir === 'auto') element.setAttribute('dir', 'auto');
// else { /* لا نلمس العنصر */ }
```

**لماذا 30%؟**
- النصوص المختلطة عربي-إنجليزي الطبيعية تحتوي عادةً 40-70% حروف عربية
- النصوص الإنجليزية مع مصطلحات عربية قليلة تحتوي < 15%
- 30% عتبة متوازنة تُغطي معظم الحالات مع تجنب false positives

### 7.4 Shadow DOM Support

**المشكلة:** مواقع كثيرة تستخدم Shadow DOM (مكونات ويب مغلقة):
- **YouTube** — custom elements للفيديو والتعليقات
- **Gmail** — واجهة مبنية بالكامل على web components
- **Google Docs** — محرر النصوص داخل shadow DOM
- **Twitter/X** — بعض المكونات تستخدم shadow DOM

المشكلة: `document.querySelectorAll()` لا يصل للعناصر داخل `shadowRoot`، مما يعني أن RTL لن يُطبّق على نصوص داخل هذه المكونات.

**⚠️ تحذير مهم — Isolated World vs Main World:**

Content Scripts في Chrome تعمل في **Isolated World** منفصل عن JavaScript الصفحة (**Main World**). هذا يعني:
- تعديل `Element.prototype.attachShadow` في Isolated World **لا يؤثر** على الصفحة الفعلية
- `window.__fluentShadowRoots` في Isolated World **غير مرئية** للصفحة، والعكس صحيح

**الحل:** `shadow-patch.js` يُحمَّل في manifest.json مع `"world": "MAIN"` (Chrome 111+ MV3) ليعمل في نفس execution context للصفحة.

| الملف | World | الوظيفة |
|-------|-------|---------|
| `shadow-patch.js` | **Main World** | patch `attachShadow` فعلياً، تسجيل shadowRoots في `window.__fluentShadowRoots` |
| `content.js` | Isolated World | المنطق الرئيسي — لا يستطيع الوصول لـ `window.__fluentShadowRoots` مباشرة |

**التواصل بين الـ worlds:** CustomEvent على `document` يعبر الـ worlds تلقائياً — فنستخدمه كجسر.

**الحل — خطوتين:**

**الخطوة 1: `shadow-patch.js` (document_start, Main World)**

يُحمَّل قبل بناء DOM في **Main World** ويُعدّل `Element.prototype.attachShadow` فعلياً:

```javascript
// shadow-patch.js — يُحمَّل في document_start + world: MAIN
// يعمل في Main World → يُعدّل attachShadow فعلياً للصفحة
(function() {
  // Set عالمي في Main World — content.js (Isolated) لا يستطيع الوصول مباشرة
  window.__fluentShadowRoots = new Set();

  // حفظ الدالة الأصلية
  const originalAttachShadow = Element.prototype.attachShadow;

  // تعديل attachShadow لتسجيل كل shadow root
  Element.prototype.attachShadow = function(init) {
    const shadowRoot = originalAttachShadow.call(this, init);
    window.__fluentShadowRoots.add(shadowRoot);

    // CustomEvent على document — يعبر الـ worlds تلقائياً!
    // content.js في Isolated World يستطيع الاستماع لهذا الحدث
    document.dispatchEvent(new CustomEvent('fluent-shadow-attached', {
      detail: { host: this, shadowRoot: shadowRoot }
    }));

    return shadowRoot;
  };
})();
```

**الخطوة 2: `content.js` (document_idle, Isolated World)**

يعمل في Isolated World — يستمع لـ CustomEvent من Main World ولا يعتمد على `window.__fluentShadowRoots` مباشرة:

```javascript
// في content.js (Isolated World) — بعد التفعيل
import { shadowDOMTraverser } from './lib/shadow-dom-traverser.js';

// ❌ لا نستطيع الوصول لـ window.__fluentShadowRoots (Main World)
// ✅ نستمع لـ CustomEvent من Main World — يعبر الـ worlds تلقائياً

function processShadowRoot(shadowRoot) {
  if (shadowRoot) {
    shadowDOMTraverser.process(shadowRoot);
  }
}

// الاستماع لـ shadowRoots جديدة من Main World
// document events تعبر الـ worlds — هذا هو جسر التواصل
document.addEventListener('fluent-shadow-attached', (e) => {
  const { shadowRoot } = e.detail;
  processShadowRoot(shadowRoot);
});

// للـ shadowRoots الموجودة مسبقاً قبل تحميل content.js:
// أرسل طلب إلى Main World لمعالجتها عبر CustomEvent
// Main World (shadow-patch.js) يستمع ويُرسل حدث لكل shadowRoot موجود
document.dispatchEvent(new CustomEvent('fluent-shadow-request-existing', {}));

// في shadow-patch.js — أضف مستمع للطلب:
// document.addEventListener('fluent-shadow-request-existing', () => {
//   for (const root of window.__fluentShadowRoots) {
//     document.dispatchEvent(new CustomEvent('fluent-shadow-attached', {
//       detail: { host: root.host, shadowRoot: root }
//     }));
//   }
// });
```

> **ملاحظة:** `"world": "MAIN"` متاح في Chrome 111+ مع Manifest V3. لا يدعمه Firefox حالياً (سيتم تجاهل التغيير في Firefox).

**`lib/shadow-dom-traverser.js`** يوفّر:
- Recursive traversal للـ shadow DOM (nested shadows)
- نفس منطق Bidi Fix لكن على عناصر داخل shadowRoot
- استماع لـ MutationObserver داخل كل shadowRoot

### 7.5 حدود الأداء

- فحص أقصى **10000 عنصر** في الـ DOM
- **IntersectionObserver** لـ lazy processing — نعالج فقط العناصر المرئية
- **Batch processing**: 500 عنصر كل `requestAnimationFrame` frame
- تخزين مؤقت للنتائج (5 ثوانٍ)
- Debounce على MutationObserver (300ms)
- لا نُعيد الفحص إذا لم يتغير الـ DOM بشكل كبير

---

## 8. البنية التقنية التفصيلية

### 8.1 content.js — المنطق الرئيسي

**المسؤوليات:**
1. استقبال الإعدادات من background.js
2. استدعاء `detector.js` للكشف عن العربي
3. القرار: هل نُفعّل؟
4. استدعاء `transition-guard.js` لتجميد الحركات (قراءة ديناميكية للمدة)
5. استدعاء `bidi-fix.js` لتطبيق RTL على النصوص (كشف نسبة الحروف)
6. استدعاء `shadow-dom-traverser.js` لمعالجة shadow DOMs
7. حقن CSS الخطوط
8. استدعاء `site-profiles.js` لإصلاحات خاصة بالموقع
9. إعداد IntersectionObserver للـ lazy processing
10. إزالة كل شيء عند التعطيل

### 8.2 background.js — Service Worker

**المسؤوليات:**
1. إدارة الإعدادات (chrome.storage.sync)
2. بث الإعدادات لكل التبويبات عند التغيير
3. اختصارات لوحة المفاتيح
4. تنظيف البيانات القديمة
5. تحديث شارة الأيقونة

### 8.3 popup — واجهة المستخدم

**الصفحة الرئيسية:**
- حالة الصفحة الحالية (نسبة العربية، هل مفعّل)
- زر تبديل تشغيل/إيقاف
- نسبة الكشف التلقائي (slider)
- اختيار الخط

**صفحة الإعدادات (المتقدمة):**
- قائمة بيضاء/سوداء
- إعدادات الخطوط
- تصدير/استيراد
- إعدادات per-site

---

## 9. CSS Logical Properties

### 9.1 ما هي؟

CSS Logical Properties بديل حديث للخصائص الفيزيائية:

| فيزيائي (قديم) | منطقي (جديد) | RTL behavior |
|----------------|---------------|--------------|
| `margin-left` | `margin-inline-start` | يتبع الاتجاه |
| `padding-right` | `padding-inline-end` | يتبع الاتجاه |
| `text-align: left` | `text-align: start` | يتبع الاتجاه |
| `left` | `inset-inline-start` | يتبع الاتجاه |
| `float: left` | `float: inline-start` | يتبع الاتجاه |

### 9.2 الدعم في الإضافة

نستخدم CSS Logical Properties في CSS الذي نحقنه:
- `text-align: start` بدل `text-align: right`
- `margin-inline-start` بدل `margin-left`
- هذا يضمن أن أنماطنا تتبع الاتجاه تلقائياً

### 9.3 ملاحظة مهمة

CSS Logical Properties **لا تحل المشكلة وحدها** لأنها تتطلب أن يكون الموقع مصمماً بها أصلاً. نحن نستخدمها فقط في CSS الذي نحقنه، وليس لتعديل CSS الموقع.

---

## 10. الأدوات والمكتبات المطلوبة

| الأداة | الاستخدام | ضروري؟ |
|--------|-----------|--------|
| Chrome Extension Manifest V3 | البنية الأساسية | ✅ نعم |
| chrome.storage.sync | حفظ الإعدادات | ✅ نعم |
| chrome.scripting | حقن ديناميكي | ✅ نعم |
| MutationObserver API | مراقبة DOM | ✅ نعم |
| IntersectionObserver API | lazy processing | ✅ نعم |
| CSS `@font-face` | تحميل الخطوط | ✅ نعم |
| Google Fonts API | خطوط إضافية | اختياري |
| TypeScript (توصية) | كتابة أنظف | اختياري |
| Vite (توصية) | بناء وتجميع | اختياري |

**لا نحتاج مكتبات خارجية.** كل شيء يمكن بناؤه بـ Vanilla JS + CSS.

---

## 11. خطة التنفيذ مرحلة بمرحلة

### المرحلة 1: الأساسيات (2-3 أيام)

**الهدف:** إضافة تعمل مع نهج Text-Only RTL

1. إنشاء هيكل المشروع و manifest.json
2. بناء `shadow-patch.js` — patch attachShadow في document_start
3. بناء `detector.js` — كشف المحتوى العربي (نسبة حروف)
4. بناء `bidi-fix.js` — تطبيق كشف نسبة الحروف على العناصر النصية
5. بناء `content.js` — التنسيق بين الوحدات
6. بناء `background.js` — إدارة الإعدادات
7. اختبار على 5 مواقع مختلفة

### المرحلة 2: Transition Guard + Shadow DOM (2-3 أيام)

**الهدف:** منع تحريك النصوص + دعم Shadow DOM

1. بناء `transition-guard.js` — قراءة ديناميكية للمدة الفعلية
2. تجميد transitions قبل التطبيق
3. إعادة transitions بعد المدة المحسوبة
4. بناء `lib/shadow-dom-traverser.js` — recursive traversal
5. اختبار على مواقع تستخدم Shadow DOM (YouTube, Gmail)

### المرحلة 3: الخطوط والأنماط (1-2 يوم)

**الهدف:** تحسين جودة النص العربي

1. تحميل خطوط عربية (Noto Naskh, Cairo, Tajawal, IBM Plex)
2. بناء `base.css` — أنماط الخطوط والتباعد
3. بناء `protection.css` — حماية الأيقونات
4. اختبار التوافق مع خطوط المواقع المختلفة

### المرحلة 4: واجهة المستخدم (2-3 أيام)

**الهدف:** popup متكامل وجميل

1. تصميم واجهة RTL عربية
2. صفحة الإعدادات
3. قائمة بيضاء/سوداء
4. اختيار الخطوط
5. تصدير/استيراد
6. اختصارات لوحة المفاتيح

### المرحلة 5: Site Profiles + Lazy Processing (2-3 أيام)

**الهدف:** دعم ذكي للمواقع الشائعة + أداء محسّن

1. بناء `site-profiles.js`
2. إعدادات مخصصة لكل موقع
3. ملفات إصلاح لـ: YouTube, Twitter/X, Facebook, Instagram, ChatGPT, Claude, Google
4. إصلاحات الترجمة (Google Translate)
5. إعداد IntersectionObserver لـ lazy processing
6. batch processing: 500 عنصر كل frame

### المرحلة 6: الاختبار والتحسين (2-3 أيام)

1. اختبار شامل على 20+ موقع
2. اختبار Shadow DOM (YouTube, Gmail, Google Docs)
3. اختبار الأداء مع 10000+ عنصر
4. قياس الأداء (Lighthouse)
5. إصلاح الأخطاء
6. تحسين الأداء

---

## 12. اختبار وضمان الجودة

### 12.1 قائمة مواقع الاختبار

| النوع | المواقع |
|-------|---------|
| شبكات اجتماعية | Twitter/X, Facebook, Instagram, Reddit, LinkedIn |
| AI | ChatGPT, Claude, Gemini, Perplexity |
| أخبار | CNN, BBC, Al Jazeera |
| بريد إلكتروني | Gmail, Outlook |
| توثيق | MDN, GitHub Docs, Stack Overflow |
| متاجر | Amazon, eBay |
| بحث | Google, DuckDuckGo |
| فيديو | YouTube, Netflix |
| محررات | Google Docs, CodePen, CodeSandbox |
| Shadow DOM | YouTube (تعليقات), Gmail, Google Docs |

### 12.2 معايير الاختبار

لكل موقع:
- [ ] لا يوجد تحريك/انتقال عند التفعيل
- [ ] النص العربي يعرض بشكل صحيح
- [ ] النص الإنجليزي داخل النص العربي يعرض صحيحاً
- [ ] الأيقونات والصور لم تتأثر
- [ ] الـ Layout (sidebar, header, nav) لم يتغير
- [ ] الكود والأكواد لا تزال LTR
- [ ] الأزرار والنماذج تعمل
- [ ] لا أخطاء في Console
- [ ] الأداء مقبول (لا lag)
- [ ] Shadow DOM elements تمت معالجتها
- [ ] 10000+ عنصر لا تُسبب تجمد

### 12.3 أدوات الاختبار
- Chrome DevTools → Elements panel (فحص dir attribute)
- Chrome DevTools → Performance tab (قياس FPS)
- Lighthouse (Performance + Accessibility)
- اختبار يدوي على كل موقع

---

## 13. ملخص التنفيذ

| القسم | الملف | الأسطر التقديرية |
|-------|-------|-------------------|
| Shadow Patch | shadow-patch.js | 30 |
| Content Script | content.js | 250 |
| Detector | lib/detector.js | 100 |
| Bidi Fix | lib/bidi-fix.js | 150 |
| Transition Guard | lib/transition-guard.js | 80 |
| Transform Fix | lib/transform-fixer.js | 80 |
| Site Profiles | lib/site-profiles.js | 150 |
| Shadow DOM Traverser | lib/shadow-dom-traverser.js | 120 |
| Background | background.js | 120 |
| Base CSS | styles/base.css | 100 |
| Protection CSS | styles/protection.css | 80 |
| Popup HTML | popup/popup.html | 200 |
| Popup JS | popup/popup.js | 300 |
| Popup CSS | popup/popup.css | 300 |
| **المجموع** | | **~2060 سطر** |

---

## 14. المخاطر والحلول

| المخاطرة | الاحتمال | الحل |
|----------|----------|------|
| بعض المواقع تتجاوز `dir="auto"` | متوسط | إضافة site-specific fix |
| خطوط عربية ثقيلة تُبطئ الصفحة | منخفض | `font-display: swap` + تحميل كسول |
| MutationObserver يُسبب loop | منخفض | Debounce + limit iterations |
| Shadow DOM معقد (nested) | متوسط | recursive traversal + event listener لكل shadowRoot جديدة |
| Transition Guard لا يكفي | منخفض | القراءة الديناميكية للمدة تضمن تغطية كاملة لكل المدد الفعلية |
| 10000+ عنصر يُسبب تجمد | متوسط | IntersectionObserver + batch processing (500 عنصر/frame) |
| CSS-in-JS يتعارض مع أنماطنا | متوسط | `!important` محدود + specificity عالية |
| المستخدم يشتكي أن الـ layout تغيّر | منخفض | توضيح أن النهج الجديد لا يلمس الـ layout |

---

*هذه الخطة مبنية على تحليل المشاريع الثلاثة السابقة + أحدث الحلول في CSS RTL (2025-2026) + أفضل الممارسات من MDN و rtlstyling.com.*
