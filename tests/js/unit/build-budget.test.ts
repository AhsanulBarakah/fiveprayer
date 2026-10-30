/**
 * Bundle-shape guard for the admin build.
 *
 * The settings route used to ship as one ~203 KB chunk and React was bundled
 * with the other vendors, both of which trip the per-asset budget. This test
 * reads the last `npm run build` output and fails if either regresses:
 *  - any JS asset above the 200 KB budget (e.g. a route chunk no longer split);
 *  - React no longer in its own long-lived `react.js` chunk.
 *
 * `build-admin/` is a build artifact (gitignored), so the suite skips when it
 * has not been built yet — run `npm run build` first.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The per-asset budget configured in webpack.config.js: 200 KB for app chunks
 * (the split target) and webpack's 244 KB for the framework chunk, which is
 * React 19 + ReactDOM and cannot be made smaller.
 */
const ASSET_BUDGET_BYTES = 200_000;
const REACT_CHUNK_BUDGET_BYTES = 250_000;

const BUILD_DIR = fileURLToPath(new URL('../../../build-admin/', import.meta.url));
const jsAssets = fs.existsSync(BUILD_DIR)
  ? fs.readdirSync(BUILD_DIR).filter((file) => file.endsWith('.js'))
  : [];

/** Map of asset filename to its size in bytes. */
const sizes = new Map(
  jsAssets.map((file) => [file, fs.statSync(path.join(BUILD_DIR, file)).size] as const)
);

describe.skipIf(jsAssets.length === 0)('admin bundle budget', () => {
  it('keeps every app asset under the per-asset budget', () => {
    const oversized = [...sizes].filter(
      ([file, bytes]) => file !== 'react.js' && bytes > ASSET_BUDGET_BYTES
    );

    expect(oversized).toEqual([]);
  });

  it('ships React in its own chunk instead of the shared vendors chunk', () => {
    expect(jsAssets).toContain('react.js');
    expect(jsAssets).toContain('vendors.js');

    // React 19 + ReactDOM are ~214 KB minified; anything much smaller means the
    // chunk no longer carries them, and vendors would then exceed the budget.
    expect(sizes.get('react.js') as number).toBeGreaterThan(150_000);
    expect(sizes.get('react.js') as number).toBeLessThan(REACT_CHUNK_BUDGET_BYTES);
    expect(sizes.get('vendors.js') as number).toBeLessThan(ASSET_BUDGET_BYTES);
  });

  it('splits the lazy route chunks (the settings page is not one big asset)', () => {
    // Lazy chunks are numbered; the entry chunks are the fixed-named ones.
    const entryAssets = ['index.js', 'react.js', 'runtime.js', 'vendors.js'];
    const routeAssets = jsAssets.filter((file) => !entryAssets.includes(file));

    expect(routeAssets.length).toBeGreaterThan(10);
    for (const file of routeAssets) {
      expect(sizes.get(file) as number).toBeLessThanOrEqual(ASSET_BUDGET_BYTES);
    }
  });
});
