/**
 * scripts/pack.mjs — حزم إضافة Fluent Arabic Web بشكل محمول وآمن
 * متوافق مع Windows و Linux و macOS دون أي اعتماد على PowerShell أو أدوات خارجية.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ZipArchive } from 'archiver';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

// قراءة رقم الإصدار ديناميكياً من manifest.json
const manifestPath = path.join(rootDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '4.3.0';

const targetZip = path.join(distDir, `fluent-arabic-web-${version}.zip`);
const tempZip = path.join(distDir, `fluent-arabic-web-${version}.tmp-${Date.now()}.zip`);
const stagingDir = path.join(distDir, `.staging-${Date.now()}`);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

async function pack() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  let success = false;

  try {
    console.log(`[Pack] Preparing staging directory for v${version}...`);
    fs.mkdirSync(stagingDir, { recursive: true });

    // 1. ملفات الجذر الأساسية للإضافة
    const rootFiles = ['manifest.json', 'background.js', 'content.js', 'shadow-patch.js', 'LICENSE'];
    for (const file of rootFiles) {
      const srcPath = path.join(rootDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(stagingDir, file));
      }
    }

    // 2. المجلدات الأساسية
    copyRecursive(path.join(rootDir, 'fonts'), path.join(stagingDir, 'fonts'));
    copyRecursive(path.join(rootDir, 'icons'), path.join(stagingDir, 'icons'));
    copyRecursive(path.join(rootDir, 'lib'), path.join(stagingDir, 'lib'));
    copyRecursive(path.join(rootDir, 'styles'), path.join(stagingDir, 'styles'));

    // 3. ملفات الـ popup الإنتاجية فقط
    const popupStaging = path.join(stagingDir, 'popup');
    fs.mkdirSync(popupStaging, { recursive: true });
    fs.copyFileSync(path.join(rootDir, 'popup', 'popup.html'), path.join(popupStaging, 'popup.html'));
    fs.copyFileSync(path.join(rootDir, 'popup', 'popup.css'), path.join(popupStaging, 'popup.css'));
    fs.copyFileSync(path.join(rootDir, 'popup', 'popup.js'), path.join(popupStaging, 'popup.js'));
    if (fs.existsSync(path.join(rootDir, 'popup', 'fonts'))) {
      copyRecursive(path.join(rootDir, 'popup', 'fonts'), path.join(popupStaging, 'fonts'));
    }

    console.log('[Pack] Archiving using pure cross-platform ZipArchive stream...');

    // 4. إنشاء ملف ZIP عبر تدفق Node.js نقي
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(tempZip);
      const archive = new ZipArchive({
        zlib: { level: 9 } // أقصى ضغط
      });

      output.on('close', resolve);
      output.on('error', reject);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(stagingDir, false);
      archive.finalize();
    });

    // 5. استبدال ذري للملف النهائي فقط بعد نجاح الإنشاء الكامل
    if (fs.existsSync(targetZip)) {
      fs.unlinkSync(targetZip);
    }
    fs.renameSync(tempZip, targetZip);

    success = true;
    const stat = fs.statSync(targetZip);
    console.log(`[Pack] Successfully created: ${targetZip} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  } finally {
    // 6. تنظيف مضمون ودائم للمجلد المؤقت وأي ملفات ناقصة
    if (fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('[Pack] Could not fully remove staging directory:', err.message);
      }
    }
    if (!success && fs.existsSync(tempZip)) {
      try {
        fs.unlinkSync(tempZip);
      } catch (err) {
        /* ignore */
      }
    }
  }
}

pack().catch((err) => {
  console.error('[Pack] Packaging failed:', err);
  process.exit(1);
});
