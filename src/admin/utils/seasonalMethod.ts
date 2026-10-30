/**
 * Seasonal Method Helper
 *
 * Shared logic for the Unified Method's per-date profile switching:
 *
 *  - `seasonMode: 'manual'`   — the base params (Fajr/Isha/Maghrib fields) are
 *    used for every date of the year.
 *  - `seasonMode: 'auto'`     — winter/summer switching. The base params act as
 *    the winter profile; dates inside [summerStart, summerEnd] use the
 *    summer* params instead.
 *  - `seasonMode: 'monthly'`  — Hizbul Ulama style monthly curve. Each calendar
 *    month has its own Fajr and Isha value (index 0 = January … 11 = December).
 *    Blank cells fall back to the base Fajr/Isha fields; Maghrib always comes
 *    from the base field.
 *
 * Used by the Unified Method settings panel (for the live "which criteria
 * apply today" indicator) and by calendar generation (per-date adjustment).
 *
 * @module utils/seasonalMethod
 */

export interface UnifiedMethodParams {
  /** Master on/off — false ignores all criteria (engine defaults apply). */
  enabled?: boolean;
  fajr?: string | number;
  isha?: string | number;
  maghrib?: string | number;
  asr?: string;
  midnight?: string;
  highLats?: string;
  iterations?: string | number;
  // Seasonal switching
  /** 'manual' | 'auto' (winter/summer) | 'monthly' (per-month curve) | 'chart' (exact per-day published times) */
  seasonMode?: string;
  summerStart?: string; // 'MM-DD'
  summerEnd?: string; // 'MM-DD'
  summerFajr?: string | number;
  summerIsha?: string | number;
  summerMaghrib?: string | number;
  summerHighLats?: string;
  // Monthly curve (Hizbul Ulama) — index 0 = January … 11 = December.
  // Entries may be angles (15) or minute offsets ('60 min'); null/'' means
  // "use the base field for that month".
  monthlyFajr?: (string | number | null)[];
  monthlyIsha?: (string | number | null)[];
  // When the monthly curve mode is on, smoothly interpolate between
  // consecutive months' numeric angle values across each month (anchored on
  // the 15th), instead of stepping on the 1st. Minute-string entries ('90
  // min') and blank cells never interpolate — they keep their flat value.
  monthlySmooth?: boolean;
  // London Unified published-table safety margins: fixed minute offsets
  // applied to Sunrise / Dhuhr / Asr while the Unified Method is active and
  // marginsEnabled is on (they REPLACE the global Tune Prayer values for
  // those three prayers, so nothing is double-applied).
  marginsEnabled?: boolean;
  sunriseOffset?: string | number;
  dhuhrOffset?: string | number;
  asrOffset?: string | number;
  // Exact per-day chart mode ('chart' seasonMode): absolute published times
  // per date. chart<Prayer>[month][day-1] = 'HH:MM' (24h), 12 arrays of up to
  // 31 entries; missing entries fall back to the normal calculation. When a
  // full published timetable is imported, all six Begins prayers are pinned
  // (the whole day is exact).
  chartFajr?: (string | null)[][];
  chartSunrise?: (string | null)[][];
  chartDhuhr?: (string | null)[][];
  chartAsr?: (string | null)[][];
  // Optional second 'Asr time (2 Mithl / Hanafi opinion) imported from the
  // same published timetable. Same shape as the other charts; when present
  // each day also pins the `asr2` Begins time (stored in asr_second_begins)
  // and the optional 'Asr 2 calendar column can display it.
  chartAsr2?: (string | null)[][];
  chartMaghrib?: (string | null)[][];
  chartIsha?: (string | null)[][];
  // Printed Jamā'ah (congregation) columns imported from the same published
  // timetable, used for the calendar's Iqamah columns while chart mode is on.
  // Same shape as the Begins charts: [month][day-1] = 'HH:MM' (24h).
  jamaahEnabled?: boolean;
  chartFajrJamaah?: (string | null)[][];
  chartDhuhrJamaah?: (string | null)[][];
  chartAsrJamaah?: (string | null)[][];
  chartMaghribJamaah?: (string | null)[][];
  chartIshaJamaah?: (string | null)[][];
  // Uniform Iqamah adjustment (chart mode only): one signed number of minutes
  // added to EVERY Iqamah time in the generated calendar — imported Jamā'ah
  // and computed Iqamah alike. Example: +5 turns 5:00 into 5:05 and 4:45 into
  // 4:50. Applied during generation (click Generate Calendar to rebuild).
  iqamahAdjustEnabled?: boolean;
  iqamahAdjust?: number;
}

export const DEFAULT_SUMMER_START = '04-01';
export const DEFAULT_SUMMER_END = '09-30';

/** Month names shown in the monthly-curve editor (Jan = index 0). */
export const MONTH_NAMES_SHORT = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Hizbul Ulama (London unified / Moonsighting.com UK) Fajr & Isha angle
 * curve — the official month-by-month sliding scale. Each month lists its
 * angular range (value on the 1st → value on the last day):
 *
 *   Jan 16.0 → 15.5    May 12.6 → 12.0    Sep 13.9 → 14.8
 *   Feb 15.5 → 15.0    Jun locked  12.0    Oct 14.8 → 15.5
 *   Mar 15.0 → 14.2    Jul locked  12.0    Nov 15.5 → 15.9
 *   Apr 14.2 → 12.6    Aug 12.1 → 13.9    Dec 15.9 → 16.0
 *
 * The array below holds each month's mid-month angle (the value on the 15th),
 * so with "Smooth the curve between months" on, the interpolated value glides
 * through the table's start/end values instead of stepping on the 1st. Used
 * to pre-fill the monthly editor (and as the Unified Method default profile);
 * every cell remains user-editable.
 */
export const HIZBUL_ULAMA_DEFAULT_CURVE: number[] = [
  15.75, // January   (16.0 → 15.5)
  15.25, // February  (15.5 → 15.0)
  14.6, // March      (15.0 → 14.2)
  13.4, // April      (14.2 → 12.6)
  12.3, // May        (12.6 → 12.0)
  12.0, // June       (locked at 12.0)
  12.0, // July       (locked at 12.0)
  13.0, // August     (12.1 → 13.9)
  14.35, // September (13.9 → 14.8)
  15.15, // October   (14.8 → 15.5)
  15.7, // November   (15.5 → 15.9)
  15.95, // December  (15.9 → 16.0)
];

/**
 * Canonical key names for the seasonal fields. Params can arrive camelCased
 * (written by the Unified Method panel) or lowercased (written by
 * SettingsManager's normalizeParams), so both must map to the same key.
 */
const KEY_ALIASES: Record<string, string> = {
  seasonmode: 'seasonMode',
  summerstart: 'summerStart',
  summerend: 'summerEnd',
  summerfajr: 'summerFajr',
  summerisha: 'summerIsha',
  summermaghrib: 'summerMaghrib',
  summerhighlats: 'summerHighLats',
  highlats: 'highLats',
  monthlyfajr: 'monthlyFajr',
  monthlyisha: 'monthlyIsha',
  monthlysmooth: 'monthlySmooth',
  marginsenabled: 'marginsEnabled',
  sunriseoffset: 'sunriseOffset',
  dhuhroffset: 'dhuhrOffset',
  asroffset: 'asrOffset',
  chartfajr: 'chartFajr',
  chartsunrise: 'chartSunrise',
  chartdhuhr: 'chartDhuhr',
  chartasr: 'chartAsr',
  chartasr2: 'chartAsr2',
  chartmaghrib: 'chartMaghrib',
  chartisha: 'chartIsha',
  jamaahenabled: 'jamaahEnabled',
  chartfajrjamaah: 'chartFajrJamaah',
  chartdhuhrijamaah: 'chartDhuhrJamaah',
  chartasrjamaah: 'chartAsrJamaah',
  chartmaghribjamaah: 'chartMaghribJamaah',
  chartishajamaah: 'chartIshaJamaah',
  iqamahadjustenabled: 'iqamahAdjustEnabled',
  iqamahadjust: 'iqamahAdjust',
};

/**
 * Return a copy of `raw` with all keys in their canonical form, so callers
 * can read `params.summerStart`, `params.highLats`, … regardless of how the
 * params were originally persisted.
 */
export const normalizeUnifiedParams = (raw?: Record<string, any> | null): UnifiedMethodParams => {
  const out: Record<string, any> = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    const canonical = KEY_ALIASES[key.toLowerCase()] || key;
    out[canonical] = value;
  });
  return out as UnifiedMethodParams;
};

/** Format a date as 'MM-DD' for range comparisons. */
export const toMonthDay = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
};

/**
 * Whether an 'MM-DD' value falls inside [start, end]. Handles ranges that
 * wrap the new year (e.g. summer from 12-01 to 03-01).
 */
export const isInRange = (value: string, start: string, end: string): boolean => {
  if (!value || !start || !end) return false;
  if (start <= end) return value >= start && value <= end;
  // wrapped range (e.g. Dec 1 – Mar 1)
  return value >= start || value <= end;
};

/** 'summer' | 'winter' for a given date. Defaults to winter when no range set. */
export const getSeasonForDate = (
  date: Date,
  summerStart?: string,
  summerEnd?: string
): 'summer' | 'winter' => {
  const start = summerStart || DEFAULT_SUMMER_START;
  const end = summerEnd || DEFAULT_SUMMER_END;
  return isInRange(toMonthDay(date), start, end) ? 'summer' : 'winter';
};

/**
 * Returns the adjust() object ({fajr, isha, maghrib}) for the season active on
 * `date`, or null when seasonal mode is off. Only defined values are included
 * so the engine's method params are never overwritten with undefined.
 *
 * Asr, Midnight and Higher Latitude are intentionally NOT switched seasonally
 * — they are controlled by the Prayer Settings page dropdowns, which stay
 * fixed for the whole year.
 */
/** A value is "set" when it is not undefined/null/empty string. */
const isSet = (value: any): boolean =>
  value !== undefined && value !== null && value !== '';

/** A pure numeric angle (e.g. 15 or '14.5') — never a '60 min' string. */
const isAngleValue = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  const s = String(value).trim();
  return s !== '' && /^\d+(\.\d+)?$/.test(s);
};

/** Numeric value of an angle-like cell. */
const asNumber = (value: any): number => parseFloat(String(value));

/**
 * Smooth monthly curve resolution.
 *
 * London unified Fajr/Isha charts do not step on the 1st of the month — the
 * angle glides continuously (e.g. September: 13.9° on the 1st → ~14.35° at
 * the 15th → 14.8° on the 30th). When `monthlySmooth` is on
 * and the date's month cell is a pure angle, this interpolates linearly
 * between the neighbouring months' numeric cells, anchored at each month's
 * 15th, so the value drifts smoothly instead of jumping on the 1st.
 *
 * Returns the resolved value for the date's month:
 *  - a number when smooth interpolation applies,
 *  - the raw cell value (angle or '90 min') when smoothing is off/not
 *    possible for this cell,
 *  - undefined when the cell is blank (base fields apply).
 */
export const getMonthlyValueForDate = (
  date: Date,
  cells?: (string | number | null)[],
  smooth = false
): string | number | undefined => {
  if (!Array.isArray(cells)) return undefined;
  const monthIndex = date.getMonth();
  const own = cells[monthIndex];
  // Explicit narrowing (a helper function cannot narrow for TS): blank cells
  // (null/undefined/'') mean "use the base fields" → undefined.
  if (own === undefined || own === null || String(own).trim() === '') return undefined;
  if (!smooth || !isAngleValue(own)) return own;

  // Numeric anchor months, in order, around the year circle.
  const numeric: number[] = [];
  cells.forEach((c, i) => {
    if (isAngleValue(c)) numeric.push(i);
  });
  if (numeric.length === 0) return own;
  const pos = numeric.indexOf(monthIndex);
  if (pos === -1) return own;

  const len = numeric.length;
  const day = date.getDate();
  // Day 1-14 blends from the previous numeric month's anchor (its 15th) to
  // this month's 15th; day 15+ blends from this month's 15th to the next
  // numeric month's 15th. Wraps across the new year.
  const neighborL = numeric[(pos - 1 + len) % len];
  const neighborR = numeric[(pos + 1) % len];
  const aMonth = day < 15 ? neighborL : monthIndex;
  const bMonth = day < 15 ? monthIndex : neighborR;

  const mid = (year: number, m: number): number => Date.UTC(year, m, 15);
  // Handle year rollover for neighbours (Jan blends from Dec, Dec blends into
  // next January).
  const aYear = aMonth === 11 && monthIndex === 0 ? 1999 : 2000;
  const bYear = bMonth === 0 && monthIndex === 11 ? 2001 : 2000;
  const t0 = mid(2000, aMonth);
  const t1 = mid(bYear, bMonth);
  const now = Date.UTC(2000, monthIndex, day);
  if (t1 <= t0) return own;
  const t = Math.min(1, Math.max(0, (now - (aYear === 1999 ? mid(1999, aMonth) : t0)) / (t1 - t0)));
  const va = asNumber(cells[aMonth]);
  const vb = asNumber(cells[bMonth]);
  return +(va + (vb - va) * t).toFixed(3);
};

/**
 * Returns the adjust() object ({fajr, isha}) for the monthly curve cell of the
 * month containing `date`, or null when seasonal mode is off / no value set.
 * Blank cells (null/''/missing) fall back to the engine's base params — which
 * the panel already seeded from the top Fajr/Isha fields. When `monthlySmooth`
 * is on, numeric cells are interpolated between months (see
 * getMonthlyValueForDate).
 */
export const getMonthlyAdjustForDate = (
  date: Date,
  params?: UnifiedMethodParams,
  legacyMonthly = false
): Record<string, any> | null => {
  params = normalizeUnifiedParams(params);
  if (!params) return null;
  // `legacyMonthly` allows entries WITHOUT a seasonMode key that nevertheless
  // carry monthly cells (older saves) to resolve exactly like monthly mode.
  if (!legacyMonthly && params.seasonMode !== 'monthly') return null;

  const smooth = params.monthlySmooth === true;
  const fajr = getMonthlyValueForDate(date, params.monthlyFajr, smooth);
  const isha = getMonthlyValueForDate(date, params.monthlyIsha, smooth);

  const adjust: Record<string, any> = {};
  if (fajr !== undefined) adjust.fajr = fajr;
  if (isha !== undefined) adjust.isha = isha;
  return Object.keys(adjust).length > 0 ? adjust : null;
};

/**
 * The default monthly adjustment for a date — the official Hizbul Ulama
 * Fajr/Isha curve (sliding 12°–16° scale) with inter-month smoothing. Used
 * for Unified Method entries that predate seasonal configuration (and were
 * never given a seasonMode or monthly cells): the curve is the default
 * profile, so such entries behave like Monthly-curve mode. Optional cells
 * override the default curve when the entry carries its own monthly arrays.
 */
export const getDefaultMonthlyAdjustForDate = (
  date: Date,
  monthlyFajr?: (string | number | null)[] | number[],
  monthlyIsha?: (string | number | null)[] | number[],
  smooth = true
): Record<string, any> => ({
  fajr: getMonthlyValueForDate(date, (monthlyFajr ?? HIZBUL_ULAMA_DEFAULT_CURVE) as any, smooth),
  isha: getMonthlyValueForDate(date, (monthlyIsha ?? HIZBUL_ULAMA_DEFAULT_CURVE) as any, smooth),
});

/**
 * Chart-mode lookup: the absolute published 'HH:MM' (24h) times pinned for a
 * date, or null when chart mode is off / that date has no entry. Any of the
 * six Begins prayers can be pinned (a full imported timetable pins all six,
 * making the whole day exactly the published table).
 */
export const getChartTimesForDate = (
  date: Date,
  params?: UnifiedMethodParams
): Record<string, string> | null => {
  params = normalizeUnifiedParams(params);
  if (!params || params.seasonMode !== 'chart') return null;

  const monthIndex = date.getMonth();
  const dayIndex = date.getDate() - 1;
  const pick = (arr?: (string | null)[][]): string | undefined => {
    const list = Array.isArray(arr) ? arr[monthIndex] : undefined;
    const v = Array.isArray(list) ? list[dayIndex] : undefined;
    if (v === undefined || v === null || String(v).trim() === '') return undefined;
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return undefined;
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h <= 23 && min <= 59 ? s : undefined;
  };
  const out: Record<string, string> = {};
  (
    [
      ['fajr', params.chartFajr],
      ['sunrise', params.chartSunrise],
      ['dhuhr', params.chartDhuhr],
      ['asr', params.chartAsr],
      ['asr2', params.chartAsr2],
      ['maghrib', params.chartMaghrib],
      ['isha', params.chartIsha],
    ] as const
  ).forEach(([key, arr]) => {
    const v = pick(arr);
    if (v) out[key] = v;
  });
  return Object.keys(out).length > 0 ? out : null;
};

/**
 * Chart-mode lookup for the imported printed Jamā'ah (congregation) times —
 * the published Iqamah column values. Returns the Jamā'ah times pinned for a
 * date keyed by prayer name ('fajr', 'dhuhr', …), or null when chart mode is
 * off, the Jamā'ah import is disabled, or that date has no entry. Values are
 * the exact printed 'HH:MM' minutes (24h) — they are written straight to the
 * calendar's Iqamah columns, replacing the begins+delay computation.
 */
export const getChartJamaahForDate = (
  date: Date,
  params?: UnifiedMethodParams
): Record<string, string> | null => {
  params = normalizeUnifiedParams(params);
  if (!params || params.seasonMode !== 'chart') return null;
  if (params.jamaahEnabled !== true) return null;

  const monthIndex = date.getMonth();
  const dayIndex = date.getDate() - 1;
  const pick = (arr?: (string | null)[][]): string | undefined => {
    const list = Array.isArray(arr) ? arr[monthIndex] : undefined;
    const v = Array.isArray(list) ? list[dayIndex] : undefined;
    if (v === undefined || v === null || String(v).trim() === '') return undefined;
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return undefined;
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h <= 23 && min <= 59 ? s : undefined;
  };
  const out: Record<string, string> = {};
  (
    [
      ['fajr', params.chartFajrJamaah],
      ['dhuhr', params.chartDhuhrJamaah],
      ['asr', params.chartAsrJamaah],
      ['maghrib', params.chartMaghribJamaah],
      ['isha', params.chartIshaJamaah],
    ] as const
  ).forEach(([key, arr]) => {
    const v = pick(arr);
    if (v) out[key] = v;
  });
  return Object.keys(out).length > 0 ? out : null;
};

/**
 * Uniform Iqamah adjustment for the generated calendar.
 *
 * Returns the signed number of minutes to add to every Iqamah time, or 0 when
 * the feature is off / not applicable. It only applies while the Unified
 * Method is in per-day chart mode (the mode that pins imported published
 * times), so the adjustment is scoped to the import workflow and never
 * interferes with Advanced Schedules or the plain Iqamah Delay fields.
 *
 * The value is clamped to ±24h and rounded to whole minutes; non-numeric input
 * falls back to 0 so a corrupt stored value can never shift the timetable.
 */
export const getIqamahAdjustMinutes = (params?: UnifiedMethodParams): number => {
  const p = normalizeUnifiedParams(params);
  if (!p || p.seasonMode !== 'chart') return 0;
  if (p.iqamahAdjustEnabled !== true) return 0;
  const n = Math.round(Number(p.iqamahAdjust));
  if (!Number.isFinite(n) || n === 0) return 0;
  return Math.max(-1440, Math.min(1440, n));
};

/**
 * Whether the Unified Method currently applies the "Adjust every Iqamah time"
 * offset (chart mode + toggle on + non-zero minutes). Shared by the settings
 * panels so the Advanced-Schedules conflict warning can never drift from the
 * value generation actually uses.
 */
export const hasActiveIqamahAdjustment = (methodsForCalculation?: any[]): boolean => {
  const entry = Array.isArray(methodsForCalculation)
    ? methodsForCalculation.find(
        (m: any) => String(m?.method || '').toLowerCase() === 'unified_method'
      )
    : undefined;
  return getIqamahAdjustMinutes(entry?.params) !== 0;
};

/**
 * Stable per-date profile token for the smoothing pass.
 *
 * Smoothing resets its chain whenever the criteria *intentionally* change
 * between consecutive days (monthly curve step on the 1st, winter/summer
 * boundary, chart window edge). The token identifies the profile, not the
 * resolved value, so a smoothly interpolated curve (whose value changes every
 * day) never triggers a spurious daily reset.
 */
export const getCriteriaProfileForDate = (
  date: Date,
  params?: UnifiedMethodParams
): string | null => {
  params = normalizeUnifiedParams(params);
  if (!params || params.seasonMode === 'manual') return null;
  if (params.seasonMode === 'chart') return 'chart';
  if (params.seasonMode === 'monthly') return `monthly:${date.getMonth()}`;
  if (params.seasonMode === 'auto') {
    return `auto:${getSeasonForDate(date, params.summerStart, params.summerEnd)}`;
  }
  // Keyless entries (no seasonMode) behave like the monthly curve — see
  // getSeasonalAdjustForDate — so the smoothing chain resets at month
  // boundaries exactly as it does for explicit monthly mode.
  return `monthly:${date.getMonth()}`;
};

/**
 * Returns the adjust() object ({fajr, isha, maghrib}) for the season/curve
 * active on `date`, or null when seasonal mode is off. Only defined values are
 * included so the engine's method params are never overwritten with undefined.
 *
 * Asr, Midnight and Higher Latitude are intentionally NOT switched per date
 * — they are controlled by the Prayer Settings page dropdowns, which stay
 * fixed for the whole year.
 */
export const getSeasonalAdjustForDate = (
  date: Date,
  params?: UnifiedMethodParams
): Record<string, any> | null => {
  // Normalize key casing so params persisted by either the panel (camelCase)
  // or SettingsManager (lowercase) behave identically.
  params = normalizeUnifiedParams(params);
  if (!params) return null;

  // Monthly (Hizbul Ulama) curve — per-month Fajr/Isha override.
  if (params.seasonMode === 'monthly') {
    return getMonthlyAdjustForDate(date, params);
  }

  // Manual and chart never produce a seasonal adjust here (chart pins are
  // applied separately by the caller).
  if (params.seasonMode === 'manual' || params.seasonMode === 'chart') return null;

  // Keyless entries (no seasonMode — written before seasonal switching
  // existed) always behave like the MONTHLY curve. When the entry carries its
  // own monthly cells they are used — so an angle edited in the table ALWAYS
  // reaches the calculation even if a legacy save omitted the mode — and when
  // it carries nothing the official Hizbul Ulama curve is the default.
  if (params.seasonMode === undefined) {
    if (Array.isArray(params.monthlyFajr) || Array.isArray(params.monthlyIsha)) {
      return getMonthlyAdjustForDate(date, params, true);
    }
    return getDefaultMonthlyAdjustForDate(
      date,
      params.monthlyFajr as any,
      params.monthlyIsha as any,
      params.monthlySmooth === true
    );
  }

  // Any other explicit mode is not a seasonal mode.
  if (params.seasonMode !== 'auto') return null;

  // Seasonal mode ('auto') — winter/summer window.
  const season = getSeasonForDate(date, params.summerStart, params.summerEnd);
  const base = season === 'summer'
    ? {
        fajr: params.summerFajr,
        isha: params.summerIsha,
        maghrib: params.summerMaghrib,
      }
    : {
        fajr: params.fajr,
        isha: params.isha,
        maghrib: params.maghrib,
      };

  const adjust: Record<string, any> = {};
  Object.entries(base).forEach(([key, value]) => {
    if (isSet(value)) adjust[key] = value;
  });
  return Object.keys(adjust).length > 0 ? adjust : null;
};