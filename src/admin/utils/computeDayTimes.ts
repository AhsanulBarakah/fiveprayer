/**
 * Shared per-date prayer time computation.
 *
 * Mirrors exactly what `useGenerateCalender` does for a single day (same
 * store settings, same seasonal switching, same `PrayTime` configuration), so
 * the React calendar can recompute the *exact* time — including seconds — for
 * the hover tooltips. The stored timetable only keeps minute precision
 * (MySQL TIME columns), so the rounded minute is derived here too and the
 * tooltip seconds come from the unrounded computation.
 *
 * NOTE: this is a plain utility (NOT a hook) — it must never call React hooks.
 * Callers prepare `settingsPrayer` at the top of their component/hook and pass
 * it in, so this function is safe to call from loops, effects and utilities.
 *
 * @module utils/computeDayTimes
 */
import PrayTimes from '../libs/PrayTimes.js';
import { useLocationStore } from '../state/storeLocation';
import {
	normalizeUnifiedParams,
	getSeasonalAdjustForDate,
	getCriteriaProfileForDate,
	getChartTimesForDate,
	getChartJamaahForDate,
} from './seasonalMethod';

/** Exact times with seconds, e.g. { fajr: '04:36:24', dhuhr: '13:05:41' } */
export type RawDayTimes = Record<string, string>;

/**
 * A single prayer time for the hover tooltip: the exact unrounded time with
 * seconds (`exact`, shown in the tooltip) and the rounded minute the calendar
 * actually displays (`minute`). The stored cells only keep minute precision,
 * so the match check must compare against the rounded minute — comparing
 * against the raw seconds' floor minute would wrongly hide tooltips for every
 * time that rounded up (e.g. 04:35:52 → stored 04:36).
 */
export interface SecondsEntry {
  /** Exact computed time with seconds, e.g. '04:35:52'. */
  exact: string;
  /** The rounded minute that generation stored, e.g. '04:36'. */
  minute: string;
  /**
   * The exact UNsMOOTHED (astronomical) seconds when day-to-day smoothing
   * changed this cell — e.g. exact '04:39:33' with natural '04:39:52'. Only
   * present when the two differ, so the tooltip can show before → after.
   */
  natural?: string;
}

export type DaySeconds = Record<string, SecondsEntry>;

export interface ComputedDayTimes {
	/** The same formatted times the generation stores (e.g. fajr: '04:36'). */
	times: Record<string, string>;
	/** Exact unrounded times with seconds ('HH:MM:SS'), used by the tooltip. */
	raw: RawDayTimes;
	/**
	 * The seasonal criteria (fajr/isha/maghrib values) that were active for
	 * this date — what `getSeasonalAdjustForDate` returned, or null when no
	 * per-date criteria applied (manual mode / feature disabled). Smoothing
	 * uses this to detect when the criteria change between two consecutive
	 * days (monthly curve step, winter/summer switch) so it can reset its
	 * chain instead of clamping across an intentional step.
	 */
	criteria: Record<string, any> | null;
	/**
	 * Prayers whose exact minute was pinned by the Unified Method's per-day
	 * chart (absolute published times, e.g. Fajr). Pinned times bypass the
	 * engine's rounding and the day-to-day smoothing cap — the published value
	 * is final. Chart overrides set the seconds to :00 (charts are printed to
	 * the minute), so the hover tooltip shows e.g. '04:38:00'.
	 */
	pinnedKeys?: string[];
	/**
	 * Imported printed Jamā'ah (congregation) times for this date, mapped to
	 * the calendar's Iqamah column names ({ fajr_iqamah: '06:46', … }). Only
	 * present while Unified Method chart mode + the Jamā'ah import are on and
	 * the date has entries. Generation writes these straight into the row's
	 * Iqamah columns (replacing begins+delay), so the congregation times match
	 * the published table exactly.
	 */
	jamaah?: Record<string, string>;
}

/**
 * Apply the configured rounding (method + seconds threshold) to an exact
 * 'HH:MM:SS' string, producing the stored minute string ('HH:MM').
 * Mirrors PrayTimes.roundTime for the nearest/up/down/none modes.
 */
export const roundToMinute = (
	hhmmss: string,
	rounding: string,
	threshold: number
): string => {
	const [hh, mm, ss] = hhmmss.split(':').map(Number);
	if (rounding === 'none') return `${hh}:${mm}`;
	if (rounding === 'up') {
		if (ss > 0) {
			const d = new Date(2000, 0, 1, hh, mm + 1);
			return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
		}
		return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	}
	if (rounding === 'down') return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
	// nearest — round up once the seconds reach the threshold (default 30)
	if (ss >= threshold) {
		const d = new Date(2000, 0, 1, hh, mm + 1);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}
	return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

/**
 * A per-date compute function produced by `createDayTimesComputer` — reuses a
 * single PrayTimes instance + one settings application across a whole month /
 * year loop instead of constructing and re-configuring the engine per day.
 */
export type DayTimesComputer = (
	date: Date,
	wordpressTimezoneOffset: number
) => ComputedDayTimes;

/**
 * Build a fast per-date computer for a loop (calendar generation, tooltip
 * seconds). The engine instance and its base configuration are prepared ONCE;
 * each day only re-applies the (cheap) per-date seasonal adjustment. The base
 * settings are snapshotted and restored before every day so a seasonal value
 * from one day can never leak into the next (e.g. a monthly-curve blank cell).
 */
export const createDayTimesComputer = (
	settingsPrayer: (prayerTime: any) => void
): DayTimesComputer => {
	const prayerTime = new PrayTimes();
	settingsPrayer(prayerTime);
	const baseSettings = JSON.parse(JSON.stringify(prayerTime.settings));
	return (date, wordpressTimezoneOffset) =>
		computeDayTimes(date, wordpressTimezoneOffset, settingsPrayer, {
			prayerTime,
			baseSettings,
		});
};

/**
 * Compute the prayer times for a single date using the current store settings.
 *
 * @param date - Local date (in the WordPress timezone) to compute times for.
 * @param wordpressTimezoneOffset - GMT offset in hours, as used at generation.
 * @param settingsPrayer - The prepared `settingsPrayer` function from
 *   `useCalenderSettings()`, obtained at the caller's component level.
 * @param shared - Optional shared engine from `createDayTimesComputer`; when
 *   present the engine is reused (base settings restored first) instead of
 *   constructing and re-configuring a new PrayTimes instance.
 */
export const computeDayTimes = (
	date: Date,
	wordpressTimezoneOffset: number,
	settingsPrayer: (prayerTime: any) => void,
	shared?: { prayerTime: any; baseSettings: any }
): ComputedDayTimes => {
	const { customLocationSelected, mfc } = useLocationStore.getState();
	const prayerTime = shared?.prayerTime ?? new PrayTimes();

	if (shared) {
		// Restore the base configuration so per-date seasonal adjustments
		// never leak into days where no seasonal criteria apply.
		Object.assign(prayerTime.settings, shared.baseSettings);
	} else {
		settingsPrayer(prayerTime);
	}

	// Unified Method seasonal (winter/summer/monthly curve) switching — same
	// per-date logic the generation loop applies. Returns null when not in
	// auto mode. When the "Enable Unified Method criteria" switch is OFF the
	// whole feature is bypassed (engine behaves like a standard method).
	const rawMethods = useLocationStore.getState().methodsForCalculation;
	const unifiedEntry = (Array.isArray(rawMethods) ? rawMethods : []).find(
		(m: any) => String(m.method || '').toLowerCase() === 'unified_method'
	);
	const unifiedParams = normalizeUnifiedParams(unifiedEntry?.params);
	// The Feature Switches "Unified Method" master switch — when OFF the whole
	// feature is bypassed no matter what the entry's own `enabled` flag says
	// (belt and braces on top of the loader forcing params.enabled=false).
	const unifiedFeatureOff =
		useLocationStore.getState().feature_toggles?.['Unified_Method_Settings'] === false;
	// The unified criteria must NEVER apply while another calculation method is
	// selected — the script must not "choose" for the user. Mirrors the
	// selected-method gate in useCalenderSettings (base params + margins).
	const rawMethodCode = String(
		(mfc as any)?.meta || (mfc as any)?.method || mfc?.name || ''
	).toLowerCase();
	const isUnifiedSelected =
		rawMethodCode === 'unified_method' || rawMethodCode === 'unified method';
	// "Prayer Calculation Methods" OFF ignores the method dropdown entirely
	// (engine forces MWL) — so the unified criteria can't apply either.
	const methodsFeatureOff =
		useLocationStore.getState().feature_toggles?.['Methods_For_Calculation'] === false;
	const unifiedActive =
		unifiedParams.enabled !== false &&
		!unifiedFeatureOff &&
		!methodsFeatureOff &&
		isUnifiedSelected;
	// getSeasonalAdjustForDate resolves the profile for this date: explicit
	// monthly curve, auto winter/summer window, keyless entries (no seasonMode)
	// using their own monthly cells or the default Hizbul Ulama curve — so an
	// edited monthly angle always reaches the calculation.
	const seasonalAdjust = unifiedActive
		? getSeasonalAdjustForDate(date, unifiedParams)
		: null;
	if (seasonalAdjust) prayerTime.adjust(seasonalAdjust);
	// The criteria actually in force for this date (may be null in manual mode
	// or when the Unified Method criteria are disabled). Exposed so the
	// smoothing pass can reset at intentional criteria switches. Uses the
	// stable profile token (month / season / chart), NOT the resolved value,
	// so a smoothly interpolated monthly curve never resets the chain daily.
	const profile = unifiedActive
		? getCriteriaProfileForDate(date, unifiedParams)
		: null;
	const criteria = profile ? { profile } : null;

	const location = [customLocationSelected.lat, customLocationSelected.lng];

	// Exact computation with NO rounding so seconds survive ('24hs' format).
	// The engine's own configured rounding (nearest/up/down/none + threshold)
	// is applied below to derive the stored minute strings.
	prayerTime.round('none');

	// Timezone handling: prefer the site's IANA timezone string (e.g.
	// 'Europe/London') with utcOffset 'auto' so Intl applies the correct
	// offset per date — GMT in winter, BST in summer. WordPress's
	// gmt_offset option is FROZEN at the value from when the timezone was
	// saved, so using it as a fixed offset is wrong for half the year in
	// DST zones (London: +1 frozen → winter times 1h late). Fall back to
	// the numeric offset only when no named zone is configured.
	prayerTime.location(location);
	const wpTimezone = (window as any).FivePrayerData?.wordpress_timezone;
	const timezoneString = wpTimezone?.timezone_string;
	if (timezoneString) {
		prayerTime.timezone(timezoneString);
		prayerTime.settings.utcOffset = 'auto';
	} else {
		prayerTime.utcOffset(wordpressTimezoneOffset);
	}
	prayerTime.format('24hs');
	const raw = prayerTime.times(date) as unknown as RawDayTimes;

	// Second 'Asr (2 Mithl / Hanafi) — the same morning/afternoon computation
	// with the two-mithl shadow factor, so the optional 'Asr 2 column has a
	// stored value even when no printed timetable was imported. Only the
	// Standard (one-mithl) schools need it: for a Hanafi main 'Asr the two
	// would be the same time, so the column stays empty there. An imported
	// chart value overrides it below — the published table always wins.
	const savedAsrMethod = prayerTime.settings.asr;
	if (String(savedAsrMethod || '').toLowerCase() !== 'hanafi') {
		prayerTime.settings.asr = 'Hanafi';
		const hanafiTimes = prayerTime.times(date) as unknown as RawDayTimes;
		prayerTime.settings.asr = savedAsrMethod;
		if (
			typeof hanafiTimes.asr === 'string' &&
			/^\d{2}:\d{2}:\d{2}$/.test(hanafiTimes.asr)
		) {
			raw.asr2 = hanafiTimes.asr;
		}
	}

	const { rounding, threshold } = getRoundingConfig();

	const times: Record<string, string> = {};
	Object.keys(raw).forEach((key) => {
		const value = raw[key];
		if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
			times[key] = roundToMinute(value, rounding, threshold);
		} else {
			times[key] = value;
		}
	});

	// Chart mode (seasonMode 'chart') — the published per-day Fajr/Isha times
	// are absolute and final: they override the computed value, set seconds to
	// :00 and are excluded from smoothing + rounding downstream.
	const chartTimes =
		unifiedParams.enabled === false
			? null
			: getChartTimesForDate(date, unifiedParams);
	const pinnedKeys: string[] = [];
	if (chartTimes) {
		Object.entries(chartTimes).forEach(([key, hhmm]) => {
			if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return;
			const hh = String(hhmm.split(':')[0]).padStart(2, '0');
			const mm = String(hhmm.split(':')[1]).padStart(2, '0');
			const full = `${hh}:${mm}:00`;
			raw[key] = full;
			times[key] = `${hh}:${mm}`;
			pinnedKeys.push(key);
		});
	}

	// Imported Jamā'ah (congregation) times — the printed Iqamah values. They
	// do not affect the Begins pipeline (smoothing/rounding) at all; generation
	// writes them straight into the row's Iqamah columns after timePrayer.
	const jamaahTimes =
		unifiedParams.enabled === false
			? null
			: getChartJamaahForDate(date, unifiedParams);
	const jamaah: Record<string, string> = {};
	if (jamaahTimes) {
		const COLUMN_MAP: Record<string, string> = {
			fajr: 'fajr_iqamah',
			dhuhr: 'dhuhr_iqamah',
			asr: 'asr_iqamah',
			maghrib: 'maghrib_iqamah',
			isha: 'isha_iqamah',
		};
		Object.entries(jamaahTimes).forEach(([key, hhmm]) => {
			if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return;
			const column = COLUMN_MAP[key];
			if (!column) return;
			const hh = String(hhmm.split(':')[0]).padStart(2, '0');
			const mm = String(hhmm.split(':')[1]).padStart(2, '0');
			jamaah[column] = `${hh}:${mm}`;
		});
	}

	return { times, raw, criteria, pinnedKeys, jamaah };
};

/**
 * WordPress timezone GMT offset in hours (defaults to 0 when unavailable) —
 * the same value generation uses to align dates and format times.
 */
export const getWordpressTimezoneOffset = (): number => {
	const wpTimezone = (window as any).FivePrayerData?.wordpress_timezone;
	return wpTimezone?.gmt_offset || 0;
};

/**
 * Current rounding configuration from the store (method + seconds threshold),
 * shared by computeDayTimes and the day-to-day smoothing pass so both re-round
 * smoothed seconds identically.
 *
 * When the custom-rounding toggle is off, this falls back to the standard
 * nearest@30 rounding (the plain engine behavior).
 */
export const getRoundingConfig = (): {
	rounding: string;
	threshold: number;
} => {
	const store = useLocationStore.getState();
	// Per-feature rounding toggle OFF means standard nearest@30 (the plain
	// engine behavior). Checks BOTH the inner "Enable custom rounding" flag
	// AND the Feature Switches "Rounding Method" master switch — a turned-off
	// feature must never be applied anywhere in the pipeline (generation and
	// the smoothing re-derivation both read this).
	if (
		store.roundingEnabled === false ||
		store.feature_toggles?.['Rounding_Method'] === false
	) {
		return { rounding: 'nearest', threshold: 30 };
	}
	const rounding_selected = store.rounding_selected;
	return {
		rounding: rounding_selected?.method || 'nearest',
		threshold: rounding_selected?.threshold ?? 30,
	};
};

/** The calendar columns a uniform Iqamah adjustment shifts. */
export const IQAMAH_COLUMNS = [
	'fajr_iqamah',
	'dhuhr_iqamah',
	'asr_iqamah',
	'maghrib_iqamah',
	'isha_iqamah',
] as const;

/**
 * Shift a 'HH:MM' clock time by a signed number of minutes, wrapping at
 * midnight (e.g. 23:58 + 5 → 00:03). Non 'HH:MM' values (blank cells, 12-hour
 * strings with AM/PM, etc.) are returned unchanged so a bad cell is never
 * corrupted.
 */
export const shiftTimeMinutes = (hhmm: string, minutes: number): string => {
	if (typeof hhmm !== 'string') return hhmm;
	const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return hhmm;
	const total = ((Number(match[1]) * 60 + Number(match[2]) + Math.trunc(minutes)) % 1440 + 1440) % 1440;
	return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * Apply the Uniform Iqamah adjustment to every Iqamah column of a generated
 * day, in place. The day's Iqamah values may be imported Jamā'ah (published
 * template) or computed (Begins + Iqamah Delay) — both are shifted by the same
 * signed minutes, so the setting works for every row. A zero/NaN adjustment is
 * a no-op.
 *
 * `skipColumns` lists Iqamah columns an Advanced Schedule already controls for
 * this day. They are left untouched so the two features can never stack on the
 * same Iqamah: the schedule's explicit value always wins, and the uniform
 * adjustment only shifts the Iqamah times no schedule set.
 */
export const applyIqamahAdjustment = (
	times: Record<string, any>,
	minutes: number,
	skipColumns?: readonly string[]
): Record<string, any> => {
	if (!Number.isFinite(minutes) || minutes === 0) return times;
	const skip = skipColumns && skipColumns.length ? new Set(skipColumns) : null;
	IQAMAH_COLUMNS.forEach((column) => {
		if (skip && skip.has(column)) return;
		const value = times[column];
		if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
			times[column] = shiftTimeMinutes(value, minutes);
		}
	});
	return times;
};