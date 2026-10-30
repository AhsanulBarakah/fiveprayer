/**
 * UnifiedMethodSettings
 *
 * Special configuration panel for the "Unified Method" calculation profile.
 * It maps the exact custom criteria of the method — Fajr, Isha, Maghrib
 * (angle or minutes) and the number of Iterations — into the method's
 * `params`, which `useCalenderSettings` applies when generating the calendar.
 *
 * Asr, Midnight and Higher Latitude are deliberately NOT part of this panel:
 * they are already controlled by the dropdowns on the Prayer Settings page,
 * and the Unified Method always uses those dropdowns so users never have two
 * places fighting over the same setting.
 *
 * The method entry lives in the `Methods_For_Calculation` settings array so it
 * is picked up by the same `addMethod()` flow as every other method. If the
 * entry does not exist yet it is created on first edit.
 *
 * Changes auto-save: the store is updated immediately on every edit (so
 * calendar generation always uses the latest criteria) and the database is
 * persisted on a short debounce. The debounced save reads from a ref that
 * always holds the latest form values, so a single change (like flipping the
 * seasonal toggle) can never be overwritten by a stale closure.
 *
 * Rendered in the Configure Settings page (Customizing → Calculation
 * Settings). Pass `standalone` when it is not inside another card.
 *
 * @module prayerSetting/UnifiedMethodSettings
 */
import React from 'react';
import { useLocationStore } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useConditional } from '../../state/storeConditional';
import { useCustomPrayerTimeSchedulesStore, hasActiveIqamahSchedule } from '../../state/useCustomPrayerTimeSchedulesStore';
import { toast } from 'sonner';
import {
  DEFAULT_SUMMER_END,
  DEFAULT_SUMMER_START,
  HIZBUL_ULAMA_DEFAULT_CURVE,
  MONTH_NAMES_SHORT,
  getSeasonForDate,
  normalizeUnifiedParams,
} from '../../utils/seasonalMethod';
import type { UnifiedMethodParams } from '../../utils/seasonalMethod';
import {
  parseLondonUnifiedTimetable,
  parsedToParams,
  CHART_PRAYERS,
  JAMAAH_PRAYERS,
} from '../../utils/londonTimetableParser';
import { __ } from '@wordpress/i18n';

export const UNIFIED_METHOD_CODE = 'UNIFIED_METHOD';
export const UNIFIED_METHOD_NAME = 'Unified Method';

/** Detect whether a selected dropdown option refers to the Unified Method. */
export const isUnifiedMethod = (value: any): boolean => {
  const code = String(value?.method || value?.meta || value?.name || '').toLowerCase();
  return code === UNIFIED_METHOD_CODE.toLowerCase() || code === UNIFIED_METHOD_NAME.toLowerCase();
};

// Default Unified Method profile: the Hizbul Ulama (London unified) monthly
// Fajr/Isha angle curve — the official sliding 12°–16° scale — applied to the
// WHOLE generated year (every month gets its own angle, smoothed between
// months). Maghrib = sunset + 3 min, plus the published-table safety margins
// Sunrise −3 / Dhuhr +6 / Asr +1 (East London style; the official 2011 spec
// −3/+5/+2 is one click away in the panel). The base Fajr/Isha fields below
// only act as fallbacks when a monthly cell is cleared. Asr / Midnight /
// Higher Latitude dropdowns are NOT stored here — they come from the Prayer
// Settings page.
const DEFAULT_PARAMS: UnifiedMethodParams = {
  fajr: 14.5, // base fallback (blank monthly cell)
  isha: '75 min', // base fallback (blank monthly cell)
  maghrib: '3 min',
  iterations: 2,
  marginsEnabled: true,
  sunriseOffset: -3,
  dhuhrOffset: 6,
  asrOffset: 1,
  // Hizbul Ulama monthly curve for the full year is the default profile.
  seasonMode: 'monthly',
  monthlySmooth: true,
  monthlyFajr: [...HIZBUL_ULAMA_DEFAULT_CURVE],
  monthlyIsha: [...HIZBUL_ULAMA_DEFAULT_CURVE],
};

// Hizbul Ulama summer cap — the starting point for the Auto (winter/summer)
// summer profile. Seeding the summer fields with these (instead of duplicating
// the winter values) means switching to Auto changes the summer months out of
// the box: e.g. September uses 12° instead of the winter 18°/14.5°.
const DEFAULT_SUMMER_FAJR: string | number = 12;
const DEFAULT_SUMMER_ISHA: string | number = 12;

const inputClass =
  'h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border';

const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5';

/** 12 blank month cells (January … December). */
const emptyMonths = (): string[] => Array(12).fill('');

/**
 * Normalize stored monthly arrays (numbers, '60 min', null, …) into 12
 * display strings; blank/missing entries become '' (use base field).
 */
const padMonths = (arr?: (string | number | null)[]): string[] => {
  const out = emptyMonths();
  if (Array.isArray(arr)) {
    arr.forEach((v, i) => {
      if (i < 12 && v !== undefined && v !== null && String(v).trim() !== '') out[i] = String(v);
    });
  }
  return out;
};

const monthsAreBlank = (arr: string[]): boolean => arr.every((v) => String(v).trim() === '');

/** Convert stored chart month arrays into textarea lines ('HH:MM' per day). */
const chartToLines = (arr?: (string | null)[][]): string[] => {
  const out: string[] = Array(12).fill('');
  if (Array.isArray(arr)) {
    arr.forEach((monthArr, m) => {
      if (m < 12 && Array.isArray(monthArr)) {
        out[m] = monthArr
          .map((v) => (v === undefined || v === null ? '' : String(v).trim()))
          .join('\n')
          .replace(/(\n)+$/, '');
      }
    });
  }
  return out;
};

/** Parse textarea lines ('HH:MM', 24h — one per day) into valid values or null. */
const parseChartLines = (text: string): (string | null)[] => {
  const out: (string | null)[] = [];
  String(text)
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trim();
      if (line === '') {
        out.push(null);
        return;
      }
      const m = line.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) {
        out.push(null);
        return;
      }
      const h = Number(m[1]);
      const min = Number(m[2]);
      if (h > 23 || min > 59) {
        out.push(null);
        return;
      }
      out.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    });
  return out;
};

/** 31-cell month column (day-1 index) from the textarea lines; blanks = null. */
const chartToParam = (linesText: string): (string | null)[] => {
  const parsed = parseChartLines(linesText);
  const out: (string | null)[] = Array(31).fill(null);
  parsed.forEach((v, i) => {
    if (i < 31) out[i] = v;
  });
  return out;
};



interface UnifiedMethodSettingsProps {
  /** Render as a standalone card (not nested inside another card). */
  standalone?: boolean;
}

// Stable empty fallback — a fresh `[]` per call would make React 18's
// useSyncExternalStore re-render forever when persisted data is non-array.
const EMPTY_METHODS: any[] = [];

const UnifiedMethodSettings: React.FC<UnifiedMethodSettingsProps> = ({ standalone }) => {
  // Guard against non-array persisted data (stale/corrupt sessionStorage) — the
  // store is rehydrated before the meta refresh replaces it with fresh API data.
  const methodsForCalculation = useLocationStore((state) =>
    Array.isArray(state.methodsForCalculation) ? state.methodsForCalculation : EMPTY_METHODS
  );
  const feature_toggles = useLocationStore((state) => state.feature_toggles || {});
  const mfc = useLocationStore((state) => state.mfc);
  const { updateIsReadyGenerator } = useConditional();
  // Advanced Schedules — when an enabled schedule actually overrides Iqamah
  // times, this adjustment is locked out (disabled controls + overlay) and
  // forced off, so the two features can never both change the Iqamah.
  const { customSchedules, isCustomSchedulesEnabled } = useCustomPrayerTimeSchedulesStore();
  const iqamahAdjustLockedBySchedules =
    isCustomSchedulesEnabled && hasActiveIqamahSchedule(customSchedules);
  const { saveBatch } = usePostMeta();

  const existingEntry = methodsForCalculation.find(
    (m: any) => String(m.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
  );
  // Normalize casing so params saved by SettingsManager (lowercase keys)
  // are read identically to those saved by this panel (camelCase).
  const currentParams = normalizeUnifiedParams(existingEntry?.params);

  // Master on/off for the whole Unified Method criteria — when off, the
  // calendar ignores these params entirely (engine defaults + Prayer Settings
  // dropdowns apply, like any standard method).
  const [enabled, setEnabled] = React.useState<boolean>(currentParams.enabled !== false);
  const [fajr, setFajr] = React.useState<string | number>(currentParams.fajr ?? DEFAULT_PARAMS.fajr!);
  const [isha, setIsha] = React.useState<string | number>(currentParams.isha ?? DEFAULT_PARAMS.isha!);
  const [maghrib, setMaghrib] = React.useState<string | number>(currentParams.maghrib ?? DEFAULT_PARAMS.maghrib!);
  const [iterations, setIterations] = React.useState<string | number>(currentParams.iterations ?? DEFAULT_PARAMS.iterations!);
  // Seasonal switching — when the stored entry never configured seasons (no
  // seasonMode key), fall back to the DEFAULT profile: Hizbul Ulama monthly
  // curve over the whole year, so selecting the Unified Method uses the
  // official 12°–16° angle scale for every month automatically.
  const [seasonMode, setSeasonMode] = React.useState<string>(
    currentParams.seasonMode || DEFAULT_PARAMS.seasonMode || 'manual'
  );
  const [summerStart, setSummerStart] = React.useState<string>(currentParams.summerStart || DEFAULT_SUMMER_START);
  const [summerEnd, setSummerEnd] = React.useState<string>(currentParams.summerEnd || DEFAULT_SUMMER_END);
  const [summerFajr, setSummerFajr] = React.useState<string | number>(currentParams.summerFajr ?? DEFAULT_SUMMER_FAJR);
  const [summerIsha, setSummerIsha] = React.useState<string | number>(currentParams.summerIsha ?? DEFAULT_SUMMER_ISHA);
  const [summerMaghrib, setSummerMaghrib] = React.useState<string | number>(currentParams.summerMaghrib ?? DEFAULT_PARAMS.maghrib!);
  // Monthly curve (Hizbul Ulama) — 12 cells per prayer, index 0 = January.
  const [monthlyFajr, setMonthlyFajr] = React.useState<string[]>(() =>
    padMonths(currentParams.monthlyFajr ?? DEFAULT_PARAMS.monthlyFajr)
  );
  const [monthlyIsha, setMonthlyIsha] = React.useState<string[]>(() =>
    padMonths(currentParams.monthlyIsha ?? DEFAULT_PARAMS.monthlyIsha)
  );
  // London Unified published safety margins (Sunrise −3 / Dhuhr +6 / Asr +1)
  const [marginsEnabled, setMarginsEnabled] = React.useState<boolean>(currentParams.marginsEnabled !== false);
  const [sunriseOffset, setSunriseOffset] = React.useState<string | number>(currentParams.sunriseOffset ?? DEFAULT_PARAMS.sunriseOffset!);
  const [dhuhrOffset, setDhuhrOffset] = React.useState<string | number>(currentParams.dhuhrOffset ?? DEFAULT_PARAMS.dhuhrOffset!);
  const [asrOffset, setAsrOffset] = React.useState<string | number>(currentParams.asrOffset ?? DEFAULT_PARAMS.asrOffset!);
  // Smooth the monthly curve between months (no step/jump on the 1st)
  const [monthlySmooth, setMonthlySmooth] = React.useState<boolean>(
    currentParams.monthlySmooth ?? DEFAULT_PARAMS.monthlySmooth === true
  );
  // Exact per-day chart mode (published Begins columns, 24h) — one textarea
  // set per prayer, each holding the selected month's 31 lines.
  const [chartMonth, setChartMonth] = React.useState<number>(new Date().getMonth());
  const [chartText, setChartText] = React.useState<Record<string, string[]>>(() => ({
    fajr: chartToLines(currentParams.chartFajr),
    sunrise: chartToLines(currentParams.chartSunrise),
    dhuhr: chartToLines(currentParams.chartDhuhr),
    asr: chartToLines(currentParams.chartAsr),
    // Optional second 'Asr column (2 Mithl / Hanafi) — drives asr_second_begins.
    asr2: chartToLines(currentParams.chartAsr2),
    maghrib: chartToLines(currentParams.chartMaghrib),
    isha: chartToLines(currentParams.chartIsha),
    // Imported Jamā'ah (congregation) columns — used for the Iqamah times.
    fajrJamaah: chartToLines(currentParams.chartFajrJamaah),
    dhuhrJamaah: chartToLines(currentParams.chartDhuhrJamaah),
    asrJamaah: chartToLines(currentParams.chartAsrJamaah),
    maghribJamaah: chartToLines(currentParams.chartMaghribJamaah),
    ishaJamaah: chartToLines(currentParams.chartIshaJamaah),
  }));
  // Imported Jamā'ah times replace the Iqamah columns while chart mode is on.
  const [jamaahEnabled, setJamaahEnabled] = React.useState<boolean>(currentParams.jamaahEnabled === true);
  // Also capture the Jamā'ah columns when importing a full-year timetable.
  const [importJamaah, setImportJamaah] = React.useState<boolean>(true);
  // Also capture the printed second 'Asr (2 Mithl / Hanafi) column — optional.
  const [importAsr2, setImportAsr2] = React.useState<boolean>(true);
  // Uniform Iqamah adjustment — one signed number of minutes added to EVERY
  // Iqamah time (imported Jamā'ah and computed alike) during generation.
  const [iqamahAdjustEnabled, setIqamahAdjustEnabled] = React.useState<boolean>(
    currentParams.iqamahAdjustEnabled === true
  );
  const [iqamahAdjustMinutes, setIqamahAdjustMinutes] = React.useState<string | number>(
    currentParams.iqamahAdjust ?? 0
  );
  // Full-year import: raw pasted timetable text (London Unified format).
  const [importText, setImportText] = React.useState<string>('');
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = React.useRef<any>(null);

  /** Keep numeric strings as numbers, keep unit strings ('90 min') as-is, drop blanks. */
  const normalizeParamValue = (value: string | number): string | number | undefined => {
    const s = String(value).trim();
    if (s === '') return undefined;
    if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    return s;
  };

  /**
   * Parse a signed whole-minute value for the uniform Iqamah adjustment,
   * clamped to ±24h. Non-numeric input becomes 0 (no shift) so a blank or a
   * stray character can never corrupt the generated timetable.
   */
  const parseSignedMinutes = (value: string | number): number => {
    const n = Math.trunc(Number(String(value).trim()));
    if (!Number.isFinite(n)) return 0;
    return Math.max(-1440, Math.min(1440, n));
  };

  // NOTE: normalizeParamValue must be declared ABOVE buildParams — buildParams
  // is invoked on the first render (via React.useRef(buildParams())) and a
  // `const` declared later would be in the temporal dead zone → ReferenceError
  // → the panel crashes on mount.
  const buildParams = (): UnifiedMethodParams => ({
    enabled,
    fajr: normalizeParamValue(fajr),
    isha: normalizeParamValue(isha),
    maghrib: normalizeParamValue(maghrib),
    iterations: Math.min(5, Math.max(1, parseInt(String(iterations), 10) || 1)),
    // London Unified safety margins — always stored (they only act while the
    // Unified Method is selected and enabled).
    marginsEnabled,
    sunriseOffset: normalizeParamValue(sunriseOffset),
    dhuhrOffset: normalizeParamValue(dhuhrOffset),
    asrOffset: normalizeParamValue(asrOffset),
    // Seasonal switching — only stored when enabled so older entries stay clean
    ...(seasonMode === 'auto'
      ? {
          seasonMode: 'auto' as const,
          summerStart: summerStart.trim(),
          summerEnd: summerEnd.trim(),
          summerFajr: normalizeParamValue(summerFajr),
          summerIsha: normalizeParamValue(summerIsha),
          summerMaghrib: normalizeParamValue(summerMaghrib),
        }
      : seasonMode === 'monthly'
        ? {
            seasonMode: 'monthly' as const,
            // 12 cells per prayer; blank cells stored as null (fall back to the
            // base Fajr/Isha fields above for that month). JSON drops undefined
            // inside arrays, so blanks must be null to keep month alignment.
            monthlyFajr: monthlyFajr.map((v) => normalizeParamValue(v) ?? null),
            monthlyIsha: monthlyIsha.map((v) => normalizeParamValue(v) ?? null),
            // Smooth the angle curve across month boundaries (no 1st-of-month
            // step) — only meaningful for pure-angle cells.
            monthlySmooth,
          }
        : seasonMode === 'chart'
          ? {
              seasonMode: 'chart' as const,
              // Absolute published times, one per day (index day-1), 12 months.
              chartFajr: chartText.fajr.map((text) => chartToParam(text)),
              chartSunrise: chartText.sunrise.map((text) => chartToParam(text)),
              chartDhuhr: chartText.dhuhr.map((text) => chartToParam(text)),
              chartAsr: chartText.asr.map((text) => chartToParam(text)),
              chartAsr2: (chartText.asr2 || []).map((text) => chartToParam(text)),
              chartMaghrib: chartText.maghrib.map((text) => chartToParam(text)),
              chartIsha: chartText.isha.map((text) => chartToParam(text)),
              // Imported Jamā'ah (congregation) columns for the Iqamah times.
              jamaahEnabled,
              chartFajrJamaah: chartText.fajrJamaah.map((text) => chartToParam(text)),
              chartDhuhrJamaah: chartText.dhuhrJamaah.map((text) => chartToParam(text)),
              chartAsrJamaah: chartText.asrJamaah.map((text) => chartToParam(text)),
              chartMaghribJamaah: chartText.maghribJamaah.map((text) => chartToParam(text)),
              chartIshaJamaah: chartText.ishaJamaah.map((text) => chartToParam(text)),
              // Uniform Iqamah adjustment (signed minutes) — applied to every
              // Iqamah time during generation.
              iqamahAdjustEnabled,
              iqamahAdjust: parseSignedMinutes(iqamahAdjustMinutes),
            }
          : { seasonMode: 'manual' as const }),
  });

  // Always holds the LATEST form values. The debounced save reads this ref
  // instead of a stale closure: setState() is async, so a closure captured in
  // the same event handler as the state change would persist the OLD value
  // (e.g. flipping the toggle to "auto" would save "manual" and snap back).
  const paramsRef = React.useRef(buildParams());
  React.useEffect(() => {
    paramsRef.current = buildParams();
  });

  // Sync the form when the stored entry changes from the outside (e.g. first
  // creation, reset from the admin). The guard skips OUR OWN auto-saves:
  // persistToStore writes a fresh params object into the store on every edit,
  // and without this check that write re-runs all the setters below — forcing a
  // second full render of this panel on every typing burst, which is what made
  // the inputs feel slow when changing numbers.
  React.useEffect(() => {
    const stored = existingEntry?.params;
    if (stored && JSON.stringify(stored) === JSON.stringify(buildParams())) return;
    setEnabled(currentParams.enabled !== false);
    setFajr(currentParams.fajr ?? DEFAULT_PARAMS.fajr!);
    setIsha(currentParams.isha ?? DEFAULT_PARAMS.isha!);
    setMaghrib(currentParams.maghrib ?? DEFAULT_PARAMS.maghrib!);
    setIterations(currentParams.iterations ?? DEFAULT_PARAMS.iterations!);
    setSeasonMode(currentParams.seasonMode || DEFAULT_PARAMS.seasonMode || 'manual');
    setSummerStart(currentParams.summerStart || DEFAULT_SUMMER_START);
    setSummerEnd(currentParams.summerEnd || DEFAULT_SUMMER_END);
    setSummerFajr(currentParams.summerFajr ?? DEFAULT_SUMMER_FAJR);
    setSummerIsha(currentParams.summerIsha ?? DEFAULT_SUMMER_ISHA);
    setSummerMaghrib(currentParams.summerMaghrib ?? DEFAULT_PARAMS.maghrib!);
    setMonthlyFajr(padMonths(currentParams.monthlyFajr ?? DEFAULT_PARAMS.monthlyFajr));
    setMonthlyIsha(padMonths(currentParams.monthlyIsha ?? DEFAULT_PARAMS.monthlyIsha));
    setMarginsEnabled(currentParams.marginsEnabled !== false);
    setSunriseOffset(currentParams.sunriseOffset ?? DEFAULT_PARAMS.sunriseOffset!);
    setDhuhrOffset(currentParams.dhuhrOffset ?? DEFAULT_PARAMS.dhuhrOffset!);
    setAsrOffset(currentParams.asrOffset ?? DEFAULT_PARAMS.asrOffset!);
    setMonthlySmooth(currentParams.monthlySmooth ?? DEFAULT_PARAMS.monthlySmooth === true);
    setJamaahEnabled(currentParams.jamaahEnabled === true);
    setIqamahAdjustEnabled(currentParams.iqamahAdjustEnabled === true);
    setIqamahAdjustMinutes(currentParams.iqamahAdjust ?? 0);
    setChartText({
      fajr: chartToLines(currentParams.chartFajr),
      sunrise: chartToLines(currentParams.chartSunrise),
      dhuhr: chartToLines(currentParams.chartDhuhr),
      asr: chartToLines(currentParams.chartAsr),
      asr2: chartToLines(currentParams.chartAsr2),
      maghrib: chartToLines(currentParams.chartMaghrib),
      isha: chartToLines(currentParams.chartIsha),
      fajrJamaah: chartToLines(currentParams.chartFajrJamaah),
      dhuhrJamaah: chartToLines(currentParams.chartDhuhrJamaah),
      asrJamaah: chartToLines(currentParams.chartAsrJamaah),
      maghribJamaah: chartToLines(currentParams.chartMaghribJamaah),
      ishaJamaah: chartToLines(currentParams.chartIshaJamaah),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEntry?.id, existingEntry?.params]);

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /** Write params into the store immediately so generation always uses them. */
  const persistToStore = (params: UnifiedMethodParams): any[] => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    );

    const raw = useLocationStore.getState().methodsForCalculation;
    const current = Array.isArray(raw) ? raw : [];
    const exists = current.some(
      (m: any) => String(m.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
    );
    const nextId =
      current.reduce((max: number, m: any) => Math.max(max, Number(m?.id) || 0), 0) + 1;

    const updated = exists
      ? current.map((m: any) =>
          String(m.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
            ? { ...m, params: cleanParams }
            : m
        )
      : [
          ...current,
          { id: nextId, name: UNIFIED_METHOD_NAME, method: UNIFIED_METHOD_CODE, params: cleanParams },
        ];

    useLocationStore.getState().updateMethodsForCalculation(updated);

    // Keep the Calculation Method dropdown options in sync with the store
    const opts = useLocationStore.getState().methodsForCal;
    const optsValue = Array.isArray(opts?.value) ? opts.value : [];
    const optExists = optsValue.some(
      (o: any) => String(o.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
    );
    const newOptsValue = optExists
      ? optsValue.map((o: any) =>
          String(o.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
            ? { ...o, params: cleanParams }
            : o
        )
      : [...optsValue, { id: nextId, name: UNIFIED_METHOD_NAME, method: UNIFIED_METHOD_CODE, params: cleanParams }];
    useLocationStore.getState().updateSetMethodsForCal({ ...opts, value: newOptsValue });

    return updated;
  };

  // Reflect every committed edit in the store IMMEDIATELY (right after each
  // render) so calendar generation — which reads the store — always uses the
  // latest criteria, even when "Generate Calendar" is clicked within the
  // debounce of the database save below. Without this, changing a monthly
  // angle and generating right away could compute with the OLD values.
  const firstPersistRef = React.useRef(true);
  React.useEffect(() => {
    if (firstPersistRef.current) {
      firstPersistRef.current = false;
      return;
    }
    const current = normalizeUnifiedParams(existingEntry?.params);
    const next = buildParams();
    // Content guard: pure re-renders and identical auto-loads must not rewrite
    // the store (only actual edits do).
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    persistToStore(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    fajr,
    isha,
    maghrib,
    iterations,
    seasonMode,
    summerStart,
    summerEnd,
    summerFajr,
    summerIsha,
    summerMaghrib,
    monthlyFajr,
    monthlyIsha,
    monthlySmooth,
    marginsEnabled,
    sunriseOffset,
    dhuhrOffset,
    asrOffset,
    jamaahEnabled,
    iqamahAdjustEnabled,
    iqamahAdjustMinutes,
  ]);

  /** Debounced database save — called on every edit. */
  const scheduleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      // Read the latest form values from the ref, never a stale closure.
      const updated = persistToStore(paramsRef.current);
      setSaveState('saving');
      try {
        await saveBatch({ Methods_For_Calculation: updated });
        // Mark the calendar as stale so "Generate Calendar" re-runs with the new criteria
        updateIsReadyGenerator(true);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (error) {
        console.error('Failed to save Unified Method settings:', error);
        toast.error(__('Failed to save Unified Method settings', 'fiveprayer'));
        setSaveState('idle');
      }
    }, 800);
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    scheduleSave();
  };

  // Never let the uniform adjustment stay ON while an Advanced Schedule owns
  // the Iqamah: the moment that becomes true, switch the toggle off and persist
  // it, so the two features cannot both be active at once.
  React.useEffect(() => {
    if (iqamahAdjustLockedBySchedules && iqamahAdjustEnabled) {
      setIqamahAdjustEnabled(false);
      scheduleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iqamahAdjustLockedBySchedules, iqamahAdjustEnabled]);

  /** Switching to the monthly mode pre-fills the Hizbul Ulama curve once. */
  const handleSeasonModeChange = (value: string) => {
    if (value === 'monthly' && monthsAreBlank(monthlyFajr) && monthsAreBlank(monthlyIsha)) {
      const defaults = HIZBUL_ULAMA_DEFAULT_CURVE.map(String);
      setMonthlyFajr(defaults);
      setMonthlyIsha(defaults);
    }
    handleChange(setSeasonMode, value);
  };

  /** Edit one monthly cell while keeping the other 11 cells intact. */
  const handleMonthCell = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(list.map((v, i) => (i === index ? value : v)));
    scheduleSave();
  };

  /** Fill every month of Fajr & Isha with the published Hizbul Ulama curve. */
  const loadHizbulCurve = () => {
    const defaults = HIZBUL_ULAMA_DEFAULT_CURVE.map(String);
    setMonthlyFajr(defaults);
    setMonthlyIsha(defaults);
    scheduleSave();
  };

  /** Select the month being edited in the exact-chart editor. */
  const handleChartMonthSelect = (m: number) => setChartMonth(m);

  /** Edit one prayer's textarea of the currently selected chart month. */
  const handleChartText = (prayer: string, value: string) => {
    const idx = chartMonth;
    setChartText((prev) => ({
      ...prev,
      [prayer]: (prev[prayer] || []).map((t, i) => (i === idx ? value : t)),
    }));
    scheduleSave();
  };

  /** Clear every prayer's textarea of the currently selected chart month. */
  const clearChartMonth = () => {
    const idx = chartMonth;
    setChartText((prev) => {
      const next: Record<string, string[]> = {};
      Object.keys(prev).forEach((p) => {
        next[p] = prev[p].map((t, i) => (i === idx ? '' : t));
      });
      return next;
    });
    scheduleSave();
  };

  /**
   * Parse a pasted full-year London Unified timetable (East London 12-column
   * layout, or the Date/Hijri/7-times AM-PM layout) and fill all 12 months ×
   * 6 prayers of the chart. When the Jamā'ah checkbox is on AND the pasted
   * table carries congregation columns (only the East London layout does),
   * they are also captured and the Iqamah toggle is enabled. The data is
   * saved to the database through the same params pipeline
   * (persistToStore + debounced saveBatch) — nothing is hardcoded.
   */
  const handleImportTimetable = () => {
    const parsed = parseLondonUnifiedTimetable(importText);
    if (!parsed) {
      toast.error(
        __('Could not read the pasted timetable. Paste the full year (all 12 month sections) in either the printed East London format (rows like “Thu 1 6:26 6:46 8:03 12:09 …”) or the Date/Hijri format (rows like “1Thu 12 Rajab 1447 6:26 AM 8:03 AM 12:09 PM …”).', 'fiveprayer')
      );
      return;
    }
    const includeJamaah = importJamaah && parsed.hasJamaah;
    const includeAsr2 = importAsr2 && parsed.hasAsr2;
    const params = parsedToParams(parsed, includeJamaah, includeAsr2);
    // Always write EVERY chart key (falling back to the previous text when a
    // column was not imported). setChartText() REPLACES the state object, so a
    // conditionally-omitted key would become undefined and crash buildParams —
    // this keeps the shape stable for the 'Asr 2 and Jamā'ah textareas alike.
    const keep = (key: string) => (chartText[key] || Array(12).fill(''));
    setChartText({
      fajr: chartToLines(params.chartFajr),
      sunrise: chartToLines(params.chartSunrise),
      dhuhr: chartToLines(params.chartDhuhr),
      asr: chartToLines(params.chartAsr),
      // Only overwrite the 'Asr 2 textareas when the table carried the column
      // and the option is on; otherwise keep whatever is already there.
      asr2: includeAsr2 ? chartToLines(params.chartAsr2) : keep('asr2'),
      maghrib: chartToLines(params.chartMaghrib),
      isha: chartToLines(params.chartIsha),
      fajrJamaah: includeJamaah ? chartToLines(params.chartFajrJamaah) : keep('fajrJamaah'),
      dhuhrJamaah: includeJamaah ? chartToLines(params.chartDhuhrJamaah) : keep('dhuhrJamaah'),
      asrJamaah: includeJamaah ? chartToLines(params.chartAsrJamaah) : keep('asrJamaah'),
      maghribJamaah: includeJamaah ? chartToLines(params.chartMaghribJamaah) : keep('maghribJamaah'),
      ishaJamaah: includeJamaah ? chartToLines(params.chartIshaJamaah) : keep('ishaJamaah'),
    });
    if (includeJamaah) setJamaahEnabled(true);
    setImportText('');
    scheduleSave();
    const byMonth = parsed.rowsByMonth
      .map((n, i) => (n > 0 ? `${MONTH_NAMES_SHORT[i].slice(0, 3)}: ${n}` : ''))
      .filter(Boolean)
      .join(', ');
    toast.success(
      `Imported ${parsed.rows} days — ${byMonth}. ` +
        (parsed.hasJamaah
          ? includeJamaah
            ? 'Jamā‘ah times included — they now fill the Iqamah columns. Saved to the database.'
            : 'Jamā‘ah columns were in the table but not imported (checkbox off). Saved to the database.'
          : includeJamaah
            ? 'This format has no Jamā‘ah columns — only the prayer times were imported. Saved to the database.'
            : 'Saved to the database.') +
        (parsed.hasAsr2
          ? includeAsr2
            ? ' Second ‘Asr (2 Mithl) time captured.'
            : ' Second ‘Asr column was in the table but not imported (checkbox off).'
          : ' This format has no second ‘Asr column.')
    );
  };

  const saveStatus =
    saveState === 'saving' ? (
      <span className="text-[11px] text-gray-500">{__('Saving…', 'fiveprayer')}</span>
    ) : saveState === 'saved' ? (
      <span className="text-[11px] text-green-600 font-medium">{__('✓ Saved', 'fiveprayer')}</span>
    ) : (
      <span className="text-[11px] text-gray-400">{__('Changes save automatically', 'fiveprayer')}</span>
    );

  // Live indicator — which criteria apply today (and would be used by
  // "Generate Calendar" for today's date).
  const today = new Date();
  const todaySeason = getSeasonForDate(today, summerStart, summerEnd);
  const todayMonth = today.getMonth();
  const todayMonthlyFajr = String(monthlyFajr[todayMonth] || '').trim() || fajr;
  const todayMonthlyIsha = String(monthlyIsha[todayMonth] || '').trim() || isha;
  const activeForToday =
    seasonMode === 'auto'
      ? todaySeason === 'summer'
        ? { fajr: summerFajr, isha: summerIsha, maghrib: summerMaghrib }
        : { fajr, isha, maghrib }
      : { fajr, isha, maghrib };
  const seasonLabel =
    seasonMode === 'auto'
      ? todaySeason === 'summer' ? 'SUMMER' : 'WINTER'
      : seasonMode === 'monthly'
        ? MONTH_NAMES_SHORT[todayMonth].toUpperCase()
        : null;

  // Live status — tells the admin EXACTLY why the criteria are (or are not)
  // active right now, so a silent no-op can never happen again (the #1
  // confusion: "I turned on Auto/seasonal and nothing changed").
  const unifiedFeatureOff = feature_toggles?.['Unified_Method_Settings'] === false;
  const unifiedSelected = isUnifiedMethod(mfc as any);
  const autoSameAsWinter =
    seasonMode === 'auto' &&
    String(summerFajr ?? '').trim() === String(fajr ?? '').trim() &&
    String(summerIsha ?? '').trim() === String(isha ?? '').trim();
  const blockers: string[] = [];
  if (unifiedFeatureOff)
    blockers.push('The “Unified Method” feature is switched OFF in Feature Switches → turn it back on there.');
  if (!enabled)
    blockers.push('“Enable Unified Method criteria” is OFF (the top switch on this panel).');
  if (!unifiedSelected)
    blockers.push('The Unified Method is not the selected calculation method — choose it under Prayer Settings → Calculation Method.');
  if (seasonMode === 'auto' && autoSameAsWinter)
    blockers.push('Auto mode: the Summer profile is identical to Winter, so switching changes nothing. Set different Summer Fajr/Isha values (e.g. 12).');

  return (
    <div className={`rounded-xl border border-purple-200 bg-purple-50/50 overflow-hidden ${standalone ? '' : 'mt-4'}`}>
      <div className="px-5 py-3.5 bg-purple-50 border-b border-purple-200 flex items-start gap-3">
        <svg className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-purple-900">{__('Unified Method — Custom Criteria', 'fiveprayer')}</h3>
          <p className="text-xs text-purple-700">{__('Map the exact calculation criteria for this method. Angle values like ', 'fiveprayer')}<code className="text-[11px] bg-purple-100 px-1 rounded-sm">18</code>{__(' or minute values like', 'fiveprayer')}{' '}
            <code className="text-[11px] bg-purple-100 px-1 rounded-sm">{__('90 min', 'fiveprayer')}</code>{__(' are supported for Fajr/Isha/Maghrib. Asr, Midnight and Higher Latitude are ', 'fiveprayer')}<strong>{__('not', 'fiveprayer')}</strong>{__(' set here — they are controlled by the dropdowns on the Prayer Settings page, and the Unified Method always uses those. Below you can switch criteria by season (winter/summer) or use a per-month Hizbul Ulama style curve.', 'fiveprayer')}</p>
        </div>
      </div>

      <div className="p-5">
        {/* Status strip — why the criteria are or are not active right now */}
        <div
          className={`mb-4 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed ${
            blockers.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {blockers.length > 0 ? (
            <>
              <strong>{__('⚠️ These criteria are NOT being applied right now:', 'fiveprayer')}</strong>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <strong>{__('✅ Criteria active.', 'fiveprayer')}</strong>{__(' Seasonal / monthly switching and the criteria below apply when you click', 'fiveprayer')}{' '}
              <strong>{__('Generate Calendar', 'fiveprayer')}</strong>.
            </>
          )}
        </div>

        {/* On/off switch for the whole Unified Method criteria */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4 bg-white border border-purple-200 rounded-lg px-4 py-3">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-purple-900">{__('Enable Unified Method criteria', 'fiveprayer')}</h4>
            <p className="text-xs text-purple-700 mt-0.5">{__('On: the criteria below (Fajr/Isha/Maghrib, Iterations, seasonal/monthly switching) are used when generating. Off: they are ignored — the calendar calculates like a standard method (engine defaults + Prayer Settings dropdowns).', 'fiveprayer')}</p>
          </div>
          <button
            type="button"
            onClick={() => handleChange(setEnabled, !enabled)}
            className={`h-10 px-4 flex items-center gap-2 rounded-lg border text-sm font-medium transition-all focus:outline-hidden shrink-0 ${
              enabled ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <span>{enabled ? 'Enabled' : 'Disabled'}</span>
            <span className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`}
              />
            </span>
          </button>
        </div>
        {!enabled && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">{__('Unified Method criteria are ', 'fiveprayer')}<strong>{__('disabled', 'fiveprayer')}</strong>{__(' — the calendar will not use the values below until you enable it again.', 'fiveprayer')}</p>
        )}

        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <div>
            <label className={labelClass}>{__('Fajr Angle', 'fiveprayer')}{seasonMode === 'monthly' && (
                <span className="text-[10px] font-normal text-purple-500">{__(' · blank months only', 'fiveprayer')}</span>
              )}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={String(fajr)}
              onChange={(e) => handleChange(setFajr, e.target.value)}
              className={`${inputClass} ${seasonMode === 'monthly' ? 'border-purple-200 bg-purple-50/40' : ''}`}
              placeholder={__('e.g., 18 or 60 min', 'fiveprayer')}
              title={seasonMode === __('monthly', 'fiveprayer')
                ? __('In Monthly curve (Hizbul Ulama) mode this is only the fallback for a month left blank — the 12-month table below controls Fajr.', 'fiveprayer')
                : undefined}
            />
          </div>
          <div>
            <label className={labelClass}>{__('Isha Angle', 'fiveprayer')}{seasonMode === 'monthly' && (
                <span className="text-[10px] font-normal text-purple-500">{__(' · blank months only', 'fiveprayer')}</span>
              )}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={String(isha)}
              onChange={(e) => handleChange(setIsha, e.target.value)}
              className={`${inputClass} ${seasonMode === 'monthly' ? 'border-purple-200 bg-purple-50/40' : ''}`}
              placeholder={__('e.g., 17 or 90 min', 'fiveprayer')}
              title={seasonMode === __('monthly', 'fiveprayer')
                ? __('In Monthly curve (Hizbul Ulama) mode this is only the fallback for a month left blank — the 12-month table below controls Isha.', 'fiveprayer')
                : undefined}
            />
          </div>
          <div>
            <label className={labelClass}>{__('Maghrib', 'fiveprayer')}</label>
            <input
              type="text"
              inputMode="decimal"
              value={String(maghrib)}
              onChange={(e) => handleChange(setMaghrib, e.target.value)}
              className={inputClass}
              placeholder={__('e.g., 4 degrees or 1 min', 'fiveprayer')}
            />
          </div>
          <div>
            <label className={labelClass}>{__('Iterations', 'fiveprayer')}</label>
            <input
              type="number"
              min={1}
              max={5}
              value={String(iterations)}
              onChange={(e) => handleChange(setIterations, e.target.value)}
              className={inputClass}
              title={__('Number of calculation passes (1-5). Higher values converge more accurately at extreme latitudes.', 'fiveprayer')}
            />
          </div>
        </div>

        <p className={`text-[11px] text-gray-500 mt-3 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <strong className="text-gray-600">{__('What is Iterations?', 'fiveprayer')}</strong>{__(' The calculation engine re-runs the time computation this many times, using each pass\'s result as the starting point for the next, so the sun\'s exact position is refined. ', 'fiveprayer')}<strong>2</strong>{__(' is plenty for normal use; only raise it (up to 5) if you are far north and want maximum precision. It does not change the method — just the precision of the same times.', 'fiveprayer')}</p>

        {/* Per-mode guide: which settings actually apply (so nothing above is
            mistakenly believed to overwrite the chosen seasonal style) */}
        {seasonMode === 'monthly' && enabled && (
          <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 text-[11px] text-purple-800">
            <strong className="text-purple-900">{__('💡 Hizbul Ulama monthly curve — what actually applies:', 'fiveprayer')}</strong>
            <ul className="mt-1 space-y-0.5 list-disc ml-4">
              <li>
                <strong>{__('Fajr & Isha', 'fiveprayer')}</strong>{__(' come ', 'fiveprayer')}<strong>{__('only', 'fiveprayer')}</strong>{__(' from the 12-month table below. The Fajr/Isha fields above are just the fallback for a month you leave ', 'fiveprayer')}<strong>{__('blank', 'fiveprayer')}</strong> ({String(fajr)} / {String(isha)}{__(') — they', 'fiveprayer')}{' '}
                <strong>{__('cannot overwrite', 'fiveprayer')}</strong>{__(' the curve.', 'fiveprayer')}</li>
              <li>
                <strong>{__('Maghrib (', 'fiveprayer')}{String(maghrib)})</strong>{__(' and ', 'fiveprayer')}<strong>{__('Iterations (', 'fiveprayer')}{String(iterations)})</strong>{__(' above are still used as-is.', 'fiveprayer')}</li>
              <li>
                <strong>{__('Sunrise / Dhuhr / Asr margins', 'fiveprayer')}</strong>{__(' below are still applied on top of the computed times — leave the presets if you follow the London Unified table.', 'fiveprayer')}</li>
              <li>
                <strong>{__('Asr method, Midnight and Higher Latitude', 'fiveprayer')}</strong>{__(' are not on this page — they come from the Prayer Settings dropdowns and stay fixed all year.', 'fiveprayer')}</li>
            </ul>
            <p className="mt-1">{__('Everything else on this page can be left untouched — nothing here accidentally overrides the monthly curve.', 'fiveprayer')}</p>
          </div>
        )}

        {/* London Unified published-table safety margins */}
        <div className={`mt-5 border-t border-purple-200 pt-4 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-purple-900">{__('London Unified safety margins (official 2011 spec)', 'fiveprayer')}</h4>
              <p className="text-[11px] text-purple-700 mt-0.5 max-w-xl">{__('The London Unified Prayer Timetable (agreed 2011) calculates the base times at ', 'fiveprayer')}<strong>{__('Charing Cross (51.5073°N, 0.12755°W)', 'fiveprayer')}</strong>{__(' with standard astronomical formulas, then prints fixed safety margins for the whole M25:', 'fiveprayer')}<strong>{__('Sunrise −3 min · Zuhr +5 min · ‘Asr +2 min · Sunset +3 min', 'fiveprayer')}</strong>{__('. Because that table is computed in Excel (full Jean Meeus), and this plugin computes in JavaScript, the official document itself notes times can differ by', 'fiveprayer')}{' '}
                <strong>{__('~1 minute', 'fiveprayer')}</strong>{__(' between platforms. That is why two presets are offered: the official spec values, and the “East London printed” values (−3/+6/+1) which reproduce the published East London sheet ', 'fiveprayer')}<em>{__('exactly to the minute', 'fiveprayer')}</em>{__(' on this engine. While on, these offsets ', 'fiveprayer')}<strong>{__('replace', 'fiveprayer')}</strong>{__(' the global Tune Prayer values for those three prayers during generation (nothing is applied twice).', 'fiveprayer')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange(setMarginsEnabled, !marginsEnabled)}
              className={`h-10 px-4 flex items-center gap-2 rounded-lg border text-sm font-medium transition-all focus:outline-hidden shrink-0 ${
                marginsEnabled ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
            >
              <span>{marginsEnabled ? 'Margins on' : 'Margins off'}</span>
              <span className={`w-9 h-5 rounded-full relative transition-colors ${marginsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${marginsEnabled ? 'left-[18px]' : 'left-0.5'}`}
                />
              </span>
            </button>
          </div>

          <div className={`mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 ${marginsEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className={labelClass}>{__('Sunrise margin (minutes)', 'fiveprayer')}</label>
              <input
                type="number"
                step="0.5"
                value={String(sunriseOffset)}
                onChange={(e) => handleChange(setSunriseOffset, e.target.value)}
                className={inputClass}
                placeholder={__('e.g., -3', 'fiveprayer')}
                title={__('Published Sunrise = astronomical sunrise − this many minutes (East London: −3).', 'fiveprayer')}
              />
            </div>
            <div>
              <label className={labelClass}>{__('Dhuhr margin (minutes)', 'fiveprayer')}</label>
              <input
                type="number"
                step="0.5"
                value={String(dhuhrOffset)}
                onChange={(e) => handleChange(setDhuhrOffset, e.target.value)}
                className={inputClass}
                placeholder={__('e.g., 6', 'fiveprayer')}
                title={__('Published Dhuhr = zawal + this many minutes (East London: +6).', 'fiveprayer')}
              />
            </div>
            <div>
              <label className={labelClass}>{__('Asr margin (minutes)', 'fiveprayer')}</label>
              <input
                type="number"
                step="0.5"
                value={String(asrOffset)}
                onChange={(e) => handleChange(setAsrOffset, e.target.value)}
                className={inputClass}
                placeholder={__('e.g., 1', 'fiveprayer')}
                title={__('Published Asr = Standard/Shafi Asr + this many minutes (East London: +1).', 'fiveprayer')}
              />
            </div>
            <div className="flex items-end">
              <div className="w-full grid gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSunriseOffset(-3);
                    setDhuhrOffset(5);
                    setAsrOffset(2);
                    scheduleSave();
                  }}
                  className="h-10 w-full px-3 text-[11px] font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-hidden"
                  title={__('Official 2011 London Unified spec: Sunrise −3, Zuhr +5, ‘Asr +2, Sunset +3 (Excel/Jean Meeus values).', 'fiveprayer')}
                >{__('↺ Official spec (−3 / +5 / +2)', 'fiveprayer')}</button>
                <button
                  type="button"
                  onClick={() => {
                    setSunriseOffset(-3);
                    setDhuhrOffset(6);
                    setAsrOffset(1);
                    scheduleSave();
                  }}
                  className="h-10 w-full px-3 text-[11px] font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-hidden"
                  title={__('Calibrated to the printed East London sheet on this engine: Sunrise −3, Zuhr +6, ‘Asr +1 (accounts for the Excel vs JavaScript ~1 min difference).', 'fiveprayer')}
                >{__('↺ East London printed (−3 / +6 / +1)', 'fiveprayer')}</button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">{__('The Asr ', 'fiveprayer')}<em>{__('method', 'fiveprayer')}</em>{__(' still comes from the Prayer Settings dropdown (the school you pick there — Shafi’i, Maliki or Hanbali on 1 Mithl, Hanafi on 2 Mithl) — the margin only adds a minute offset on top of the computed Asr.', 'fiveprayer')}</p>
        </div>

        {/* Seasonal (winter/summer) auto-switching */}
        <div className={`mt-5 border-t border-purple-200 pt-4 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-purple-900">{__('Seasonal / Monthly Criteria', 'fiveprayer')}</h4>
              <p className="text-[11px] text-purple-700 mt-0.5 max-w-xl">{__('Many UK mosques use ', 'fiveprayer')}<strong>{__('18°/17° in winter', 'fiveprayer')}</strong>{__(' but switch to time-based criteria (e.g. Fajr ~90 min before sunrise, Isha 75 min after sunset) in summer when 18° is unreachable. ', 'fiveprayer')}<strong>{__('Manual', 'fiveprayer')}</strong>{__(' uses one criteria all year;', 'fiveprayer')}{' '}
                <strong>{__('Auto', 'fiveprayer')}</strong>{__(' switches between a winter and a summer profile; ', 'fiveprayer')}<strong>{__('Monthly curve', 'fiveprayer')}</strong>{__(' uses a different Fajr/Isha value for each calendar month (the Hizbul Ulama London unified style). In all modes "Generate Calendar" produces the correct timetable in one pass.', 'fiveprayer')}</p>
            </div>
            <select
              value={seasonMode}
              onChange={(e) => handleSeasonModeChange(e.target.value)}
              className="h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border"
            >
              <option value="manual">{__('Manual — one criteria all year', 'fiveprayer')}</option>
              <option value="auto">{__('Auto — switch winter / summer', 'fiveprayer')}</option>
              <option value="monthly">{__('Monthly curve — Hizbul Ulama style', 'fiveprayer')}</option>
              <option value="chart">{__('Exact chart — per-day published times (Fajr & Isha)', 'fiveprayer')}</option>
            </select>
          </div>

          {seasonMode === 'auto' && (
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>{__('Summer starts (MM-DD)', 'fiveprayer')}</label>
                <input
                  type="text"
                  value={summerStart}
                  onChange={(e) => handleChange(setSummerStart, e.target.value)}
                  className={inputClass}
                  placeholder={__('e.g., 04-01', 'fiveprayer')}
                />
              </div>
              <div>
                <label className={labelClass}>{__('Summer ends (MM-DD)', 'fiveprayer')}</label>
                <input
                  type="text"
                  value={summerEnd}
                  onChange={(e) => handleChange(setSummerEnd, e.target.value)}
                  className={inputClass}
                  placeholder={__('e.g., 09-30', 'fiveprayer')}
                />
              </div>
              <div>
                <label className={labelClass}>{__('Summer Fajr', 'fiveprayer')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={String(summerFajr)}
                  onChange={(e) => handleChange(setSummerFajr, e.target.value)}
                  className={inputClass}
                  placeholder={__('e.g., 60 min or 12', 'fiveprayer')}
                />
              </div>
              <div>
                <label className={labelClass}>{__('Summer Isha', 'fiveprayer')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={String(summerIsha)}
                  onChange={(e) => handleChange(setSummerIsha, e.target.value)}
                  className={inputClass}
                  placeholder={__('e.g., 75 min or 12', 'fiveprayer')}
                />
              </div>
              <div>
                <label className={labelClass}>{__('Summer Maghrib', 'fiveprayer')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={String(summerMaghrib)}
                  onChange={(e) => handleChange(setSummerMaghrib, e.target.value)}
                  className={inputClass}
                  placeholder={__('e.g., 3 min or 4', 'fiveprayer')}
                />
              </div>
            </div>
          )}

          {seasonMode === 'monthly' && (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-purple-700 max-w-xl">{__('Give each calendar month its own ', 'fiveprayer')}<strong>{__('Fajr', 'fiveprayer')}</strong>{__(' and ', 'fiveprayer')}<strong>{__('Isha', 'fiveprayer')}</strong>{__(' value — an angle like', 'fiveprayer')}{' '}
                  <code className="text-[10px] bg-purple-100 px-1 rounded-sm">15</code>{__(' or a minutes offset like', 'fiveprayer')}{' '}
                  <code className="text-[10px] bg-purple-100 px-1 rounded-sm">{__('60 min', 'fiveprayer')}</code>{__('. A blank cell falls back to the base Fajr/Isha fields above. Maghrib always comes from the base Maghrib field above.', 'fiveprayer')}</p>
                <button
                  type="button"
                  onClick={loadHizbulCurve}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-hidden shrink-0"
                >{__('↺ Load Hizbul Ulama curve', 'fiveprayer')}</button>
              </div>

              {/* Smooth the curve between months — the published London charts
                  glide continuously (e.g. September 13.9° → 14.35° mid-month →
                  14.8°), they do not step on the 1st. */}
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap bg-white border border-purple-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-purple-900">{__('Smooth the curve between months', 'fiveprayer')}</h4>
                  <p className="text-[10px] text-purple-700 mt-0.5 max-w-xl">{__('Interpolate the angle across each month (anchored on the 15th) instead of stepping on the 1st — this is how the published London unified Fajr/Isha charts actually move. Only pure-angle cells are interpolated; minute values like', 'fiveprayer')}{' '}
                    <code className="text-[10px] bg-purple-100 px-1 rounded-sm">{__('90 min', 'fiveprayer')}</code>{__(' stay flat.', 'fiveprayer')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange(setMonthlySmooth, !monthlySmooth)}
                  className={`h-9 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 ${
                    monthlySmooth ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  <span>{monthlySmooth ? 'Smoothing on' : 'Smoothing off'}</span>
                  <span className={`w-8 h-4.5 rounded-full relative transition-colors ${monthlySmooth ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span
                      className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${monthlySmooth ? 'left-[16px]' : 'left-0.5'}`}
                    />
                  </span>
                </button>
              </div>
              <div className="mt-3 grid gap-1.5">
                <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-1.5 px-1">
                  <span className="text-[10px] font-semibold text-purple-900 uppercase tracking-wide">{__('Month', 'fiveprayer')}</span>
                  <span className="text-[10px] font-semibold text-purple-900 uppercase tracking-wide">{__('Fajr (angle or min)', 'fiveprayer')}</span>
                  <span className="text-[10px] font-semibold text-purple-900 uppercase tracking-wide">{__('Isha (angle or min)', 'fiveprayer')}</span>
                </div>
                {MONTH_NAMES_SHORT.map((monthName, index) => (
                  <div
                    key={monthName}
                    className={`grid grid-cols-[1.1fr_1fr_1fr] gap-1.5 items-center px-1 rounded-sm ${
                      index === todayMonth ? 'bg-purple-100/70 ring-1 ring-purple-300' : ''
                    }`}
                  >
                    <span className="text-xs text-gray-700 py-1">
                      {monthName}
                      {index === todayMonth && <span className="ml-1 text-[9px] text-purple-600 font-semibold">{__('(today)', 'fiveprayer')}</span>}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monthlyFajr[index] || ''}
                      onChange={(e) => handleMonthCell(monthlyFajr, setMonthlyFajr, index, e.target.value)}
                      className="h-8 px-2 text-sm border border-gray-200 rounded-lg bg-white focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border"
                      placeholder={__('e.g., 18 or 60 min', 'fiveprayer')}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monthlyIsha[index] || ''}
                      onChange={(e) => handleMonthCell(monthlyIsha, setMonthlyIsha, index, e.target.value)}
                      className="h-8 px-2 text-sm border border-gray-200 rounded-lg bg-white focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border"
                      placeholder={__('e.g., 17 or 75 min', 'fiveprayer')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {seasonMode === 'chart' && (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-purple-700 max-w-xl">{__('Pinned days use the ', 'fiveprayer')}<strong>{__('exact published minutes', 'fiveprayer')}</strong>{__(' (rounding and smoothing never touch them); blank days use the normal calculation with the criteria above. Import the full printed year once and everything is saved to your database — nothing is hardcoded. You can also edit any month/prayer below (24-hour times, one per line, line 1 = day 1).', 'fiveprayer')}</p>
                <button
                  type="button"
                  onClick={clearChartMonth}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors focus:outline-hidden shrink-0"
                >{__('Clear ', 'fiveprayer')}{MONTH_NAMES_SHORT[chartMonth]}
                </button>
              </div>

              {/* Full-year import (London Unified / East London printed format) */}
              <div className="mt-3 bg-white border border-purple-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-purple-900">{__('Import a full-year timetable', 'fiveprayer')}</h4>
                <p className="text-[11px] text-purple-700 mt-0.5">{__('Paste the whole printed year (all 12 month sections, e.g. ', 'fiveprayer')}<code className="text-[10px] bg-purple-100 px-1 rounded-sm">{__('JANUARY 2026', 'fiveprayer')}</code>…
                  <code className="text-[10px] bg-purple-100 px-1 rounded-sm">{__('DECEMBER 2026', 'fiveprayer')}</code>{__('). Two layouts are accepted: the printed East London format (rows like ', 'fiveprayer')}<code className="text-[10px] bg-purple-100 px-1 rounded-sm">{__('Thu 1 6:26 6:46 8:03 12:09 …', 'fiveprayer')}</code>{__(', includes Jamā‘ah columns) and the Date/Hijri format (rows like', 'fiveprayer')}{' '}
                  <code className="text-[10px] bg-purple-100 px-1 rounded-sm">{__('1Thu 12 Rajab 1447 6:26 AM 8:03 AM 12:09 PM 1:47 PM 2:18 PM 4:05 PM 5:42 PM', 'fiveprayer')}</code>{__(', no Jamā‘ah). Only the prayer times are read — the Hijri column is skipped — and everything is stored in the database.', 'fiveprayer')}</p>
                <label className="mt-2 flex items-center gap-2 text-[11px] text-purple-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={importJamaah}
                    onChange={(e) => setImportJamaah(e.target.checked)}
                    className="accent-purple-600 w-3.5 h-3.5"
                  />
                  <span>
                    <strong>{__('Also import the Jamā‘ah (congregation) times', 'fiveprayer')}</strong>{__(' — they fill the', 'fiveprayer')}{' '}
                    <strong>{__('Iqamah columns', 'fiveprayer')}</strong>{__(' of the calendar, so the congregation times match the printed timetable exactly.', 'fiveprayer')}</span>
                </label>
                <label className="mt-2 flex items-center gap-2 text-[11px] text-purple-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={importAsr2}
                    onChange={(e) => setImportAsr2(e.target.checked)}
                    className="accent-purple-600 w-3.5 h-3.5"
                  />
                  <span>
                    <strong>{__('Also import the second ‘Asr time (2 Mithl / Hanafi)', 'fiveprayer')}</strong>{__(' — stored separately and shown as the optional', 'fiveprayer')}{' '}
                    <strong>{__('Hanafi column', 'fiveprayer')}</strong>{__(' when enabled in', 'fiveprayer')}{' '}
                    <strong>{__('Timetable Layout', 'fiveprayer')}</strong>{__('. Some tables print only one ‘Asr time — nothing changes then.', 'fiveprayer')}</span>
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={5}
                  className="mt-2 w-full px-3 py-2 text-[11px] font-mono border border-gray-200 rounded-lg bg-white focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border resize-y"
                  placeholder={__('JANUARY 2026\nFajr Zuhr ‘Asr Maghrib ‘Ishā\nBegins Jamā‘ah Sunrise Begins Jamā‘ah 1 Mithl 2 Mithl Jamā‘ah Begins Jamā‘ah Begins Jamā‘ah\nThu 1 6:26 6:46 8:03 12:09 12:45 1:46 2:17 2:45 4:05 4:12 5:42 7:30\nFri 2 6:26 6:46 8:03 12:10 1:00 1:47 2:18 2:45 4:06 4:13 5:43 7:30\n…\n\n(also accepted — Date/Hijri layout)\n1Thu 12 Rajab 1447 6:26 AM 8:03 AM 12:09 PM 1:47 PM 2:18 PM 4:05 PM 5:42 PM\n2Fri 13 Rajab 1447 6:26 AM 8:03 AM 12:10 PM 1:48 PM 2:19 PM 4:06 PM 5:43 PM\n…', 'fiveprayer')}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportTimetable}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-hidden"
                  >{__('Import & save to database', 'fiveprayer')}</button>
                  <span className="text-[10px] text-gray-400">{__('12 month sections, one row per day — the parser handles the 12-hour clock.', 'fiveprayer')}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {MONTH_NAMES_SHORT.map((monthName, index) => (
                  <button
                    key={monthName}
                    type="button"
                    onClick={() => handleChartMonthSelect(index)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors focus:outline-hidden ${
                      chartMonth === index
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {monthName}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                {CHART_PRAYERS.map((prayer) => (
                  <div key={prayer}>
                    <label className={labelClass}>
                      {MONTH_NAMES_SHORT[chartMonth]} — {prayer.charAt(0).toUpperCase() + prayer.slice(1)}{__(' (one per day, 24h)', 'fiveprayer')}</label>
                    <textarea
                      value={chartText[prayer]?.[chartMonth] || ''}
                      onChange={(e) => handleChartText(prayer, e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg bg-white focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border resize-y"
                      placeholder={'04:38\n04:40\n04:41\n…'} // day 1 first
                    />
                  </div>
                ))}
              </div>

              {/* Imported Jamā'ah times → Iqamah columns */}
              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap bg-white border border-purple-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-purple-900">{__('Jamā‘ah times → Iqamah columns', 'fiveprayer')}</h4>
                  <p className="text-[10px] text-purple-700 mt-0.5 max-w-xl">{__('When on, the imported Jamā‘ah (congregation) times are written straight into the calendar\'s', 'fiveprayer')}{' '}
                    <strong>{__('Iqamah columns', 'fiveprayer')}</strong>{__(' for every day that has one (published minute, exactly as printed). Blank days keep the computed Iqamah (Begins + Iqamah Delay). Off — Iqamah columns are computed from Begins + Iqamah Delay as usual.', 'fiveprayer')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange(setJamaahEnabled, !jamaahEnabled)}
                  className={`h-9 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 ${
                    jamaahEnabled ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  <span>{jamaahEnabled ? 'Jamā‘ah on' : 'Jamā‘ah off'}</span>
                  <span className={`w-8 h-4.5 rounded-full relative transition-colors ${jamaahEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span
                      className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${jamaahEnabled ? 'left-[16px]' : 'left-0.5'}`}
                    />
                  </span>
                </button>
              </div>

              {/* Uniform Iqamah adjustment — one signed number of minutes added
                  to EVERY Iqamah time (imported Jamā'ah or computed). Applied
                  during generation, so it never edits the imported data. */}
              <div
                className={`relative mt-3 bg-white border border-purple-200 rounded-lg px-3 py-2 ${iqamahAdjustLockedBySchedules ? 'overflow-hidden' : ''}`}
                aria-disabled={iqamahAdjustLockedBySchedules || undefined}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-purple-900">{__('Adjust every Iqamah time', 'fiveprayer')}</h4>
                    <p className="text-[10px] text-purple-700 mt-0.5 max-w-xl">{__('Add or subtract the same number of minutes to EVERY Iqamah time in the generated calendar — imported Jamā‘ah and computed Iqamah alike. For example +5 turns 5:00 into 5:05 and 4:45 into 4:50; use a negative number to subtract.', 'fiveprayer')}</p>
                  </div>
                  <button
                    type="button"
                    disabled={iqamahAdjustLockedBySchedules}
                    onClick={() => handleChange(setIqamahAdjustEnabled, !iqamahAdjustEnabled)}
                    className={`h-9 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 ${
                      iqamahAdjustLockedBySchedules
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : iqamahAdjustEnabled ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
                    }`}
                  >
                    <span>{iqamahAdjustEnabled ? 'Adjustment on' : 'Adjustment off'}</span>
                    <span className={`w-8 h-4.5 rounded-full relative transition-colors ${iqamahAdjustEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span
                        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${iqamahAdjustEnabled ? 'left-[16px]' : 'left-0.5'}`}
                      />
                    </span>
                  </button>
                </div>
                <div className={`mt-3 flex items-center gap-2 flex-wrap ${iqamahAdjustEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                  <input
                    type="number"
                    step="1"
                    inputMode="numeric"
                    disabled={iqamahAdjustLockedBySchedules}
                    value={String(iqamahAdjustMinutes)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setIqamahAdjustMinutes(raw);
                      // Typing a non-zero number switches the adjustment on, so
                      // a value can never be silently ignored because the master
                      // toggle was left off.
                      if (parseSignedMinutes(raw) !== 0) setIqamahAdjustEnabled(true);
                      scheduleSave();
                    }}
                    className="h-9 w-28 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border"
                    placeholder="0"
                  />
                  <span className="text-[11px] text-gray-600">{__('minutes (negative to subtract, e.g. -5)', 'fiveprayer')}</span>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-amber-600">{__('Click “Generate Calendar” afterwards to rebuild the timetable with the adjusted Iqamah times.', 'fiveprayer')}</p>
                {/* Overlay (same pattern as the Iqamah Delay panel) — locks the
                    whole control while an Advanced Schedule owns the Iqamah. */}
                {iqamahAdjustLockedBySchedules && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg pointer-events-none">
                    <div className="absolute inset-0 rounded-lg bg-white opacity-70" />
                    <div className="relative z-10 mx-3 max-w-[92%] rounded-lg bg-gray-800 px-4 py-2 text-center text-[11px] leading-snug text-white shadow-lg">
                      {__('Disabled — an Advanced Schedule overrides the Iqamah times. Turn that schedule off (or clear its Iqamah times) to use this adjustment.', 'fiveprayer')}
                    </div>
                  </div>
                )}
              </div>

              {jamaahEnabled && (
                <div className="mt-3">
                  <p className="text-[10px] text-purple-700 mb-2">
                    <strong>{__('Jamā‘ah (Iqamah) columns', 'fiveprayer')}</strong>{__(' — imported from the printed timetable (one per day, 24h). Edit here if needed; blank days fall back to Begins + Iqamah Delay.', 'fiveprayer')}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {JAMAAH_PRAYERS.map((prayer) => (
                      <div key={prayer}>
                        <label className={labelClass}>
                          {MONTH_NAMES_SHORT[chartMonth]} — {prayer.charAt(0).toUpperCase() + prayer.slice(1)}{__(' Jamā‘ah (one per day, 24h)', 'fiveprayer')}</label>
                        <textarea
                          value={chartText[`${prayer}Jamaah`]?.[chartMonth] || ''}
                          onChange={(e) => handleChartText(`${prayer}Jamaah`, e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 text-xs font-mono border border-purple-200 rounded-lg bg-purple-50/40 focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border resize-y"
                          placeholder={'06:46\n06:46\n06:46\n…'} // day 1 first
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live indicator */}
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-[11px] flex items-start gap-2 ${
              seasonMode === 'chart'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : seasonMode === 'auto'
                  ? todaySeason === 'summer'
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                  : seasonMode === 'monthly'
                    ? 'bg-purple-50 border-purple-200 text-purple-800'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <span className="font-semibold shrink-0">
              {seasonMode === 'monthly' && seasonLabel
                ? `Today (${seasonLabel}):`
                : seasonMode === 'auto'
                  ? `Today is ${seasonLabel}:`
                  : seasonMode === 'chart'
                    ? 'Chart mode:'
                    : 'Seasonal switching is off:'}
            </span>
            <span>
              {seasonMode === 'chart' ? (
                <>
                  {MONTH_NAMES_SHORT[todayMonth]}{__(' today: Fajr', 'fiveprayer')}{' '}
                  {String((chartText.fajr[todayMonth] || '').split('\n')[Math.min(new Date().getDate() - 1, 30)] || '').trim() || '— (computed)'}{__(', Sunrise', 'fiveprayer')}{' '}
                  {String((chartText.sunrise[todayMonth] || '').split('\n')[Math.min(new Date().getDate() - 1, 30)] || '').trim() || '— (computed)'}{__(', Isha', 'fiveprayer')}{' '}
                  {String((chartText.isha[todayMonth] || '').split('\n')[Math.min(new Date().getDate() - 1, 30)] || '').trim() || '— (computed)'}{__('. Blank days fall back to the normal calculation + margins.', 'fiveprayer')}</>
              ) : seasonMode === 'monthly' ? (
                <>
                  {MONTH_NAMES_SHORT[todayMonth]}{__(' uses Fajr ', 'fiveprayer')}{String(todayMonthlyFajr)}{__(', Isha ', 'fiveprayer')}{String(todayMonthlyIsha)}{__(' (blank cells use the base fields above). Maghrib stays ', 'fiveprayer')}{String(maghrib || 'from base field')}{__(' all year.', 'fiveprayer')}{monthlySmooth && (
                    <>
                      {' '}
                      <strong>{__('Smoothing is on', 'fiveprayer')}</strong>{__(' — the angle glides between months instead of stepping on the 1st.', 'fiveprayer')}</>
                  )}
                </>
              ) : seasonMode === 'auto' ? (
                <>
                  {summerStart} – {summerEnd}{__(' uses the summer criteria — Fajr ', 'fiveprayer')}{String(activeForToday.fajr)}{__(', Isha ', 'fiveprayer')}{String(activeForToday.isha)}{__(', Maghrib ', 'fiveprayer')}{String(activeForToday.maghrib)}{__('. Dates outside that window use the winter criteria above.', 'fiveprayer')}</>
              ) : (
                <>{__('The criteria above are used for every date of the year when you click Generate Calendar.', 'fiveprayer')}</>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px] text-gray-500">{__('Asr, Midnight and Higher Latitude always come from the ', 'fiveprayer')}<strong>{__('Prayer Settings', 'fiveprayer')}</strong>{__(' page. After changing these values, click', 'fiveprayer')}{' '}
            <span className="font-medium">{__('Generate Calendar', 'fiveprayer')}</span>{__(' to rebuild the timetable.', 'fiveprayer')}</p>
          {saveStatus}
        </div>
      </div>
    </div>
  );
};

export default UnifiedMethodSettings;