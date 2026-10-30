import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end configuration.
 *
 * The site under test is the WordPress that `npx wp-env start` boots from
 * `.wp-env.json` — this plugin is mounted into it and activated. Start it with
 * `npm run env:start`, then run these tests with `npm run test:e2e`.
 *
 * The specs run in a browser against a real WordPress, so they catch what the
 * PHP and unit suites cannot: a screen that 500s, an asset the build did not
 * emit, or a shortcode that renders nothing on the front end.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One worker: wp-env serves a single site and the specs share its users.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: process.env.WP_BASE_URL ?? 'http://localhost:8888',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
