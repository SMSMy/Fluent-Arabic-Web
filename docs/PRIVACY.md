# سياسة الخصوصية — Fluent Arabic Web

**آخر تحديث:** 15 أكتوبر 2026
تنطبق على إضافة المتصفح «Fluent Arabic Web - RTL» وعلى موقع المشروع هذا.

---

## الخلاصة في سطر واحد

**لا نجمع أي بيانات، ولا نرسل أي شيء إلى أي مكان.** لا حسابات، ولا تحليلات، ولا تتبّع، ولا إعلانات، ولا خادم خارجي.

وهذا هو نفس ما أُعلن عنه في صفحة الإضافة على متجر كروم: أن المطوّر لا يجمع بياناتك ولا يستخدمها، وأنها لا تُباع لأطراف ثالثة، ولا تُستخدم لأغراض غير وظيفة الإضافة، ولا لتحديد الجدارة الائتمانية.

## ما لا تفعله الإضافة

- **لا نداء شبكة إطلاقاً.** لا يوجد في ملفات الإضافة أي `fetch` أو `XMLHttpRequest` أو `WebSocket` أو `sendBeacon`. كل المعالجة تجري داخل متصفحك.
- **لا جمع محتوى.** لا يُرسل نص الصفحات التي تزورها، ولا عناوينها، ولا روابطها، ولا أي جزء منها إلى أي جهة.
- **لا أدوات تحليل ولا تتبّع ولا إعلانات ولا بصمة جهاز.**
- **لا حسابات ولا تسجيل دخول.**

يمكنك التحقق بنفسك على نسخة المستودع:

```bash
grep -rn "fetch(\|XMLHttpRequest\|WebSocket\|sendBeacon" content.js background.js lib/ shadow-patch.js
```

الأمر لا يُخرج شيئاً.

## ما تحفظه الإضافة على جهازك

تُحفظ الإعدادات في تخزين المتصفح `chrome.storage`، وهي:

- حالة التفعيل، وحساسية الكشف التلقائي للعربية.
- الخط العربي المختار.
- قوائم المواقع المسموحة والممنوعة، والمحددات المخصصة التي تلتقطها بنفسك.
- إعدادات كل موقع على حدة.

تفاصيل تخصّ هذا التخزين:

- **إن كنت مفعّلاً لمزامنة المتصفح**، فقد يُزامن `chrome.storage.sync` هذه الإعدادات بين أجهزتك عبر حساب المتصفح الخاص بك. هذا نقل يديره المتصفح نفسه بين أجهزتك، ولا يمرّ بنا ولا نصل إليه.
- **التصدير والاستيراد** ملف JSON محلي أنت من يحفظه في جهازك، ولا يُرفع إلى أي مكان.
- **إلغاء تثبيت الإضافة** يحذف هذه الإعدادات من جهازك.

## الصلاحيات وسبب طلبها

| الصلاحية | لماذا |
| --- | --- |
| `storage` | حفظ إعداداتك على جهازك. |
| `activeTab` | التعامل مع التبويب الحالي عند تفعيلك الإضافة أو استخدام الاختصار. |
| `<all_urls>` (صلاحية مواقع) | لأن الإضافة تعمل على أي موقع تزوره: تحتاج قراءة نصوص الصفحة لتصحيح اتجاهها. القراءة والتعديل يجريان داخل متصفحك فقط. |
| ملفات الخطوط والأنماط في `web_accessible_resources` | لتتمكن الصفحة من تحميل الخطوط العربية المدمجة عند اختيارك خطاً. |

## موقع المشروع (GitHub Pages)

- صفحات ثابتة: لا حسابات، ولا نماذج، ولا أدوات تحليل، ولا ملفات تعريف ارتباط من جهتنا.
- تُحمَّل خطوط العرض في الموقع من خدمة **Google Fonts**، وعندها يتصل متصفحك بخوادم جوجل لجلب ملف الخط — كما يفعل أي موقع يستخدم هذه الخدمة. لا نرسل نحن أي بيانات، ويمكنك منع ذلك بحجب الخطوط في متصفحك دون أن يتعطل شيء.

## الأطراف الثالثة

لا نشارك أي بيانات مع أي طرف ثالث، لأننا لا نملك أصلاً أي بيانات نجمعها. لا خدمات تحليل، ولا حِزم تتبّع، ولا خوادم وسيطة. (استخدامك لمتجر كروم نفسه يخضع لسياسات جوجل، لا لسياساتنا.)

## الأطفال

لا نجمع بيانات من أي مستخدم، بمن فيهم الأطفال دون الثالثة عشرة.

## التغييرات على هذه السياسة

أي تعديل يُسجَّل علناً في تاريخ المستودع، ويمكنك مراجعة كل نسخة سابقة على:
<https://github.com/SMSMy/Fluent-Arabic-Web/commits/main/docs/PRIVACY.md>

## التواصل

لأي سؤال أو ملاحظة حول الخصوصية: [Issues على GitHub](https://github.com/SMSMy/Fluent-Arabic-Web/issues).

---

# Privacy Policy — Fluent Arabic Web

**Last updated:** 15 October 2026
Applies to the "Fluent Arabic Web - RTL" browser extension and to this project site.

## In one line

**We collect nothing and send nothing anywhere.** No accounts, no analytics, no tracking, no ads, no external server. This matches the Chrome Web Store declaration: the developer does not collect or use your data, it is not sold to third parties, not used or transferred for purposes unrelated to the extension's core functionality, and not used to determine creditworthiness.

## What the extension does not do

- **No network calls at all.** There is no `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon` anywhere in the extension code.
- **No content collection.** Page text, titles and URLs never leave your browser.
- **No analytics, tracking, ads or fingerprinting.**
- **No accounts and no sign-in.**

Verify it yourself on a clone of the repository:

```bash
grep -rn "fetch(\|XMLHttpRequest\|WebSocket\|sendBeacon" content.js background.js lib/ shadow-patch.js
```

The command prints nothing.

## What is stored on your device

Settings live in the browser's `chrome.storage`: enabled state, Arabic-detection threshold, chosen font, per-site allow/deny lists and any custom selectors you pick. If you have browser sync enabled, `chrome.storage.sync` may sync those settings between your own devices through your browser account — that transfer is handled by the browser and never passes through us. Export/import writes a local JSON file that you keep. Uninstalling the extension removes the stored settings.

## Permissions and why they are needed

| Permission | Why |
| --- | --- |
| `storage` | Save your settings on your device. |
| `activeTab` | Act on the current tab when you invoke the extension or its shortcut. |
| `<all_urls>` (host access) | The extension works on any site you visit, so it must read page text to fix its direction. Reading and correction happen inside your browser only. |
| Fonts/styles in `web_accessible_resources` | So a page can load the bundled Arabic fonts when you choose one. |

## The project website (GitHub Pages)

Static pages: no accounts, no forms, no analytics, no cookies of our own. Display fonts are loaded from **Google Fonts**, which means your browser contacts Google to fetch the font file, as any site using that service does. We send nothing ourselves, and blocking those fonts breaks nothing.

## Third parties

None. There is no data to share, because none is collected.

## Children

No data is collected from anyone, including children under 13.

## Changes to this policy

Every change is recorded publicly in the repository history:
<https://github.com/SMSMy/Fluent-Arabic-Web/commits/main/docs/PRIVACY.md>

## Contact

Questions about privacy: [GitHub Issues](https://github.com/SMSMy/Fluent-Arabic-Web/issues).
