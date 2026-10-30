import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';
import {
  FaCheck,
  FaCopy,
  FaExchangeAlt,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaLanguage,
  FaCode,
} from 'react-icons/fa';
import { useCopyShortcode } from './useCopyShortcode';

type Shortcode = {
  shortcode: string;
  description: string;
  requiresCustomLanguage?: boolean;
};

/** Landing page for the translation editors. */
const TRANSLATE_SETTINGS_PATH = '/moresettings/translate';

/**
 * Which Translate editor holds the text for each translatable shortcode.
 *
 * Derived from the backend translation resolver (TranslationManager), which
 * looks a label up in extra_info, then vertical_daily_prayer, then
 * prayer_names. Keys are the bare shortcode (attributes stripped).
 */
const SHORTCODE_TRANSLATE_SECTION: Record<string, string> = {
  // Prayer names -> Prayer Names editor
  '[Fp_Single_Fajr_Name]': 'prayernames',
  '[Fp_Single_Dhuhr_Name]': 'prayernames',
  '[Fp_Single_Asr_Name]': 'prayernames',
  '[Fp_Single_Maghrib_Name]': 'prayernames',
  '[Fp_Single_Isha_Name]': 'prayernames',
  '[Fp_Single_Sunrise_Name]': 'prayernames',
  '[Fp_Single_Midnight_Name]': 'prayernames',
  // Begins / Iqamah / Prayer / Next Prayer -> Vertical Daily Prayer editor
  '[Fp_Single_Prayer_Begins_Title]': 'verticaldailyprayer',
  '[Fp_Single_Prayer_Iqamah_Title]': 'verticaldailyprayer',
  '[Fp_Single_Prayer_Title]': 'verticaldailyprayer',
  '[Fp_Single_Next_Prayer_Title]': 'verticaldailyprayer',
  '[Fp_Single_Next_Prayer_Begins_Title]': 'verticaldailyprayer',
  '[Fp_Single_Next_Prayer_Iqamah_Title]': 'verticaldailyprayer',
  // Custom / extra labels -> Extra Info editor
  '[Fp_Single_PTFT]': 'extra_info',
  '[Fp_Single_Current_Title]': 'extra_info',
  '[Fp_Single_Current_Location]': 'extra_info',
  '[Fp_Single_Masjid_Name]': 'extra_info',
  // Six optional "extra prayer" slots -> Extra Info editor
  '[Fp_Extra_Prayer_1]': 'extra_info',
  '[Fp_Extra_Prayer_2]': 'extra_info',
  '[Fp_Extra_Prayer_3]': 'extra_info',
  '[Fp_Extra_Prayer_4]': 'extra_info',
  '[Fp_Extra_Prayer_5]': 'extra_info',
  '[Fp_Extra_Prayer_6]': 'extra_info',
};

/** Resolves the Translate editor route for a shortcode (attributes ignored). */
const translateSectionFor = (shortcode: string): string => {
  const base = shortcode.replace(/[\[\]]/g, '').split(' ')[0];
  const section = SHORTCODE_TRANSLATE_SECTION[`[${base}]`];
  return section ? `${TRANSLATE_SETTINGS_PATH}/${section}` : TRANSLATE_SETTINGS_PATH;
};

/**
 * Legacy shortcodes that are still registered and still render.
 *
 * Mirrors ShortCodeMap::DEPRECATED_SHORTCODES on the PHP side, minus the two
 * entries that simply map to themselves ([Fp_Single_CurrentDate] and
 * [Fp_Single_CurrentTime] are current shortcodes, not aliases).
 */
export const DEPRECATED_SHORTCODES: { shortcode: string; replacement: string }[] = [
  { shortcode: '[Fp_Single_Fajr_Begins]', replacement: '[Fp_Single_Fajr_Begins_time]' },
  { shortcode: '[Fp_Single_Fajr_Iqamah]', replacement: '[Fp_Single_Fajr_Iqamah_time]' },
  { shortcode: '[Fp_Single_Dhuhr_Begins]', replacement: '[Fp_Single_Dhuhr_Begins_time]' },
  { shortcode: '[Fp_Single_Dhuhr_Iqamah]', replacement: '[Fp_Single_Dhuhr_Iqamah_time]' },
  { shortcode: '[Fp_Single_Asr_Begins]', replacement: '[Fp_Single_Asr_Begins_time]' },
  { shortcode: '[Fp_Single_Asr_Iqamah]', replacement: '[Fp_Single_Asr_Iqamah_time]' },
  { shortcode: '[Fp_Single_Maghrib_Begins]', replacement: '[Fp_Single_Maghrib_Begins_time]' },
  { shortcode: '[Fp_Single_Maghrib_Iqamah]', replacement: '[Fp_Single_Maghrib_Iqamah_time]' },
  { shortcode: '[Fp_Single_Isha_Begins]', replacement: '[Fp_Single_Isha_Begins_time]' },
  { shortcode: '[Fp_Single_Isha_Iqamah]', replacement: '[Fp_Single_Isha_Iqamah_time]' },
  { shortcode: '[Fp_Single_Midnight_Begins]', replacement: '[Fp_Single_Midnight_Begins_time]' },
  { shortcode: '[Fp_Single_Sunrise_Begins]', replacement: '[Fp_Single_Sunrise_Begins_time]' },
  { shortcode: '[Fp_Single_NextPrayerIqamahTime]', replacement: '[Fp_Single_Next_Prayer_Iqamah_Time]' },
  { shortcode: '[Fp_Single_NextPrayerIqamahTitle]', replacement: '[Fp_Single_Next_Prayer_Iqamah_Title]' },
  { shortcode: '[Fp_Single_NextPrayerBeginsTime]', replacement: '[Fp_Single_Next_Prayer_Begins_Time]' },
  { shortcode: '[Fp_Single_NextPrayerBeginsTitle]', replacement: '[Fp_Single_Next_Prayer_Begins_Title]' },
];

/**
 * Small inline badge marking a shortcode whose output is translatable.
 * Clicking it takes the user straight to the Translate settings so they can
 * change the text without hunting through the menus.
 */
const CustomizableTextBadge: React.FC<{ className?: string; to?: string }> = ({
  className = '',
  to = TRANSLATE_SETTINGS_PATH,
}) => (
  <Link
    to={to}
    title={__('Opens the Translate settings', 'fiveprayer')}
    aria-label={__('Opens the Translate settings', 'fiveprayer')}
    className={`group inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 ring-1 ring-blue-200 transition-colors hover:bg-blue-600 hover:text-white hover:ring-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${className}`}
  >
    <FaLanguage className="h-3 w-3" />
    {__('Customizable Text', 'fiveprayer')}
    <FaExternalLinkAlt className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
  </Link>
);

const SingleShortcodeDocs: React.FC = () => {
  const shortcodes: Shortcode[] = [
    { shortcode: '[Fp_Single_Fajr_Begins_time]', description: __('Displays the Fajr prayer begins time (e.g., "05:10 AM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Fajr_Iqamah_time]', description: __('Displays the Fajr prayer iqamah time (e.g., "05:17 AM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Dhuhr_Begins_time]', description: __('Displays the Dhuhr prayer begins time (e.g., "12:30 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Dhuhr_Iqamah_time]', description: __('Displays the Dhuhr prayer iqamah time (e.g., "12:37 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Asr_Begins_time]', description: __('Displays the Asr prayer begins time (e.g., "03:45 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Asr_2_Begins_time]', description: __('Displays the second ‘Asr begins time — the 2 Mithl (Hanafi) calculation, stored as the Hanafi time. Empty when the timetable has no second ‘Asr for the day.', 'fiveprayer') },
    { shortcode: '[Fp_Single_Asr_Iqamah_time]', description: __('Displays the Asr prayer iqamah time (e.g., "03:52 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Maghrib_Begins_time]', description: __('Displays the Maghrib prayer begins time (e.g., "06:10 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Maghrib_Iqamah_time]', description: __('Displays the Maghrib prayer iqamah time (e.g., "06:17 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Isha_Begins_time]', description: __('Displays the Isha prayer begins time (e.g., "07:45 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Isha_Iqamah_time]', description: __('Displays the Isha prayer iqamah time (e.g., "07:52 PM").', 'fiveprayer') },
    { shortcode: '[Fp_Single_Midnight_Begins_time]', description: __('Displays the midnight time also known as Qiyām Al-Layl (e.g., "11:50 PM").', 'fiveprayer') },
    {
      shortcode: '[Fp_Single_Midnight_Name]',
      description: __('Displays the midnight name also known as Qiyām Al-Layl (e.g., "Midnight").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    { shortcode: '[Fp_Single_Sunrise_Begins_time]', description: __('Displays the sunrise time (e.g., "05:10 AM").', 'fiveprayer') },

    {
      shortcode: '[Fp_Single_Prayer_Begins_Title]',
      description: __('Displays the begins title (e.g., "Begins").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Prayer_Iqamah_Title]',
      description: __('Displays the iqamah title (e.g., "Iqamah").', 'fiveprayer'),
      requiresCustomLanguage: true
    },

    {
      shortcode: '[Fp_Single_Fajr_Name]',
      description: __('Displays the name of Fajr prayer (e.g., "Fajr").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Dhuhr_Name]',
      description: __('Displays the name of Dhuhr prayer (e.g., "Dhuhr").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Asr_Name]',
      description: __('Displays the name of Asr prayer (e.g., "Asr").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Maghrib_Name]',
      description: __('Displays the name of Maghrib prayer (e.g., "Maghrib").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Isha_Name]',
      description: __('Displays the name of Isha prayer (e.g., "Isha").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Sunrise_Name]',
      description: __('Displays the name of Sunrise (e.g., "Sunrise").', 'fiveprayer'),
      requiresCustomLanguage: true
    },

    { shortcode: '[Fp_Single_CurrentDate]', description: __('Displays the current Gregorian date (e.g., "20 April 2025"). When Day Display is on it also carries the optional Day parts inline at the day position, e.g. "Wed 14th October 2026" (Name first) or "14th Wed October 2026" (Number first).', 'fiveprayer') },
    { shortcode: '[Fp_Single_Hijra_Date]', description: __('Displays the current Hijri date (e.g., "15 Ramadan 1447").', 'fiveprayer') },
    { shortcode: '[Fp_Single_CurrentTime]', description: __('Displays the current time with live updates (e.g., "05:10 AM").', 'fiveprayer') },
    {
      shortcode: '[Fp_Single_PTFT]',
      description: __('Displays the text set in the Translate settings (e.g., "Prayer Times For Today").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Current_Title]',
      description: __('Displays the current prayer title set in the Translate settings (e.g., "The Current Prayer").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Prayer_Title]',
      description: __('Displays the static text "Prayer" from Translate settings, used in Vertical Daily Prayer header.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Current_Location]',
      description: __('Displays the location text set in the Translate settings (e.g., "Current Location").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Masjid_Name]',
      description: __('Displays the masjid name set in the Translate settings (e.g., "Masjid Al-Noor").', 'fiveprayer'),
      requiresCustomLanguage: true
    },

    {
      shortcode: '[Fp_Single_Next_Prayer_Iqamah_Time]',
      description: __('Displays the iqamah time of the next prayer (e.g., "05:00 AM"). Dynamically updates based on the next upcoming prayer.', 'fiveprayer')
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Iqamah_Title]',
      description: __('Displays the iqamah title of the next prayer (e.g., "Fajr Iqamah"). Dynamically updates based on the next upcoming prayer.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Begins_Time]',
      description: __('Displays the begins time of the next prayer (e.g., "05:10 AM"). Dynamically updates based on the next upcoming prayer.', 'fiveprayer')
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Begins_Title]',
      description: __('Displays the next prayer title dynamically (e.g., "Fajr Begins", "Dhuhr Begins").', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Begins_Title removeNextWord="true"]',
      description: __('Displays the next prayer title dynamically (e.g., "Fajr"). Removes the word "Begins" from the output.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Begins_Title removeSpecificWord="Fajr or Begins or any words you want"]',
      description: __('Displays the next prayer title dynamically. You can remove any specific word (e.g., "Fajr", "Begins", "Iqamah") from the output using this attribute.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Begins_Title remove_next_word="true"]',
      description: __('Same as removeNextWord but using snake_case format. Removes the word "Begins" from the output.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Begins_Title remove_specific_word="Fajr or Begins or any words you want"]',
      description: __('Same as removeSpecificWord but using snake_case. Removes a specified word (e.g., "Begins", "Fajr") from the dynamically changing next prayer title.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Title]',
      description: __('Displays the static text "Next Prayer".', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Single_Next_Prayer_Remaining]',
      description: __('Displays the live time remaining until the next prayer (e.g. "1 hour 5 minutes", "45 minutes"). Off by default: turn it on first under FivePrayer → Customizing → Configure Settings → Next Prayer Countdown, where you also choose the format and switch the "in" / "remaining" / "Now" words; the words themselves are translated under More → Translate. Once enabled it also appears automatically in the Vertical Daily Prayer.', 'fiveprayer')
    },

    // Six optional extra-prayer slots (Jumu'ah, Eid, …). Configured under
    // FivePrayer → Customizing → Configure Settings → Extra Prayers.
    {
      shortcode: '[Fp_Extra_Prayer_1]',
      description: __('Displays extra prayer slot 1 — the name and time you set under Configure Settings → Extra Prayers (e.g. "Jumu‘ah 1 13:30"), plus the optional note. Off by default: enable "Extra Prayers" first. The name and note are translated under More → Translate → Extra Info. Add name="…", time="…" or note="…" to override the saved slot for this placement.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Extra_Prayer_2]',
      description: __('Displays extra prayer slot 2 — same behaviour as [Fp_Extra_Prayer_1], using the slot 2 values from Configure Settings → Extra Prayers.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Extra_Prayer_3]',
      description: __('Displays extra prayer slot 3 — same behaviour as [Fp_Extra_Prayer_1], using the slot 3 values from Configure Settings → Extra Prayers.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Extra_Prayer_4]',
      description: __('Displays extra prayer slot 4 — same behaviour as [Fp_Extra_Prayer_1], using the slot 4 values from Configure Settings → Extra Prayers.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Extra_Prayer_5]',
      description: __('Displays extra prayer slot 5 — same behaviour as [Fp_Extra_Prayer_1], using the slot 5 values from Configure Settings → Extra Prayers.', 'fiveprayer'),
      requiresCustomLanguage: true
    },
    {
      shortcode: '[Fp_Extra_Prayer_6]',
      description: __('Displays extra prayer slot 6 — same behaviour as [Fp_Extra_Prayer_1], using the slot 6 values from Configure Settings → Extra Prayers.', 'fiveprayer'),
      requiresCustomLanguage: true
    }
  ];

  // Copies a shortcode to the clipboard (with a fallback for http admin pages).
  const { copied: copiedShortcodes, copy: copyToClipboard } = useCopyShortcode();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 font-sans">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600 ring-1 ring-blue-100">
          <FaCode />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {__('FivePrayer Shortcodes Documentation', 'fiveprayer')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {__('Below is a list of all available shortcodes for displaying prayer times and other related information. Click the "Copy" button to copy the shortcode to your clipboard.', 'fiveprayer')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {__('The same reference in Markdown, including the deprecated tags and their replacements:', 'fiveprayer')}{' '}
            <a
              href="https://github.com/AhsanulBarakah/fiveprayer/blob/main/docs/SHORTCODES.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-green-700 underline hover:text-green-800"
            >
              docs/SHORTCODES.md
            </a>
          </p>
        </div>
      </div>

      {/* About / translation callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2">
          <FaInfoCircle className="h-4 w-4 shrink-0 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-900">
            {__('About Translation Shortcodes', 'fiveprayer')}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-blue-800">
          {__('Shortcodes marked with ', 'fiveprayer')}
          <CustomizableTextBadge className="mx-0.5 align-middle" />
          {__(' will display in English by default. To change these texts to another language or customize the default English text, follow these steps:', 'fiveprayer')}
        </p>
        <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>{__('Go to ', 'fiveprayer')}<span className="font-medium">{__('FivePrayer → Hijri Calendar', 'fiveprayer')}</span></li>
          <li>{__('Enable ', 'fiveprayer')}<span className="font-medium">{__('Active Hijri Calendar', 'fiveprayer')}</span>{__(' option', 'fiveprayer')}</li>
          <li>{__('Select your preferred ', 'fiveprayer')}<span className="font-medium">{__('Calendar Type', 'fiveprayer')}</span>{__(' (Umm al-Qura, etc.)', 'fiveprayer')}</li>
          <li>{__('Enable the ', 'fiveprayer')}<span className="font-medium">{__('Custom Language', 'fiveprayer')}</span>{__(' option in the same section', 'fiveprayer')}</li>
        </ol>
        <Link
          to={TRANSLATE_SETTINGS_PATH}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
        >
          <FaLanguage className="h-4 w-4" />
          {__('Open Translate settings', 'fiveprayer')}
        </Link>
      </div>

      {/* Shortcodes table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{__('Shortcode', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('Description', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('Action', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shortcodes.map((item, index) => (
                <tr key={index} className="align-top transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {/* break-words (not break-all): a tag wraps at spaces instead
                        of splitting mid-token, e.g. "[Fp_Single_Next_Prayer_\nIqamah_Time]" */}
                    <code className="inline-block break-words rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                      {item.shortcode}
                    </code>
                    {item.requiresCustomLanguage && (
                      <div className="mt-2">
                        <CustomizableTextBadge to={translateSectionFor(item.shortcode)} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.description}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyToClipboard(item.shortcode)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                        copiedShortcodes[item.shortcode]
                          ? 'bg-green-500 text-white focus:ring-green-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
                      }`}
                    >
                      {copiedShortcodes[item.shortcode] ? <FaCheck className="h-3.5 w-3.5" /> : <FaCopy className="h-3.5 w-3.5" />}
                      {copiedShortcodes[item.shortcode] ? __('Copied!', 'fiveprayer') : __('Copy', 'fiveprayer')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deprecated shortcodes — still registered, superseded by the names above */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <FaExchangeAlt className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              {__('Deprecated shortcodes', 'fiveprayer')}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {__('These still work, but each one has been replaced by a clearer name. Use the replacement column for new content — a Deprecated Shortcodes notice in the admin lists every page still using an old tag.', 'fiveprayer')}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">{__('Deprecated shortcode', 'fiveprayer')}</th>
                <th className="px-5 py-3">{__('Use instead', 'fiveprayer')}</th>
                <th className="px-5 py-3">{__('Action', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEPRECATED_SHORTCODES.map((item) => (
                <tr key={item.shortcode} className="align-top transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500">
                    <code className="inline-block break-words rounded-md bg-gray-100 px-2 py-1 font-mono text-xs line-through">
                      {item.shortcode}
                    </code>
                  </td>
                  <td className="px-5 py-3">
                    <code className="inline-block break-words rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                      {item.replacement}
                    </code>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.replacement)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${
                        copiedShortcodes[item.replacement]
                          ? 'bg-green-500 text-white focus:ring-green-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
                      }`}
                    >
                      {copiedShortcodes[item.replacement] ? <FaCheck className="h-3.5 w-3.5" /> : <FaCopy className="h-3.5 w-3.5" />}
                      {copiedShortcodes[item.replacement] ? __('Copied!', 'fiveprayer') : __('Copy', 'fiveprayer')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SingleShortcodeDocs;
