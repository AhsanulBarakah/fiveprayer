/**
 * useDayTimesSeconds
 *
 * Recomputes the exact prayer times (with seconds) for every day of the
 * currently displayed month, using the same settings pipeline as calendar
 * generation. Returns a map keyed by 'YYYY-MM-DD' → { fajr: { exact:
 * '04:35:52', minute: '04:36' }, ... } that the calendar components use for
 * hover tooltips. `exact` holds the unrounded time with seconds (what the
 * tooltip shows) and `minute` is the rounded minute generation stored (what
 * the match guard compares against).
 *
 * @module hooks/useDayTimesSeconds
 */
import { useEffect, useState } from 'react';
import { useLocationStore } from '../state/storeLocation';
import { useTimeTableMonth } from '../state/storeTimeTable';
import { useTuneStore } from '../state/storeTunePrayer';
import { useMonth } from './useMonth';
import { useCalenderSettings } from './useCalenderSettings';
import {
	computeDayTimes,
	createDayTimesComputer,
	getWordpressTimezoneOffset,
	type DaySeconds,
} from '../utils/computeDayTimes';
import { smoothDayTimes } from '../utils/smoothDayTimes';
import {
	getCalendarYearSpan,
	resolveDisplayMonth,
	resolveHijriVariant,
} from '../utils/hijriCalendar';

/**
 * Module-level cache of computed tooltip-second maps, keyed by the displayed
 * month + year + a JSON fingerprint of every setting that affects the times.
 * Navigation between admin pages remounts the calendar, and month switches
 * re-run this hook — the cache makes repeat visits instant and only invalidates
 * when a setting actually changes. Capped to avoid unbounded memory growth.
 */
const SECONDS_CACHE_MAX = 24;
const secondsCache = new Map<string, Record<string, DaySeconds>>();

/**
 * Cheap JSON fingerprint of every store value that can change the computed
 * times. `settingsPrayer` depends on the tune store + method/location/rounding
 * selections; `computeDayTimes` reads the location, methods (unified params
 * incl. seasonal/chart data), rounding and smoothing config.
 */
const buildSettingsFingerprint = (): string => {
	const s = useLocationStore.getState();
	const t = useTuneStore.getState();
	return JSON.stringify([
		s.customLocationSelected?.lat,
		s.customLocationSelected?.lng,
		(s.mfc as any)?.meta ?? (s.mfc as any)?.method ?? s.mfc?.name,
		s.oaac?.method,
		s.mncm?.method,
		s.hlm?.method,
		s.rounding_selected,
		s.roundingEnabled,
		s.smoothing_selected,
		s.methodsForCalculation,
		s.calendar_type,
		s.calendar_display,
		t.Imsak, t.Fajr, t.Sunrise, t.Dhuhr, t.Asr,
		t.Maghrib, t.Sunset, t.Isha, t.Midnight,
	]);
};

export const useDayTimesSeconds = (): Record<string, DaySeconds> => {
	const { month, calendar_type } = useLocationStore();
	const { HijraLocale } = useTimeTableMonth();
	const { TimeTableMonthFullYear } = useTimeTableMonth() as unknown as {
		TimeTableMonthFullYear: any[];
	};
	const { MonthList } = useMonth();
	const [secondsMap, setSecondsMap] = useState<Record<string, DaySeconds>>({});
	// Prepare at the hook level — computeDayTimes is a plain utility and must
	// not call hooks itself (that caused the 'Invalid hook call' crash).
	const { settingsPrayer } = useCalenderSettings();

	useEffect(() => {
		if (!Array.isArray(TimeTableMonthFullYear) || !TimeTableMonthFullYear.length) {
			setSecondsMap({});
			return;
		}

		// Same month resolution as useMonthCalendar (selected month → current
		// month; in Hijri Calendar Type mode the list holds Gregorian months
		// with year labels covering the generated Hijri span).
		const monthList = Array.isArray(MonthList) ? MonthList : [];
		const selectedMonth = resolveDisplayMonth(month, monthList, calendar_type, new Date());
		if (!selectedMonth) return;

		// Fast path — identical month + settings already computed (navigation
		// back/forth, month switching): reuse the cached map without touching
		// the engine at all.
		const cacheKey = `${selectedMonth.method}|${new Date().getFullYear()}|${buildSettingsFingerprint()}`;
		const cached = secondsCache.get(cacheKey);
		if (cached) {
			setSecondsMap(cached);
			return;
		}

		const wpOffset = getWordpressTimezoneOffset();

		// Displayed month boundaries: a Hijri month entry carries its own
		// Gregorian start/end range (it spans two Gregorian months and may
		// cross a year boundary); Gregorian mode uses the plain calendar month
		// of the current year, unchanged.
		const hijriRange =
			selectedMonth.start && selectedMonth.end
				? { start: new Date(selectedMonth.start), end: new Date(selectedMonth.end) }
				: null;

		let monthStart: Date;
		let monthEnd: Date;
		if (hijriRange) {
			monthStart = hijriRange.start;
			monthEnd = hijriRange.end;
		} else {
			const year = new Date().getFullYear();
			const monthIndex = Number(selectedMonth.method) - 1;
			if (monthIndex < 0 || monthIndex > 11) return; // '13' (Ramadan) is not a calendar month
			monthStart = new Date(Date.UTC(year, monthIndex, 1));
			monthEnd = new Date(Date.UTC(year, monthIndex + 1, 1));
		}

		// Build the chain range the SAME way generation does, depending on the
		// smoothing mode:
		//  - 'noDrift': the result for any day depends only on that day and the
		//    previous day's raw value, so a single seed day (the previous
		//    day) is enough to reproduce generation exactly.
		//  - 'strict', 'hybrid' & 'manual': the chain carries state (all three
		//    cap consecutive steps from the previous smoothed value), so we
		//    must replay it from the generation start (Jan 1 of the displayed
		//    year in Gregorian mode; 1 Muharram of the Hijri year in Hijri
		//    mode) or the tooltip seconds would diverge from what was stored.
		const storeMode = useLocationStore.getState().smoothing_selected?.mode;
		const chainCarriesState =
			storeMode === 'strict' || storeMode === 'hybrid' || storeMode === 'manual';
		let chainStart: Date;
		if (hijriRange) {
			if (chainCarriesState) {
				// Generation replays the smoothing chain from the start of the
				// selected non-Gregorian year (1 Muharram for Lunar Hijri,
				// 1 Farvardin for Solar Hijri/Persian); replay from the same
				// start so the seconds match.
				const span = getCalendarYearSpan(
					calendar_type,
					new Date(),
					resolveHijriVariant(HijraLocale?.calenderType)
				);
				chainStart = span ? new Date(span.start) : new Date(monthStart.getTime() - 864e5);
			} else {
				chainStart = new Date(monthStart.getTime() - 864e5); // previous day's seed
			}
		} else {
			chainStart = chainCarriesState
				? new Date(Date.UTC(new Date().getFullYear(), 0, 1)) // Jan 1 of the displayed year
				: new Date(monthStart.getTime() - 864e5); // previous month's last day
		}

		const computedDays: { date: Date; raw: any; times: any; criteria: any; pinnedKeys?: string[] }[] = [];
		try {
			// One continuous loop from the chain start to the end of the
			// displayed month; the output filter below keeps only the month days.
			// Uses a single shared PrayTimes instance (configured once) so the
			// whole loop is fast — same math as the per-day path.
			const computeDay = createDayTimesComputer(settingsPrayer);
			const cursor = new Date(chainStart.getTime());
			while (cursor < monthEnd) {
				const date = new Date(cursor.getTime());
				const r = computeDay(date, wpOffset);
				computedDays.push({ date, raw: r.raw, times: r.times, criteria: r.criteria, pinnedKeys: r.pinnedKeys });
				cursor.setUTCDate(cursor.getUTCDate() + 1);
			}
		} catch {
			// Never let a tooltip computation break the calendar.
			return;
		}

		// Same smoothing pass generation uses — same store config, same cap, same
		// chain start — so the tooltip seconds always match what was generated.
		const smoothed = smoothDayTimes(computedDays);
		const map: Record<string, DaySeconds> = {};
		const startMs = monthStart.getTime();
		const endMs = monthEnd.getTime();

		// computedDays[i] → smoothed[i] are 1:1 in the same order (smoothing
		// never adds/removes days). The pre-smoothing raw on computedDays is the
		// "natural" (astronomical) time — when smoothing changed a cell the two
		// differ, and the tooltip shows before → after.
		smoothed.forEach((day, index) => {
			// Only include days inside the displayed month (the chain may have
			// started earlier — the generation start, or the seed day).
			const t = day.date.getTime();
			if (t < startMs || t >= endMs) return;

			const dateKey = day.date.toISOString().slice(0, 10);
			const entry: DaySeconds = {};
			const naturalRaw = computedDays[index]?.raw || {};
			Object.keys(day.raw).forEach((key: string) => {
				const exact = day.raw[key];
				if (typeof exact === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(exact)) {
					const minute = day.times[key];
					const natural = naturalRaw[key];
					entry[key] = {
						exact,
						// day.times[key] is the derived 'HH:MM' that generation
						// stored; fall back to the raw floor minute if missing.
						minute:
							typeof minute === 'string' && /^\d{2}:\d{2}$/.test(minute)
								? minute
								: exact.slice(0, 5),
						// Only surface the unsmoothed seconds when smoothing
						// actually changed this cell (differs from the exact).
						natural:
							typeof natural === 'string' && natural !== exact
								? natural
								: undefined,
					};
				}
			});
			map[dateKey] = entry;
		});

		secondsCache.set(cacheKey, map);
		if (secondsCache.size > SECONDS_CACHE_MAX) {
			const oldest = secondsCache.keys().next().value;
			if (oldest !== undefined) secondsCache.delete(oldest);
		}
		setSecondsMap(map);
	}, [month?.method, MonthList, TimeTableMonthFullYear, settingsPrayer, calendar_type]);

	return secondsMap;
};
