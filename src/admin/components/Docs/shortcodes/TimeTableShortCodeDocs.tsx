import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';
import {
  FaCheck,
  FaClock,
  FaCopy,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaPrint,
  FaTable,
} from 'react-icons/fa';
import { useCopyShortcode } from './useCopyShortcode';

/** A link chip shown next to a shortcode (guide, settings page, …). */
type ShortcodeLink = { label: string; to: string };

type Shortcode = {
  shortcode: string;
  description: string;
  links?: ShortcodeLink[];
};

type Group = {
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcodes: Shortcode[];
};

/** Where the settings that drive these shortcodes live. */
const CALCULATION_SETTINGS_PATH = '/customizing/settings';
const DISPLAY_SETTINGS_PATH = '/moresettings/displaysettings';
const COUNTDOWN_GUIDE_PATH = '/documentation/nextprayercountdown';
const TRANSLATE_VDP_PATH = '/moresettings/translate/verticaldailyprayer';

const TimeTableShortCodeDocs: React.FC = () => {
  const { copied, copy } = useCopyShortcode();

  const groups: Group[] = [
    {
      title: __('Monthly timetable', 'fiveprayer'),
      description: __(
        'The full month of prayer times in a table, with a printer button.',
        'fiveprayer'
      ),
      icon: <FaTable />,
      shortcodes: [
        {
          shortcode: '[Fp_TimeTable_Monthly]',
          description: __(
            'Displays the monthly prayer timetable. The printer button sits outside the table (this is the default).',
            'fiveprayer'
          ),
        },
        {
          shortcode: '[Fp_TimeTable_Monthly printer_option="outside"]',
          description: __(
            'The same as the default — the printer button is placed outside the table.',
            'fiveprayer'
          ),
        },
        {
          shortcode: '[Fp_TimeTable_Monthly printer_option="inside"]',
          description: __(
            'Places the printer button inside the table instead.',
            'fiveprayer'
          ),
        },
      ],
    },
    {
      title: __('Printer buttons', 'fiveprayer'),
      description: __(
        'Show a print button on its own, anywhere on the page.',
        'fiveprayer'
      ),
      icon: <FaPrint />,
      shortcodes: [
        {
          shortcode: '[Fp_Printer_Button]',
          description: __(
            'Prints the timetable on the current page — the visitor is not taken anywhere else.',
            'fiveprayer'
          ),
        },
        {
          shortcode: '[Fp_Printer_Button_URL]',
          description: __(
            'Redirects to your own URL with the selected month passed dynamically. Set the URL in Display Settings.',
            'fiveprayer'
          ),
          links: [{ label: __('Display Settings', 'fiveprayer'), to: DISPLAY_SETTINGS_PATH }],
        },
      ],
    },
    {
      title: __('Vertical daily prayer', 'fiveprayer'),
      description: __(
        'Today’s prayer block: current time and date, the next prayer and the live countdown.',
        'fiveprayer'
      ),
      icon: <FaClock />,
      shortcodes: [
        {
          shortcode: '[Fp_Vertical_Daily_Prayer]',
          description: __(
            'Displays the vertical daily prayer for today — the current time and date, the next-prayer notice with the "in" / "remaining" / "Now" words and the live time-remaining countdown.',
            'fiveprayer'
          ),
          links: [
            { label: __('Countdown guide', 'fiveprayer'), to: COUNTDOWN_GUIDE_PATH },
            { label: __('Edit its words', 'fiveprayer'), to: TRANSLATE_VDP_PATH },
          ],
        },
        {
          shortcode: '[Fp_Single_Next_Prayer_Remaining]',
          description: __(
            'The live time-remaining countdown on its own. It is already included inside [Fp_Vertical_Daily_Prayer], so you only need this to place it somewhere else. Its format and words are configured under Configure Settings → Next Prayer Countdown.',
            'fiveprayer'
          ),
          links: [{ label: __('Countdown guide', 'fiveprayer'), to: COUNTDOWN_GUIDE_PATH }],
        },
      ],
    },
  ];

  const renderTable = (group: Group) => (
    <div
      key={group.title}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs"
    >
      <div className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
          {group.icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{group.title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{group.description}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">{__('Shortcode', 'fiveprayer')}</th>
              <th className="px-5 py-3">{__('What it does', 'fiveprayer')}</th>
              <th className="px-5 py-3">{__('Action', 'fiveprayer')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {group.shortcodes.map((item) => {
              const isCopied = copied[item.shortcode];
              return (
                <tr key={item.shortcode} className="align-top transition-colors hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <code className="inline-block break-all rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                      {item.shortcode}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {item.description}
                    {item.links && item.links.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {item.links.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-600 hover:text-white hover:ring-green-600"
                          >
                            {link.label}
                            <FaExternalLinkAlt className="h-2.5 w-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => copy(item.shortcode)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                        isCopied
                          ? 'bg-green-500 text-white focus:ring-green-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
                      }`}
                    >
                      {isCopied ? <FaCheck className="h-3.5 w-3.5" /> : <FaCopy className="h-3.5 w-3.5" />}
                      {isCopied ? __('Copied!', 'fiveprayer') : __('Copy', 'fiveprayer')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 font-sans">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-lg text-green-600 ring-1 ring-green-100">
          <FaTable />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {__('Timetable & Daily Prayer — Shortcodes', 'fiveprayer')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {__(
              'Everything that prints prayer times on the front end: the monthly timetable, the printer buttons and the vertical daily prayer. Copy a shortcode and paste it into any post, page or widget.',
              'fiveprayer'
            )}
          </p>
        </div>
      </div>

      {/* How to use / where things are configured */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2">
          <FaInfoCircle className="h-4 w-4 shrink-0 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-900">
            {__('How to place one', 'fiveprayer')}
          </h2>
        </div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-relaxed text-blue-800">
          <li>{__('Copy the shortcode with the button in the table below.', 'fiveprayer')}</li>
          <li>
            {__('Paste it into a page, post or widget — the WordPress ', 'fiveprayer')}
            <strong>{__('Shortcode block', 'fiveprayer')}</strong>
            {__(' or a text widget both work.', 'fiveprayer')}
          </li>
          <li>{__('Save and reload the page to see the result.', 'fiveprayer')}</li>
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-blue-800">
          {__('The colours, font sizes and border of the tables come from ', 'fiveprayer')}
          <Link to={CALCULATION_SETTINGS_PATH} className="font-medium underline">
            {__('Configure Settings', 'fiveprayer')}
          </Link>
          {__('. The wording inside the daily prayer ("in", "remaining", "Now") is translated under ', 'fiveprayer')}
          <Link to={TRANSLATE_VDP_PATH} className="font-medium underline">
            {__('More → Translate → Vertical Daily Prayer', 'fiveprayer')}
          </Link>
          {__('.', 'fiveprayer')}
        </p>
      </div>

      {/* Grouped shortcodes */}
      {groups.map(renderTable)}

      {/* Related guide */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {__('Live countdown to the next prayer', 'fiveprayer')}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {__(
              'The vertical daily prayer can show a live "time remaining" that ticks down on its own. It is off by default — switch it on, then learn how to change its format, switch the connector words on or off, and style it.',
              'fiveprayer'
            )}
          </p>
        </div>
        <Link
          to={COUNTDOWN_GUIDE_PATH}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-400"
        >
          <FaClock className="h-3.5 w-3.5" />
          {__('Open the countdown guide', 'fiveprayer')}
        </Link>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="text-base font-semibold text-gray-800">
          {__('Notes & troubleshooting', 'fiveprayer')}
        </h2>
        <ul className="mt-2 ml-4 list-disc space-y-1.5 text-sm text-gray-700">
          <li>
            {__('The ', 'fiveprayer')}
            <code className="rounded-sm bg-white px-1.5 py-0.5 font-mono text-xs border border-gray-200">
              printer_option
            </code>
            {__(' attribute only accepts ', 'fiveprayer')}
            <code className="rounded-sm bg-white px-1.5 py-0.5 font-mono text-xs border border-gray-200">inside</code>
            {__(' or ', 'fiveprayer')}
            <code className="rounded-sm bg-white px-1.5 py-0.5 font-mono text-xs border border-gray-200">outside</code>
            {__('. Leaving it out uses ', 'fiveprayer')}
            <code className="rounded-sm bg-white px-1.5 py-0.5 font-mono text-xs border border-gray-200">outside</code>
            {__('.', 'fiveprayer')}
          </li>
          <li>
            {__(
              '[Fp_Printer_Button_URL] needs a custom URL to be set in Display Settings — without one it renders nothing.',
              'fiveprayer'
            )}
          </li>
          <li>
            {__(
              'The vertical daily prayer is time-sensitive. Page-cache plugins are told to exclude it automatically, so the times and the countdown stay correct on cached pages.',
              'fiveprayer'
            )}
          </li>
          <li>
            {__('If nothing appears, first check that the matching feature is switched on in the ', 'fiveprayer')}
            <Link to={CALCULATION_SETTINGS_PATH} className="font-medium underline">
              {__('Feature Switches', 'fiveprayer')}
            </Link>
            {__(' panel.', 'fiveprayer')}
          </li>
          <li>
            {__('Prayer times themselves are calculated from your location and method — if they look wrong, regenerate the calendar on the Prayer Settings page.', 'fiveprayer')}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TimeTableShortCodeDocs;
