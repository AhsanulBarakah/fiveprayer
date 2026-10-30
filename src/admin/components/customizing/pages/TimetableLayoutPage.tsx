/**
 * Timetable Layout Page
 *
 * Configures the display designs and shows a live preview for each:
 *  - "Standard Timetable" — the monthly calendar (default vs separate Hijri
 *    layout, column visibility).
 *  - "Vertical Today" — the single-day vertical prayer table rendered by
 *    [Fp_Vertical_Daily_Prayer] (local time, Gregorian date, Hijri date).
 *
 * Each design owns its own meta key (`timetable_layout` /
 * `vertical_today_layout`) and its own preview, so more designs and more
 * per-design fields can be added without disturbing the others.
 *
 * Changes stay local until the user clicks Save.
 *
 * @module customizing/pages/TimetableLayoutPage
 */
import React from 'react';
import { NavLink } from 'react-router';
import ColumnLayoutCalendar from '../ColumnLayoutCalendar';
import VerticalTodayPreview from '../VerticalTodayPreview';
import { useTimetableLayoutStore } from '../../../state/storeTimetableLayout';
import { useVerticalTodayLayoutStore } from '../../../state/storeVerticalTodayLayout';
import { useDayDisplayStore } from '../../../state/storeDayDisplay';
import { usePostMeta } from '../../../hooks/usePostMeta';
import { useLocationStore } from '../../../state/storeLocation';
import { useTimeTableMonth } from '../../../state/storeTimeTable';
import type { CountdownConfig } from '../../../utils/countdownFormat';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

type Design = 'timetable' | 'verticalToday';

const DESIGNS: { value: Design; label: string; desc: string }[] = [
  { value: 'timetable', label: __('Standard Timetable', 'fiveprayer'), desc: __('Monthly calendar', 'fiveprayer') },
  { value: 'verticalToday', label: __('Vertical Today', 'fiveprayer'), desc: __('Single-day table', 'fiveprayer') },
];

const TimetableLayoutPage = () => {
  const options = useTimetableLayoutStore();
  const { updateOption } = useTimetableLayoutStore();
  const verticalOptions = useVerticalTodayLayoutStore();
  const { updateOption: updateVerticalOption } = useVerticalTodayLayoutStore();
  // Day display is a single global config shared by both designs, so the
  // toggles here and the Day Display card stay in sync.
  const dayDisplay = useDayDisplayStore();
  const { updateOption: updateDayOption } = useDayDisplayStore();
  const { saveBatch } = usePostMeta();
  const [isSaving, setIsSaving] = React.useState(false);
  const [design, setDesign] = React.useState<Design>('timetable');
  const month = useLocationStore((state) => state.month);
  const { updateSetSkipIqamahMidnight, updateSkipIqamah, updateSkipBegins, updateSkipMidnight, updateSkipDate, updateShowSunrise, updateShowHijriDate } = useLocationStore();
  // Next-prayer countdown — the SAME store/meta the Configure Settings page
  // uses, so the two pages stay in sync.
  const nextPrayerCountdown = useLocationStore((state) => state.next_prayer_countdown) as CountdownConfig;
  const updateNextPrayerCountdown = useLocationStore((state) => state.updateNextPrayerCountdown);
  const feature_toggles = useLocationStore((state) => state.feature_toggles || {});
  const feature_toggles_update = useLocationStore((state) => state.feature_toggles_update);
  const countdownEnabled = feature_toggles['Next_Prayer_Countdown'] === true;

  // The Hijri Date field is only rendered when the Hijra Calendar is active
  // (mirrors ColumnLayoutCalendar, VerticalTodayPreview and the PHP renderers),
  // so its switch is disabled until the user turns the Hijra Calendar on. The
  // Activate Hijra toggle writes to useTimeTableMonth, so read that same live
  // store here — otherwise the switch stays stale until a full page refresh.
  const isHijraActive = useTimeTableMonth((state) => state.HijraLocale?.isActive === true);

  const toPayload = (opts: any) => ({
    layoutType: opts.layoutType,
    showDate: opts.showDate,
    showHijriDate: opts.showHijriDate,
    showSunrise: opts.showSunrise,
    showBegins: opts.showBegins,
    showIqamah: opts.showIqamah,
    showMidnight: opts.showMidnight,
    showAsr2: opts.showAsr2,
  });

  const toVerticalPayload = (opts: any) => ({
    showTime: opts.showTime,
    showDate: opts.showDate,
    showHijriDate: opts.showHijriDate,
    showAsr2: opts.showAsr2,
  });

  const toDayPayload = (opts: any) => ({
    showFull: opts.showFull,
    showShort: opts.showShort,
    showNumber: opts.showNumber,
    order: opts.order,
  });

  // Changes stay local until the user clicks Save. Toggles/radios only update
  // the in-memory store + preview; handleSave() reads the current store state
  // and persists both designs to the DB that the published (PHP-rendered)
  // output reads from.
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const locState = useLocationStore.getState();
      await saveBatch({
        timetable_layout: toPayload(useTimetableLayoutStore.getState()),
        vertical_today_layout: toVerticalPayload(useVerticalTodayLayoutStore.getState()),
        // The countdown controls live on this page too; persist them with the
        // same Save so nothing is silently left unsaved.
        next_prayer_countdown: locState.next_prayer_countdown,
        feature_toggles: locState.feature_toggles,
        // The shared Day display config (also editable from Configure Settings
        // → Day Display); persisted here so Layout changes are not lost.
        day_display: toDayPayload(useDayDisplayStore.getState()),
      });
    } catch (error) {
      toast.error(__('Failed to save', 'fiveprayer'));
    } finally {
      setIsSaving(false);
    }
  };

  const isHijriLayout = options.layoutType === 'hijri';

  const columnOptions = [
    { key: 'showDate' as const, label: __('Gregorian Date', 'fiveprayer'), desc: __('Day and month', 'fiveprayer') },
    { key: 'showHijriDate' as const, label: __('Hijri Date', 'fiveprayer'), desc: __('Islamic date column', 'fiveprayer') },
    { key: 'showSunrise' as const, label: __('Sunrise', 'fiveprayer'), desc: __('Sunrise time', 'fiveprayer') },
    { key: 'showBegins' as const, label: __('Begins', 'fiveprayer'), desc: __('Begins time', 'fiveprayer') },
    { key: 'showIqamah' as const, label: __('Iqamah', 'fiveprayer'), desc: __('Iqamah & Jamaah', 'fiveprayer') },
    { key: 'showAsr2' as const, label: __('Hanafi', 'fiveprayer'), desc: __('Second ‘Asr — 2 Mithl time', 'fiveprayer') },
    { key: 'showMidnight' as const, label: __('Midnight', 'fiveprayer'), desc: __('Midnight time', 'fiveprayer') },
  ];

  // Fields available on the Vertical Today design. Kept in one array so new
  // fields can be added without touching the rendering below. Declared in
  // render order: the local-time line sits above the two date lines.
  const verticalFieldOptions = [
    { key: 'showTime' as const, label: __('Current Local Time', 'fiveprayer'), desc: __('Live clock above the dates', 'fiveprayer') },
    { key: 'showDate' as const, label: __('Gregorian Date', 'fiveprayer'), desc: __('Date under the local time', 'fiveprayer') },
    { key: 'showHijriDate' as const, label: __('Hijri Date', 'fiveprayer'), desc: __('Islamic date line', 'fiveprayer') },
    { key: 'showAsr2' as const, label: __('Hanafi', 'fiveprayer'), desc: __('Second ‘Asr — 2 Mithl row', 'fiveprayer') },
  ];

  const handleToggle = (key: string, value: boolean) => {
    updateOption(key as any, value);

    // Sync to the stores the calendar reads from
    switch (key) {
      case 'showIqamah':
        updateSetSkipIqamahMidnight(!value);
        updateSkipIqamah(!value);
        break;
      case 'showBegins':
        updateSkipBegins(!value);
        break;
      case 'showMidnight':
        updateSkipMidnight(!value);
        break;
      case 'showDate':
        updateSkipDate(!value);
        break;
      case 'showSunrise':
        updateShowSunrise(value);
        break;
      case 'showHijriDate':
        updateShowHijriDate(value);
        break;
    }
  };

  // Small reusable toggle row for a design field.
  const renderToggle = (
    key: string,
    label: string,
    desc: string,
    checked: boolean,
    onChange: (next: boolean) => void,
    disabled = false,
    disabledNote?: React.ReactNode,
  ) => (
    <div key={key}>
      <div className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:bg-gray-50'}`}>
        <div className="min-w-0 mr-3">
          <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{label}</p>
          <p className={`text-[10px] ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
        </div>
        <button type="button" role="switch" aria-checked={checked}
          aria-disabled={disabled}
          disabled={disabled}
          title={disabled ? __('Activate the Hijra Calendar to use this field', 'fiveprayer') : undefined}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shrink-0 ${
            disabled ? 'bg-gray-200 opacity-60 cursor-not-allowed' : (checked ? 'bg-green-600' : 'bg-gray-200')
          }`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>
      {disabled && disabledNote && (
        <p className="px-2.5 pb-2.5 text-[10px] leading-snug text-amber-600">{disabledNote}</p>
      )}
    </div>
  );

  // Shared Day display block — the same global config is shown under both
  // designs (and mirrored by Configure Settings → Day Display), so the two
  // stay in sync. The master switch lives in the Feature Switches list.
  const renderDayBlock = () => (
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">{__('Day Display (shared)', 'fiveprayer')}</h2>
      <p className="text-[10px] leading-snug text-gray-500 mb-2">
        {__('Adds the Day column / day line for both designs. Master on/off is in Configure Settings → Day Display.', 'fiveprayer')}
      </p>
      <div className="space-y-1">
        {renderToggle('day-full', __('Day — Full Name', 'fiveprayer'), __('e.g. Friday', 'fiveprayer'), !!dayDisplay.showFull, (v) => updateDayOption('showFull', v))}
        {renderToggle('day-short', __('Day — Short Name', 'fiveprayer'), __('e.g. Fri', 'fiveprayer'), !!dayDisplay.showShort, (v) => updateDayOption('showShort', v))}
        {renderToggle('day-number', __('Day — Number', 'fiveprayer'), __('e.g. 14th', 'fiveprayer'), !!dayDisplay.showNumber, (v) => updateDayOption('showNumber', v))}
      </div>
      <div className="mt-3 px-2.5">
        <label className="block text-[11px] font-medium text-gray-600 mb-1">{__('Order', 'fiveprayer')}</label>
        <select
          value={dayDisplay.order}
          onChange={(e) => updateDayOption('order', e.target.value as any)}
          className="h-9 w-full px-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
        >
          <option value="name_first">{__('Name first — Fri 27th', 'fiveprayer')}</option>
          <option value="number_first">{__('Number first — 27th Fri', 'fiveprayer')}</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        {/* Sidebar — stacks above the preview on small screens */}
        <div className="w-full lg:w-80 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
          {/* Design Selector */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{__('Design', 'fiveprayer')}</h2>
            <div className="space-y-2">
              {DESIGNS.map(({ value, label, desc }) => {
                const isActive = design === value;
                return (
                  <label key={value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive ? 'border-green-400 bg-green-50 ring-1 ring-green-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input type="radio" name="design" value={value} checked={isActive}
                      onChange={() => setDesign(value)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-[11px] text-gray-500">{desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {design === 'timetable' ? (
            <>
              {/* Layout Selector */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">{__('Layout Style', 'fiveprayer')}</h2>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    !isHijriLayout ? 'border-green-400 bg-green-50 ring-1 ring-green-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input type="radio" name="layoutType" value="default" checked={!isHijriLayout}
                      onChange={() => updateOption('layoutType', 'default')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{__('Default', 'fiveprayer')}</p>
                      <p className="text-[11px] text-gray-500">{__('Standard timetable', 'fiveprayer')}</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isHijriLayout ? 'border-green-400 bg-green-50 ring-1 ring-green-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input type="radio" name="layoutType" value="hijri" checked={isHijriLayout}
                      onChange={() => updateOption('layoutType', 'hijri')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{__('Separate', 'fiveprayer')}</p>
                      <p className="text-[11px] text-gray-500">{__('Separate Hijri Date column', 'fiveprayer')}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Column Toggles */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">{__('Columns', 'fiveprayer')}</h2>
                <div className="space-y-1">
                  {columnOptions.map(({ key, label, desc }) => {
                    const isDisabled = key === 'showHijriDate' && !isHijraActive;
                    return renderToggle(
                      key,
                      label,
                      desc,
                      !!options[key],
                      (next) => handleToggle(key, next),
                      isDisabled,
                      isDisabled ? (
                        <>
                          {__('Needs the Hijra Calendar —', 'fiveprayer')}{' '}
                          <NavLink to="/hijra" className="font-medium underline hover:text-amber-700">
                            {__('activate it first', 'fiveprayer')}
                          </NavLink>
                        </>
                      ) : undefined,
                    );
                  })}
                </div>
              </div>
              {renderDayBlock()}
            </>
          ) : (
            /* Vertical Today Fields */
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">{__('Fields', 'fiveprayer')}</h2>
              <div className="space-y-1">
                {verticalFieldOptions.map(({ key, label, desc }) => {
                  const isDisabled = key === 'showHijriDate' && !isHijraActive;
                  return renderToggle(
                    key,
                    label,
                    desc,
                    !!verticalOptions[key],
                    (next) => updateVerticalOption(key, next),
                    isDisabled,
                    isDisabled ? (
                      <>
                        {__('Needs the Hijra Calendar —', 'fiveprayer')}{' '}
                        <NavLink to="/hijra" className="font-medium underline hover:text-amber-700">
                          {__('activate it first', 'fiveprayer')}
                        </NavLink>
                      </>
                    ) : undefined,
                  );
                })}
              </div>
              {renderDayBlock()}

              {/* Next Prayer Countdown — same feature as Configure Settings →
                  Next Prayer Countdown, controllable here too. Persisted with
                  the Save button below. */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{__('Next Prayer Countdown', 'fiveprayer')}</h3>
                <p className="text-[10px] leading-snug text-gray-500 mb-2">
                  {__('Live time remaining until the next prayer, shown in the Vertical Today notice.', 'fiveprayer')}
                </p>
                <div className="space-y-1">
                  {renderToggle(
                    'countdown-enabled',
                    __('Enable next-prayer countdown', 'fiveprayer'),
                    __('Master switch — off by default', 'fiveprayer'),
                    countdownEnabled,
                    (next) => feature_toggles_update('Next_Prayer_Countdown', next),
                  )}
                </div>

                <div className={`mt-2 space-y-1 ${countdownEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                  <div className="p-2.5">
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      {__('Output format', 'fiveprayer')}
                    </label>
                    <select
                      value={nextPrayerCountdown.format}
                      onChange={(e) =>
                        updateNextPrayerCountdown({
                          ...nextPrayerCountdown,
                          format: e.target.value as CountdownConfig['format'],
                        })
                      }
                      className="h-9 w-full px-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                    >
                      <option value="long">{__('Long — 1 hour 5 minutes', 'fiveprayer')}</option>
                      <option value="short">{__('Short — 1h 5m', 'fiveprayer')}</option>
                      <option value="clock">{__('Clock — 01:05', 'fiveprayer')}</option>
                    </select>
                  </div>
                  {renderToggle(
                    'countdown-seconds',
                    __('Show seconds (updates every second)', 'fiveprayer'),
                    __('Off: ticks once a minute', 'fiveprayer'),
                    !!nextPrayerCountdown.show_seconds,
                    (next) => updateNextPrayerCountdown({ ...nextPrayerCountdown, show_seconds: next }),
                  )}
                  {renderToggle(
                    'countdown-prefix',
                    __('Show "in" before the time', 'fiveprayer'),
                    __('e.g. "in 01 hours 05 minutes"', 'fiveprayer'),
                    !!nextPrayerCountdown.show_prefix,
                    (next) => updateNextPrayerCountdown({ ...nextPrayerCountdown, show_prefix: next }),
                  )}
                  {renderToggle(
                    'countdown-suffix',
                    __('Show "remaining" after the time', 'fiveprayer'),
                    __('e.g. "01 hours 05 minutes remaining"', 'fiveprayer'),
                    !!nextPrayerCountdown.show_suffix,
                    (next) => updateNextPrayerCountdown({ ...nextPrayerCountdown, show_suffix: next }),
                  )}
                  {renderToggle(
                    'countdown-now',
                    __('Show "Now" when the time arrives', 'fiveprayer'),
                    __('Off: nothing is shown at zero', 'fiveprayer'),
                    !!nextPrayerCountdown.show_now,
                    (next) => updateNextPrayerCountdown({ ...nextPrayerCountdown, show_now: next }),
                  )}
                  <p className="px-2.5 pt-1 text-[10px] leading-snug text-gray-400">
                    {__('Connector words are translated under', 'fiveprayer')}{' '}
                    <NavLink
                      to="/moresettings/translate/verticaldailyprayer"
                      className="font-medium text-green-700 underline hover:text-green-800"
                    >
                      {__('More → Translate → Vertical Daily Prayer', 'fiveprayer')}
                    </NavLink>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save */}
          <div className="p-4 mt-auto border-t border-gray-100">
            <button onClick={handleSave} disabled={isSaving}
              className={`w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors focus:outline-hidden ${
                isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-700 text-white hover:bg-green-800'
              }`}>
              {isSaving ? 'Saving...' : 'Save Layout'}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {__('Preview — ', 'fiveprayer')}
              {design === 'timetable'
                ? (isHijriLayout ? 'Hijri Layout' : 'Default Layout')
                : 'Vertical Today'}
            </h2>
            <p className="text-xs text-gray-500">{month?.name || 'No month selected'}</p>
          </div>
          {/* No rounding on this wrapper on purpose: the timetable's corners
              must come from the "Border radius" setting alone (the same value
              the front end reads), never from a fixed radius here. */}
          <div className="bg-white border border-gray-200 shadow-xs overflow-x-auto">
            {design === 'timetable' ? <ColumnLayoutCalendar /> : <VerticalTodayPreview />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableLayoutPage;
