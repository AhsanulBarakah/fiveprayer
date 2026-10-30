/**
 * Builds the installable plugin zip: `fiveprayer.zip`.
 *
 * `wp-scripts plugin-zip` packs the `files` list from package.json using
 * npm-packlist, and npm always includes the manifest in a package. package.json
 * is build metadata — WordPress reads the plugin header from Fiveprayer.php and
 * runs its own update checks against WordPress.org — so it is stripped from the
 * finished archive here. Every bundle therefore looks the same, whether it was
 * built locally or by the release workflow.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const manifest = require(path.join(root, 'package.json'));

const zipName = `${manifest.name}.zip`;
const zipPath = path.join(root, zipName);
const zipRoot = `${manifest.name}/`;

// Paths (relative to the plugin root inside the archive) that must not ship.
const EXCLUDED = ['package.json'];

/**
 * adm-zip is what plugin-zip uses to write the archive, but it is a dependency
 * of @wordpress/scripts rather than of this project, so it is resolved through
 * there instead of being duplicated in devDependencies.
 */
function loadAdmZip() {
  try {
    return require('adm-zip');
  } catch {
    const scriptsDir = path.dirname(
      require.resolve('@wordpress/scripts/package.json', { paths: [root] })
    );
    return require(require.resolve('adm-zip', { paths: [scriptsDir] }));
  }
}

// Run wp-scripts through node itself rather than its .bin shim: the shim is a
// batch file on Windows, where a checkout path with spaces breaks the call.
const binScript = path.join(root, 'node_modules', '@wordpress', 'scripts', 'bin', 'wp-scripts.js');

const packed = spawnSync(process.execPath, [binScript, 'plugin-zip'], {
  cwd: root,
  stdio: 'inherit',
});

if (packed.status !== 0) {
  console.error(`\nplugin-zip failed (exit ${packed.status ?? 'unknown'}); ${zipName} was not modified.`);
  process.exit(packed.status ?? 1);
}

const AdmZip = loadAdmZip();
const zip = new AdmZip(zipPath);
const relativeName = (entry) => (entry.startsWith(zipRoot) ? entry.slice(zipRoot.length) : entry);

let removed = 0;
for (const entry of zip.getEntries()) {
  if (entry.isDirectory || !EXCLUDED.includes(relativeName(entry.entryName))) {
    continue;
  }
  zip.deleteFile(entry.entryName);
  removed += 1;
}

if (removed > 0) {
  zip.writeZip(zipPath);
}

// Read the archive back from disk: the whole point of this script is the
// absence of these files, so a silently failed deletion must fail the build.
const written = new AdmZip(zipPath).getEntries().map((entry) => relativeName(entry.entryName));
const leaked = written.filter((name) => EXCLUDED.includes(name));

if (leaked.length > 0) {
  console.error(`\n${zipName} still contains ${leaked.join(', ')} — refusing to call this bundle done.`);
  process.exit(1);
}

console.log(`\nRemoved ${removed} build-only file(s). ${zipName} contains ${written.length} files.`);
