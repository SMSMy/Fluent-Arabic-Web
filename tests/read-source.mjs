/**
 * tests/read-source.mjs — قراءة ملفات المشروع كنصّ بنهايات أسطر موحّدة (LF)
 *
 * وحدة مستقلة بلا اعتماديات ثقيلة، ليبقى فحص المصادر معزولًا عن jsdom،
 * ولا يسقط على ويندوز حيث يفحص git الملفات بـ CRLF.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** جذر المشروع (المجلد الأعلى لمجلد الاختبارات) */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * قراءة ملف من جذر المشروع كنصّ، مع تطبيع نهايات الأسطر إلى LF.
 * @param {string} rel - مسار نسبي من جذر المشروع
 * @returns {string} محتوى الملف بنهايات أسطر LF
 */
export function readSource(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}
