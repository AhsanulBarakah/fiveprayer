/**
 * VerticalTodayPreview
 *
 * Live preview of the "Vertical Today" design — the single-day vertical prayer
 * table rendered on the front end by [Fp_Vertical_Daily_Prayer].
 *
 * It deliberately mirrors the frontend markup and styling so the fields the
 * user switches on/off here (local time, Gregorian date, Hijri date) are shown
 * exactly as visitors see them. Colours come from the same store the monthly
 * timetable preview uses.
 *
 * @module customizing/VerticalTodayPreview
 */
import React, { useMemo } from 'react';
import { useMonthCalendar } from '../../hooks/useMonthCalendar';
import { useTimeTableColor } from '../../state/storeTimeTableColor';
import { useVerticalTodayLayoutStore } from '../../state/storeVerticalTodayLayout';
import { useDayDisplayStore } from '../../state/storeDayDisplay';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { useTranslationStore } from '../../state/useTranslationStore';
import { useHijra } from '../../hooks/useHijra';
import useFormatDataLocale from '../../hooks/translate/useFormatDataLocale';
import { useLocationStore } from '../../state/storeLocation';
import { formatCountdown, type CountdownConfig } from '../../utils/countdownFormat';
import { formatWpClock } from '../../utils/formatWpTime';
import { VerticalPrayerTableStyled } from './prayerTable/VerticalPrayerTableStyled';
import { __ } from '@wordpress/i18n';

/** Parse a stored 12h/24h time string into minutes since midnight. */
const parseMinutes = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = (match[3] || '').toLowerCase();
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  if (!period && hours > 23) return null;
  return hours * 60 + minutes;
};

const VerticalTodayPreview = () => {
  const { showTime, showDate, showHijriDate, showAsr2 } = useVerticalTodayLayoutStore();
  const dayDisplay = useDayDisplayStore();
  const colorProps = useTimeTableColor();
  const monthData = useMonthCalendar();
  const fullYearData = useTimeTableMonth((state) => state.TimeTableMonthFullYear) as unknown as any[];
  const HijraLocale = useTimeTableMonth((state) => state.HijraLocale);
  const {
    prayer_names,
    activeLanguage,
    hijralocales,
    vertical_daily_prayer,
    day_names,
    gregorian_numbers,
    gregorian_months,
  } = useTranslationStore();
  const { hijraLocale } = useHijra();
  const { gregorian_format } = useFormatDataLocale();
  const countdownConfig = useLocationStore((state) => state.next_prayer_countdown) as CountdownConfig;
  const countdownEnabled = useLocationStore(
    (state) => state.feature_toggles?.['Next_Prayer_Countdown'] === true
  );
  // Day display is a single global config gated by the Day_Display master switch.
  const dayMasterOn = useLocationStore(
    (state) => state.feature_toggles?.['Day_Display'] === true
  );
  const showFullDay = dayMasterOn && dayDisplay.showFull;
  const showShortDay = dayMasterOn && dayDisplay.showShort;
  const showDayNumber = dayMasterOn && dayDisplay.showNumber;
  const dayOrder = dayDisplay.order;

  // Tick the preview every second so the countdown visibly counts down, like
  // the frontend. Declared before the early return so the hook order is stable.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hijriActive = HijraLocale?.isActive === true;
  const customLan = hijralocales?.isActive === true && hijralocales?.customLan === true;
  const lang = activeLanguage || 'en';

  // Site wall-clock time. The preview anchors to the site's timestamp and ticks
  // from there (like the front-end `live-time.js`), then reads the shifted Date
  // with the UTC getters so the masjid's local time is shown regardless of the
  // admin browser's own timezone.
  const wpTimezone = typeof window !== 'undefined' ? window.FivePrayerData?.wordpress_timezone : undefined;
  const anchor = React.useRef({
    base: wpTimezone?.current_timestamp ? wpTimezone.current_timestamp * 1000 : Date.now(),
    mount: Date.now(),
  });
  const siteMs = anchor.current.base + (now - anchor.current.mount);
  const siteNow = new Date(siteMs);
  const timeFormat = window.FivePrayerData?.time_format || 'g:i a';

  // Digit translation (gregorian_numbers) for the active language — applied to
  // the clock, the Gregorian date and the countdown, mirroring `live-time.js`
  // and NextPrayerCountdown::translateNumbers(). No-ops without a custom
  // language.
  const digitMap = useMemo(() => {
    if (!customLan) return null;
    const map: Record<string, string> = {};
    for (const n of gregorian_numbers || []) {
      if (n.language_code === lang) map[n.original_text] = n.translated_text;
    }
    return map;
  }, [customLan, lang, gregorian_numbers]);

  const translateDigit = (digit: string) => digitMap?.[digit] ?? digit;
  const translateNumbers = (value: string) =>
    digitMap ? value.replace(/[0-9]/g, (d) => digitMap[d] ?? d) : value;

  const translateMeridiem = (period: 'AM' | 'PM') => {
    if (!customLan) return undefined;
    const entry = (gregorian_numbers || []).find(
      (n) => n.language_code === lang && n.original_text.toUpperCase() === period
    );
    return entry?.translated_text;
  };

  const todayStr = siteNow.toISOString().split('T')[0];
  const dayKey = (d: any) => (d?.date ? new Date(d.date).toISOString().split('T')[0] : '');

  // Prefer today's row from the (translated) selected month, then fall back to
  // the full-year data so the preview still shows "today" when the selected
  // month is not the current one.
  const row = useMemo(() => {
    const fromMonth = (monthData || []).find((d) => dayKey(d) === todayStr);
    if (fromMonth) return fromMonth;
    const fromYear = (fullYearData || []).find((d) => dayKey(d) === todayStr);
    return fromYear || (monthData || [])[0] || (fullYearData || [])[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthData, fullYearData, todayStr]);

  // Translate a fixed vertical-table label through the Translate system. The
  // front end matches case-insensitively (strcasecmp), so this does too.
  const t = (original: string) => {
    if (!customLan) return original;
    const entry = (vertical_daily_prayer || []).find(
      (p: any) =>
        p.language_code === lang &&
        String(p.original_text).toLowerCase() === original.toLowerCase()
    );
    return entry ? entry.translated_text : original;
  };

  const prayerName = (original: string) => {
    if (!customLan) return original;
    const entry = (prayer_names || []).find(
      (p: any) =>
        p.language_code === lang &&
        String(p.original_text).toLowerCase() === original.toLowerCase()
    );
    return entry ? entry.translated_text : original;
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
    if (!customLan) return original;
    const entry = (day_names || []).find(
      (d: any) => d.language_code === lang && String(d.original_text).toLowerCase() === original.toLowerCase()
    );
    return entry ? entry.translated_text : original;
  };

  const lookupDayNumber = (n: number) => {
    const fallback = englishOrdinal(n);
    if (!customLan) return fallback;
    const entry = (day_names || []).find(
      (d: any) => d.language_code === lang && String(d.original_text) === String(n)
    );
    return entry?.translated_text || fallback;
  };

  /**
   * Fold the Day parts into the Gregorian date line, mirroring the PHP
   * PrayerTimeRenderer::renderCurrentDate(). The day number becomes the ordinal
   * (when the Number part is on) and the weekday name is placed *inline at the
   * day position* (never appended), per the order:
   *
   *   name_first   → "Wed 14th October 2026"
   *   number_first → "14th Wed October 2026"
   *
   * With the feature off the date is returned untouched.
   */
  const formatCurrentDateWithDay = (base: string, date: Date): string => {
    if (!showFullDay && !showShortDay && !showDayNumber) return base;

    const plainDay = translateNumbers(String(date.getUTCDate()));
    const idx = plainDay ? base.indexOf(plainDay) : -1;
    if (idx < 0) return base;

    const nameParts: string[] = [];
    if (showFullDay) {
      nameParts.push(lookupDay(new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date)));
    }
    if (showShortDay) {
      nameParts.push(lookupDay(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)));
    }
    const name = nameParts.join(' ');
    const numberFirst = dayOrder === 'number_first';

    let dayPiece: string;
    if (showDayNumber) {
      const ordinal = lookupDayNumber(date.getUTCDate());
      dayPiece = name ? (numberFirst ? `${ordinal} ${name}` : `${name} ${ordinal}`) : ordinal;
    } else {
      dayPiece = name ? (numberFirst ? `${plainDay} ${name}` : `${name} ${plainDay}`) : plainDay;
    }

    return `${base.slice(0, idx)}${dayPiece}${base.slice(idx + plainDay.length)}`;
  };

  // Build a Gregorian date line for the active language without hard-coding a
  // locale: the canonical month name comes from Intl and is then swapped for
  // the translated entry, and the digits follow gregorian_numbers.
  const formatGregorianDate = (date: Date): string => {
    const englishMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    const monthName = customLan
      ? (gregorian_months || []).find(
          (m: any) =>
            m.language_code === lang &&
            String(m.original_text).toLowerCase() === englishMonth.toLowerCase()
        )?.translated_text || englishMonth
      : englishMonth;
    return `${translateNumbers(String(date.getUTCDate()))} ${monthName} ${translateNumbers(
      String(date.getUTCFullYear())
    )}`;
  };

  if (!row) {
    return (
      <div className="p-12 text-center text-gray-400 text-sm">
        <p>{__('No prayer data available for today.', 'fiveprayer')}</p>
      </div>
    );
  }

  // The raw (untranslated) "today" row straight from the API. Time math and
  // translation both start from this, so the date/times stay correct even when
  // the selected month is not the current one (the translated month data would
  // then be empty and the row would never be localised).
  const rawRow = (fullYearData || []).find((d) => dayKey(d) === todayStr) || row;

  // Translate the row through the very same helper the monthly timetable uses
  // (gregorian_format) rather than relying on the month slice: that keeps the
  // times, the AM/PM marker, the digits and the Gregorian date in sync with the
  // Translate system no matter which month is selected. No hard-coded locale.
  const displayRow =
    customLan && rawRow && typeof rawRow.currentDate === 'string'
      ? gregorian_format([rawRow], gregorian_numbers, gregorian_months, lang)[0] || rawRow
      : rawRow;

  // Rows mirror ShortCodeVerticalDailyPrayer::renderPrayerTable().
  const rows = [
    { slug: 'fajr', label: prayerName('Fajr'), begins: displayRow.fajr_begins, iqamah: displayRow.fajr_iqamah, full: false },
    { slug: 'sunrise', label: prayerName('Sunrise'), begins: displayRow.sunrise, iqamah: null, full: true },
    { slug: 'dhuhr', label: prayerName('Dhuhr'), begins: displayRow.dhuhr_begins, iqamah: displayRow.dhuhr_iqamah, full: false },
    { slug: 'asr', label: prayerName('Asr'), begins: displayRow.asr_begins, iqamah: displayRow.asr_iqamah, full: false },
    // Second ‘Asr (2 Mithl / Hanafi): a Begins-only row under ‘Asr, shown when
    // the layout switch is on and the day carries a stored time. The label is the
    // Hanafi prayer name, from the same collection the front end reads.
    ...(showAsr2 && displayRow.asr_second_begins
      ? [{ slug: 'asr2', label: prayerName('Hanafi'), begins: displayRow.asr_second_begins, iqamah: null, full: true }]
      : []),
    { slug: 'maghrib', label: prayerName('Maghrib'), begins: displayRow.maghrib_begins, iqamah: displayRow.maghrib_iqamah, full: false },
    { slug: 'isha', label: prayerName('Isha'), begins: displayRow.isha_begins, iqamah: displayRow.isha_iqamah, full: false },
  ];

  // Time math must use the untranslated values: the displayed row may already
  // carry the active language's digits and AM/PM marker, which parseMinutes
  // cannot read.
  const rawBegins: Record<string, unknown> = {
    fajr: rawRow.fajr_begins,
    sunrise: rawRow.sunrise,
    dhuhr: rawRow.dhuhr_begins,
    asr: rawRow.asr_begins,
    maghrib: rawRow.maghrib_begins,
    isha: rawRow.isha_begins,
  };

  // The frontend highlights the NEXT prayer's row and shows it in the notice;
  // approximate it from the Begins times so the preview reads the same way
  // (using the ticking clock). Sunrise IS a candidate — NextPrayer includes it
  // in both the begins and iqamah arrays, and the PHP renderer only suppresses
  // the "Next Prayer" title for it — so it is not filtered out here either.
  const nowMinutes = siteNow.getUTCHours() * 60 + siteNow.getUTCMinutes();
  const nextSlug =
    rows
      .map((r) => ({ slug: r.slug, minutes: parseMinutes(rawBegins[r.slug]) }))
      .filter((r) => r.minutes !== null && r.minutes > nowMinutes)
      .sort((a, b) => (a.minutes as number) - (b.minutes as number))[0]?.slug || 'fajr';

  const nextRow = rows.find((r) => r.slug === nextSlug) || rows[0];

  // Live countdown to the next prayer's Begins time (mirrors the frontend's
  // [Fp_Single_Next_Prayer_Remaining] / Vertical Daily Prayer notice). Words go
  // through the plugin Translate system and the digits follow the language.
  const nextBeginsMinutes = parseMinutes(rawBegins[nextSlug]);
  const targetTime = (() => {
    if (nextBeginsMinutes == null) return null;
    const d = new Date(siteMs);
    d.setUTCHours(Math.floor(nextBeginsMinutes / 60), nextBeginsMinutes % 60, 0, 0);
    // A Begins time already passed today belongs to tomorrow (the next prayer
    // after Isha rolls over to Fajr).
    if (d.getTime() <= siteMs) d.setUTCDate(d.getUTCDate() + 1);
    return d.getTime();
  })();
  const remainingSeconds = targetTime != null ? Math.max(0, (targetTime - siteMs) / 1000) : 0;
  const countdownText = countdownEnabled
    ? translateNumbers(formatCountdown(remainingSeconds, countdownConfig, t))
    : '';

  const clockText = formatWpClock(
    { hours: siteNow.getUTCHours(), minutes: siteNow.getUTCMinutes(), seconds: siteNow.getUTCSeconds() },
    timeFormat,
    { digit: translateDigit, meridiem: translateMeridiem }
  );
  const gregorianDate = displayRow.currentDate || formatGregorianDate(siteNow);
  const hijriDate = typeof hijraLocale === 'function' ? hijraLocale(displayRow.date) : '';

  // The date the Day parts describe (today's row), used to place the weekday
  // name and ordinal inside the Gregorian date line.
  const dayDateObj = (() => {
    const raw = displayRow?.date;
    if (typeof raw === 'string' && raw) {
      const d = new Date(raw.length <= 10 ? `${raw}T00:00:00Z` : raw);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(Date.UTC(siteNow.getUTCFullYear(), siteNow.getUTCMonth(), siteNow.getUTCDate()));
  })();
  const gregorianDateWithDay = formatCurrentDateWithDay(gregorianDate, dayDateObj);

  return (
    <VerticalPrayerTableStyled
      $second_bg={colorProps.rgba_second_bg}
      $second_text={colorProps.rgba_second_text}
      $odd_bg={colorProps.rgba_odd_bg}
      $even_bg={colorProps.rgba_even_bg}
      $odd_text={colorProps.rgba_odd_text}
      $even_text={colorProps.rgba_even_text}
      $border_clr={colorProps.rgba_border_clr}
      $border_size={colorProps.rgba_border_size}
      $border_style={colorProps.rgba_border_style}
      $border_radius={colorProps.rgba_border_radius}
      $light_bg={colorProps.rgba_light_bg}
      $light_text={colorProps.rgba_light_text}
      $hover_bg={colorProps.rgba_hover_bg}
      $hover_text={colorProps.rgba_hover_text}
      $hoverMode={colorProps.hoverMode}
      $hoverEnabled={colorProps.hoverEnabled}
    >
      <div className="fiveprayer-container fiveprayer__iqamah_next">
        <table className="fiveprayer-table fiveprayer__DairyPrayer_">
          <thead>
            <tr>
              <th colSpan={3} className="prayer-header">
                {/* Next-prayer notice (mirrors renderNextPrayerNotice). */}
                <div className="next-prayer-notice">
                  <div className="next-prayer-head">
                    {nextSlug !== 'sunrise' && (
                      <span className="next-prayer-title">{t('Next Prayer')}</span>
                    )}
                    <span className="next-prayer-name">{nextRow.label}</span>
                    <span className="next-prayer-time">{nextRow.begins}</span>
                  </div>
                  {countdownEnabled && countdownText && (
                    <div className="next-prayer-countdown">
                      <span className="fiveprayer-next-prayer-countdown">{countdownText}</span>
                    </div>
                  )}
                </div>
                {/* Date line (mirrors renderHeader). Sibling of the notice, so
                    the notice's bottom border sits between the two. */}
                <div className="prayer-date">
                  {showTime && (
                    <div className="prayer-date-time">
                      <span>{t('Current Local Time')}</span>
                      <span className="fiveprayer-live-time">{clockText}</span>
                    </div>
                  )}
                  {showDate && <div>{gregorianDateWithDay}</div>}
                  {showHijriDate && hijriActive && hijriDate && (
                    <div className="prayer-date-hijri">{hijriDate}</div>
                  )}
                </div>
              </th>
            </tr>
            <tr id="fiveprayer-tbmonth-second">
              <th>{t('Prayer')}</th>
              <th>{t('Begins')}</th>
              <th>{t('Iqamah')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className={r.slug === nextSlug ? 'fiveprayer__today_row' : undefined}>
                <th>{r.label}</th>
                {r.full ? (
                  <td colSpan={2}>{r.begins}</td>
                ) : (
                  <>
                    <td>{r.begins}</td>
                    <td>{r.iqamah || '\u00A0'}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VerticalPrayerTableStyled>
  );
};

export default VerticalTodayPreview;
