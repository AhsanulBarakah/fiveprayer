import { expect, type Page } from '@playwright/test';

/** wp-env creates the admin user these defaults point at. */
export const ADMIN_USERNAME = process.env.WP_USERNAME ?? 'admin';
export const ADMIN_PASSWORD = process.env.WP_PASSWORD ?? 'password';

/**
 * Sign in through wp-login.php.
 *
 * The specs sign in themselves rather than reusing a stored state file so a
 * failure points at the login screen when the site is not up.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/wp-login.php');
  await page.fill('#user_login', ADMIN_USERNAME);
  await page.fill('#user_pass', ADMIN_PASSWORD);
  await Promise.all([page.waitForURL(/wp-admin/), page.click('#wp-submit')]);
  await expect(page.locator('#wpadminbar')).toBeVisible();
}

/** Assert the page is not one of WordPress's error screens. */
export async function expectNoPhpError(page: Page): Promise<void> {
  const body = page.locator('body');
  await expect(body).not.toContainText('Fatal error');
  await expect(body).not.toContainText('There has been a critical error');
  await expect(body).not.toContainText('Parse error');
}
