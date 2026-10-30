/**
 * CalendarTypeSettings
 *
 * Configuration card for the "Calendar Type" category in the Calculation
 * Settings page. Decides which span of days "Generate Calendar" covers:
 *
 *  - 'gregorian' — the current Gregorian (solar) year (Jan 1 → Dec 31) plus
 *    the usual 3 extra months, exactly as today.
 *  - 'persian'   — the current Solar Hijri (Persian) year (1 Farvardin →
 *    Esfand end, Nowruz ≈ 21 March) plus the same 3 extra months. The Persian
 *    year is solar (365/366 days), so it stays aligned with the seasons —
 *    prayer times are nearly identical to the Gregorian table; only the
 *    covered days differ slightly.
 *  - 'hijri'     — the current Lunar Hijri (Islamic) year (1 Muharram → Dhu
 *    al-Hijjah) plus the same 3 extra months. The lunar year is 354/355 days
 *    and drifts ~11 days earlier each solar year, so its dates land on
 *    DIFFERENT physical days — the generated prayer times genuinely differ
 *    from the Gregorian table.
 *
 * The engine always computes from the Gregorian dates that make up the
 * selected year; the stored timetable keeps Gregorian dates everywhere. The
 * calendar type decides WHICH days get generated (and therefore which times
 * appear in the table).
 *
 * Display mode (calendar_display) — shown for Persian/Hijri:
 *  - 'span'     — the month dropdown lists every Gregorian month the generated
 *    span touches, with year labels (e.g. "June 2026" … "September 2027"), so
 *    every generated day is reachable.
 *  - 'fixed12'  — the dropdown always lists the 12 Gregorian months of the
 *    current year; months the generated span skips show an empty table.
 *
 * The Hijri variant (Umm al-Qura / Civil) is taken from the existing Hijra
 * display settings so the generated year always matches the Hijri Date column.
 *
 * The selections are stored in the `calendar_type` / `calendar_display` meta,
 * persisted together with the other calculation settings when Save Settings /
 * Generate Calendar runs, and loaded back from the database on refresh.
 *
 * @module prayerSetting/CalendarTypeSettings
 */
import React, { useMemo } from 'react';
import { useLocationStore } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import {
	formatHijriDate,
	formatPersianDate,
	getHijriYearSpan,
	getPersianYearSpan,
	resolveHijriVariant,
	type HijriVariant,
} from '../../utils/hijriCalendar';
import { __ } from '@wordpress/i18n';

interface CalendarTypeSettingsProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const CalendarTypeSettings: React.FC<CalendarTypeSettingsProps> = ({ title, description, icon }) => {
  const calendar_type = useLocationStore((state) => state.calendar_type);
  const updateCalendarType = useLocationStore((state) => state.updateCalendarType);
  const calendar_display = useLocationStore((state) => state.calendar_display);
  const updateCalendarDisplay = useLocationStore((state) => state.updateCalendarDisplay);
  const { saveBatch } = usePostMeta();
  const HijraLocale = useTimeTableMonth((state) => state.HijraLocale);
  const variant: HijriVariant = resolveHijriVariant(HijraLocale?.calenderType);

  // Live preview: where the current Hijri year starts/ends in Gregorian terms,
  // and what today's Hijri date is — helps the admin understand the span.
  const hijriPreview = useMemo(() => {
    const today = new Date();
    const span = getHijriYearSpan(today, variant);
    if (!span) return null;
    return {
      start: span.start,
      end: new Date(span.end.getTime() - 864e5), // last generated day
      todayLabel: formatHijriDate(today, variant),
      year: span.hijriYear,
      name: 'Hijri',
    };
  }, [variant]);

  // Live preview for the Solar Hijri (Persian) year.
  const persianPreview = useMemo(() => {
    if (calendar_type !== 'persian') return null;
    const today = new Date();
    const span = getPersianYearSpan(today);
    if (!span) return null;
    return {
      start: span.start,
      end: new Date(span.end.getTime() - 864e5), // last generated day
      todayLabel: formatPersianDate(today),
      year: span.persianYear,
      name: 'Persian',
    };
  }, [calendar_type]);

  const preview = calendar_type === 'hijri' ? hijriPreview : calendar_type === 'persian' ? persianPreview : null;

  const formatGregorian = (date: Date | null): string => {
    if (!date) return '—';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const options = [
    {
      value: 'gregorian' as const,
      label: __('Gregorian calendar (solar)', 'fiveprayer'),
      desc: __('Generate the current Gregorian year (1 January → 31 December) plus 3 extra months. The default — the timetable covers the Gregorian solar year (365/366 days).', 'fiveprayer'),
    },
    {
      value: 'persian' as const,
      label: __('Solar Hijri calendar (Persian)', 'fiveprayer'),
      desc: __('Generate the current Persian solar year (1 Farvardin → 29/30 Esfand, Nowruz ≈ 21 March) plus 3 extra months. Solar, so dates stay aligned with the seasons — prayer times are nearly identical to the Gregorian table; only the covered days differ slightly (leap years).', 'fiveprayer'),
    },
    {
      value: 'hijri' as const,
      label: __('Lunar Hijri calendar (Islamic)', 'fiveprayer'),
      desc: __('Generate the current Islamic lunar year (1 Muharram → 29/30 Dhu al-Hijjah) plus 3 extra months. The lunar year is 354/355 days and drifts ~11 days earlier each solar year, so its dates land on different physical days — the generated prayer times genuinely differ from the Gregorian table.', 'fiveprayer'),
    },
  ];

  const displayModes = [
    {
      value: 'span' as const,
      label: __('Show every month the year touches', 'fiveprayer'),
      desc: __('The month dropdown lists all Gregorian months the generated span covers, with year labels (e.g. "June 2026" … "September 2027") — every generated day is reachable. Recommended.', 'fiveprayer'),
    },
    {
      value: 'fixed12' as const,
      label: __('Always show the 12 Gregorian months of the current year', 'fiveprayer'),
      desc: __('The dropdown stays January–December of the current year. Months the generated span skips (e.g. Jan–May 2026 for the lunar year) show an empty table.', 'fiveprayer'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-w-2xl">
            {options.map(({ value, label, desc }) => (
              <label
                key={value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  calendar_type === value
                    ? 'border-green-400 bg-green-50 ring-1 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="calendar_type"
                  value={value}
                  checked={calendar_type === value}
                  onChange={() => {
                    updateCalendarType(value);
                    // Persist to the DATABASE so the choice survives a page
                    // refresh — the store alone is wiped on reload.
                    saveBatch({ calendar_type: value }).catch(() => {});
                  }}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          {(calendar_type === 'hijri' || calendar_type === 'persian') && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-2xl">
              <p className="text-xs text-purple-800">
                <strong>{__('📅 Current ', 'fiveprayer')}{calendar_type === 'hijri' ? 'Hijri' : 'Persian'}{__(' year preview', 'fiveprayer')}</strong>
                {calendar_type === 'hijri' && (
                  <>{__(' — using ', 'fiveprayer')}<strong>{variant === 'islamic-civil' ? 'Islamic Civil' : 'Islamic Umm al-Qura'}</strong>{__(' (from the Hijra settings):', 'fiveprayer')}</>
                )}
                {calendar_type === 'persian' && ':'}
              </p>
              {preview ? (
                <ul className="text-xs text-purple-800 mt-2 space-y-1">
                  <li>{__('• Today is ', 'fiveprayer')}<strong>{preview.todayLabel}</strong>
                  </li>
                  <li>
                    • 1 {calendar_type === 'hijri' ? 'Muharram' : 'Farvardin'} {preview.year}{' '}
                    {calendar_type === 'hijri' ? 'AH' : 'AP'} ={' '}
                    <strong>{formatGregorian(preview.start)}</strong>
                  </li>
                  <li>{__('• Last day of ', 'fiveprayer')}{calendar_type === 'hijri' ? 'Dhu al-Hijjah' : 'Esfand'}{' '}
                    {preview.year} = <strong>{formatGregorian(preview.end)}</strong>
                  </li>
                </ul>
              ) : (
                <p className="text-xs text-purple-800 mt-2">
                  {calendar_type === 'hijri' ? 'Hijri' : 'Persian'}{__(' dates are not available in this browser — the calendar will fall back to the Gregorian year.', 'fiveprayer')}</p>
              )}
              <p className="text-xs text-purple-800 mt-2">{__('When you click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(', the timetable is built for every day of this', 'fiveprayer')}{' '}
                {calendar_type === 'hijri' ? 'lunar year — which skips Jan–May and adds months into next year, so its times genuinely differ from the Gregorian table' : 'solar year — dates stay aligned with the seasons, so its times are nearly identical to the Gregorian table'}.
              </p>
            </div>
          )}

          {(calendar_type === 'hijri' || calendar_type === 'persian') && (
            <div className="mt-4 max-w-2xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{__('Month display', 'fiveprayer')}</h3>
              <p className="text-xs text-gray-500 mb-2">{__('How the month dropdown shows the generated ', 'fiveprayer')}{calendar_type === 'hijri' ? 'lunar' : 'solar'}{__(' year. Try both — pick whichever feels right for you.', 'fiveprayer')}</p>
              <div className="space-y-2">
                {displayModes.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      calendar_display === value
                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="calendar_display"
                      value={value}
                      checked={calendar_display === value}
                      onChange={() => {
                        updateCalendarDisplay(value);
                        saveBatch({ calendar_display: value }).catch(() => {});
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <strong>{__('💡 Note:', 'fiveprayer')}</strong>{__(' this setting is saved together with your other calculation settings and takes effect the next time you click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__('. The calendar type decides WHICH days the full-year generation covers — it does not change how prayer times are calculated for a given day. The', 'fiveprayer')}{' '}
            <strong>{__('Lunar Hijri (Islamic)', 'fiveprayer')}</strong>{__(' year covers different days than Gregorian (so its times differ); the ', 'fiveprayer')}<strong>{__('Solar Hijri (Persian)', 'fiveprayer')}</strong>{__(' year is solar like Gregorian (so its times are nearly the same, only the covered days differ slightly).', 'fiveprayer')}</div>

          <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
            <strong>{__('✅ How to see it working:', 'fiveprayer')}</strong>{__(' pick ', 'fiveprayer')}<strong>{__('Lunar Hijri', 'fiveprayer')}</strong> → <strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' → the month dropdown now lists the Hijri year\'s months (e.g. ', 'fiveprayer')}<em>{__('June 2026 … September 2027', 'fiveprayer')}</em>{__(' instead of January–December). Months the Hijri year skips (e.g. January–May 2026) show ', 'fiveprayer')}<strong>{__('empty tables', 'fiveprayer')}</strong>{__(', and months it adds (e.g. April–September 2027) are brand new. Days both years share — like 1 September 2026 — are the same physical days, so their times are identical by design.', 'fiveprayer')}</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTypeSettings;