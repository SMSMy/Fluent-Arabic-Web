/**
 * scripts/build-site.mjs — بناء صفحة الموقع الرئيسية من قالبها
 *
 * مصدر الحقيقة الواحد للأرقام هو `manifest.json` (رقم الإصدار المنشور فعلاً في
 * الإضافة)، وقالب الصفحة في `site/index.template.html` يحمل الرمز
 * `{{VERSION}}`. فلا يوجد رقم إصدار مكتوب بخطّ اليد في أي صفحة منشورة:
 *   npm run build:site
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, readVersion, majorMinor } from './version.mjs';

const TEMPLATE = 'site/index.template.html';
const TARGET = 'docs/index.html';

/**
 * تعبئة قالب الصفحة بالأرقام المشتقّة من رقم الإصدار.
 * @param {string} template محتوى site/index.template.html
 * @param {string} version رقم الإصدار مثل "4.3.0"
 * @returns {string} محتوى docs/index.html
 */
export function renderSiteHtml(template, version) {
  return template
    .replace(/\{\{VERSION\}\}/g, version)
    .replace(/\{\{VERSION_MM\}\}/g, majorMinor(version));
}

function main() {
  const version = readVersion();
  const template = fs.readFileSync(path.join(ROOT, TEMPLATE), 'utf8');
  const html = renderSiteHtml(template, version);
  fs.writeFileSync(path.join(ROOT, TARGET), html, 'utf8');
  console.log(`[Site] ${TEMPLATE} -> ${TARGET} (v${version}, ${html.length} chars)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
