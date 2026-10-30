/**
 * NextPrayerCountdownSettings
 *
 * Configuration panel for the "Next Prayer Countdown" category in the
 * Configure Settings page. Controls the live "time remaining until the next
 * prayer" shown by [Fp_Single_Next_Prayer_Remaining] and in the Vertical Daily
 * Prayer notice.
 *
 * The value is simply the time left between now and the next prayer begins
 * time — there is no rounding step. The options are presentation only: the
 * output format, whether the connector words are shown, and whether seconds
 * are shown.
 *
 * The connector words ("in" before the time, "remaining" after it, "Now" once
 * the prayer has arrived) are NOT typed here. They are fixed phrases resolved
 * through the site's Translate system (More → Translate → Vertical Daily
 * Prayer), so the wording and language are edited in one place. This card only
 * switches each one on or off.
 *
 * The master on/off is the `Next_Prayer_Countdown` feature switch (Feature
 * Switches page), so it behaves like every other feature. The customization is
 * stored in the `next_prayer_countdown` meta and applied on the next page
 * load — no calendar regeneration is required.
 *
 * @module prayerSetting/NextPrayerCountdownSettings
 */
import React from 'react';
import { Link } from 'react-router';
import { useLocationStore } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import { __ } from '@wordpress/i18n';
import { formatCountdown, type CountdownConfig } from '../../utils/countdownFormat';

interface NextPrayerCountdownSettingsProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const FEATURE_KEY = 'Next_Prayer_Countdown';

/** Admin path to the translate editor for the countdown connector words. */
const TRANSLATE_PATH = '/moresettings/translate/verticaldailyprayer';

const FORMAT_OPTIONS: { value: CountdownConfig['format']; label: string; example: string }[] = [
  { value: 'long', label: __('Long', 'fiveprayer'), example: '1 hour 5 minutes' },
  { value: 'short', label: __('Short', 'fiveprayer'), example: '1h 5m' },
  { value: 'clock', label: __('Clock', 'fiveprayer'), example: '01:05' },
];

/** A master-switch style on/off panel, matching the other settings panels. */
const SwitchPanel: React.FC<{
  title: React.ReactNode;
  description: React.ReactNode;
  on: boolean;
  onChange: (next: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}> = ({ title, description, on, onChange, onLabel = 'On', offLabel = 'Off' }) => (
  <div className="flex items-center justify-between gap-4 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`h-10 px-4 flex items-center gap-2 rounded-lg border text-sm font-medium transition-all focus:outline-hidden shrink-0 ${
        on ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
      }`}
    >
      <span>{on ? onLabel : offLabel}</span>
      <span className={`w-9 h-5 rounded-full relative transition-colors ${on ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  </div>
);

const NextPrayerCountdownSettings: React.FC<NextPrayerCountdownSettingsProps> = ({ title, description, icon }) => {
  const config = useLocationStore((state) => state.next_prayer_countdown);
  const updateNextPrayerCountdown = useLocationStore((state) => state.updateNextPrayerCountdown);
  const feature_toggles = useLocationStore((state) => state.feature_toggles || {});
  const feature_toggles_update = useLocationStore((state) => state.feature_toggles_update);
  const { saveBatch } = usePostMeta();

  // Ships OFF: only an explicit `true` counts as enabled. Anything else
  // (key missing on a fresh or upgraded install) keeps the countdown off,
  // matching NextPrayerCountdown::isEnabled() on the front end.
  const enabled = feature_toggles[FEATURE_KEY] === true;

  const persistConfig = (next: CountdownConfig) => {
    updateNextPrayerCountdown(next);
    saveBatch({ next_prayer_countdown: next }).catch(() => {});
  };

  const toggleEnabled = () => {
    const next = !enabled;
    feature_toggles_update(FEATURE_KEY, next);
    saveBatch({ feature_toggles: { ...feature_toggles, [FEATURE_KEY]: next } }).catch(() => {});
  };

  // Two sample previews so the effect of the settings is obvious.
  const previewFar = formatCountdown(65 * 60 + 30, config as CountdownConfig);
  const previewNear = formatCountdown(18 * 60, config as CountdownConfig);

  const current = config as CountdownConfig;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Master switch (shared with Feature Switches) */}
          <SwitchPanel
            title={__('Enable next-prayer countdown', 'fiveprayer')}
            description={__('Shows the time remaining until the next prayer in the Vertical Daily Prayer and through the [Fp_Single_Next_Prayer_Remaining] shortcode.', 'fiveprayer')}
            on={enabled}
            onChange={toggleEnabled}
            onLabel="Enabled"
            offLabel="Disabled"
          />

          <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
            {/* Format */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {__('Output format', 'fiveprayer')}
              </label>
              <select
                value={current.format}
                onChange={(e) => persistConfig({ ...current, format: e.target.value as CountdownConfig['format'] })}
                className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {`${option.label} — ${option.example}`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {__('How the remaining time is written. "Long" spells it out, "Short" abbreviates, "Clock" shows HH:MM (or MM:SS with seconds on).', 'fiveprayer')}
              </p>
            </div>

            {/* Seconds — same panel style as the master switch above */}
            <div className="mt-4">
              <SwitchPanel
                title={__('Show seconds (updates every second)', 'fiveprayer')}
                description={__('Off (default): the countdown ticks down once per minute (e.g. 8:29 → 8:28). On: it also shows seconds and updates every second.', 'fiveprayer')}
                on={!!current.show_seconds}
                onChange={(next) => persistConfig({ ...current, show_seconds: next })}
              />
            </div>

            {/* Connector words — switched on/off here, edited in the Translate system */}
            <div className="mt-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{__('Connector words', 'fiveprayer')}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {__('Switch the words shown around the countdown on or off. The words themselves are not typed here — they live in the Translate system, so their spelling and language are edited in one place.', 'fiveprayer')}
                  </p>
                </div>
                <Link
                  to={TRANSLATE_PATH}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 shrink-0"
                >
                  {__('Edit words in More → Translate', 'fiveprayer')}
                </Link>
              </div>

              <div className="space-y-3">
                <SwitchPanel
                  title={<>{__('Show ', 'fiveprayer')}<code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200">in</code>{__(' before the time', 'fiveprayer')}</>}
                  description={__('Adds the word translated as "in" in front of the countdown, e.g. "in 01 hours 05 minutes". Leave it off for a plain number.', 'fiveprayer')}
                  on={!!current.show_prefix}
                  onChange={(next) => persistConfig({ ...current, show_prefix: next })}
                />
                <SwitchPanel
                  title={<>{__('Show ', 'fiveprayer')}<code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200">remaining</code>{__(' after the time', 'fiveprayer')}</>}
                  description={__('Adds the word translated as "remaining" after the countdown, e.g. "01 hours 05 minutes remaining".', 'fiveprayer')}
                  on={!!current.show_suffix}
                  onChange={(next) => persistConfig({ ...current, show_suffix: next })}
                />
                <SwitchPanel
                  title={<>{__('Show ', 'fiveprayer')}<code className="rounded-sm bg-white px-1.5 py-0.5 border border-gray-200">Now</code>{__(' when the time arrives', 'fiveprayer')}</>}
                  description={__('Shows the word translated as "Now" once the countdown reaches zero. When off, the countdown shows nothing at that moment.', 'fiveprayer')}
                  on={!!current.show_now}
                  onChange={(next) => persistConfig({ ...current, show_now: next })}
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <strong className="block text-xs uppercase tracking-wide text-blue-700 mb-2">{__('Preview', 'fiveprayer')}</strong>
            <p className="text-[11px] text-blue-700 mb-2">
              {__('A sample of what visitors will see, using your format and the connector words you switched on. The two values are just example times (about 1h 5m and 18m left) so you can see the result.', 'fiveprayer')}
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-1">
              <span>
                {__('Longer:', 'fiveprayer')} <code className="bg-white px-1.5 py-0.5 rounded-sm border border-blue-100">{previewFar || __('(nothing)', 'fiveprayer')}</code>
              </span>
              <span>
                {__('Shorter:', 'fiveprayer')} <code className="bg-white px-1.5 py-0.5 rounded-sm border border-blue-100">{previewNear || __('(nothing)', 'fiveprayer')}</code>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            {__('Changes save automatically and apply on the next page load. Use the shortcode [Fp_Single_Next_Prayer_Remaining] anywhere, or leave it to the Vertical Daily Prayer shortcode.', 'fiveprayer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NextPrayerCountdownSettings;
