import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';

/**
 * PrayerHighlightDoc
 *
 * How-to page for the automatic next-prayer highlight: any container classed
 * `fiveprayer_highlight` whose children carry a `data-prayer` attribute gets
 * `fiveprayer_active` added to the child whose prayer is the upcoming one.
 *
 * Mirrors the real implementation in:
 *   - php/classes/core/helpers/FivePrayer_Highlighter.php (server side, wp_footer)
 *   - php/classes/core/Assets/JS/highlighter.js (client side)
 */
const PrayerHighlightDoc: React.FC = () => {
  const singlePrayerDocPath = '/documentation/singleprayer/shortcodes';
  const translatePath = '/moresettings/translate';

  /** Prayer slugs that can be highlighted (the five prayers + sunrise). */
  const slugs = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  const exampleHtml = `<div class="fiveprayer_highlight">
  <div data-prayer="fajr">Fajr</div>
  <div data-prayer="sunrise">Sunrise</div>
  <div data-prayer="dhuhr">Dhuhr</div>
  <div data-prayer="asr">Asr</div>
  <div data-prayer="maghrib">Maghrib</div>
  <div data-prayer="isha">Isha</div>
</div>`;

  const exampleCss = `.fiveprayer_highlight > div {
  padding: 8px 16px;
  border-radius: 8px;
  color: #374151;
}

.fiveprayer_highlight > div.fiveprayer_active {
  background: #0a7c46;
  color: #ffffff;
  font-weight: 600;
}`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 font-sans">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h2 className="mb-3 text-center text-2xl font-bold text-gray-800">
          {__('🎯 Highlight the Next Prayer', 'fiveprayer')}
        </h2>
        <p className="text-center text-lg text-gray-700">
          {__('Mark the upcoming prayer automatically inside your own layout — the plugin finds the right one and highlights it for you.', 'fiveprayer')}
        </p>
      </div>

      {/* What it is */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('What is it?', 'fiveprayer')}</h3>
        <p className="mb-3 text-gray-700">
          {__('Five Prayer can highlight the next prayer on your page. You build the layout yourself — a list, a row, a set of cards, anything — and give it one container class plus a small attribute on each prayer. The plugin then adds an active class to the prayer that is coming up next, so your own CSS decides how it looks.', 'fiveprayer')}
        </p>
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            <strong>{__('Good to know:', 'fiveprayer')}</strong>{' '}
            {__('It highlights the NEXT prayer (the one still to come), not the one that has just begun. The choice is made when the page is rendered — so a page left open across a prayer time updates the highlight the next time it is loaded.', 'fiveprayer')}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('How it works', 'fiveprayer')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{__('Part', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('What you add', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('What Five Prayer does', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 align-top text-gray-700">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Wrapper', 'fiveprayer')}</td>
                <td className="px-4 py-3">
                  <code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">fiveprayer_highlight</code>
                </td>
                <td className="px-4 py-3">{__('Marks the container to scan. Only prayers inside it are searched.', 'fiveprayer')}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Each prayer', 'fiveprayer')}</td>
                <td className="px-4 py-3">
                  <code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">data-prayer="asr"</code>
                </td>
                <td className="px-4 py-3">{__('Tells the plugin which prayer that element represents.', 'fiveprayer')}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Active state', 'fiveprayer')}</td>
                <td className="px-4 py-3">
                  <code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">fiveprayer_active</code>
                </td>
                <td className="px-4 py-3">{__('Added by the plugin to the element whose data-prayer matches the next prayer. The plugin stylesheet gives it a default highlight look; override it with your own CSS to change it.', 'fiveprayer')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step by step */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('Step by step', 'fiveprayer')}</h3>
        <ol className="ml-4 list-decimal space-y-3 text-gray-700">
          <li>
            {__('Build your prayer layout in any page builder or with the block editor.', 'fiveprayer')}
          </li>
          <li>
            {__('Add the class', 'fiveprayer')}{' '}
            <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">fiveprayer_highlight</code>{' '}
            {__('to the container that holds all the prayers (usually the parent row or list).', 'fiveprayer')}
          </li>
          <li>
            {__('For each prayer element add a', 'fiveprayer')}{' '}
            <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">data-prayer</code>{' '}
            {__('attribute using one of the slugs below.', 'fiveprayer')}
          </li>
          <li>
            {__('Add your own CSS for', 'fiveprayer')}{' '}
            <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">.fiveprayer_active</code>{' '}
            {__('to choose how the highlighted prayer looks.', 'fiveprayer')}
          </li>
        </ol>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-gray-800">{__('Allowed data-prayer values', 'fiveprayer')}</p>
          <div className="flex flex-wrap gap-2">
            {slugs.map((slug) => (
              <code key={slug} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-800">
                {slug}
              </code>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {__('Values are matched case-insensitively, so "Asr", "asr" and " ASR " all work. Only the five prayers and Sunrise are ever highlighted — Midnight and Iqamah-only times are not part of the next-prayer list.', 'fiveprayer')}
          </p>
        </div>
      </div>

      {/* Example markup */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('Example markup', 'fiveprayer')}</h3>
        <p className="mb-3 text-gray-700">
          {__('A simple list of the six prayers. The plugin adds', 'fiveprayer')}{' '}
          <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">fiveprayer_active</code>{' '}
          {__('to the one that is next (here, Asr).', 'fiveprayer')}
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100"><code>{exampleHtml}</code></pre>
        <p className="mt-4 mb-2 text-sm font-semibold text-gray-800">{__('Result at load time', 'fiveprayer')}</p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100"><code>{`<div class="fiveprayer_highlight">
  <div data-prayer="fajr">Fajr</div>
  <div data-prayer="sunrise">Sunrise</div>
  <div data-prayer="dhuhr">Dhuhr</div>
  <div data-prayer="asr" class="fiveprayer_active">Asr</div>
  <div data-prayer="maghrib">Maghrib</div>
  <div data-prayer="isha">Isha</div>
</div>`}</code></pre>
      </div>

      {/* Styling */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('Styling the highlighted prayer', 'fiveprayer')}</h3>
        <p className="mb-3 text-gray-700">
          {__('Five Prayer ships a default look for the highlight — an accent colour and bold text — inside its combined stylesheet, so it is visible on any theme and any page builder straight away. To change it, add your own rule under', 'fiveprayer')}{' '}
          <strong>{__('Appearance → Customize → Additional CSS', 'fiveprayer')}</strong>{__(' — it loads after the plugin stylesheet and wins.', 'fiveprayer')}
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100"><code>{exampleCss}</code></pre>
        <p className="mt-3 text-xs text-gray-500">
          {__('Target the class on its own, or scope it with your container (for example', 'fiveprayer')}{' '}
          <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">.fiveprayer_highlight .fiveprayer_active</code>{' '}
          {__(') so only your prayer list is affected.', 'fiveprayer')}
        </p>
      </div>

      {/* Using it in the editor */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('Adding the attributes in an editor', 'fiveprayer')}</h3>
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{__('Block editor (Gutenberg)', 'fiveprayer')}</h4>
            <p className="mt-1 text-sm text-gray-700">
              {__('Use a', 'fiveprayer')}{' '}
              <strong>{__('Custom HTML', 'fiveprayer')}</strong>{' '}
              {__('block for the list above — the standard Group/Paragraph blocks only let you add a CSS class, not a data-prayer attribute. Paste the markup from the example and switch back to the visual editor when done.', 'fiveprayer')}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{__('Page builders (Elementor, Breakdance, Divi, Bricks, …)', 'fiveprayer')}</h4>
            <p className="mt-1 text-sm text-gray-700">
              {__('Use the builder\'s HTML / Code element for the container and the prayer items, or add the class through each element\'s CSS class field and the data-prayer attribute through its custom-attributes field if it has one.', 'fiveprayer')}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{__('Pairing with shortcodes', 'fiveprayer')}</h4>
            <p className="mt-1 text-sm text-gray-700">
              {__('You can print the live times next to each name with the single-prayer shortcodes — see', 'fiveprayer')}{' '}
              <Link to={singlePrayerDocPath} className="font-medium text-green-700 underline">{__('Single Prayer shortcodes', 'fiveprayer')}</Link>{__('.', 'fiveprayer')}
            </p>
          </div>
        </div>
      </div>

      {/* Notes & troubleshooting */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">{__('Notes & troubleshooting', 'fiveprayer')}</h3>
        <ul className="ml-4 list-disc space-y-2 text-sm text-gray-700">
          <li>{__('The value you send to data-prayer must match the prayer name the site displays. Under the default English labels this is fajr / sunrise / dhuhr / asr / maghrib / isha. If you enabled', 'fiveprayer')}{' '}
            <Link to={translatePath} className="font-medium text-green-700 underline">{__('Custom Translation', 'fiveprayer')}</Link>{' '}
            {__('use the translated name (lowercase) for the prayers you translate.', 'fiveprayer')}</li>
          <li>{__('Nothing highlighted? Check the container has exactly the class fiveprayer_highlight (underscore, not hyphen), that each item has a data-prayer attribute, and that the prayer you expect is the one actually coming up. If no element matches, the highlight is simply not added — it never throws an error on the page.', 'fiveprayer')}</li>
          <li>{__('The highlight is server-rendered per page load. If a page is cached, purge that page after regenerating the calendar and confirm the upcoming prayer is the one you expect.', 'fiveprayer')}</li>
          <li>{__('You can use more than one container on a page; every .fiveprayer_highlight container is scanned.', 'fiveprayer')}</li>
          <li>{__('Only the first matching element is needed per prayer, but if you repeat a prayer inside a container every matching element is highlighted together — useful for a name plus its time split across two elements.', 'fiveprayer')}</li>
        </ul>
      </div>

      {/* Developer reference */}
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-gray-200">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">{__('Developer reference', 'fiveprayer')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{__('Item', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('Value', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{__('Container class', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs">fiveprayer_highlight</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{__('Child attribute', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs">data-prayer</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{__('Active class', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs">fiveprayer_active</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{__('Localized object', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs">window.fiveprayerHighlighter</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{__('Server class', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs text-[11px]">FivePrayer\Core\Helpers\FivePrayer_Highlighter</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">{__('Client script', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs text-[11px]">php/classes/core/Assets/JS/highlighter.js</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {__('The next prayer is resolved on wp_footer through the same logic as [Fp_Single_Next_Prayer_Begins_Title], so the highlighted prayer always agrees with the next-prayer shortcodes.', 'fiveprayer')}
        </p>
      </div>
    </div>
  );
};

export default PrayerHighlightDoc;
