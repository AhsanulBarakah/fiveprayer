#!/usr/bin/env node
/**
 * Regenerates the Docs screenshots in `docs/images/`.
 *
 * The pages are React components, so they are first rendered to static HTML by
 * `tests/js/unit/docs-preview.test.tsx` (only when DOCS_SCREENSHOTS=1), then
 * captured with headless Chrome. Run this after changing the Docs UI so the
 * images in `docs/SHORTCODES.md` keep matching what the admin actually shows.
 *
 *   npm run docs:screenshots
 *
 * Set CHROME_PATH to override the browser location.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW_DIR = path.join(ROOT, '.freebuff', 'docs-preview');
const IMAGE_DIR = path.join(ROOT, 'docs', 'images');
const CSS = path.join(ROOT, 'build-admin', 'index.css');

const SHOTS = [
  { html: 'landing-card.html', png: 'shortcodes-reference-card.png', width: 1280, height: 330 },
  { html: 'deprecated-table.html', png: 'shortcodes-deprecated-table.png', width: 1280, height: 1180 },
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const fail = (message) => {
  console.error(`docs:screenshots — ${message}`);
  process.exit(1);
};

if (!fs.existsSync(CSS)) {
  fail('build-admin/index.css is missing. Run `npm run build` first.');
}

const chrome = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
if (!chrome) {
  fail('Chrome was not found. Set CHROME_PATH to its executable.');
}

// Run the local vitest entry point directly: spawning `npx` needs a shell on
// Windows, and this avoids depending on how npx is installed.
const vitest = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
if (!fs.existsSync(vitest)) {
  fail('vitest is not installed. Run `npm install` first.');
}

const render = spawnSync(
  process.execPath,
  [vitest, 'run', 'tests/js/unit/docs-preview.test.tsx'],
  { cwd: ROOT, stdio: 'inherit', env: { ...process.env, DOCS_SCREENSHOTS: '1' } }
);

if (render.status !== 0) {
  fail('the Docs pages could not be rendered.');
}

fs.mkdirSync(IMAGE_DIR, { recursive: true });

for (const shot of SHOTS) {
  const html = path.join(PREVIEW_DIR, shot.html);
  const output = path.join(IMAGE_DIR, shot.png);

  if (!fs.existsSync(html)) {
    fail(`${shot.html} was not produced by the render step.`);
  }

  const chromeRun = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${shot.width},${shot.height}`,
      `--screenshot=${output}`,
      pathToFileURL(html).href,
    ],
    { cwd: ROOT, stdio: 'inherit' }
  );

  if (chromeRun.status !== 0 || !fs.existsSync(output)) {
    fail(`Chrome could not capture ${shot.png}.`);
  }

  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`docs/images/${shot.png} — ${shot.width}x${shot.height}, ${kb} KB`);
}
