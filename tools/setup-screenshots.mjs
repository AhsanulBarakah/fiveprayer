#!/usr/bin/env node
/**
 * Regenerates the README "After Activation" screenshots.
 *
 * The five steps documented in README.md (== After Activation ==, images under
 * == Screenshots ==) are driven in a real WordPress admin, so the images show
 * what an installer actually meets instead of a mock-up. Run this after
 * changing the admin screens, then update the WordPress version named in the
 * README caption when the browser reports a different one.
 *
 *   npx @wp-playground/cli@latest start --port 9423   # in this directory
 *   npm run readme:screenshots
 *
 * The Playground CLI auto-mounts this working copy as a plugin; activate
 * FivePrayer once in its admin and the site files are reused on every later
 * run. `--url=http://127.0.0.1:8888` points the capture at another instance
 * (wp-env, a Local site) instead.
 *
 * Playwright's "chrome" channel is used, so a stock Chrome install is enough;
 * set CHROME_PATH to use a different binary. Screenshots land in
 * screenshots/setup-01…05.png at the 1440x900 size the README expects.
 *
 * The run is idempotent: the location, the chosen methods and the month are
 * reused when already saved, so rerunning never duplicates a location or seeds
 * the images with a different city.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'screenshots');
const WORK_DIR = path.join(ROOT, '.freebuff');
const VIEWPORT = { width: 1440, height: 900 };

const valueFlag = (name) => {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const BASE = (
  valueFlag('url') ??
  process.argv.slice(2).find((arg) => !arg.startsWith('-')) ??
  'http://127.0.0.1:9423'
).replace(/\/$/, '');

const log = (step, message) => console.log(`[${step}] ${message}`);

const fail = (message) => {
  console.error(`readme:screenshots — ${message}`);
  process.exit(1);
};

// Playground answers `wp-login.php` with a redirect once its auto-login cookie
// is set, so any HTTP response — not just 200 — means WordPress is listening.
const reachable = await fetch(`${BASE}/wp-login.php`, {
  redirect: 'manual',
  // A cold PHP-WASM worker can sit on its first request for a while; time the
  // probe out rather than hang the whole run.
  signal: AbortSignal.timeout(60_000),
})
  .then((response) => response.status > 0)
  .catch(() => false);

if (!reachable) {
  fail(
    `no WordPress answered at ${BASE}. Start one first:\n` +
      '  npx @wp-playground/cli@latest start --port 9423\n' +
      `then run this again, or point it elsewhere with --url=http://host:port`
  );
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(WORK_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' }),
});
/**
 * A page with PHP-WASM-sized timeouts. Playground answers the first request of
 * each page slowly and browser.newPage() starts every page on Playwright's 30s
 * default, so the admin page and the about page that reports the version both
 * need the longer limits.
 */
const newAdminPage = async () => {
  const fresh = await browser.newPage({ viewport: VIEWPORT });
  fresh.setDefaultTimeout(120_000);
  fresh.setDefaultNavigationTimeout(240_000);
  return fresh;
};

const page = await newAdminPage();

let wordpressVersion = 'unknown';

const shot = async (name, step) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, name) });
  log(step, `saved screenshots/${name}`);
};

/**
 * The plugin's telemetry consent modal covers the page until answered.
 * Answer "No thanks" via a synthetic click (the overlay intercepts pointer
 * events) and drop any leftover overlay so it stays out of the screenshots.
 */
const dismissConsent = async () => {
  const handled = await page.evaluate(() => {
    const buttons = document.querySelectorAll('[data-ifiiri-consent="no"]');
    buttons.forEach((button) => button.click());
    document.querySelectorAll('.ifiiri-modal, .ifiiri-modal__backdrop').forEach((el) => el.remove());
    return buttons.length;
  });
  if (handled) {
    await page.waitForTimeout(500);
    log('consent', `answered "No thanks" (${handled} prompt)`);
  }
};

/** Open one of the custom dropdowns in a card and return its popup list. */
const openDropdown = async (label) => {
  const box = page
    .locator('div.relative.w-full')
    .filter({ has: page.locator('label', { hasText: label }) });
  await box.first().click();
  const popup = page.locator('div.z-30').last();
  await popup.waitFor({ timeout: 60_000 });
  return popup;
};

/** Pick an option by its visible label, the way a person would. */
const pickOption = async (label, text) => {
  const popup = await openDropdown(label);
  await popup.getByText(text, { exact: true }).click();
  await page.waitForTimeout(700);
  log('pick', `${label} → ${text}`);
};

const fillLocation = async () => {
  await page.fill('input[name="country"]', 'United Kingdom');
  await page.fill('input[name="city"]', 'London');
  await page.fill('input[name="lat"]', '51.5074');
  await page.fill('input[name="lng"]', '-0.1278');
};

try {
  // --- Sign in ---------------------------------------------------------
  await page.goto(`${BASE}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  log('login', `landed on ${page.url()}`);

  if (page.url().includes('wp-login.php')) {
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await Promise.all([page.waitForURL(/wp-admin/, { timeout: 120_000 }), page.click('#wp-submit')]);
    log('login', 'signed in with the CLI defaults');
  }

  const about = await newAdminPage();
  await about.goto(`${BASE}/wp-admin/about.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 180_000,
  });
  const version = (await about.locator('body').innerText()).match(/Version\s+([0-9][0-9.]*)/i);
  wordpressVersion = version ? version[1] : 'unknown';
  log('version', `WordPress ${wordpressVersion}`);
  await about.close();

  // --- 1. Settings > General: timezone ---------------------------------
  await page.goto(`${BASE}/wp-admin/options-general.php`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#timezone_string', { timeout: 120_000 });
  await dismissConsent();
  await page.selectOption('#timezone_string', 'Europe/London');
  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.click('#submit'),
  ]);
  await page.waitForSelector('text=Settings saved', { timeout: 60_000 });
  log('timezone', 'Europe/London saved');
  // The timezone row sits below the fold at 1440x900. The reload restores the
  // previous scroll position, which can land back at the top, so scroll until
  // the field is really on screen instead of scrolling once and hoping.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    // Centre the row rather than nudging the field into view: Playwright counts
    // a half-visible element as visible, which leaves the select cut off at the
    // bottom edge of the capture.
    await page.evaluate(() => {
      const row = document.querySelector('#timezone_string')?.closest('tr');
      row?.scrollIntoView({ block: 'center' });
    });
    const onScreen = await page.evaluate(() => {
      const field = document.querySelector('#timezone_string');
      if (!field) return false;
      const box = field.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= window.innerHeight;
    });
    if (onScreen) break;
    await page.waitForTimeout(500);
  }
  await shot('setup-01-timezone.png', 'step 1');

  // --- 2. Customizing > Location ---------------------------------------
  await page.goto(`${BASE}/wp-admin/admin.php?page=fiveprayer#/customizing/location`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('input[name="country"]', { timeout: 120_000 });
  await dismissConsent();
  // Reruns reuse the location already saved, so the list never doubles up.
  const alreadySaved = await page.getByText(/\d+ locations? saved/).innerText();
  if (alreadySaved.startsWith('0')) {
    await fillLocation();
    await page.getByRole('button', { name: /^Add Location$/ }).click();
    await page.waitForSelector('text=/1 location saved/', { timeout: 60_000 });
    log('location', 'saved United Kingdom - London');
  } else {
    log('location', `reusing the existing saved location (${alreadySaved})`);
  }
  // The form clears on save; type the same values again so the capture shows
  // both the saved entry and the fields that produced it. Nothing is added a
  // second time, so reruns never duplicate the location.
  await fillLocation();
  await shot('setup-02-location.png', 'step 2');

  // --- 3. Prayer Settings ----------------------------------------------
  await page.goto(`${BASE}/wp-admin/admin.php?page=fiveprayer#/prayersettings`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('text=Prayer Settings', { timeout: 120_000 });
  await dismissConsent();

  await pickOption('Location, City', 'United Kingdom - London');
  await pickOption('Month', 'October');
  await pickOption('Higher Latitude Adjustment', 'No adjustments');
  await pickOption('Calculation Method', 'Muslim World League (MWL)');
  await pickOption('Asr Calculation', 'Shafii, Maliki, Jafari and Hanbali');
  // Changing the method auto-syncs this field; set it anyway so the capture
  // always shows a deliberate choice.
  await pickOption('Midnight Calculation Mode', 'Standard (Mid Sunset to Sunrise)');

  // Choosing a month asks for Update Month; save it so the card reads clean.
  const updateMonth = page.getByRole('button', { name: /Update Month/ });
  if (await updateMonth.isEnabled().catch(() => false)) {
    await updateMonth.click();
    // The button reads "Updating..." until the save lands; capturing then would
    // show a disabled control mid-flight.
    await page
      .getByRole('button', { name: /Updating/ })
      .waitFor({ state: 'detached', timeout: 120_000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    log('settings', 'month saved');
  }
  // The "Month updated" toast lands over the admin bar; let it fade so the
  // capture shows the settings rather than a floating notice.
  await page
    .locator('[data-sonner-toast]')
    .last()
    .waitFor({ state: 'detached', timeout: 15_000 })
    .catch(() => {});
  log('settings', 'Prayer Settings filled in');
  await shot('setup-03-prayer-settings.png', 'step 3');

  // --- 4. Generate Calendar --------------------------------------------
  const generate = page.getByRole('button', { name: /Generate Calendar/ });
  await generate.click();
  await page.waitForSelector('text=No timetable data', { state: 'detached', timeout: 180_000 });
  // The button reads "Generating..." while the year is built; capture the
  // finished state, not the spinner.
  await page
    .getByRole('button', { name: /Generating/ })
    .waitFor({ state: 'detached', timeout: 180_000 })
    .catch(() => {});
  // Let the toast from the month save fade before capturing.
  await page
    .locator('[data-sonner-toast]')
    .last()
    .waitFor({ state: 'detached', timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  log('generate', 'calendar generated');
  await shot('setup-04-generate.png', 'step 4');

  // --- 5. Customizing > TimeTable --------------------------------------
  await page.goto(`${BASE}/wp-admin/admin.php?page=fiveprayer#/customizing/timetable`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('text=/Fajr/i', { timeout: 120_000 });
  await dismissConsent();
  await page.waitForTimeout(1500);
  await shot('setup-05-timetable.png', 'step 5');
} catch (error) {
  await page
    .screenshot({ path: path.join(WORK_DIR, 'setup-fail.png') })
    .catch(() => {});
  console.error('FAILED:', error.message);
  console.error('url:', page.url());
  process.exitCode = 1;
} finally {
  await browser.close();
}

if (!process.exitCode) {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const caption = readme
    .split('\n')
    .find((line) => /captured in WordPress Playground/.test(line));
  if (caption && !caption.includes(wordpressVersion)) {
    console.warn(
      `readme:screenshots — the README caption still names another version. Captured on ${wordpressVersion}; update this line:\n  ${caption}`
    );
  }
  console.log(`Captured the setup screenshots from WordPress ${wordpressVersion} on ${BASE}.`);
}
