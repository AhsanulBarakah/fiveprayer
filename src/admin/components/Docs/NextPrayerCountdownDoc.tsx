import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';

/**
 * NextPrayerCountdownDoc
 *
 * Dedicated how-to page for the live "time remaining until the next prayer"
 * feature: what it is, how to place it, and what every setting means.
 */
const NextPrayerCountdownDoc: React.FC = () => {
  const settingsPath = '/customizing/settings';
  // Colours / border for the tables live on the Timetable customising page.
  const timetableStylePath = '/customizing/timetable';
  const translateVdpPath = '/moresettings/translate/verticaldailyprayer';

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">
          {__('⏳ Next Prayer Countdown Guide', 'fiveprayer')}
        </h2>
        <p className="text-lg text-gray-700 text-center">
          {__('Show visitors exactly how long is left until the next prayer — a live number that ticks down on its own.', 'fiveprayer')}
        </p>
      </div>

      {/* What is it */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What is the Next Prayer Countdown?', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-3">
          {__('The Next Prayer Countdown displays the real time remaining between now and the next prayer begins time (for example “01 hours 05 minutes” or “00h 45m”). It updates on its own while the page stays open, so visitors always see the current value.', 'fiveprayer')}
        </p>
        <p className="text-gray-700">
          {__('It is a straightforward calculation of the remaining time — there is no rounding or “nearest 5 / 15 minutes” step. What you see is exactly how long is left.', 'fiveprayer')}
        </p>
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            <strong>{__('Good to know:', 'fiveprayer')}</strong>{' '}
            {__('By default the countdown ticks down once a minute (e.g. 08:29 → 08:28). Turn on “Show seconds” if you want it to update every second. Its width is fixed — numbers are zero-padded and every unit stays on screen — so it never shifts the page as it counts down.', 'fiveprayer')}
          </p>
        </div>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <strong>{__('Off by default:', 'fiveprayer')}</strong>{' '}
            {__('this feature ships turned OFF. The countdown appears only after you switch on “Enable next-prayer countdown” in Configure Settings → Next Prayer Countdown, and the shortcode outputs nothing while it is off. The rest of the Vertical Daily Prayer (the prayer name, time and date line) is unaffected either way.', 'fiveprayer')}
          </p>
        </div>
      </div>

      {/* How to use it */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('How to use it', 'fiveprayer')}</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('1. Shortcode — place it anywhere', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Drop this shortcode into any post, page or widget to show the countdown on its own:', 'fiveprayer')}</p>
            <code className="inline-block rounded-md bg-white px-3 py-1.5 font-mono text-sm text-gray-800 border border-gray-200">[Fp_Single_Next_Prayer_Remaining]</code>
            <p className="text-gray-700 mt-3">{__('It outputs the live-updating remaining time as plain text. No background or border is added on purpose, so you can style it exactly how you want (see “Styling the countdown” below).', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('2. Automatic — Vertical Daily Prayer', 'fiveprayer')}</h4>
            <p className="text-gray-700">
              {__('The countdown is added automatically to the ', 'fiveprayer')}
              <code className="rounded-sm bg-white px-1.5 py-0.5 font-mono text-xs border border-gray-200">[Fp_Vertical_Daily_Prayer]</code>
              {__(' notice underneath the next prayer name and time. You do not need to add the shortcode yourself there — just switch the feature on first, since it ships off.', 'fiveprayer')}
            </p>
          </div>
        </div>
      </div>

      {/* Where to configure */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Where to configure it', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">
          {__('All options live under ', 'fiveprayer')}
          <strong>{__('FivePrayer → Customizing → Configure Settings → Next Prayer Countdown', 'fiveprayer')}</strong>.
        </p>
        <ol className="text-gray-700 space-y-2 ml-4 list-decimal">
          <li>{__('Open the ', 'fiveprayer')}<strong>{__('Next Prayer Countdown', 'fiveprayer')}</strong>{__(' category in the sidebar.', 'fiveprayer')}</li>
          <li>{__('Use the master switch to turn the whole feature on or off (this is the same switch as on the ', 'fiveprayer')}<strong>{__('Feature Switches', 'fiveprayer')}</strong>{__(' page).', 'fiveprayer')}</li>
          <li>{__('Change the format and switch the connector words (“in” / “remaining” / “Now”) on or off below. Everything saves automatically.', 'fiveprayer')}</li>
          <li>{__('Reload the page that shows the countdown — the new settings apply on the next page load.', 'fiveprayer')}</li>
        </ol>
        <Link
          to={settingsPath}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-400"
        >
          {__('Open Configure Settings', 'fiveprayer')}
        </Link>
      </div>

      {/* Settings explained */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What each setting means', 'fiveprayer')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{__('Setting', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('What it does', 'fiveprayer')}</th>
                <th className="px-4 py-3">{__('Example', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 align-top">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Enable next-prayer countdown', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('Master on/off, and OFF by default. Until you switch it on, the countdown outputs nothing anywhere — neither the shortcode nor the Vertical Daily Prayer. Off is the shipped state for every new and upgraded install.', 'fiveprayer')}</td>
                <td className="px-4 py-3 text-gray-400">—</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Output format', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('How the remaining time is written. Long spells it out, Short abbreviates it, Clock shows HH:MM (or MM:SS when seconds are on).', 'fiveprayer')}</td>
                <td className="px-4 py-3">
                  <div><strong>{__('Long:', 'fiveprayer')}</strong> {__('01 hours 05 minutes', 'fiveprayer')}</div>
                  <div><strong>{__('Short:', 'fiveprayer')}</strong> 01h 05m</div>
                  <div><strong>{__('Clock:', 'fiveprayer')}</strong> 01:05</div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Show seconds', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('Off (default): the countdown ticks down once a minute. On: it also shows the seconds and updates every second.', 'fiveprayer')}</td>
                <td className="px-4 py-3">
                  <div><strong>{__('Off:', 'fiveprayer')}</strong> {__('01 hours 05 minutes', 'fiveprayer')}</div>
                  <div><strong>{__('On:', 'fiveprayer')}</strong> 01 hours 04 minutes 59 seconds</div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Show “in” before the time', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('Switches the connector word shown before the countdown on or off. The word is fixed (“in”) and is edited under More → Translate → Vertical Daily Prayer, so its spelling and language are changed there — not here. Off by default.', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-1.5 py-0.5 border border-gray-200">{__('in 01 hours 05 minutes', 'fiveprayer')}</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Show “remaining” after the time', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('Switches the connector word shown after the countdown on or off. Like the prefix, the word is fixed (“remaining”) and translated under More → Translate → Vertical Daily Prayer. Off by default.', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-1.5 py-0.5 border border-gray-200">{__('01 hours 05 minutes remaining', 'fiveprayer')}</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Show “Now” when the time arrives', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('Switches the word shown when the countdown reaches zero on or off. The word is fixed (“Now”) and translated under More → Translate → Vertical Daily Prayer. Off by default: nothing is shown once the prayer time arrives.', 'fiveprayer')}</td>
                <td className="px-4 py-3"><code className="rounded-sm bg-gray-100 px-1.5 py-0.5 border border-gray-200">{__('Now', 'fiveprayer')}</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-800">{__('Preview', 'fiveprayer')}</td>
                <td className="px-4 py-3">{__('A live sample using your current settings, so you can see the result before saving. It shows two fixed example times (1h 5m and 18m left) — these are only for the preview, not the real prayer time.', 'fiveprayer')}</td>
                <td className="px-4 py-3 text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Practical examples */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Practical examples', 'fiveprayer')}</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>{__('Plain countdown:', 'fiveprayer')}</strong> {__('Format Long, every connector word off →', 'fiveprayer')} <code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200 text-gray-800">{__('00 hours 45 minutes', 'fiveprayer')}</code>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>{__('Sentence style:', 'fiveprayer')}</strong> {__('Format Long, “in” and “remaining” on →', 'fiveprayer')} <code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200 text-gray-800">{__('in 00 hours 45 minutes remaining', 'fiveprayer')}</code>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>{__('Compact badge:', 'fiveprayer')}</strong> {__('Format Short →', 'fiveprayer')} <code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200 text-gray-800">00h 45m</code>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>{__('Countdown clock:', 'fiveprayer')}</strong> {__('Format Clock, Show seconds on →', 'fiveprayer')} <code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200 text-gray-800">00:44:59</code>
            </p>
          </div>
        </div>
      </div>

      {/* Styling */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Styling the countdown', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-3">
          {__('The countdown is deliberately unstyled — no background, border, padding or colour is imposed. To add your own, target the ', 'fiveprayer')}
          <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs border border-gray-200">.fiveprayer-next-prayer-countdown</code>
          {__(' class in your theme\u2019s Additional CSS (Appearance → Customize → Additional CSS) and override it.', 'fiveprayer')}
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 mb-3"><code>{`.fiveprayer-next-prayer-countdown{\n  background: #0a7c46;\n  color: #ffffff;\n  padding: 2px 10px;\n  border-radius: 999px;\n}`}</code></pre>
        <p className="text-gray-700 text-sm">
          {__('The only rules the plugin keeps are layout guards that stop the numbers from jumping as they change (fixed-width figures via tabular numerals, centred and non-wrapping). If you need a perfectly fixed width, give the class a width/min-width in your override — the “Clock” format already has a naturally stable width because its numbers are zero-padded.', 'fiveprayer')}
        </p>
      </div>

      {/* Vertical Daily Prayer appearance */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('How it looks in the Vertical Daily Prayer', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">
          {__('Inside ', 'fiveprayer')}
          <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs border border-gray-200">[Fp_Vertical_Daily_Prayer]</code>
          {__(' the countdown sits under the next-prayer name and time. Two details there follow your existing timetable settings rather than a fixed style:', 'fiveprayer')}
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{__('The divider line', 'fiveprayer')}</h4>
            <p className="mt-1 text-sm text-gray-700">
              {__('The rule between the next-prayer block and the “Current Local Time” / date line is drawn with your timetable border — the same ', 'fiveprayer')}
              <strong>{__('style, size and colour', 'fiveprayer')}</strong>
              {__(' you set under ', 'fiveprayer')}
              <Link to={timetableStylePath} className="font-medium text-green-700 underline">{__('Customizing → Timetable → Border', 'fiveprayer')}</Link>
              {__('. Change the table border there and this line follows automatically; there is no separate setting for it.', 'fiveprayer')}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{__('The date and label sizes', 'fiveprayer')}</h4>
            <p className="mt-1 text-sm text-gray-700">
              {__('The date / “Current Local Time” line and the small section label are sized to sit comfortably next to the large prayer name, so the block reads as one unit. Only the countdown value itself is left completely unstyled (see “Styling the countdown”).', 'fiveprayer')}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">{__('The connector words', 'fiveprayer')}</h4>
            <p className="mt-1 text-sm text-gray-700">
              {__('“in”, “remaining” and “Now” appear exactly where you switched them on, and their wording and language come from ', 'fiveprayer')}
              <Link to={translateVdpPath} className="font-medium text-green-700 underline">{__('More → Translate → Vertical Daily Prayer', 'fiveprayer')}</Link>
              {__('. Nothing has to be typed in the countdown settings.', 'fiveprayer')}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{__('Notes & troubleshooting', 'fiveprayer')}</h3>
        <ul className="text-gray-700 text-sm space-y-2 ml-4 list-disc">
          <li>{__('The countdown uses the site clock and the generated timetable. If the prayer times themselves look wrong, regenerate the calendar on the Prayer Settings page.', 'fiveprayer')}</li>
          <li>{__('The number refreshes by itself while the page is open, and re-syncs with the server when the visitor returns to the tab — so it stays correct even on cached pages.', 'fiveprayer')}</li>
          <li>{__('Already showing the next prayer? The countdown switches to the following prayer automatically once the current one begins.', 'fiveprayer')}</li>
          <li>{__('If nothing appears, check that the feature is enabled under Feature Switches and that the page actually uses the shortcode or the Vertical Daily Prayer.', 'fiveprayer')}</li>
          <li>{__('The value uses a fixed width by design: each number is zero-padded and every unit is always shown, so the display never jumps as it counts down.', 'fiveprayer')}</li>
          <li>{__('The connector words are not typed in the settings. They are fixed phrases (“in”, “remaining”, “Now”) listed under More → Translate → Vertical Daily Prayer, where you give each language its own wording. Switching a word on or off in the countdown settings never changes its translation.', 'fiveprayer')}</li>
        </ul>
      </div>
    </div>
  );
};

export default NextPrayerCountdownDoc;
