import { expect, test } from '@playwright/test';
import { expectNoPhpError, login } from './utils';

test.describe('FivePrayer in wp-admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('the plugin is active on a fresh install', async ({ page }) => {
    await page.goto('/wp-admin/plugins.php');

    // data-plugin is "fiveprayer/Fiveprayer.php": the directory wp-env mounted.
    const row = page.locator('tr[data-plugin^="fiveprayer/"]');
    await expect(row).toHaveCount(1);
    // An active plugin offers Deactivate; an inactive one offers Activate.
    await expect(row.getByRole('link', { name: 'Deactivate' })).toBeVisible();
    await expectNoPhpError(page);
  });

  test('the settings screen loads', async ({ page }) => {
    const response = await page.goto('/wp-admin/admin.php?page=fiveprayer');

    expect(response?.status()).toBe(200);
    await expectNoPhpError(page);
    // The React app renders into the page's own container, so an empty page
    // means the admin bundle is missing or failed — which a status check alone
    // would not catch.
    await expect(page.locator('#wpbody-content')).toBeVisible();
    await expect(page.locator('#wpbody-content')).not.toBeEmpty();
  });
});
