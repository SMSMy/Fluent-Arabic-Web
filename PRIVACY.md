# سياسة الخصوصية لامتداد Fluent Arabic Web

تاريخ آخر تحديث: 25 أبريل 2025

## مقدمة

نحن في Fluent Arabic Web نلتزم بحماية خصوصيتك. تشرح سياسة الخصوصية هذه كيفية تعامل امتداد Fluent Arabic Web ("الامتداد") مع المعلومات وكيف نحمي خصوصيتك.

## المعلومات التي نجمعها

### لا نجمع أي بيانات شخصية

امتداد Fluent Arabic Web مصمم ليعمل بشكل كامل على جهازك دون الحاجة إلى جمع أو إرسال أي بيانات شخصية إلى خوادمنا أو أي طرف ثالث. نحن:

- **لا** نجمع معلومات تعريف شخصية
- **لا** نتتبع نشاطك على الإنترنت
- **لا** نشارك أي بيانات مع أطراف ثالثة
- **لا** نستخدم خدمات تحليلات أو إعلانات

### التخزين المحلي

يستخدم الامتداد واجهة برمجة التطبيقات `chrome.storage.sync` لتخزين إعداداتك وتفضيلاتك محلياً على جهازك فقط، مثل:

- حالة تفعيل/تعطيل الامتداد
- قائمة المواقع المسموح بها (القائمة البيضاء)
- قائمة المواقع المحظورة (القائمة السوداء)
- إعدادات الكشف التلقائي عن المحتوى العربي

هذه البيانات تُخزن محلياً على جهازك ولا يتم مشاركتها مع أي خوادم خارجية.

## أذونات المتصفح

يطلب امتداد Fluent Arabic Web الأذونات التالية:

### أذونات المضيف (`<all_urls>`)

يطلب الامتداد إذن الوصول إلى جميع المواقع (`<all_urls>`) للأسباب التالية:

1. **تحسين عرض النصوص العربية**: يحتاج الامتداد إلى تحليل محتوى الصفحة للكشف عن النصوص العربية وتطبيق التحسينات المناسبة.
2. **تطبيق تنسيقات CSS**: لتطبيق تنسيقات CSS المخصصة للنصوص العربية على مختلف المواقع.
3. **دعم الكتابة من اليمين إلى اليسار (RTL)**: لتعديل اتجاه النص في العناصر التي تحتوي على محتوى عربي.

الامتداد **لا يستخدم** أي رمز برمجي مستضاف عن بُعد. جميع الأكواد والموارد (بما في ذلك ملفات الخطوط) مضمنة في حزمة الامتداد نفسها ولا يتم تحميل أي شيء من خوادم خارجية.

### أذونات التخزين (`storage`)

يستخدم الامتداد إذن `storage` لتخزين إعداداتك وتفضيلاتك محلياً على جهازك.

### أذونات علامة التبويب النشطة (`activeTab`)

يستخدم الامتداد إذن `activeTab` للوصول إلى علامة التبويب النشطة لتطبيق التحسينات وتحديث حالة الامتداد في واجهة المستخدم.

## كيف نستخدم المعلومات

المعلومات المخزنة محلياً تُستخدم فقط لتوفير وظائف الامتداد الأساسية:

- تذكر إعداداتك وتفضيلاتك
- تطبيق التحسينات على المواقع وفقاً لإعداداتك
- تحديد ما إذا كان يجب تطبيق التحسينات على موقع معين أم لا

## الأمان

نحن ملتزمون بضمان أمان بياناتك. نظراً لأن الامتداد لا يجمع أو يرسل أي بيانات خارج جهازك، فإن مخاطر الأمان المرتبطة بالبيانات الشخصية منخفضة للغاية.

## التغييرات على سياسة الخصوصية

قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإخطارك بأي تغييرات عن طريق نشر السياسة الجديدة على صفحة GitHub الخاصة بالامتداد وتحديث تاريخ "آخر تحديث" في أعلى هذه الصفحة.

## اتصل بنا

إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى فتح مشكلة (Issue) على [صفحة GitHub الخاصة بالامتداد](https://github.com/nvkq/Fluent-Arabic-Web/issues) أو التواصل معنا عبر البريد الإلكتروني على [jljal1419@gmail.com].

---

هذه السياسة متاحة باللغة العربية والإنجليزية. في حالة وجود أي تعارض بين النسختين، تسود النسخة العربية.

# Privacy Policy for Fluent Arabic Web Extension

Last Updated: April 25, 2025

## Introduction

At Fluent Arabic Web, we are committed to protecting your privacy. This Privacy Policy explains how the Fluent Arabic Web extension ("the Extension") handles information and how we protect your privacy.

## Information We Collect

### We Do Not Collect Personal Data

The Fluent Arabic Web extension is designed to work entirely on your device without collecting or sending any personal data to our servers or any third parties. We:

- Do **NOT** collect personally identifiable information
- Do **NOT** track your internet activity
- Do **NOT** share any data with third parties
- Do **NOT** use analytics or advertising services

### Local Storage

The Extension uses the `chrome.storage.sync` API to store your settings and preferences locally on your device only, such as:

- Extension enable/disable status
- Whitelisted websites
- Blacklisted websites
- Arabic content auto-detection settings

This data is stored locally on your device and is not shared with any external servers.

## Browser Permissions

The Fluent Arabic Web extension requests the following permissions:

### Host Permissions (`<all_urls>`)

The extension requests permission to access all websites (`<all_urls>`) for the following reasons:

1. **Arabic Text Enhancement**: The extension needs to analyze page content to detect Arabic text and apply appropriate enhancements.
2. **CSS Styling Application**: To apply custom CSS styling for Arabic text across various websites.
3. **Right-to-Left (RTL) Support**: To modify text direction in elements containing Arabic content.

The extension does **NOT** use any remotely hosted code. All code and resources (including font files) are included in the extension package itself and nothing is loaded from external servers.

### Storage Permission (`storage`)

The extension uses the `storage` permission to store your settings and preferences locally on your device.

### Active Tab Permission (`activeTab`)

The extension uses the `activeTab` permission to access the active tab to apply enhancements and update the extension status in the user interface.

## How We Use Information

The locally stored information is used only to provide the core functionality of the extension:

- Remember your settings and preferences
- Apply enhancements to websites according to your settings
- Determine whether enhancements should be applied to a specific site or not

## Security

We are committed to ensuring the security of your data. Since the extension does not collect or send any data outside your device, the security risks associated with personal data are minimal.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on the extension's GitHub page and updating the "Last Updated" date at the top of this page.

## Contact Us

If you have any questions about this Privacy Policy, please open an issue on the [extension's GitHub page](https://github.com/nvkq/Fluent-Arabic-Web/issues) or contact us via email at [jljal1419@gmail.com].

---

This policy is available in both Arabic and English. In case of any conflict between the versions, the Arabic version shall prevail.

