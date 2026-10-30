/**
 * Day-to-day smoothing of prayer Begins times.
 *
 * Caps how much a time may change from one calendar day to the next. For
 * example if Sept 1 Fajr computes to 04:37:44 and Sept 2 to 04:39:52 (a
 * +2:08 jump), a 90-second cap clamps Sept 2 to 04:39:14 — no single day may
 * jump more than the configured cap from where the previous day's TRUE
 * calculation was.
 *
 * Each day is anchored to the previous day's *raw* (true) value, NOT to the
 * previous day's smoothed value. That matters: chaining from smoothed values
 * makes the smoothed time fall further and further behind the real
 * calculation over long stretches (e.g. Fajr drifts later by ~2 min/day from
 * June to December, so a chained 90s cap ends up many minutes early by
 * autumn). Anchoring to the true value keeps every smoothed time within one
 * cap of the real time, forever. It also makes the result depend only on the
 * current and previous day's raw values, so the whole-year generation pass
 * and the month-only tooltip recomputation always produce IDENTICAL seconds —
 * the hover tooltip stays in sync with what was generated.
 *
 * Applied AFTER the per-day calculation and BEFORE rounding, so the stored
 * minutes (and the hover-tooltip seconds) both reflect the capped values and
 * the Rounding Method / Seconds Threshold are applied on top of them.
 * PrayTimes.js itself is untouched — this is a pure post-processing pass over
 * the already-computed times.
 *
 * @module utils/smoothDayTimes
 */
import { useLocationStore } from '../state/storeLocation';
import {
	getRoundingConfig,
	roundToMinute,
	type RawDayTimes,
} from './computeDayTimes';

/** The six Begins times the cap applies to (Midnight is not a Begins time). */
export const SMOOTHING_PRAYERS = [
	'fajr',
	'sunrise',
	'dhuhr',
	'asr',
	'maghrib',
	'isha',
] as const;

export type SmoothingMode = 'noDrift' | 'strict' | 'hybrid' | 'manual';

export interface SmoothingConfig {
	enabled: boolean;
	maxSeconds: number;
	/**
	 * 'noDrift' — anchor each day to the previous day's TRUE value (never
	 * drifts from the real calculation; consecutive steps can still exceed the
	 * cap during steep stretches).
	 * 'strict' — anchor to the previous SMOOTHED value, so consecutive days
	 * never differ by more than the cap (but the curve can fall behind the
	 * true times during steep stretches and recovers when the drift slows).
	 * 'hybrid' — smooth steps like 'strict', but also bound how far the curve
	 * may stray from the true time: when a capped step would push the drift
	 * beyond `driftBudget`, the step cap releases just enough to hold the
	 * curve inside the budget (so it never runs away by many minutes). When
	 * the natural drift slows, the curve walks back to the true time at cap
	 * speed.
	 * 'manual' — per-prayer daily-step control: the admin types how much
	 * each Begins prayer may change per day (e.g. Fajr 60 = 1 minute per
	 * day). The curve chains from the previous day's value like 'strict',
	 * so during steep stretches (e.g. ~2 min/day in September) consecutive
	 * displayed days step by EXACTLY your typed amount; when the natural
	 * drift is gentler than your step the true time is kept. The
	 * `driftBudget` leash (shared with 'hybrid') stops the curve from
	 * falling far behind the true times: when the chained step would push
	 * the drift past the budget it releases just enough to hold inside the
	 * bound. A prayer left at 0 keeps its true time untouched.
	 */
	mode: SmoothingMode;
	/** Seconds the smoothed time may stray from the true time (hybrid & manual). */
	driftBudget: number;
	/**
	 * Manual daily-step mode only: the per-day change in seconds allowed for
	 * each Begins prayer (0 = keep the true time). The sign of the natural
	 * drift is always respected — typing 60 means "1 minute later per day"
	 * while times are getting later and "1 minute earlier per day" while
	 * they are getting earlier, automatically.
	 */
	manualSteps: Record<string, number>;
}

export interface SmoothableDay {
	date: Date;
	raw: RawDayTimes;
	/**
	 * The active seasonal criteria for this date ({ fajr, isha, maghrib }
	 * values in force — what `computeDayTimes` applied). Used to detect when
	 * the criteria change between two consecutive days (Unified Method monthly
	 * curve stepping on the 1st, or the winter/summer window switching). Those
	 * changes are INTENTIONAL — the times legitimately jump to the new
	 * criteria — so the smoothing chain must reset at the boundary instead of
	 * clamping the step (clamping it produced an artificial dip on the 1st/2nd
	 * of the month).
	 */
	criteria?: Record<string, any> | null;
	/**
	 * Prayers whose exact minute was pinned by the Unified Method's per-day
	 * chart (absolute published times). Pinned values are final — the cap must
	 * never alter them — and they reset the chain so the days that follow cap
	 * relative to the published value.
	 */
	pinnedKeys?: string[];
	/**
	 * Imported Jamā'ah (congregation) times mapped to the Iqamah column names
	 * ({ fajr_iqamah: '06:46', … }). Carried through unchanged — smoothing
	 * only ever touches the six Begins prayers, never the Iqamah columns.
	 */
	jamaah?: Record<string, string>;
}

export interface SmoothedDay extends SmoothableDay {
	/** Rounded minutes ('HH:MM') — what the calendar stores and displays. */
	times: Record<string, string>;
}

/** Seconds of day from 'HH:MM:SS', or null when the value is not a real time. */
const toSeconds = (hhmmss: string): number | null => {
	if (typeof hhmmss !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(hhmmss))
		return null;
	const [h, m, s] = hhmmss.split(':').map(Number);
	if ([h, m, s].some((n) => Number.isNaN(n))) return null;
	return h * 3600 + m * 60 + s;
};

/** 'HH:MM:SS' from seconds of day (wraps at 24h, so day rollover stays sane). */
const fromSeconds = (sec: number): string => {
	const total = ((Math.round(sec) % 86400) + 86400) % 86400;
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Current smoothing configuration from the store (defaults: on, 90 seconds,
 * no-drift mode). Smoothing is enabled only when its own toggle is on.
 */
export const getSmoothingConfig = (): SmoothingConfig => {
	const store = useLocationStore.getState();
	const s = store.smoothing_selected;
	const maxSeconds = Math.max(1, Math.min(3600, Number(s?.maxSeconds) || 90));
	const mode =
		s?.mode === 'strict'
			? 'strict'
			: s?.mode === 'hybrid'
				? 'hybrid'
				: s?.mode === 'manual'
					? 'manual'
					: 'noDrift';
	const driftBudget = Math.max(0, Math.min(3600, Number(s?.driftBudget) || 180));
	// Manual steps default to 0 — a prayer at 0 keeps its true time (only
	// prayers the admin types a step for are changed). Steps are magnitudes
	// clamped to 0…3600 (an hour per day is plenty); the natural drift's
	// sign is always respected by the smoothing loop.
	const rawSteps =
		s?.manualSteps && typeof s.manualSteps === 'object' ? s.manualSteps : {};
	const manualSteps: Record<string, number> = {};
	for (const key of SMOOTHING_PRAYERS) {
		const v = Number((rawSteps as Record<string, unknown>)[key]);
		manualSteps[key] = Number.isFinite(v)
			? Math.max(0, Math.min(3600, Math.round(v)))
			: 0;
	}
	// Smoothing is controlled by its own toggle AND the Feature Switches
	// "Day-to-Day Smoothing" master switch — if the feature is turned off the
	// whole pass is skipped (belt and braces on top of the loader's derived
	// enabled=false, so a hidden/off feature can never still smooth).
	const featureOff =
		store.feature_toggles?.['Day_to_day_Smoothing'] === false;
	return {
		enabled: !!s?.enabled && !featureOff,
		maxSeconds,
		mode,
		driftBudget,
		manualSteps,
	};
};

/**
 * Clamp each prayer's change between consecutive days to the configured
 * maximum, then re-derive the rounded minutes. Days must be sorted ascending
 * by date (generation and the tooltip hook both pass them that way).
 *	 * Modes:
	 *  - 'noDrift': each day is capped relative to the previous day's TRUE raw
	 *    value. The smoothed times stay within one cap of the real calculation
	 *    forever (no accumulated drift), and the result for any day depends only
	 *    on that day and the previous day's raw values — so running it over the
	 *    whole year or over a month seeded with the previous month's last day
	 *    produces IDENTICAL values. Consecutive displayed steps can still exceed
	 *    the cap during steep stretches (e.g. ~2 min/day in September).
	 *  - 'strict': each day is capped relative to the previous SMOOTHED value, so
	 *    consecutive displayed days never differ by more than the cap. The curve
	 *    can fall behind the true times during long steep stretches and recovers
	 *    when the natural drift slows below the cap. Because the chain carries
	 *    state, callers must run it over the SAME range as generation (the tooltip
	 *    hook builds the chain from January 1st in this mode).
	 *  - 'hybrid': like 'strict', but when a capped step would push the smoothed
	 *    value more than `driftBudget` away from the true time, the cap releases
	 *    just enough to hold inside the bound (never runs away by many minutes).
	 *  - 'manual': per-prayer typed daily step (`manualSteps`), chained like
	 *    'strict' with the same drift-budget release. While the natural drift
	 *    exceeds the typed step, consecutive days move by exactly the typed step
	 *    (e.g. 60s = 1 minute per day); when the natural drift is gentler the
	 *    true time is kept. A prayer at 0 is left untouched.
	 *
 * When smoothing is disabled, returns the input with only the `times` derived
 * — i.e. a no-op that still matches the generation pipeline shape.
 */	export const smoothDayTimes = (days: SmoothableDay[]): SmoothedDay[] => {
	const { enabled, maxSeconds, mode, driftBudget, manualSteps } = getSmoothingConfig();
	const { rounding, threshold } = getRoundingConfig();
	// Chain state per prayer: in 'strict' mode this tracks the previous
	// SMOOTHED value; in 'noDrift' mode it tracks the previous TRUE raw value.
	const prev: Record<string, number | null> = {};
	// Criteria (fajr/isha/maghrib values) in force on the previous day — when
	// it differs from today's, the schedule intentionally switched criteria
	// (monthly curve step on the 1st, winter/summer boundary) and the chain is
	// reset so that day starts fresh instead of being clamped against the old
	// regime (which caused dips on the 1st/2nd of each month).
	let prevCriteria = '';
	const result: SmoothedDay[] = [];

	for (const day of days) {
		const raw: RawDayTimes = { ...day.raw };

		// Detect an intentional criteria change between consecutive days.
		// `criteria` may be undefined (older callers) — treat as 'no criteria'
		// so behavior is unchanged when the field is absent.
		const criteria = day.criteria ?? null;
		const criteriaSig =
			criteria && typeof criteria === 'object'
				? JSON.stringify(criteria)
				: '';
		if (criteriaSig !== prevCriteria) {
			// Fresh baseline for every prayer — the criteria change itself is a
			// legitimate step (e.g. 13.5° August → 15° September), so the new
			// regime starts from its own true values, not clamped to the old
			// regime's last day.
			for (const key of SMOOTHING_PRAYERS) prev[key] = null;
		}
		prevCriteria = criteriaSig;

		const pinned = Array.isArray(day.pinnedKeys) ? day.pinnedKeys : [];

		for (const key of SMOOTHING_PRAYERS) {
			const cur = toSeconds(raw[key]);
			if (cur === null) {
				prev[key] = null; // invalid day — reset the chain for this prayer
				continue;
			}

			// Chart-pinned (exact published) times are final: keep them as-is and
			// use them as the new chain baseline (never cap a published value).
			if (pinned.includes(key)) {
				prev[key] = cur;
				continue;
			}
			const last = prev[key];
			if (mode === 'strict' || mode === 'hybrid' || mode === 'manual') {
				// Strict / Hybrid / Manual — chain from the smoothed value so
				// consecutive days never differ by more than the cap (unless the
				// drift budget forces a release, below). In Manual mode the cap
				// is the per-prayer typed step (`manualSteps[key]`); a prayer
				// left at 0 keeps its true time untouched.
				prev[key] = cur;
				// Loose `== null` also catches the initial `undefined` chain state
				// (first day), not just the explicit null resets below.
				if (!enabled || last == null) continue;

				// Manual mode: per-prayer step. 0 = keep the true time (no cap
				// applied — the day is already within the step, and the chain
				// moves to the true value).
				const cap = mode === 'manual' ? (manualSteps[key] ?? 0) : maxSeconds;
				if (cap <= 0) {
					prev[key] = cur;
					continue;
				}

				const delta = cur - last;
				if (Math.abs(delta) > 43200) continue; // midnight wrap — fresh baseline

				if (Math.abs(delta) <= cap) {
					// Already within the cap — keep the true time, chain moves to it.
					prev[key] = cur;
					continue;
				}

				// Capped step from the previous smoothed value.
				let out = last + Math.sign(delta) * cap;

				if (mode === 'hybrid' || mode === 'manual') {
					// Drift budget: `out` would sit `out - cur` seconds away from
					// today's true time. If that is more than the budget, release
					// the cap just enough to land exactly ON the budget (never
					// past the true time) — the table can never run away by more
					// than `driftBudget`, no matter how long the steep stretch.
					// In Manual mode this keeps the typed daily step from falling
					// too far behind the real times across long stretches.
					const drift = out - cur;
					if (Math.abs(drift) > driftBudget) {
						out = cur + Math.sign(drift) * driftBudget;
					}
				}

				raw[key] = fromSeconds(out);
				prev[key] = out; // chain continues from the smoothed value
			} else {
				// No-drift — anchor to the TRUE value; only the output is capped.
				prev[key] = cur;
				// Loose `== null` also catches the initial `undefined` chain state.
				if (!enabled || last == null) continue;

				const delta = cur - last;
				if (Math.abs(delta) > 43200) continue; // midnight wrap — fresh baseline

				if (Math.abs(delta) > maxSeconds) {
					raw[key] = fromSeconds(last + Math.sign(delta) * maxSeconds);
				}
			}
		}

		const times: Record<string, string> = {};
		Object.keys(raw).forEach((key) => {
			const value = raw[key];
			if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
				times[key] = roundToMinute(value, rounding, threshold);
			} else {
				times[key] = value;
			}
		});

		result.push({ date: day.date, raw, times, jamaah: day.jamaah });
	}

	return result;
};