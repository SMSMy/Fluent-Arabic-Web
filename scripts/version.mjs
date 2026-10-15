/**
 * scripts/version.mjs — مصدر الحقيقة الواحد لأرقام الإصدار
 *
 * الرقم يُقرأ من manifest.json (وهو ما يُنشر فعلاً في الإضافة على المتجر)،
 * ويُتحقّق من تطابق package.json معه حتى لا يتفرّع الرقم في مكانين.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @returns {string} رقم الإصدار، مثل "4.3.0"
 */
export function readVersion() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (!manifest.version) throw new Error('manifest.json لا يحمل حقل version');
  if (pkg.version !== manifest.version) {
    throw new Error(
      `تعارض أرقام الإصدار: manifest.json=${manifest.version} و package.json=${pkg.version} — وحّدهما ثم أعد البناء.`
    );
  }
  return manifest.version;
}

/** الرقم مختصراً إلى major.minor (لأسماء الوثائق مثل PRIVACY_CHARTER_v4.3) */
export function majorMinor(version) {
  return version.split('.').slice(0, 2).join('.');
}
