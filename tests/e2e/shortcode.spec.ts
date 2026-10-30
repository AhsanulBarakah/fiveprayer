import { expect, test } from '@playwright/test';
import { expectNoPhpError } from './utils';

/**
 * The page is created by the CI job with `wp post create`; locally, create one
 * with `[Fp_Single_CurrentTime]` and export its id:
 *
 *   FIVEPRAYER_E2E_PAGE_ID=12 npm run test:e2e
 */
const shortcodePageId = process.env.FIVEPRAYER_E2E_PAGE_ID;

test.describe('shortcodes on the front end', () => {
  test.skip(
    !shortcodePageId,
    'FIVEPRAYER_E2E_PAGE_ID is not set — export the id of a page containing [Fp_Single_CurrentTime].'
  );

  test('renders the current time for a logged-out visitor', async ({ page }) => {
    const response = await page.goto(`/?page_id=${shortcodePageId}`);

    expect(response?.status()).toBe(200);
    await expectNoPhpError(page);
    // A time, not the literal tag: rendering nothing would leave the shortcode
    // text or an empty paragraph behind.
    await expect(page.locator('body')).toContainText(/\d{1,2}:\d{2}/);
    await expect(page.locator('body')).not.toContainText('[Fp_Single_CurrentTime]');
  });
});
