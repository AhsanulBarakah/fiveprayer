import React, { useState } from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';

/**
 * CSSCustomPropertiesDoc
 *
 * Reference for the `--fiveprayer-*` custom properties the timetable and the daily
 * tables read. They are declared on the plugin's own containers (see
 * StyleManager::CONTAINER_SCOPE) and never on `:root`, so the only way to
 * change them from outside is to target one of those containers with enough
 * specificity to beat the inline block the plugin prints.
 *
 * Keep the names and defaults in step with:
 *   - php/classes/core/ShortCodes/Managers/StyleManager.php
 *   - php/classes/core/Daily/Styles/Traits/StyleRendererTrait.php
 * tests/php/test-css-scoping.php fails if a stylesheet declares a custom
 * property that is not `--fiveprayer-`.
 */
const CSSCustomPropertiesDoc: React.FC = () => {
  const timetableDocPath = '/documentation/timetable/shortcodes';

  const [preview, setPreview] = useState({
    header: '#0a7c46',
    odd: '#f4faf5',
    even: '#ffffff',
    highlight: '#fff4c2',
    border: '#214c0a',
  });

  const previewRows = [
    { prayer: 'Fajr', kind: 'odd' as const },
    { prayer: 'Dhuhr', kind: 'even' as const },
    { prayer: 'Asr', kind: 'highlight' as const },
    { prayer: 'Maghrib', kind: 'odd' as const },
    { prayer: 'Isha', kind: 'even' as const },
  ];

  const previewVariables = {
    '--fiveprayer-bg-first': preview.header,
    '--fiveprayer-bg-odd': preview.odd,
    '--fiveprayer-bg-even': preview.even,
    '--fiveprayer-bg-highlight': preview.highlight,
    '--fiveprayer-clr-border': preview.border,
    '--fiveprayer-border-size': '1px',
    '--fiveprayer-clr-radius': '8px',
  } as React.CSSProperties;

  const containers = [
    '.fiveprayer-container',
    '.fiveprayer__printer',
    '.fiveprayer__iqamah_next',
    '.fiveprayer-default-layout',
    '.fiveprayer-hijri-layout',
    'table.fiveprayer__TablePrayer_',
    'table.fiveprayer__DairyPrayer_',
  ];

  const groups: { title: string; rows: [string, string, string][] }[] = [
    {
      title: __('Row colours', 'fiveprayer'),
      rows: [
        ['--fiveprayer-bg-first', __('Background of the header band and the first month band.', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-clr-first', __('Text colour of the header band and the first month band.', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-bg-second', __('Background of the second band under the header.', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-clr-second', __('Text colour of the second band under the header.', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-bg-odd', __('Background of the odd body rows (1st, 3rd, …).', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-clr-odd', __('Text colour of the odd body rows.', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-bg-even', __('Background of the even body rows.', 'fiveprayer'), 'transparent'],
        ['--fiveprayer-clr-even', __('Text colour of the even body rows.', 'fiveprayer'), 'transparent'],
        [
          '--fiveprayer-bg-highlight',
          __('Background of today’s row (the highlighted row).', 'fiveprayer'),
          'rgba(242, 255, 0, 1)',
        ],
        [
          '--fiveprayer-clr-highlight',
          __('Text colour of today’s row.', 'fiveprayer'),
          'rgba(201, 9, 9, 1)',
        ],
        [
          '--fiveprayer-bg-hover',
          __('Row background on hover, where hover colours are switched on.', 'fiveprayer'),
          'rgba(0, 0, 0, 0.08)',
        ],
        ['--fiveprayer-clr-hover', __('Row text colour on hover.', 'fiveprayer'), 'inherit'],
      ],
    },
    {
      title: __('Borders and corners', 'fiveprayer'),
      rows: [
        [
          '--fiveprayer-border-size',
          __('Thickness of every cell line and the table outline. Any length; 0 removes the lines.', 'fiveprayer'),
          '1px',
        ],
        ['--fiveprayer-border-style', __('A CSS border style: solid, dashed, dotted, double, …', 'fiveprayer'), 'solid'],
        ['--fiveprayer-clr-border', __('Colour of the cell lines and the outline.', 'fiveprayer'), 'rgba(0, 0, 0, 0.1)'],
        [
          '--fiveprayer-border-default',
          __('The three border values already combined, ready for a `border:` shorthand.', 'fiveprayer'),
          '1px solid rgba(0, 0, 0, 0.1)',
        ],
        [
          '--fiveprayer-clr-radius',
          __(
            'Corner radius of the vertical daily table, in pixels. The monthly table takes its radius straight from Customizing → Timetable → Border radius.',
            'fiveprayer'
          ),
          '0px',
        ],
      ],
    },
  ];

  const exampleCss = `body .fiveprayer__printer,
body .fiveprayer-container {
  --fiveprayer-bg-odd: #f4faf5;
  --fiveprayer-clr-odd: #12281b;
  --fiveprayer-bg-even: #ffffff;
  --fiveprayer-clr-even: #12281b;
  --fiveprayer-bg-highlight: #fff4c2;
  --fiveprayer-clr-highlight: #4a3400;
  --fiveprayer-clr-border: rgb(18 40 27 / 0.2);
}`;

  const scopedExample = `.my-masjid-area .fiveprayer__printer {
  --fiveprayer-border-style: dashed;
  --fiveprayer-border-size: 2px;
}`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 font-sans">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h2 className="mb-3 text-center text-2xl font-bold text-gray-800">
          {__('🎨 Theme the Tables with CSS Variables', 'fiveprayer')}
        </h2>
        <p className="text-center text-lg text-gray-700">
          {__(
            'Every colour and border you pick in Customizing is published as a CSS custom property. Override those properties to restyle the timetable and the daily tables from your theme — no plugin file edits.',
            'fiveprayer'
          )}
        </p>
      </div>

      {/* Where the variables live */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-3 text-xl font-semibold text-gray-800">
          {__('Where the variables live', 'fiveprayer')}
        </h3>
        <p className="mb-3 text-gray-700">
          {__(
            'The variables are declared on the plugin’s own containers and inherit into everything inside them. They are deliberately not declared on :root: they are the plugin’s names, and nothing else on the page should be able to read or overwrite them. On a page that renders none of the containers below, the properties simply do not exist.',
            'fiveprayer'
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {containers.map((selector) => (
            <code
              key={selector}
              className="rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-800"
            >
              {selector}
            </code>
          ))}
        </div>
      </div>

      {/* Variable reference */}
      {groups.map((group) => (
        <div key={group.title} className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
          <h3 className="mb-4 text-xl font-semibold text-gray-800">{group.title}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-2 pr-4 font-semibold">{__('Variable', 'fiveprayer')}</th>
                  <th className="py-2 pr-4 font-semibold">{__('What it controls', 'fiveprayer')}</th>
                  <th className="py-2 font-semibold">{__('Default when unset', 'fiveprayer')}</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map(([name, description, fallback]) => (
                  <tr key={name} className="border-b border-gray-100 align-top last:border-0">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">{name}</code>
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{description}</td>
                    <td className="py-2">
                      <code className="text-gray-600">{fallback}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Live preview */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-3 text-xl font-semibold text-gray-800">{__('Live preview', 'fiveprayer')}</h3>
        <p className="mb-4 text-gray-700">
          {__(
            'Change a swatch to see how the two properties work together. The preview is painted with the same variables the tables read, and the controls do not save anything — copy the CSS below to apply a choice to your site.',
            'fiveprayer'
          )}
        </p>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="overflow-x-auto rounded-xl border border-gray-200 p-4">
            <div style={previewVariables}>
              <table
                className="w-full border-collapse text-center text-sm"
                style={{
                  borderRadius: 'var(--fiveprayer-clr-radius)',
                  overflow: 'hidden',
                  outline: '1px solid var(--fiveprayer-clr-border)',
                }}
              >
                <thead>
                  <tr>
                    <th
                      colSpan={2}
                      style={{
                        background: 'var(--fiveprayer-bg-first)',
                        color: '#ffffff',
                        padding: '6px 8px',
                        borderBottom: 'var(--fiveprayer-border-size) solid var(--fiveprayer-clr-border)',
                      }}
                    >
                      {__('October timetable', 'fiveprayer')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => {
                    const background =
                      row.kind === 'highlight'
                        ? 'var(--fiveprayer-bg-highlight)'
                        : row.kind === 'odd'
                          ? 'var(--fiveprayer-bg-odd)'
                          : 'var(--fiveprayer-bg-even)';

                    return (
                      <tr key={row.prayer} style={{ background }}>
                        <td
                          style={{
                            padding: '5px 8px',
                            textAlign: 'left',
                            borderRight: 'var(--fiveprayer-border-size) solid var(--fiveprayer-clr-border)',
                            borderBottom: 'var(--fiveprayer-border-size) solid var(--fiveprayer-clr-border)',
                            color: '#12281b',
                          }}
                        >
                          {row.prayer}
                          {row.kind === 'highlight' ? ` (${__('today', 'fiveprayer')})` : ''}
                        </td>
                        <td
                          style={{
                            padding: '5px 8px',
                            borderBottom: 'var(--fiveprayer-border-size) solid var(--fiveprayer-clr-border)',
                            color: '#12281b',
                          }}
                        >
                          {row.prayer === 'Fajr'
                            ? '05:29'
                            : row.prayer === 'Dhuhr'
                              ? '12:50'
                              : row.prayer === 'Asr'
                                ? '15:56'
                                : row.prayer === 'Maghrib'
                                  ? '18:38'
                                  : '20:10'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {([
              ['header', __('Header band', 'fiveprayer')],
              ['odd', __('Odd rows', 'fiveprayer')],
              ['even', __('Even rows', 'fiveprayer')],
              ['highlight', __('Today', 'fiveprayer')],
              ['border', __('Borders', 'fiveprayer')],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-gray-700">
                <span>{label}</span>
                <input
                  type="color"
                  aria-label={label}
                  value={preview[key]}
                  onChange={(event) =>
                    setPreview((current) => ({ ...current, [key]: event.target.value }))
                  }
                  className="h-8 w-12 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-3 text-xl font-semibold text-gray-800">{__('Example', 'fiveprayer')}</h3>
        <p className="mb-3 text-gray-700">
          {__(
            'Put your overrides in Appearance → Customize → Additional CSS, a child theme’s stylesheet, or the page builder’s own custom CSS. The plugin prints its values in an inline block after the stylesheets, on the same selector, so an override that only matches the exact selector may lose. The body prefix adds one level of specificity and settles it.',
            'fiveprayer'
          )}
        </p>
        <pre className="mb-4 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100">
          <code>{exampleCss}</code>
        </pre>
        <p className="mb-3 text-gray-700">
          {__(
            'To restyle one table only, wrap the shortcode in a container with your own class and target that class. Inside it the same variables are re-declared, so your rule must name the plugin container as well.',
            'fiveprayer'
          )}
        </p>
        <pre className="mb-3 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100">
          <code>{scopedExample}</code>
        </pre>
        <p className="text-gray-700">
          {__(
            'In your own stylesheets always give a fallback — var(--fiveprayer-bg-odd, transparent) — so the rule is harmless where the plugin is not rendered.',
            'fiveprayer'
          )}
        </p>
      </div>

      {/* Print + settings */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-3 text-xl font-semibold text-gray-800">{__('Two things to know', 'fiveprayer')}</h3>
        <ul className="list-disc space-y-2 pl-5 text-gray-700">
          <li>
            {__(
              'Printing keeps the table and its borders, and today’s row prints with its normal odd/even stripe instead of the highlight colour, so paper ignores --fiveprayer-bg-highlight. The border properties apply to print as well.',
              'fiveprayer'
            )}
          </li>
          <li>
            {__(
              'The Customizing screens remain the source of truth: the plugin rewrites these properties from your settings, so a variable you override only affects the tables your rule matches. To change the defaults for every table, set the colours in Customizing instead.',
              'fiveprayer'
            )}
          </li>
        </ul>
        <p className="mt-4 text-gray-700">
          {__('See also: ', 'fiveprayer')}
          <Link to={timetableDocPath} className="font-medium text-green-700 hover:underline">
            {__('the timetable shortcodes', 'fiveprayer')}
          </Link>
          {__(' and Customizing → Timetable for the settings these variables mirror.', 'fiveprayer')}
        </p>
      </div>

      {/* Migration from the old short prefix */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-3 text-xl font-semibold text-gray-800">
          {__('Upgrading from an earlier version', 'fiveprayer')}
        </h3>
        <p className="mb-3 text-gray-700">
          {__(
            'Custom CSS written against the old short prefix needs the new names. Nothing else changes: the rules can stay as they are, only the names move.',
            'fiveprayer'
          )}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-gray-700">
          <li>
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">.fp__highlight</code>
            {' → '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">.fiveprayer__highlight</code>
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">.FP_DairyPrayer_</code>
            {' → '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">.fiveprayer__DairyPrayer_</code>
          </li>
          <li>
            {__('The other plugin classes follow the same move: ', 'fiveprayer')}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">.fp-…</code>
            {' → '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">.fiveprayer-…</code>
            {__(' (settings, notices and admin screens).', 'fiveprayer')}
          </li>
          <li>
            {__(
              'Pre-release 3.0 builds published the colours and borders as --fp-… properties; they are --fiveprayer-… now. The 2.4.x names (--bg-odd, --clr-border, … on :root) no longer exist at all — use the properties in the table above.',
              'fiveprayer'
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CSSCustomPropertiesDoc;
