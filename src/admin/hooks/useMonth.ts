import { useCallback, useMemo } from "react";
import { useConditional } from "../state/storeConditional";
import { useLocationStore } from "../state/storeLocation";
import { useTimeTableMonth } from "../state/storeTimeTable";
import { getCalendarYearSpan, resolveHijriVariant, getEffectiveCalendarType } from "../utils/hijriCalendar";

// Static data for month names and list
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_LIST = {value:[
  { name: 'January', method: '1' },
  { name: 'February', method: '2' },
  { name: 'March', method: '3' },
  { name: 'April', method: '4' },
  { name: 'May', method: '5' },
  { name: 'June', method: '6' },
  { name: 'July', method: '7' },
  { name: 'August', method: '8' },
  { name: 'September', method: '9' },
  { name: 'October', method: '10' },
  { name: 'November', method: '11' },
  { name: 'December', method: '12' },
  { name: 'Ramadan', method: '13' },
]};

export const useMonth = () => {
  const { isRamadan } = useConditional();
  const { calendar_type, calendar_display, feature_toggles } = useLocationStore();
  const { HijraLocale } = useTimeTableMonth();
  // "Calendar Type" feature OFF behaves exactly like 'gregorian' everywhere
  // (generation AND the month dropdown) — a hidden card never changes the
  // covered days.
  const effectiveCalendarType = getEffectiveCalendarType(calendar_type, feature_toggles);

  // Calendar Type = Persian/Hijri with 'span' display: the generated span
  // covers the current Persian/Hijri year (roughly two Gregorian years, e.g.
  // Lunar Hijri 1448 = Jun 2026 → Sep 2027). The month dropdown keeps
  // GREGORIAN month names but lists every Gregorian month the span touches,
  // with its year label ("June 2026" … "September 2027"), so the user still
  // navigates by familiar month names while every day of the selected
  // calendar year is reachable. With 'fixed12' display the plain 12 Gregorian
  // months of the current year are used instead (months the span skips show
  // an empty table). The same Hijri variant as generation (Hijra display
  // settings) is used so the span matches the generated rows.
  const hijriVariant = resolveHijriVariant(HijraLocale?.calenderType);
  const calendarSpan = useMemo(() => {
    if (effectiveCalendarType !== 'hijri' && effectiveCalendarType !== 'persian') return null;
    if (calendar_display !== 'span') return null;
    try {
      return getCalendarYearSpan(effectiveCalendarType, new Date(), hijriVariant);
    } catch {
      return null;
    }
  }, [effectiveCalendarType, calendar_display, hijriVariant]);

  // Memoize the MonthName function to avoid recreating it on every render.
  // Gregorian names are always used: even in Hijri/Persian span mode the
  // dropdown is labelled "June 2026" … so the admin navigates by familiar
  // month names (see MonthList below).
  const MonthName = useCallback((month: number) => MONTH_NAMES[month], []);

  // Memoize the MonthList function to avoid recalculating it on every render
  const MonthList = useMemo(() => {
    if (calendarSpan) {
      const entries: { name: string; method: string; start: string; end: string }[] = [];
      const cursor = new Date(
        Date.UTC(calendarSpan.start.getUTCFullYear(), calendarSpan.start.getUTCMonth(), 1)
      );
      while (cursor < calendarSpan.end) {
        const y = cursor.getUTCFullYear();
        const m = cursor.getUTCMonth() + 1;
        entries.push({
          name: `${MONTH_NAMES[m - 1]} ${y}`,
          method: `g-${y}-${m}`,
          start: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
          end: new Date(Date.UTC(y, m, 1)).toISOString(),
        });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
      return entries;
    }
    return MONTH_LIST.value.filter((item) =>
      !isRamadan.ramadan ? item.name !== 'Ramadan' : true
    );
  }, [calendarSpan, calendar_type, calendar_display, hijriVariant, isRamadan.ramadan]);

  return { MonthName, MonthList };
};