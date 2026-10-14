import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const zipFile = path.join(distDir, 'fluent-arabic-web-4.3.0.zip');
const stagingDir = path.join(distDir, 'staging');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

function copyRecursive(src, dest) {
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

// 1. Root files
const rootFiles = ['manifest.json', 'background.js', 'content.js', 'shadow-patch.js'];
for (const file of rootFiles) {
  fs.copyFileSync(path.join(rootDir, file), path.join(stagingDir, file));
}

// 2. Directories
copyRecursive(path.join(rootDir, 'fonts'), path.join(stagingDir, 'fonts'));
copyRecursive(path.join(rootDir, 'icons'), path.join(stagingDir, 'icons'));
copyRecursive(path.join(rootDir, 'lib'), path.join(stagingDir, 'lib'));
copyRecursive(path.join(rootDir, 'styles'), path.join(stagingDir, 'styles'));

// 3. Popup (only production files)
const popupStaging = path.join(stagingDir, 'popup');
fs.mkdirSync(popupStaging, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'popup', 'popup.html'), path.join(popupStaging, 'popup.html'));
fs.copyFileSync(path.join(rootDir, 'popup', 'popup.css'), path.join(popupStaging, 'popup.css'));
fs.copyFileSync(path.join(rootDir, 'popup', 'popup.js'), path.join(popupStaging, 'popup.js'));
if (fs.existsSync(path.join(rootDir, 'popup', 'fonts'))) {
  copyRecursive(path.join(rootDir, 'popup', 'fonts'), path.join(popupStaging, 'fonts'));
}

console.log('Staged files successfully. Creating zip archive...');

// 4. Create ZIP archive
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });

// 5. Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });

const stat = fs.statSync(zipFile);
console.log(`Successfully created ${zipFile} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
