import React, { useMemo } from 'react';
import { useMonthCalendar } from '../../hooks/useMonthCalendar';
import { useTimetableLayoutStore } from '../../state/storeTimetableLayout';
import { useDayDisplayStore } from '../../state/storeDayDisplay';
import { useLocationStore } from '../../state/storeLocation';
import { useTimeTableColor } from '../../state/storeTimeTableColor';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { useTranslationStore } from '../../state/useTranslationStore';
import { PrayerTableStyled } from './prayerTable/PrayerTableStyled';
import { useHijra } from '../../hooks/useHijra';
import { useDayTimesSeconds } from '../../hooks/useDayTimesSeconds';
import TimeWithSeconds from './prayerTable/TimeWithSeconds';
import { getTranslatedPrayerNames } from './prayerTable/prayerCalendarUtils';
import { getCalendarYearSpan, resolveHijriVariant, getEffectiveCalendarType } from '../../utils/hijriCalendar';
import { __ } from '@wordpress/i18n';

const ColumnLayoutCalendar = () => {
  const data = useMonthCalendar();
  // Exact per-day times with seconds (recomputed at display time) for the
  // hover tooltips — the stored timetable only keeps minute precision.
  const daySeconds = useDayTimesSeconds();
  const { showDate, showHijriDate, showSunrise, showBegins, showIqamah, showMidnight, showAsr2, layoutType } = useTimetableLayoutStore();
  const dayDisplay = useDayDisplayStore();
  const month = useLocationStore((state) => state.month);
  const selectedAsr = useLocationStore((state) => state.oaac);
  const calendar_type = useLocationStore((state) => state.calendar_type);
  const feature_toggles = useLocationStore((state) => state.feature_toggles);
  // Day display is a single global config gated by the Day_Display master switch.
  const dayMasterOn = feature_toggles?.['Day_Display'] === true;
  const showFullDay = dayMasterOn && dayDisplay.showFull;
  const showShortDay = dayMasterOn && dayDisplay.showShort;
  const showDayNumber = dayMasterOn && dayDisplay.showNumber;
  const dayOrder = dayDisplay.order;
  // "Calendar Type" feature OFF behaves exactly like 'gregorian' here too
  // (no Hijri banner, no empty-month notes) — the banner must not claim a
  // Hijri year is selected when the feature is turned off.
  const effectiveCalendarType = getEffectiveCalendarType(calendar_type, feature_toggles);
  const colorData = useTimeTableColor();
  const { hijraLocale } = useHijra();
  const HijraLocale = useTimeTableMonth((state) => state.HijraLocale);
  const { prayer_names, activeLanguage, hijralocales, timetable_prayer, day_names } = useTranslationStore();

  // Calendar Type = Persian/Hijri: show the generated year's span so the
  // admin can SEE the choice took effect (the table now covers a different
  // range of days than the Gregorian year — e.g. Lunar Hijri 1448 covers
  // Jun 2026 → Sep 2027, skipping Jan–May 2026). Days both years share are
  // the same physical days and have identical times; the visible difference
  // is which months exist and which are empty.
  const nonGregorianSpan =
    effectiveCalendarType === 'hijri' || effectiveCalendarType === 'persian'
      ? getCalendarYearSpan(
          effectiveCalendarType,
          new Date(),
          resolveHijriVariant(HijraLocale?.calenderType)
        )
      : null;

  const isHijriActive = HijraLocale?.isActive === true;
  // When the Hijri calendar is not activated, hijraLocale() falls back to the
  // Gregorian date — only render the Hijri column when it's actually active.
  const effectiveShowHijri = showHijriDate && isHijriActive;
  // The layout options are the single source of truth — the legacy
  // skipIqamahMidnight flag is synced from showIqamah on load, so it must not
  // override an explicitly enabled Iqamah column (matches the PHP templates).
  const effectiveSkipIqamah = !showIqamah;
  const effectiveSkipBegins = !showBegins;
  const effectiveSkipMidnight = !showMidnight;

  // 'Asr 2 reads a stored second 'Asr per day. Rows generated before the
  // column existed — or with a Hanafi main 'Asr, where both times are the
  // same — carry none, so say why the column is empty instead of leaving the
  // user guessing.
  const asr2Missing =
    showAsr2 &&
    Array.isArray(data) &&
    data.length > 0 &&
    !data.some(
      (day: any) =>
        typeof day.asr_second_begins === 'string' && day.asr_second_begins !== ''
    );
  // The advice depends on the chosen school: a Hanafi main 'Asr has no second
  // time to store, so regenerating would not fill the column.
  const asrIsHanafi =
    String(selectedAsr?.method || '').toLowerCase() === 'hanafi';

  const useCustomLan = hijralocales?.isActive && hijralocales?.customLan;
  const lang = activeLanguage || 'en';

  // Optional "Day" column — enabled parts combine in one cell (e.g. "Wed 7th").
  const showDay = showFullDay || showShortDay || showDayNumber;

  const toUtcDate = (value: unknown): Date | null => {
    if (typeof value !== 'string' || !value) return null;
    const d = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
    return isNaN(d.getTime()) ? null : d;
  };

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

  const lookupDay = (original: string) => {
    if (!useCustomLan) return original;
    const entry = (day_names || []).find(
      (d: any) => d.language_code === lang && String(d.original_text).toLowerCase() === original.toLowerCase()
    );
    return entry ? entry.translated_text : original;
  };

  const lookupDayNumber = (n: number) => {
    const fallback = englishOrdinal(n);
    if (!useCustomLan) return fallback;
    const entry = (day_names || []).find(
      (d: any) => d.language_code === lang && String(d.original_text) === String(n)
    );
    return entry?.translated_text || fallback;
  };

  const formatDay = (dateValue: unknown) => {
    const date = toUtcDate(dateValue);
    if (!date) return '';
    const parts: string[] = [];
    if (showFullDay) {
      parts.push(lookupDay(new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date)));
    }
    if (showShortDay) {
      parts.push(lookupDay(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)));
    }
    if (showDayNumber) {
      const n = lookupDayNumber(date.getUTCDate());
      if (dayOrder === 'number_first') parts.unshift(n);
      else parts.push(n);
    }
    return parts.join(' ');
  };

  const lookup = (originalText: string) => {
    if (!useCustomLan) return originalText;
    const t = timetable_prayer?.find(
      (p: any) => p.original_text === originalText && p.language_code === lang
    );
    return t ? t.translated_text : originalText;
  };

  const translatedPrayerNames = useMemo(() =>
    getTranslatedPrayerNames(prayer_names, activeLanguage, hijralocales),
    [prayer_names, activeLanguage, hijralocales]
  );

  const subHeaders = useMemo(() => {
    const hijraIsActive = hijralocales && hijralocales.isActive === true;
    const useLanguage = hijraIsActive ? activeLanguage : 'en';
    const useCustomLan = hijraIsActive && hijralocales.customLan;
    const monthMethod = month?.method ?? '';
    const rawLabels = [
      'Date',
      monthMethod === '13' ? 'Suhoor End' : 'Fajr Begins',
      monthMethod === '13' ? 'Suhoor End Iqamah' : 'Fajr Iqamah',
      'Sunrise',
      monthMethod === '13' ? 'Iftar End' : 'Dhuhr Begins',
      'Dhuhr Iqamah',
      monthMethod === '13' ? 'Iftar End' : 'Asr Begins',
      'Asr Iqamah',
      monthMethod === '13' ? 'Iftar Start' : 'Maghrib Begins',
      'Maghrib Iqamah',
      'Isha Begins',
      'Isha Iqamah',
      'Midnight',
    ];
    return rawLabels.map((label) => {
      const translation = timetable_prayer?.find(
        (p: any) => p.original_text === label && p.language_code === useLanguage
      );
      if (translation && useCustomLan) return translation.translated_text;
      return label.replace(/^(Fajr|Dhuhr|Asr|Maghrib|Isha|Midnight)\s/, '');
    });
  }, [prayer_names, activeLanguage, hijralocales, timetable_prayer, month?.method]);

  // The second ‘Asr is a prayer name like the others, so its header follows
  // Translate → Prayer Names too. It is stored under “Hanafi”, and the same
  // language gate the other names use applies: no custom language means the
  // untranslated name.
  const hanafiLabel = useMemo(() => {
    const hijraIsActive = hijralocales && hijralocales.isActive === true;
    const useLanguage = hijraIsActive ? activeLanguage : 'en';
    const useCustomLan = hijraIsActive && hijralocales.customLan;
    const entry = (prayer_names || []).find(
      (p: any) =>
        p.language_code === useLanguage &&
        String(p.original_text).toLowerCase() === 'hanafi'
    );
    return useCustomLan && entry?.translated_text ? entry.translated_text : 'Hanafi';
  }, [prayer_names, activeLanguage, hijralocales]);

  const fajrLabel = translatedPrayerNames[0] || 'Fajr';
  const dhuhrLabel = translatedPrayerNames[1] || 'Dhuhr';
  const asrLabel = translatedPrayerNames[2] || 'Asr';
  const maghribLabel = translatedPrayerNames[3] || 'Maghrib';
  const ishaLabel = translatedPrayerNames[4] || 'Isha';
  const midnightLabel = translatedPrayerNames[5] || 'Midnight';

  const groupHeaderBg = `rgba(${colorData.rgba_first_bg.r},${colorData.rgba_first_bg.g},${colorData.rgba_first_bg.b},${colorData.rgba_first_bg.a})`;
  const groupHeaderText = `rgba(${colorData.rgba_first_text.r},${colorData.rgba_first_text.g},${colorData.rgba_first_text.b},${colorData.rgba_first_text.a})`;
  const subHeaderBg = `rgba(${colorData.rgba_second_bg.r},${colorData.rgba_second_bg.g},${colorData.rgba_second_bg.b},${colorData.rgba_second_bg.a})`;
  const subHeaderText = `rgba(${colorData.rgba_second_text.r},${colorData.rgba_second_text.g},${colorData.rgba_second_text.b},${colorData.rgba_second_text.a})`;
  const highlightBg = `rgba(${colorData.rgba_light_bg.r},${colorData.rgba_light_bg.g},${colorData.rgba_light_bg.b},${colorData.rgba_light_bg.a})`;
  const highlightText = `rgba(${colorData.rgba_light_text.r},${colorData.rgba_light_text.g},${colorData.rgba_light_text.b},${colorData.rgba_light_text.a})`;

  // Gregorian year/month for group header — extracted from translated currentDate
  const gregorianHeader = useMemo(() => {
    if (!data?.length || !data[0]?.currentDate) return '';
    const parts = data[0].currentDate.trim().split(/\s+/);
    return parts.length >= 3 ? parts[parts.length - 1] : '';
  }, [data]);

  // Hijri year for group header — extracted from translated hijriLocale output
  const hijriHeader = useMemo(() => {
    if (!isHijriActive) return '';
    if (!data?.length || !data[0]?.date || typeof hijraLocale !== 'function') return '';
    const hijriStr = hijraLocale(data[0].date) || '';
    const parts = hijriStr.trim().split(/\s+/);
    return parts.length >= 3 ? parts.slice(-2).join(' ') : (parts.length >= 2 ? parts[parts.length - 1] : '');
  }, [data, hijraLocale, isHijriActive]);

  if (!data || !data.length) {
    return (
      <div className="p-12 text-center text-gray-400 text-sm">
        <p>{__('No timetable data for ', 'fiveprayer')}<span className="font-medium text-gray-600">{month?.name || 'this month'}</span>.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="overflow-x-auto">
      <PrayerTableStyled
        $rgba_odd_bg={colorData.rgba_odd_bg}
        $rgba_even_bg={colorData.rgba_even_bg}
        $rgba_odd_text={colorData.rgba_odd_text}
        $rgba_even_text={colorData.rgba_even_text}
        $rgba_border_clr={colorData.rgba_border_clr}
        $rgba_hover_bg={colorData.rgba_hover_bg}
        $rgba_hover_text={colorData.rgba_hover_text}
        $hoverMode={colorData.hoverMode}
        $hoverEnabled={colorData.hoverEnabled}
        $rgba_border_size={colorData.rgba_border_size}
        $rgba_border_style={colorData.rgba_border_style}
        $rgba_border_radius={colorData.rgba_border_radius}
        $rgba_light_bg={colorData.rgba_light_bg}
        $rgba_light_text={colorData.rgba_light_text}
      >
        <table className="w-full">
          <thead>
            {/* Row 1: Group headers */}
            <tr style={{ backgroundColor: groupHeaderBg, color: groupHeaderText }}>
              {(showDate || effectiveShowHijri) && (
                layoutType === 'hijri' ? (
                  <>
                    {showDate && <th>{gregorianHeader}</th>}
                    {effectiveShowHijri && <th>{hijriHeader}</th>}
                  </>
                ) : (
                  <th>
                    {showDate && gregorianHeader}
                    {showDate && effectiveShowHijri && ' / '}
                    {effectiveShowHijri && hijriHeader}
                  </th>
                )
              )}
              {!showDate && !effectiveShowHijri && <th></th>}
              {showDay && <th></th>}
              {(() => {
                const fajrCols = (effectiveSkipBegins ? 0 : 1) + (effectiveSkipIqamah ? 0 : 1) + (showSunrise ? 1 : 0);
                const prayerCols = (effectiveSkipBegins ? 0 : 1) + (effectiveSkipIqamah ? 0 : 1);
                // The optional 'Asr 2 column lives inside the Asr group.
                const asrCols = prayerCols + (showAsr2 ? 1 : 0);
                return (
                  <>
                    {fajrCols > 0 && <th colSpan={fajrCols}>{fajrLabel}</th>}
                    {prayerCols > 0 && <th colSpan={prayerCols}>{dhuhrLabel}</th>}
                    {asrCols > 0 && <th colSpan={asrCols}>{asrLabel}</th>}
                    {prayerCols > 0 && <th colSpan={prayerCols}>{maghribLabel}</th>}
                    {prayerCols > 0 && <th colSpan={prayerCols}>{ishaLabel}</th>}
                    {!effectiveSkipMidnight && <th>{midnightLabel}</th>}
                  </>
                );
              })()}
            </tr>
            {/* Row 2: Sub headers */}
            <tr style={{ backgroundColor: subHeaderBg, color: subHeaderText }}>
              {(showDate || effectiveShowHijri) && (
                layoutType === 'hijri' ? (
                  <>
                    {showDate && <th>{lookup('Date')}</th>}
                    {effectiveShowHijri && <th>{lookup('Hijri Date')}</th>}
                  </>
                ) : (
                  <th>
                    {showDate && lookup('Date')}
                    {showDate && effectiveShowHijri && ' / '}
                    {effectiveShowHijri && lookup('Hijri Date')}
                  </th>
                )
              )}
              {!showDate && !effectiveShowHijri && <th></th>}
              {showDay && <th>{lookup('Day')}</th>}
              {!effectiveSkipBegins && <th>{subHeaders[1]}</th>}
              {!effectiveSkipIqamah && <th>{subHeaders[2]}</th>}
              {showSunrise && <th>{subHeaders[3]}</th>}
              {!effectiveSkipBegins && <th>{subHeaders[4]}</th>}
              {!effectiveSkipIqamah && <th>{subHeaders[5]}</th>}
              {!effectiveSkipBegins && <th>{subHeaders[6]}</th>}
              {showAsr2 && <th>{hanafiLabel}</th>}
              {!effectiveSkipIqamah && <th>{subHeaders[7]}</th>}
              {!effectiveSkipBegins && <th>{subHeaders[8]}</th>}
              {!effectiveSkipIqamah && <th>{subHeaders[9]}</th>}
              {!effectiveSkipBegins && <th>{subHeaders[10]}</th>}
              {!effectiveSkipIqamah && <th>{subHeaders[11]}</th>}
              {!effectiveSkipMidnight && <th>{subHeaders[12]}</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((day: any, i: number) => {
              const dayDate = day.date ? new Date(day.date).toISOString().split('T')[0] : '';
              const isToday = dayDate === today;
              return (
                <tr key={i} className={isToday ? 'fiveprayer__today_row' : undefined} style={isToday ? { backgroundColor: highlightBg, color: highlightText } : undefined}>
                  {(showDate || effectiveShowHijri) && (
                    layoutType === 'hijri' ? (
                      <>
                        {showDate && <td>{day.currentDate}</td>}
                        {effectiveShowHijri && <td>{typeof hijraLocale === 'function' ? hijraLocale(day.date) : day.hijri_date || ''}</td>}
                      </>
                    ) : (
                      <td>
                        {showDate && day.currentDate}
                        {showDate && effectiveShowHijri && <br />}
                        {effectiveShowHijri && (typeof hijraLocale === 'function' ? hijraLocale(day.date) : day.hijri_date || '')}
                      </td>
                    )
                  )}
                  {!showDate && !effectiveShowHijri && <td>{day.currentDate}</td>}
                  {showDay && <td>{formatDay(day.date)}</td>}
                  {!effectiveSkipBegins && <TimeWithSeconds value={day.fajr_begins} exact={daySeconds[dayDate]?.fajr} label={__('Fajr', 'fiveprayer')} />}
                  {!effectiveSkipIqamah && <td>{day.fajr_iqamah}</td>}
                  {showSunrise && <TimeWithSeconds value={day.sunrise} exact={daySeconds[dayDate]?.sunrise} label={__('Sunrise', 'fiveprayer')} />}
                  {!effectiveSkipBegins && <TimeWithSeconds value={day.dhuhr_begins} exact={daySeconds[dayDate]?.dhuhr} label={__('Dhuhr', 'fiveprayer')} />}
                  {!effectiveSkipIqamah && <td>{day.dhuhr_iqamah}</td>}
                  {!effectiveSkipBegins && <TimeWithSeconds value={day.asr_begins} exact={daySeconds[dayDate]?.asr} label={__('Asr', 'fiveprayer')} />}
                  {showAsr2 && <TimeWithSeconds value={day.asr_second_begins} exact={daySeconds[dayDate]?.asr2} label={hanafiLabel} />}
                  {!effectiveSkipIqamah && <td>{day.asr_iqamah}</td>}
                  {!effectiveSkipBegins && <TimeWithSeconds value={day.maghrib_begins} exact={daySeconds[dayDate]?.maghrib} label={__('Maghrib', 'fiveprayer')} />}
                  {!effectiveSkipIqamah && <td>{day.maghrib_iqamah}</td>}
                  {!effectiveSkipBegins && <TimeWithSeconds value={day.isha_begins} exact={daySeconds[dayDate]?.isha} label={__('Isha', 'fiveprayer')} />}
                  {!effectiveSkipIqamah && <td>{day.isha_iqamah}</td>}
                  {!effectiveSkipMidnight && <TimeWithSeconds value={day.midnight} exact={daySeconds[dayDate]?.midnight} label={__('Midnight', 'fiveprayer')} />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PrayerTableStyled>
      {/* The selected Calendar Type is NOT the plain Gregorian year — show the
          span it generated so the choice is visible instead of looking like
          "nothing changed" (months both years share have identical times). */}
      {nonGregorianSpan && (
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[11px] text-purple-800">
          <strong>📅 {calendar_type === 'hijri' ? 'Lunar Hijri (Islamic)' : 'Solar Hijri (Persian)'}{__(' year selected:', 'fiveprayer')}</strong>{' '}
          {nonGregorianSpan.start.toISOString().slice(0, 10)} → {new Date(nonGregorianSpan.end.getTime() - 864e5).toISOString().slice(0, 10)}
          ({Math.round((nonGregorianSpan.end.getTime() - nonGregorianSpan.start.getTime()) / 864e5)}{__(' days). Months this year skips are empty; months it adds (e.g. next year\'s spring) are new. Days both years share (like 1 September) are the same physical days, so their times are identical.', 'fiveprayer')}</div>
      )}
      {/* The Hanafi column is on but no stored second 'Asr exists for these dates. */}
      {asr2Missing && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-800">
          <strong>{__('The Hanafi column is on, but these dates have no stored second ‘Asr.', 'fiveprayer')}</strong>{' '}
          {asrIsHanafi
            ? __(
                'Your Asr already uses the Hanafi 2 Mithl time, so there is no separate second ‘Asr to show — turn the Hanafi column off. To print both times, pick a 1 Mithl option (Shafii, Maliki, Jafari and Hanbali — or the Asr + Hanafi entry) in Configure Settings → Asr Calculation and click Generate.',
                'fiveprayer'
              )
            : __(
                'Pick a 1 Mithl option in Configure Settings → Asr Calculation (Shafii, Maliki, Jafari and Hanbali, or the combined Asr + Hanafi entry), then click Generate — generation now stores the 2 Mithl time for every day and fills this column.',
                'fiveprayer'
              )}
        </div>
      )}
      {/* Empty month — the selected non-Gregorian year does not cover it */}
      {data.length === 0 && nonGregorianSpan && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-800">
          <strong>{__('No times for this month.', 'fiveprayer')}</strong>{__(' The selected ', 'fiveprayer')}{calendar_type === 'hijri' ? 'Lunar Hijri' : 'Solar Hijri'}{' '}{__('year covers ', 'fiveprayer')}{nonGregorianSpan.start.toISOString().slice(0, 10)} →{' '}
          {new Date(nonGregorianSpan.end.getTime() - 864e5).toISOString().slice(0, 10)}{__(', so months outside that range are skipped — this is the Calendar Type setting doing its job. Pick a month inside the span from the dropdown.', 'fiveprayer')}</div>
      )}
    </div>
  );
};

export default ColumnLayoutCalendar;
