<div align="center">

<!-- Install Button -->
<a href="https://chromewebstore.google.com/detail/fluent-arabic-web/gofhnecgeianjadhjmlkpmfjmflmolag" target="_blank">
  <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_128x128.png" width="48" alt="Chrome">
  <br>
  <img src="https://img.shields.io/badge/%E2%AC%87%EF%B8%8F%20Install%20from%20Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
</a>

<br><br>

---

<img src="assets/fluent_arabic_web_icon.svg" alt="Fluent Arabic Web — الأيقونة الجديدة" width="280">

<h1>Fluent Arabic Web</h1>

<p><b>تجربة تصفح عربية مثالية — بدون تحريك أو كسر التخطيط</b></p>

<img src="https://img.shields.io/badge/Manifest-v3-blueviolet?style=flat-square" alt="Manifest v3">
<img src="https://img.shields.io/badge/Version-4.0.1-success?style=flat-square" alt="v4.0.1">
<img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT">

</div>

---

## 📖 عن الإضافة

إضافة **Fluent Arabic Web** تهدف إلى تحسين عرض النصوص العربية على مواقع الويب التي لا تدعم اللغة العربية بشكل كامل أو لا توفر اتجاه النص من اليمين إلى اليسار (RTL) بشكل صحيح. تقوم الإضافة باكتشاف النصوص العربية تلقائياً وتصحيح اتجاهها دون إحداث فوضى في تخطيط الموقع الأصلي.

---

## 🧭 كيف تعمل الإضافة؟

![رسم توضيحي: قبل وبعد استخدام الإضافة](assets/fluent_arabic_web_concept.svg)

*يساراً: نص عربي غير منسق (محاذاة خاطئة وترتيب كلمات معكوس) — يميناً: نفس الصفحة بعد أن تصحح الإضافة الاتجاه والمحاذاة تلقائياً، دون المساس بتصميم الموقع.*

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|---|---|
| 🔍 **اكتشاف تلقائي وذكي** | تكتشف النصوص العربية في الصفحة وتصحح اتجاهها إلى اليمين (RTL) |
| 🔤 **إصلاح Bidi** | معالجة متقدمة لثنائية الاتجاه لتجنب عكس الكلمات الأجنبية والأرقام |
| 🛡️ **حماية التخطيط** | تعديل النصوص فقط مع الحفاظ على التصميم العام للموقع |
| 🌑 **Shadow DOM** | دعم كامل للمواقع الحديثة التي تستخدم Shadow DOM |
| 🖋️ **خطوط مخصصة** | خطوط عربية جميلة من ثمانية تايبفيس لأفضل تجربة قراءة |
| 🌐 **دعم iFrames** | تطبيق RTL داخل الإطارات المضمّنة (`all_frames: true`) |
| ⭐ **Whitelist / Blacklist** | دعم `*.example.com` لإدارة المواقع بمرونة |
| ⌨️ **اختصار لوحة المفاتيح** | تفعيل/تعطيل RTL بضغطة `Alt + Shift + A` |

---

## 🖼️ صور الإضافة

### قبل الاستخدام
![صورة قبل](assets/صورة%20قبل.jpg)

### بعد الاستخدام
![صورة بعد](assets/صورة%20بعد.jpg)

### واجهة الإضافة
![واجهة الإضافة](assets/صورة%20لواجهة%20الاضافة%20.jpg)

---

## 🚀 التثبيت

### من Chrome Web Store (موصى به)

<a href="https://chromewebstore.google.com/detail/fluent-arabic-web/gofhnecgeianjadhjmlkpmfjmflmolag">
  <img src="https://img.shields.io/badge/Install%20from%20Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
</a>

### من المصدر (للمطورين)

```bash
git clone https://github.com/SMSMy/Fluent-Arabic-Web.git
```

1. افتح `chrome://extensions/` أو `edge://extensions/`
2. فعّل **وضع المطور (Developer mode)**
3. انقر **تحميل إضافة فُكّ ضغطها (Load unpacked)**
4. اختر مجلد المستودع

---

## 🚧 التطوير وخارطة الطريق

### مواقع معروفة لا تعمل معها الإضافة بعد

بعض التطبيقات الحديثة (SPA) لا يكفيها الكشف العام، ومنها:

- [grok.com](https://grok.com/) و [aistudio.google.com](https://aistudio.google.com/) — React/Angular يعيدان رسم الصفحة باستمرار فيُمحى `dir="rtl"` بعد أول re-render
- صفحات DeepSeek Harness المحلية (`127.0.0.1:3080`)

| السبب | الأثر |
|---|---|
| لا يوجد profile للموقع في `lib/site-profiles.js` | يعمل الكشف العام فقط وينكسر مع المواقع الديناميكية |
| React / Tailwind يعيدان الرسم | `dir="rtl"` يُمسَح فوراً |
| البث الحي للتوكنات | وميض بين LTR و RTL |
| Shadow DOM / CSP | العناصر الداخلية لا تُلمَس |

### الحل الجاري

1. **Profiles جاهزة داخل الكود** — نفس أسلوب ChatGPT وClaude: selectors ثابتة + CSS بـ `!important` (يصمد أمام re-render)، مع استثناء `pre` و`code` والجداول حتى لا ينعكس الكود.
2. **محرر عناصر لكل موقع** — زر «التقط عنصراً» (element picker) في الـ popup يحفظ selectors مستقرة في `chrome.storage`، مع زر مشاركة الإعداد كـ JSON.
3. **تحديث الـ profiles عن بُعد** — بدل انتظار تحديث المتجر عند كل تغيير في كلاسات المواقع.

### إصلاحات ذات أولوية (من تقرير الفحص)

1. تجميع دفعات الـ `MutationObserver` — حتى لا تُفقد العناصر العربية أثناء الـ debounce
2. إزالة `return true` غير المشروط في message listener (تسريب في كروم)
3. `loadSettings` يعدّل الكائن الأصلي — خلط إعدادات بين الجلسات
4. تقليل استدعاءات `getComputedStyle` في الصفحات الكبيرة
5. ضغط حجم الأيقونة وتوحيد CSS المكرر بين `fixes.css` و`protection.css`

### ميزات مخططة

- Profiles لـ Copilot وDiscord وNotion (نفس فئة SPAs)
- وضع «طبيب الموقع»: يشرح سبب فشل الإصلاح (CSP / Shadow مغلق / React overwrite / نسبة عربي تحت العتبة)
- debounce ديناميكي: منخفض للبث الحي، أعلى للصفحات الثابتة
- استثناء ذكي لكتل الكود حتى لا ينعكس `if (x)` داخل رد عربي
- تحويل الخطوط إلى WOFF2 واختبارات آلية على صفحات ثابتة (ChatGPT / Claude / Grok)

### ما لا ننصح به

- كتابة CSS selectors يدوياً بدون element picker
- `forceRTL` على كامل `body` في قروك — يكسر الشريط الجانبي والكود
- الاعتماد على `loadDelay` طويل وحده — يعالج التحميل الأول فقط وليس البث الحي
