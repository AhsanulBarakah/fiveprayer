/**
 * DayDisplaySettings
 *
 * Configuration panel for the "Day Display" category in Configure Settings.
 * Controls the optional Day column in the monthly timetable ([Fp_TimeTable_Monthly])
 * and the Day parts folded into the current-date shortcode
 * ([Fp_Single_CurrentDate] — the Vertical Daily Prayer renders its date line
 * through that same shortcode). The preview below shows both.
 *
 * Three independent parts can be switched on and combined in one cell / line:
 *   - Full weekday name  (Friday)
 *   - Short weekday name (Fri)
 *   - Day-of-month       (27th)
 * and the order they render in:
 *   - Name first   → "Fri 27th" / "Wed 14th October 2026"
 *   - Number first → "27th Fri" / "14th Wed October 2026"
 *
 * In the current-date line the weekday name sits *inline at the day position*
 * (never appended after the year), so Name first reads "Wed 14th October 2026"
 * and Number first reads "14th Wed October 2026".
 *
 * Every part comes from the Translate system (More → Translate → Day Names),
 * which ships English + Arabic defaults, so this card only chooses which parts
 * show and in what order.
 *
 * The master on/off is the `Day_Display` feature switch (Feature Switches
 * page). The customization is stored in the `day_display` meta and applied on
 * the next page load — no calendar regeneration is required.
 *
 * @module prayerSetting/DayDisplaySettings
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { useLocationStore } from '../../state/storeLocation';
import { useDayDisplayStore, type DayDisplayOrder } from '../../state/storeDayDisplay';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useTranslationStore } from '../../state/useTranslationStore';
import { __ } from '@wordpress/i18n';

interface DayDisplaySettingsProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

const FEATURE_KEY = 'Day_Display';

/** Admin path to the translate editor that holds the day names. */
const TRANSLATE_PATH = '/moresettings/translate/daynames';

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

/** Small reusable toggle row. */
const ToggleRow: React.FC<{
  label: string;
  desc: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}> = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="min-w-0 mr-3">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-[10px] text-gray-500">{desc}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shrink-0 ${
        checked ? 'bg-green-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  </div>
);

const englishOrdinal = (n: number) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

const DayDisplaySettings: React.FC<DayDisplaySettingsProps> = ({ title, description, icon }) => {
  const { showFull, showShort, showNumber, order, updateOption } = useDayDisplayStore();
  const feature_toggles = useLocationStore((state) => state.feature_toggles || {});
  const feature_toggles_update = useLocationStore((state) => state.feature_toggles_update);
  const { saveBatch } = usePostMeta();

  const { day_names, gregorian_months, gregorian_numbers, activeLanguage, hijralocales } = useTranslationStore();
  const customLan = hijralocales?.isActive === true && hijralocales?.customLan === true;
  const lang = activeLanguage || 'en';

  // Digit translation, mirroring the PHP renderer / translateNumbers helper.
  const digitMap = useMemo(() => {
    if (!customLan) return null;
    const map: Record<string, string> = {};
    for (const n of gregorian_numbers || []) {
      if (n.language_code === lang) map[n.original_text] = n.translated_text;
    }
    return map;
  }, [customLan, lang, gregorian_numbers]);
  const translateNumbers = (value: string) =>
    digitMap ? value.replace(/[0-9]/g, (d) => digitMap[d] ?? d) : value;

  // Ships OFF: only an explicit `true` counts, matching DayNameFormatter::isEnabled().
  const enabled = feature_toggles[FEATURE_KEY] === true;

  const persist = (patch: Partial<{ showFull: boolean; showShort: boolean; showNumber: boolean; order: DayDisplayOrder }>) => {
    const next = { showFull, showShort, showNumber, order, ...patch };
    Object.entries(patch).forEach(([key, value]) => updateOption(key as any, value as any));
    saveBatch({ day_display: next }).catch(() => {});
  };

  const toggleEnabled = () => {
    const next = !enabled;
    feature_toggles_update(FEATURE_KEY, next);
    saveBatch({ feature_toggles: { ...feature_toggles, [FEATURE_KEY]: next } }).catch(() => {});
  };

  // Live preview for both places the Day parts render, using today's date:
  //   - columnToken: the monthly timetable's Day column (DayNameFormatter::format)
  //                  → "Wed 14th" / "14th Wed"
  //   - dateLine:    the [Fp_Single_CurrentDate] line
  //                  → "Wed 14th October 2026" / "14th Wed October 2026"
  // Mirrors the PHP renderers.
  const preview = useMemo(() => {
    const now = new Date();
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const lookupDay = (original: string) => {
      if (!customLan) return original;
      const entry = (day_names || []).find(
        (d: any) => d.language_code === lang && String(d.original_text).toLowerCase() === original.toLowerCase()
      );
      return entry ? entry.translated_text : original;
    };
    const lookupNumber = (n: number) => {
      const fallback = englishOrdinal(n);
      if (!customLan) return fallback;
      const entry = (day_names || []).find(
        (d: any) => d.language_code === lang && String(d.original_text) === String(n)
      );
      return entry?.translated_text || fallback;
    };

    // Plain translated Gregorian date, as the shortcode builds it.
    const englishMonth = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(date);
    const monthName = customLan
      ? (gregorian_months || []).find(
          (m: any) => m.language_code === lang && String(m.original_text).toLowerCase() === englishMonth.toLowerCase()
        )?.translated_text || englishMonth
      : englishMonth;
    const plainDay = translateNumbers(String(date.getUTCDate()));
    const base = `${plainDay} ${monthName} ${translateNumbers(String(date.getUTCFullYear()))}`;

    const nameParts: string[] = [];
    if (showFull) nameParts.push(lookupDay(new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date)));
    if (showShort) nameParts.push(lookupDay(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)));
    const name = nameParts.join(' ');
    const numberFirst = order === 'number_first';
    const ordinal = showNumber ? lookupNumber(date.getUTCDate()) : '';

    // The timetable Day column shows the day parts alone, joined by the order
    // (mirrors DayNameFormatter::format()).
    const columnToken = (numberFirst ? [ordinal, name] : [name, ordinal])
      .filter(Boolean)
      .join(' ');

    let dayPiece: string;
    if (showNumber) {
      dayPiece = name ? (numberFirst ? `${ordinal} ${name}` : `${name} ${ordinal}`) : ordinal;
    } else {
      dayPiece = name ? (numberFirst ? `${plainDay} ${name}` : `${name} ${plainDay}`) : plainDay;
    }

    const idx = base.indexOf(plainDay);
    const dateLine = idx < 0 ? base : `${base.slice(0, idx)}${dayPiece}${base.slice(idx + plainDay.length)}`;

    return { dateLine, columnToken };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFull, showShort, showNumber, order, customLan, lang, day_names, gregorian_months, gregorian_numbers]);

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
            title={__('Enable Day display', 'fiveprayer')}
            description={__('Adds the Day column to the monthly timetable and folds the day into the current-date line (e.g. “Wed 14th October 2026”, or “14th Wed October 2026” in number-first order).', 'fiveprayer')}
            on={enabled}
            onChange={toggleEnabled}
            onLabel="Enabled"
            offLabel="Disabled"
          />

          <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
            {/* Parts */}
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              {__('Parts to show', 'fiveprayer')}
            </h3>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
              <ToggleRow
                label={__('Full weekday name', 'fiveprayer')}
                desc={__('e.g. Friday', 'fiveprayer')}
                checked={showFull}
                onChange={(v) => persist({ showFull: v })}
              />
              <ToggleRow
                label={__('Short weekday name', 'fiveprayer')}
                desc={__('e.g. Fri', 'fiveprayer')}
                checked={showShort}
                onChange={(v) => persist({ showShort: v })}
              />
              <ToggleRow
                label={__('Day-of-month number', 'fiveprayer')}
                desc={__('e.g. 14th', 'fiveprayer')}
                checked={showNumber}
                onChange={(v) => persist({ showNumber: v })}
              />
            </div>

            {/* Order */}
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-5 mb-1.5">
              {__('Order', 'fiveprayer')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'name_first' as DayDisplayOrder, label: __('Name first', 'fiveprayer'), example: 'Wed 14th October 2026' },
                { value: 'number_first' as DayDisplayOrder, label: __('Number first', 'fiveprayer'), example: '14th Wed October 2026' },
              ]).map((opt) => {
                const active = order === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => persist({ order: opt.value })}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all focus:outline-hidden ${
                      active ? 'border-green-400 bg-green-50 text-green-800 ring-1 ring-green-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="block text-[10px] text-gray-500">{opt.example}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live preview — both places the Day parts appear */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{__('Preview (today)', 'fiveprayer')}</p>

            <div>
              <p className="text-[10px] font-medium text-gray-500">
                {__('Monthly timetable — Day column', 'fiveprayer')}
              </p>
              <p className="text-base font-semibold text-gray-900">
                {enabled && preview.columnToken ? preview.columnToken : __('— off —', 'fiveprayer')}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium text-gray-500">
                {__('Shortcode [Fp_Single_CurrentDate]', 'fiveprayer')}
              </p>
              <p className="text-base font-semibold text-gray-900">
                {enabled && preview.dateLine ? preview.dateLine : __('— off —', 'fiveprayer')}
              </p>
            </div>
          </div>

          <p className="text-[11px] leading-snug text-gray-400">
            {__('The weekday names and day-of-month words come from the Translate system.', 'fiveprayer')}{' '}
            <Link to={TRANSLATE_PATH} className="font-medium text-green-700 underline hover:text-green-800">
              {__('More → Translate → Day Names', 'fiveprayer')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DayDisplaySettings;
