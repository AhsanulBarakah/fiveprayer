/**
 * Generate Calendar Hook
 *
 * Core calendar generation logic. Uses the PrayTimes.js library to calculate
 * prayer times for every day of the current year based on the user's location
 * and settings. Generates data for the full year plus 3 extra months.
 *
 * @module useGenerateCalender
 */
import { toast } from 'sonner';
import { useTimes } from './useTimes';
import { useClickGenerate } from './useClickGenerate';
import { useCalenderSettings } from './useCalenderSettings';
import { useCustomPrayerTimeSchedulesStore, getMatchingSchedule, type CustomPrayerTimeSchedule } from '../state/useCustomPrayerTimeSchedulesStore';
import { useLocationStore } from '../state/storeLocation';
import { useTimeTableMonth } from '../state/storeTimeTable';
import { createDayTimesComputer, getWordpressTimezoneOffset, applyIqamahAdjustment } from '../utils/computeDayTimes';
import { normalizeUnifiedParams, getIqamahAdjustMinutes } from '../utils/seasonalMethod';
import { smoothDayTimes } from '../utils/smoothDayTimes';
import { getCalendarYearSpan, resolveHijriVariant, getEffectiveCalendarType } from '../utils/hijriCalendar';
import { __ } from '@wordpress/i18n';

/** Iqamah column per prayer, in the same shape an Advanced Schedule sets them. */
const SCHEDULE_IQAMAH_COLUMNS: Array< [ prayer: string, column: string ] > = [
	[ 'fajr', 'fajr_iqamah' ],
	[ 'dhuhr', 'dhuhr_iqamah' ],
	[ 'asr', 'asr_iqamah' ],
	[ 'maghrib', 'maghrib_iqamah' ],
	[ 'isha', 'isha_iqamah' ],
];

/**
 * Which Iqamah columns an Advanced Schedule actually controls on a given date.
 * Mirrors the precedence in `timePrayer`: a schedule only replaces an Iqamah
 * when its master has at least one enabled prayer time AND either a per-date
 * override or the prayer's Iqamah flag + value is set. Those columns are then
 * excluded from the Unified Method uniform adjustment, so the two controls can
 * never stack on the same Iqamah.
 */
export const getScheduleControlledIqamahColumns = (
	schedule: CustomPrayerTimeSchedule,
	date: Date
): string[] => {
	const flags = schedule.prayerTimeEnabledFlags || {};
	const hasEnabledPrayerTimes =
		flags.isFajrEnabled || flags.isFajrIqamahEnabled ||
		flags.isDhuhrEnabled || flags.isDhuhrIqamahEnabled ||
		flags.isAsrEnabled || flags.isAsrIqamahEnabled ||
		flags.isMaghribEnabled || flags.isMaghribIqamahEnabled ||
		flags.isIshaEnabled || flags.isIshaIqamahEnabled;
	if ( ! hasEnabledPrayerTimes ) return [];

	const dateKey = date.toISOString().split( 'T' )[ 0 ];
	const overrides: Record< string, string > =
		( schedule.dateOverrides && schedule.dateOverrides[ dateKey ] ) || {};
	const times: Record< string, string > = ( schedule.prayerTimes || {} ) as any;

	return SCHEDULE_IQAMAH_COLUMNS.filter( ( [ prayer, column ] ) => {
		const key = `${ prayer }Iqamah`;
		const cap = prayer.charAt( 0 ).toUpperCase() + prayer.slice( 1 );
		const override = overrides[ key ];
		const flagged = !! ( flags as any )[ `is${ cap }IqamahEnabled` ] && !! times[ key ];
		return !! override || flagged;
	} ).map( ( [ , column ] ) => column );
};

export const useGenerateCalender = () => {
	const { appendDataGenerate } = useClickGenerate();
	const { timePrayer } = useTimes();
	const DataTable: object[] = [];
	// Prepare the settings closure at the hook level — computeDayTimes is a
	// plain utility and must not call hooks itself.
	const { settingsPrayer } = useCalenderSettings();
	// Calendar Type — 'gregorian' (default) generates the current Gregorian
	// year; 'hijri' generates the current Hijri year span (1 Muharram → Dhu
	// al-Hijjah). The stored timetable stays Gregorian in both cases.
	const calendar_type = useLocationStore((state) => state.calendar_type);
	const feature_toggles = useLocationStore((state) => state.feature_toggles);
	const HijraLocale = useTimeTableMonth((state) => state.HijraLocale);
	// "Calendar Type" feature OFF ignores the stored choice and always
	// generates the plain Gregorian year (the engine default) — a hidden card
	// must not keep changing which days get generated.
	const effectiveCalendarType = getEffectiveCalendarType(calendar_type, feature_toggles);

	/** Preserve custom schedule state during generation */
	const { customSchedules, isCustomSchedulesEnabled } = useCustomPrayerTimeSchedulesStore();

	/**
	 * Generate prayer times for every day of the current year + 3 months.
	 * Uses WordPress timezone for date calculations to ensure consistency.
	 *
	 * When the Unified Method has seasonal switching enabled (seasonMode:
	 * 'auto'), the winter/summer profile active on each date is applied, so a
	 * single full-year generation automatically produces the correct timetable
	 * for both seasons (e.g. London mosques switch from 18°/17° in winter to
	 * time-based summer criteria without any manual step).
	 */
	const GenerateCalender = async () => {
		const wordpressTimezoneOffset = getWordpressTimezoneOffset();

		const now = new Date();
		const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
		const wpTime = new Date(utc + (3600000 * wordpressTimezoneOffset));

		const currentyear = wpTime.getFullYear();

		// Start/end (end exclusive) of the span to generate. Default: the
		// current Gregorian year + 3 extra months (Jan 1 → Apr 1 next year).
		// When Calendar Type = Persian (Solar Hijri) or Hijri (Lunar Hijri), the
		// span instead covers the current Persian/Hijri year + 3 extra months,
		// converted to its Gregorian dates, so a full non-Gregorian year gets
		// generated (e.g. 1 Muharram → Dhu al-Hijjah).
		let startUtc: Date;
		let endUtc: Date;

		const yearSpan =
			effectiveCalendarType === 'hijri' || effectiveCalendarType === 'persian'
				? getCalendarYearSpan(effectiveCalendarType, wpTime, resolveHijriVariant(HijraLocale?.calenderType))
				: null;

		if (yearSpan) {
			startUtc = yearSpan.start;
			endUtc = yearSpan.end;
		} else {
			startUtc = new Date(Date.UTC(currentyear, 0, 1));
			endUtc = new Date(Date.UTC(currentyear + 1, 3, 1));
		}

		// The user picked a non-Gregorian year but the browser could not
		// convert dates (no Intl Persian/Islamic calendar support) — generation
		// silently fell back to the Gregorian year above. Warn so the result is
		// not a confusing "identical Gregorian table" with no explanation.
		if ((effectiveCalendarType === 'hijri' || effectiveCalendarType === 'persian') && !yearSpan) {
			toast.warning(
				`${calendar_type === 'hijri' ? 'Hijri' : 'Persian'} year conversion is unavailable in this browser — generated the Gregorian year instead.`
			);
		}

		let startDate = new Date(startUtc.getTime() + (wordpressTimezoneOffset * 60 * 60 * 1000));
		const wpEndDate = new Date(endUtc.getTime() + (wordpressTimezoneOffset * 60 * 60 * 1000));

		try {
			// Pass 1 — compute every day (same store settings, same seasonal
			// (winter/summer/monthly) switching, same engine configuration as
			// the calendar's hover-tooltip seconds). One shared PrayTimes
			// instance is configured once and reused for the whole loop.
			const computeDay = createDayTimesComputer(settingsPrayer);
			const computedDays = [];
			while (startDate < wpEndDate) {
				const dateForCalculation = new Date(startDate.getTime());
				const { times, raw, criteria, pinnedKeys, jamaah } = computeDay(dateForCalculation, wordpressTimezoneOffset);
				computedDays.push({ date: dateForCalculation, raw, times, criteria, pinnedKeys, jamaah });
				startDate.setDate(startDate.getDate() + 1);
			}

			// Pass 2 — day-to-day smoothing: cap how much each Begins time may
			// change between consecutive days (e.g. max 90s per day), then
			// re-derive the rounded minutes. Sequential, so the chain carries
			// across the whole year. Uses the same utility as the tooltip hook,
			// keeping stored minutes and hover seconds in sync.
			const smoothedDays = smoothDayTimes(computedDays);
			// Uniform Iqamah adjustment (Unified Method → chart/import): one signed
			// number of minutes added to EVERY Iqamah time, imported Jamā'ah or
			// computed alike. Resolved once — it is the same for all days.
			const unifiedParams = normalizeUnifiedParams(
				(useLocationStore.getState().methodsForCalculation || []).find(
					(m: any) => String(m.method || '').toLowerCase() === 'unified_method'
				)?.params
			);
			const iqamahAdjust = getIqamahAdjustMinutes(unifiedParams);
			for (const day of smoothedDays) {
				// The imported printed Jamā'ah times are passed into timePrayer as the
				// Iqamah base. A matching Advanced Schedule override still wins over
				// them, so schedules can control the times of the imported timetable.
				await timePrayer(day.times as any, day.date, day.jamaah);
				// Shift every Iqamah (imported or computed) by the configured minutes
				// BEFORE storing, so the calendar, the printed timetable and the
				// frontend all show the adjusted values. Runs after the Jamā'ah
				// overwrite so imported days are adjusted too.
				if (iqamahAdjust !== 0) {
					// Advanced Schedules and the uniform adjustment are mutually
					// exclusive per prayer: any Iqamah a schedule sets for this date is
					// skipped here, so the schedule value is never shifted on top of
					// itself. Days with no matching schedule (or columns it leaves
					// alone) still receive the uniform adjustment.
					const matchingSchedule = isCustomSchedulesEnabled
						? getMatchingSchedule(day.date, customSchedules)
						: null;
					const scheduleColumns = matchingSchedule
						? getScheduleControlledIqamahColumns(matchingSchedule, day.date)
						: undefined;
					applyIqamahAdjustment(day.times as any, iqamahAdjust, scheduleColumns);
				}
				DataTable.push(day.times);
			}
		} catch (error) {
			// Surface failures instead of failing silently (previously the
			// generation just stopped with only the 'Settings saved' toast).
			console.error('Calendar generation failed:', error);
			toast.error(__('Calendar generation failed. Check your settings and try again.', 'fiveprayer'));
			return;
		}

		if (DataTable?.length) {
			appendDataGenerate(DataTable);
		}
	};

	return { GenerateCalender };
};
