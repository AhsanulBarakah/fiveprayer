/**
 * Hijri calendar utilities.
 *
 * Converts between Gregorian and Hijri dates using the browser's built-in
 * `Intl.DateTimeFormat` with Islamic calendars ('islamic-umalqura' — Umm
 * al-Qura, used by most Islamic countries — and 'islamic-civil'). The same
 * variants the Hijra display settings already use, so generated Hijri years
 * always match the Hijri Date column shown on the timetable.
 *
 * The plugin's timetable is stored and displayed with GREGORIAN dates; the
 * Calendar Type setting only decides WHICH span of days gets generated:
 *  - 'gregorian' — the current Gregorian year (Jan 1 → Dec 31) plus the
 *    usual 3 extra months.
 *  - 'hijri' — the current Hijri year (1 Muharram → 29/30 Dhu al-Hijjah)
 *    plus the same 3 extra months, converted to its Gregorian span so the
 *    engine computes every day of that Hijri year.
 *
 * @module utils/hijriCalendar
 */

/** Calendar variants supported by the Hijra display settings. */
export type HijriVariant = 'islamic-umalqura' | 'islamic-civil';

/** Fallback used when no Hijra calendar type has been configured. */
export const DEFAULT_HIJRI_VARIANT: HijriVariant = 'islamic-umalqura';

export interface HijriParts {
	year: number;
	month: number; // 1 = Muharram … 12 = Dhu al-Hijjah
	day: number;
}

/** Number of extra months generated beyond the full year (mirrors Gregorian). */
export const EXTRA_MONTHS = 3;

/**
 * Hijri month names (index 0 = Muharram). Used only for labels/validation —
 * the timetable itself stays Gregorian.
 */
export const HIJRI_MONTH_NAMES = [
	'Muharram',
	'Safar',
	"Rabi' al-awwal",
	"Rabi' al-thani",
	'Jumada al-awwal',
	'Jumada al-thani',
	'Rajab',
	"Sha'ban",
	'Ramadan',
	'Shawwal',
	"Dhu al-Qi'dah",
	'Dhu al-Hijjah',
];

/**
 * Persian (Solar Hijri) month names (index 0 = Farvardin). The Persian year
 * is solar (365/366 days, Nowruz ≈ 21 March), so its date names stay aligned
 * with the seasons — prayer times on a given Persian date are the same as the
 * same-season Gregorian date.
 */
export const PERSIAN_MONTH_NAMES = [
	'Farvardin',
	'Ordibehesht',
	'Khordad',
	'Tir',
	'Mordad',
	'Shahrivar',
	'Mehr',
	'Aban',
	'Azar',
	'Dey',
	'Bahman',
	'Esfand',
];

/**
 * Resolve the Hijri variant to use for generation: whatever is selected in
 * the Hijra display settings (Umm al-Qura or Civil), falling back to Umm
 * al-Qura when nothing is configured. The caller reads the store and passes
 * the raw `calenderType` string here, keeping this module store-free.
 */
export const resolveHijriVariant = (calenderType?: string): HijriVariant =>
	calenderType === 'islamic-civil' ? 'islamic-civil' : DEFAULT_HIJRI_VARIANT;

/**
 * The calendar type actually in force for generation/display.
 *
 * The "Calendar Type" Feature Switch is a master toggle: when it is OFF the
 * card is hidden AND the stored choice is ignored — generation and the month
 * dropdown behave exactly as if 'gregorian' were selected (the plain engine
 * default), so a turned-off feature can never keep changing which days get
 * generated.
 */
export const getEffectiveCalendarType = (
	calendarType: string | undefined,
	featureToggles?: Record<string, boolean> | null
): string =>
	featureToggles?.['Calendar_Type'] === false ? 'gregorian' : calendarType || 'gregorian';

/**
 * Format a Gregorian date as Hijri parts (year, month, day) using the given
 * calendar variant. Returns null when Intl cannot resolve the calendar
 * (e.g. very old browsers without Islamic calendar support).
 */
export const gregorianToHijri = (
	date: Date,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): HijriParts | null => {
	try {
		const parts = new Intl.DateTimeFormat(`en-US-u-ca-${variant}`, {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
		}).formatToParts(date);

		const get = (type: string): number => {
			const p = parts.find((part) => part.type === type);
			return p ? parseInt(p.value, 10) : NaN;
		};

		const year = get('year');
		const month = get('month');
		const day = get('day');
		if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
			return null;
		}
		return { year, month, day };
	} catch {
		return null;
	}
};

/**
 * The Hijri year that contains a Gregorian date, or null when conversion is
 * unavailable.
 */
export const hijriYearOf = (
	date: Date,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): number | null => {
	const parts = gregorianToHijri(date, variant);
	return parts ? parts.year : null;
};

/**
 * The Hijri month (1-12) that contains a Gregorian date, or null.
 */
export const hijriMonthOf = (
	date: Date,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): number | null => {
	const parts = gregorianToHijri(date, variant);
	return parts ? parts.month : null;
};

/**
 * Find the Gregorian date of a specific Hijri date (year/month/day) by
 * scanning Gregorian dates near the estimate. A Hijri year is ~354 days, so a
 * scan window of ±2 Gregorian years around the linear estimate is always
 * enough. Returns null if no match is found (Intl unavailable).
 */
export const hijriToGregorian = (
	year: number,
	month: number,
	day: number,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): Date | null => {
	// Rough Gregorian estimate: Hijri year 1 ≈ 622 CE, ~354.37 days per year.
	// The linear estimate drifts up to ~6 months from the real calendar by
	// modern Hijri years (lunar years fall ~11 days earlier each solar year),
	// so the scan window must be wide enough to cover Dhu al-Hijjah of the
	// target year — not just Muharram. estYear−2 … estYear+3 is always enough.
	const estYear = Math.floor(622 + ((year - 1) * 354.367) / 365.25);
	const start = new Date(Date.UTC(estYear - 2, 0, 1));
	const end = new Date(Date.UTC(estYear + 3, 0, 1));

	let cursor = new Date(start.getTime());
	while (cursor < end) {
		const parts = gregorianToHijri(cursor, variant);
		if (parts && parts.year === year && parts.month === month && parts.day === day) {
			return cursor;
		}
		cursor = new Date(cursor.getTime() + 864e5);
	}
	return null;
};

export interface HijriYearSpan {
	/** Gregorian date of 1 Muharram of the current Hijri year (UTC midnight). */
	start: Date;
	/** Gregorian date of the first day AFTER the generated span (UTC midnight). */
	end: Date;
	/** The Hijri year being generated (e.g. 1448). */
	hijriYear: number;
}

/**
 * The Gregorian span covering the Hijri year that contains `today`, plus
 * EXTRA_MONTHS of the following Hijri year (mirroring the Gregorian
 * generation which also adds 3 extra months). `end` is exclusive, matching the
 * `while (start < end)` loop in useGenerateCalender.
 *
 * Returns null when Intl cannot convert dates in this browser.
 */
export const getHijriYearSpan = (
	today: Date,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): HijriYearSpan | null => {
	const currentHijriYear = hijriYearOf(today, variant);
	if (!currentHijriYear) return null;

	const muharram1 = hijriToGregorian(currentHijriYear, 1, 1, variant);
	if (!muharram1) return null;

	// Full Hijri year runs until the last day of Dhu al-Hijjah — i.e. the day
	// before 1 Muharram of the NEXT Hijri year. Then add EXTRA_MONTHS more:
	// 1 Muharram of year+1, + 3 Hijri months → 1 Rabi' al-thani of year+1.
	const nextMuharram = hijriToGregorian(currentHijriYear + 1, 1, 1, variant);
	if (!nextMuharram) return null;

	// End of the full Hijri year (exclusive) = 1 Muharram of the next year.
	// Add 3 extra months: walk forward from nextMuharram until the Hijri month
	// equals 4 (Rabi' al-thani) — that date is the exclusive end of the span.
	let end = new Date(nextMuharram.getTime());
	const limit = new Date(end.getTime() + 400 * 864e5);
	while (end < limit) {
		const parts = gregorianToHijri(end, variant);
		if (parts && parts.year === currentHijriYear + 1 && parts.month === 1 + EXTRA_MONTHS && parts.day === 1) {
			break;
		}
		end = new Date(end.getTime() + 864e5);
	}

	return { start: muharram1, end, hijriYear: currentHijriYear };
};

/**
 * Format a Gregorian date as a readable Hijri date string (e.g.
 * "1 Muharram 1448 AH") for the settings panel preview. Returns an empty
 * string when conversion is unavailable.
 */
export const formatHijriDate = (
	date: Date,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): string => {
	const parts = gregorianToHijri(date, variant);
	if (!parts) return '';
	const monthName = HIJRI_MONTH_NAMES[parts.month - 1];
	if (!monthName) return '';
	return `${parts.day} ${monthName} ${parts.year} AH`;
};

// ---------------------- Persian (Solar Hijri) calendar ----------------------

/** Convert a Gregorian date to Persian (Solar Hijri) parts via Intl. */
export const gregorianToPersian = (date: Date): HijriParts | null => {
	try {
		const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
		}).formatToParts(date);

		const get = (type: string): number => {
			const p = parts.find((part) => part.type === type);
			return p ? parseInt(p.value, 10) : NaN;
		};

		const year = get('year');
		const month = get('month');
		const day = get('day');
		if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
			return null;
		}
		return { year, month, day };
	} catch {
		return null;
	}
};

/** The Persian (Solar Hijri) year that contains a Gregorian date, or null. */
export const persianYearOf = (date: Date): number | null => {
	const parts = gregorianToPersian(date);
	return parts ? parts.year : null;
};

/**
 * Find the Gregorian date of a specific Persian date (year/month/day) by
 * scanning Gregorian dates near the estimate. The Persian calendar is solar,
 * so its year stays aligned with the Gregorian year (Nowruz ≈ 21 March) and a
 * ±2 year scan window is always sufficient. Returns null if no match found.
 */
export const persianToGregorian = (
	year: number,
	month: number,
	day: number
): Date | null => {
	// Persian epoch: year 1 ≈ 622 CE (Hegira solar). Solar year ≈ 365.2422 days.
	const estYear = Math.floor(622 + ((year - 1) * 365.2422) / 365.25);
	const start = new Date(Date.UTC(estYear - 2, 0, 1));
	const end = new Date(Date.UTC(estYear + 2, 0, 1));

	let cursor = new Date(start.getTime());
	while (cursor < end) {
		const parts = gregorianToPersian(cursor);
		if (parts && parts.year === year && parts.month === month && parts.day === day) {
			return cursor;
		}
		cursor = new Date(cursor.getTime() + 864e5);
	}
	return null;
};

export interface PersianYearSpan {
	/** Gregorian date of 1 Farvardin of the current Persian year (UTC midnight). */
	start: Date;
	/** Gregorian date of the first day AFTER the generated span (UTC midnight). */
	end: Date;
	/** The Persian year being generated (e.g. 1405). */
	persianYear: number;
}

/**
 * The Gregorian span covering the Persian year that contains `today`, plus
 * EXTRA_MONTHS of the following Persian year (1 Farvardin → 1 Tir of year+1,
 * exclusive) — mirroring the Gregorian/Hijri generation which also adds 3
 * extra months. Returns null when Intl cannot convert dates in this browser.
 */
export const getPersianYearSpan = (today: Date): PersianYearSpan | null => {
	const persianYear = persianYearOf(today);
	if (!persianYear) return null;

	const farvardin1 = persianToGregorian(persianYear, 1, 1);
	if (!farvardin1) return null;

	// Full Persian year runs until the day before 1 Farvardin of the NEXT
	// year; then add EXTRA_MONTHS more → 1 Tir (month 4) of year+1 (exclusive).
	const end = persianToGregorian(persianYear + 1, 1 + EXTRA_MONTHS, 1);
	if (!end) return null;

	return { start: farvardin1, end, persianYear };
};

/**
 * Format a Gregorian date as a readable Persian date string (e.g.
 * "1 Farvardin 1405 AP") for the settings panel preview. Returns an empty
 * string when conversion is unavailable.
 */
export const formatPersianDate = (date: Date): string => {
	const parts = gregorianToPersian(date);
	if (!parts) return '';
	const monthName = PERSIAN_MONTH_NAMES[parts.month - 1];
	if (!monthName) return '';
	return `${parts.day} ${monthName} ${parts.year} AP`;
};

// ------------------- Unified calendar-year span resolver -------------------

export interface CalendarYearSpan {
	/** Gregorian date of the first generated day (UTC midnight). */
	start: Date;
	/** Gregorian date of the first day AFTER the generated span (UTC midnight). */
	end: Date;
	/** Human label of the generated year (e.g. "Lunar Hijri 1448 AH"). */
	label: string;
}

/**
 * Resolve the generated span for the selected Calendar Type:
 *  - 'hijri'    → Lunar Hijri (Islamic) year + 3 months (via Hijri variant)
 *  - 'persian'  → Solar Hijri (Persian) year + 3 months
 *  - anything else (e.g. 'gregorian') → null (caller uses the Gregorian year)
 */
export const getCalendarYearSpan = (
	calendarType: string | undefined,
	today: Date,
	variant: HijriVariant = DEFAULT_HIJRI_VARIANT
): CalendarYearSpan | null => {
	if (calendarType === 'hijri') {
		const span = getHijriYearSpan(today, variant);
		return span ? { start: span.start, end: span.end, label: `Lunar Hijri ${span.hijriYear} AH` } : null;
	}
	if (calendarType === 'persian') {
		const span = getPersianYearSpan(today);
		return span ? { start: span.start, end: span.end, label: `Solar Hijri ${span.persianYear} AP` } : null;
	}
	return null;
};

/**
 * Resolve which month entry is currently selected for display, shared by the
 * calendar view and the tooltip-seconds hook so both always agree:
 *
 *  1. Exact match on the stored selection's `method` key.
 *  2. Hijri Calendar Type mode — the dropdown lists GREGORIAN months with
 *     year labels covering the Hijri-generated span (keys like `g-2027-2`);
 *     fall back to the entry containing today, or the first entry when today
 *     falls outside the generated span.
 *  3. Gregorian mode — fall back to the current Gregorian month.
 *
 * Returns null only when the list is empty.
 */
export const resolveDisplayMonth = (
	month: { method?: string } | null | undefined,
	monthList: { name: string; method: string; start?: string; end?: string }[],
	calendarType?: string,
	today: Date = new Date()
): { name: string; method: string; start?: string; end?: string } | null => {
	const exact = monthList.find((d) => String(d.method) === String(month?.method));
	if (exact) return exact;

	// Span-mode entries (Hijri/Persian Calendar Type with 'span' display)
	// carry their own Gregorian start/end range (keys like `g-2027-2`); the
	// fallback is the entry containing today, or the first entry when today
	// falls outside the generated span. Plain Gregorian month lists (fixed-12
	// display, or Gregorian Calendar Type) have no ranges and fall through to
	// the current-Gregorian-month match below.
	const hasRanges = monthList.some((d) => d.start && d.end);
	if ((calendarType === 'hijri' || calendarType === 'persian') && hasRanges) {
		const t = today.getTime();
		const containing = monthList.find(
			(d) =>
				d.start &&
				d.end &&
				t >= new Date(d.start).getTime() &&
				t < new Date(d.end).getTime()
		);
		if (containing) return containing;
		// Today outside the generated span (e.g. viewing next year's table) —
		// default to the first available month rather than an empty view.
		return monthList.length ? monthList[0] : null;
	}

	const currentMonth = today.getMonth() + 1;
	return (
		monthList.find((d) => /^\d+$/.test(d.method) && Number(d.method) === currentMonth) ||
		null
	);
};