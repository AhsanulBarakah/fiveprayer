import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'praytimes-test-stub',
      enforce: 'pre',
      resolveId(id) {
        // The vendored engine mixes an ESM export with a `module.exports`
        // fallback that Vite's transform cannot evaluate; unit tests only
        // import it transitively, so they get a stub with the same surface.
        if (id.endsWith('libs/PrayTimes.js')) {
          return fileURLToPath(new URL('./tests/js/unit/stubs/PrayTimes.ts', import.meta.url));
        }
        return null;
      },
    },
  ],
  test: {
    // Unit tests only — the browser harness (tests/js/*.mjs) and the PHP
    // integration checks (tests/php/*.php) keep their own runners.
    include: ['tests/js/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['tests/js/unit/setup.ts'],
    restoreMocks: true,
  },
});
