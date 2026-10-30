# FivePrayer Development Documentation

## Features Hidden from Page Builders

### Oxygen Builder Integration
We have hidden the entire FivePrayer category from Oxygen Builder to prevent conflicts and ensure proper functionality. The following elements are currently disabled in Oxygen:

- FivePrayer Times
- FivePrayer Schedule
- FivePrayer Hijri Calendar
- FivePrayer Countdown

For detailed technical implementation and control options, see [Oxygen Integration Control](oxygen/oxygen-integration-control.md).

### Breakdance Integration
Similarly, we have hidden the FivePrayer category from Breakdance Builder for the same reasons.

For detailed technical implementation and control options, see [Breakdance Integration Control](breakdance/breakdance-integration-control.md).

## Dynamic Tags Refactoring

The dynamic tags system has been refactored to improve maintainability and performance.

For detailed information about the refactoring, benefits, and how to add new dynamic tags, see [Dynamic Tags Refactoring](dynamic-tags/dynamic-tags-refactoring.md).

### Status
- ✅ FivePrayer elements hidden from Oxygen Builder
- ✅ FivePrayer elements hidden from Breakdance Builder
- ✅ Dynamic tags refactored into smaller files (< 300 lines each)
- ✅ All functionality preserved
- ✅ Easy to re-enable when ready

## Checks Before Committing

`.githooks/pre-commit` runs the cheap checks that catch a broken commit:

| Step | What it catches |
| --- | --- |
| `php -l` on staged files | A syntax error that would fatal the plugin |
| `npm run typecheck` | Type errors in the admin app, including tests |
| `npm run test:unit` | Store/meta-loader, calendar, rounding and build-budget regressions, plus the shortcode-reference guards |
| `node tests/js/test-tv-display-fit.mjs` | TV display fitting logic |

Enable it once per clone — `npm install` does this automatically through the
`prepare` script, or run it by hand:

```bash
npm run hooks:install   # git config core.hooksPath .githooks
```

Skipping is deliberate, not silent: `SKIP_CHECKS=1 git commit -m "…"` (or the
usual `git commit --no-verify`).

GitHub runs the same checks on every push and pull request in
`.github/workflows/checks.yml`, and adds two things the hook leaves out because
they are slow: the production build (`npm run build`) and the PHP integration
suites in `tests/php/`.

Those PHP tests are not PHPUnit — they bootstrap a real WordPress, so the
`php-tests` job installs WordPress 6.7 against a MySQL service, copies the
plugin into `wp-content/plugins/fiveprayer`, runs `composer install` for the
autoloader, activates the plugin and then runs each test file. Locally they run
against your own WordPress install through `npm run test:php`.

Regenerate the screenshots with `npm run docs:screenshots` after changing the
Docs UI.

## Cutting a Release

1. Bump the version in `package.json`, the `Stable tag` in `README.md` and
   `changelog.txt`.
2. Add a short `= x.y.z =` entry to the **Release Notes** section at the top of
   `changelog.txt` — that text becomes the GitHub release body, so keep it
   installer-facing and skip the commit-by-commit detail that lives further
   down. With no entry, the release falls back to generated notes.
3. Commit, then tag and push: `git tag v3.0.1 && git push origin v3.0.1`.

`.github/workflows/release.yml` then builds the plugin, runs
`npm run plugin:zip` (which packages only the `files` list in `package.json` —
no `src/`, `blocks/`, `docs/` or tests, and no `package.json` itself, since npm
packing always includes the manifest and `tools/pack-plugin.mjs` strips it back
out) and publishes a GitHub release with `fiveprayer-v3.0.1.zip` attached.
GitHub adds the source archives itself, so the release shows both the
installable bundle and the source.

The job refuses to publish when the tag does not match the version in
`package.json`, and re-running it for an existing release replaces the asset
(`--clobber`) instead of failing.
