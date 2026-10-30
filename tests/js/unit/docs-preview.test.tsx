/**
 * Renders the Docs pages to static HTML for `npm run docs:screenshots`.
 *
 * Skipped during a normal `npm run test:unit` run — it only writes files, so
 * there is nothing to assert. The screenshot script runs it with
 * DOCS_SCREENSHOTS=1, then points headless Chrome at the output.
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import HomeDocs from '../../../src/admin/components/Docs/HomeDocs';
import SingleShortcodeDocs from '../../../src/admin/components/Docs/shortcodes/SingleShortCodeDocs';

const OUT_DIR = path.resolve(__dirname, '../../../.freebuff/docs-preview');
const CSS = path.resolve(__dirname, '../../../build-admin/index.css');

const enabled = process.env.DOCS_SCREENSHOTS === '1';

/** One Docs page in an HTML shell, scoped the way Root.tsx scopes the admin. */
const renderPage = (component: React.ComponentType, offset = 0): string => {
  const body = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/documentation'] },
      React.createElement(component)
    )
  );
  const css = fs.readFileSync(CSS, 'utf8');

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><style>${css}</style></head>
<body style="margin:0;background:#f9fafb">
  <div class="fiveprayer" style="background:#f9fafb;min-height:100vh">
    <main style="padding:24px;${offset ? `margin-top:-${offset}px` : ''}">${body}</main>
  </div>
</body>
</html>`;
};

describe.skipIf(!enabled)('docs screenshots', () => {
  it('writes the pages the screenshot script captures', () => {
    if (!fs.existsSync(CSS)) {
      throw new Error('Run `npm run build` first — build-admin/index.css is missing.');
    }
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // The landing card sits below the intro, so the page is shifted up to put
    // it at the top of the viewport; the deprecated table is near the end of
    // the shortcode page.
    fs.writeFileSync(path.join(OUT_DIR, 'landing-card.html'), renderPage(HomeDocs, 246));
    fs.writeFileSync(
      path.join(OUT_DIR, 'deprecated-table.html'),
      renderPage(SingleShortcodeDocs, 3900)
    );
  });
});
