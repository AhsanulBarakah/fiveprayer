/**
 * DaySmoothingSettings
 *
 * Configuration card for "Day-to-Day Smoothing" in the Configure Settings
 * page. Caps how much each Begins time (Fajr, Sunrise, Dhuhr, Asr, Maghrib,
 * Isha) may change from one calendar day to the next — e.g. if Sept 1 Fajr
 * computes to 04:37:44 and Sept 2 to 04:39:52, a 90-second cap turns Sept 2
 * into 04:39:14. The cap is applied at calendar generation time (and to the
 * hover-tooltip seconds), after the astronomical calculation and before
 * rounding. PrayTimes.js itself is never modified.
 *
 * Modes:
 *  - No drift — anchor each day to the previous day's TRUE value (never
 *    drifts from the real calculation).
 *  - Strict   — consecutive days never differ by more than the cap.
 *  - Hybrid   — Strict plus a max-drift bound from the true time.
 *  - Manual   — per-prayer typed daily step (e.g. Fajr 60 = 1 min/day);
 *    chained like Strict with the same drift leash.
 *
 * A LIVE preview shows the REAL computed seconds (your location/method/tune,
 * current month) for the first five days of the displayed month, natural vs
 * smoothed, so changing the cap/mode/steps visibly changes the times.
 *
 * The selection is stored in `smoothing_selected` (persisted when the
 * calendar is generated, like the rounding selection) and read by the shared
 * `smoothDayTimes` utility used by both generation and the calendar preview.
 *
 * @module prayerSetting/DaySmoothingSettings
 */
import React from 'react';
import { useLocationStore } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { useTuneStore } from '../../state/storeTunePrayer';
import { useMonth } from '../../hooks/useMonth';
import { useCalenderSettings } from '../../hooks/useCalenderSettings';
import {
	createDayTimesComputer,
	getWordpressTimezoneOffset,
} from '../../utils/computeDayTimes';
import {
	smoothDayTimes,
	SMOOTHING_PRAYERS,
	type SmoothableDay,
	type SmoothingConfig,
} from '../../utils/smoothDayTimes';
import {
	getCalendarYearSpan,
	resolveDisplayMonth,
	resolveHijriVariant,
} from '../../utils/hijriCalendar';
import { __ } from '@wordpress/i18n';

interface DaySmoothingSettingsProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const clampSeconds = (v: string | number): number => {
  const n = parseInt(String(v), 10);
  if (isNaN(n)) return 90;
  return Math.min(3600, Math.max(1, n));
};

const clampDriftBudget = (v: string | number): number => {
  const n = parseInt(String(v), 10);
  if (isNaN(n)) return 180;
  return Math.min(3600, Math.max(0, n));
};

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/** Two-digit helper. */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Worked example for the "How it works" guide — mirrors the FIRST two days of
 * the real smoothing chain exactly (same arithmetic as smoothDayTimes), using
 * a realistic Fajr pair (Sept 1 04:37:44 → Sept 2 04:39:52, +2:08 drift).
 * Day 1 is the chain baseline (its true time), day 2 is capped from it only
 * when its natural drift exceeds the cap; hybrid/manual then apply the drift
 * leash. Returns the exact day-2 result to the second.
 */
const guideExample = (
  mode: 'noDrift' | 'strict' | 'hybrid' | 'manual',
  cap: number,
  driftBudget: number,
  manualStepFajr: number
): { out: string; step: number; capped: boolean } => {
  const raw1 = '04:37:44';
  const raw2 = '04:39:52';
  const s1 = 4 * 3600 + 37 * 60 + 44;
  const s2 = 4 * 3600 + 39 * 60 + 52;
  const natural = s2 - s1; // +128s = +2:08
  let out = s2;
  let capped = false;
  const limit = mode === 'manual' ? manualStepFajr : cap;
  if (limit > 0 && Math.abs(natural) > limit) {
    out = s1 + Math.sign(natural) * limit;
    capped = true;
    if (mode === 'hybrid' || mode === 'manual') {
      const drift = out - s2;
      if (Math.abs(drift) > driftBudget) out = s2 + Math.sign(drift) * driftBudget;
    }
  }
  const total = ((Math.round(out) % 86400) + 86400) % 86400;
  return {
    out: `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`,
    step: out - s1,
    capped,
  };
};

/** Module-level raw-day cache keyed by engine fingerprint + window key. */

const RAW_CACHE_MAX = 12;
const rawDaysCache = new Map<string, SmoothableDay[]>();

const DaySmoothingSettings: React.FC<DaySmoothingSettingsProps> = ({ title, description, icon }) => {
  const smoothing_selected = useLocationStore((state) => state.smoothing_selected);
  const smoothing_selected_update = useLocationStore((state) => state.smoothing_selected_update);
  const { saveBatch } = usePostMeta();
  const [enabled, setEnabled] = React.useState<boolean>(smoothing_selected?.enabled ?? true);
  const [maxSeconds, setMaxSeconds] = React.useState<number>(smoothing_selected?.maxSeconds ?? 90);
  const [mode, setMode] = React.useState<'noDrift' | 'strict' | 'hybrid' | 'manual'>(
    smoothing_selected?.mode ?? 'noDrift'
  );
  const [driftBudget, setDriftBudget] = React.useState<number>(
    smoothing_selected?.driftBudget ?? 180
  );
  const [manualSteps, setManualSteps] = React.useState<Record<string, number>>(
    () => ({ ...(smoothing_selected?.manualSteps || {}) })
  );

  // Sync local state when the store changes from the OUTSIDE (e.g. the Feature
  // Switches panel toggling smoothing off/on). The guard skips OUR OWN writes:
  // without it, every auto-saved value re-ran all five setters below —
  // including a fresh `manualSteps` object — forcing an extra render on every
  // arrow press.
  React.useEffect(() => {
    const stored = smoothing_selected;
    if (
      stored &&
      stored.enabled === enabled &&
      stored.maxSeconds === maxSeconds &&
      stored.mode === mode &&
      stored.driftBudget === driftBudget &&
      JSON.stringify(stored.manualSteps || {}) === JSON.stringify(manualSteps)
    ) {
      return;
    }
    setEnabled(stored?.enabled ?? true);
    if (stored?.maxSeconds !== undefined) setMaxSeconds(stored.maxSeconds);
    setMode(stored?.mode ?? 'noDrift');
    if (stored?.driftBudget !== undefined) setDriftBudget(stored.driftBudget);
    setManualSteps({ ...(stored?.manualSteps || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smoothing_selected]);

  // The STORE write is debounced (the local state + live preview update
  // instantly). Writing the store on every keystroke re-renders every
  // `smoothing_selected` subscriber — including the Feature Switches panel on
  // this same page — which is what made holding the arrow keys on a number
  // input feel slow. With the debounce, one write happens shortly after you
  // stop pressing.
  const pendingRef = React.useRef<any>(null);
  const persistTimerRef = React.useRef<any>(null);

  /** Merge the given fields into the store object, always keeping the rest. */
  const persist = (patch: Partial<SmoothingConfig & { manualSteps?: Record<string, number> }>) => {
    pendingRef.current = {
      enabled,
      maxSeconds,
      mode,
      driftBudget,
      manualSteps,
      ...patch,
    };
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        smoothing_selected_update(pendingRef.current);
        // Also persist to the DATABASE so the toggle/values survive a page
        // refresh — the store alone is wiped on reload, which made the
        // smoothing "Enabled" switch come back off every time.
        saveBatch({ smoothing_selected: pendingRef.current }).catch(() => {});
      }
      pendingRef.current = null;
    }, 350);
  };

  // Flush the last pending write on unmount so no edit is ever lost.
  React.useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      if (pendingRef.current) {
        smoothing_selected_update(pendingRef.current);
        saveBatch({ smoothing_selected: pendingRef.current }).catch(() => {});
      }
    };
  }, []);

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    persist({ enabled: value });
  };

  const handleMaxSeconds = (value: string) => {
    const v = clampSeconds(value);
    setMaxSeconds(v);
    persist({ maxSeconds: v });
  };

  const handleMode = (value: 'noDrift' | 'strict' | 'hybrid' | 'manual') => {
    setMode(value);
    // First time Manual is chosen, seed a sensible 60s (1 min/day) step for
    // each prayer so the mode visibly does something — the admin then tunes
    // each prayer or sets 0 to keep the true time.
    if (value === 'manual') {
      const steps = manualSteps ?? {};
      const hasAny = SMOOTHING_PRAYERS.some((k) => (steps[k] ?? 0) > 0);
      if (!hasAny) {
        const seeded: Record<string, number> = {};
        for (const k of SMOOTHING_PRAYERS) seeded[k] = 60;
        setManualSteps(seeded);
        // This write is immediate, so cancel any pending debounced write from
        // the inputs above — otherwise it would fire later and overwrite the
        // seeded steps with stale values.
        if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        pendingRef.current = null;
        smoothing_selected_update({
          enabled,
          maxSeconds,
          mode: value,
          driftBudget,
          manualSteps: seeded,
        });
        return;
      }
    }
    persist({ mode: value });
  };

  const handleDriftBudget = (value: string) => {
    const v = clampDriftBudget(value);
    setDriftBudget(v);
    persist({ driftBudget: v });
  };

  const handleStep = (key: string, value: string) => {
    const n = parseInt(String(value), 10);
    const v = isNaN(n) ? 0 : Math.min(3600, Math.max(0, n));
    const next = { ...manualSteps, [key]: v };
    setManualSteps(next);
    persist({ manualSteps: next });
  };

  const isManual = mode === 'manual';

  // Worked example for the guide below the live preview (exact to the second).
  const ex = guideExample(mode, maxSeconds, driftBudget, manualSteps.fajr ?? 0);
  const manualStepZero = isManual && (manualSteps.fajr ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="p-6">
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl ${isManual ? 'sm:grid-cols-1' : ''}`}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Day-to-Day Smoothing', 'fiveprayer')}</label>
              <button
                type="button"
                onClick={() => handleToggle(!enabled)}
                className={`w-full h-10 px-3 flex items-center justify-between rounded-lg border text-sm font-medium transition-all focus:outline-hidden ${
                  enabled
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <span>{enabled ? 'Enabled' : 'Disabled'}</span>
                <span
                  className={`w-8 h-4.5 rounded-full relative transition-colors ${
                    enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${
                      enabled ? 'left-4' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>
            <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Mode', 'fiveprayer')}</label>
              <select
                value={mode}
                onChange={(e) => handleMode(e.target.value as 'noDrift' | 'strict' | 'hybrid' | 'manual')}
                disabled={!enabled}
                className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border disabled:opacity-50"
              >
                <option value="noDrift">{__('No drift — stay true to the real times', 'fiveprayer')}</option>
                <option value="strict">{__('Strict — never jump more than the cap', 'fiveprayer')}</option>
                <option value="hybrid">{__('Hybrid — smooth steps, but never drift too far', 'fiveprayer')}</option>
                <option value="manual">{__('Manual — I type the change per day (per prayer)', 'fiveprayer')}</option>
              </select>
            </div>

            {!isManual && (
              <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Max change per day ', 'fiveprayer')}<span className="text-gray-400">{__('(seconds)', 'fiveprayer')}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={String(maxSeconds)}
                  onChange={(e) => handleMaxSeconds(e.target.value)}
                  className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                  title={__('The largest allowed change between two consecutive days, in seconds (1-3600)', 'fiveprayer')}
                />
              </div>
            )}

            {(mode === 'hybrid' || isManual) && (
              <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Max drift from the true time ', 'fiveprayer')}<span className="text-gray-400">{__('(seconds)', 'fiveprayer')}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={3600}
                  value={String(driftBudget)}
                  onChange={(e) => handleDriftBudget(e.target.value)}
                  className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                  title={__('How far the smoothed time may stray from the true astronomical time before the cap releases to pull it back (0-3600)', 'fiveprayer')}
                />
              </div>
            )}
          </div>

          {isManual && (
            <div className={`mt-4 max-w-2xl ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-800 font-medium mb-2.5">{__('✍️ Manual daily-step mode — type the biggest change each Begins time may make per day', 'fiveprayer')}{' '}
                  <span className="text-purple-500">{__('(seconds; 60 = 1 minute)', 'fiveprayer')}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {SMOOTHING_PRAYERS.map((key) => (
                    <div key={key}>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">
                        {PRAYER_LABELS[key]}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={3600}
                        value={String(manualSteps[key] ?? 0)}
                        onChange={(e) => handleStep(key, e.target.value)}
                        className="h-9 w-full px-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 focus:outline-hidden transition-all box-border"
                        title={`${PRAYER_LABELS[key]}: max change per day in seconds (0 = keep the true time)`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-purple-700 mt-2.5 leading-relaxed">{__('0 means that prayer keeps its true astronomical time untouched. While the natural drift is steeper than your step, consecutive days move by exactly your typed amount (e.g. 60 = +1 minute per day in autumn, −1 minute per day in spring automatically). When the drift is gentler, the true time is kept.', 'fiveprayer')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live real-time preview — actual computed seconds for the displayed month */}
      <LivePreview
        smoothingConfig={{
          enabled,
          maxSeconds,
          mode,
          driftBudget,
          manualSteps,
        }}
      />

      {/* Guide — kept BELOW the live preview so the real times come first */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">{__('How it works', 'fiveprayer')}</h3>
          <p className="text-xs text-gray-500">{__('Worked example — exact to the second, the same math the live preview above and Generate Calendar use.', 'fiveprayer')}</p>
        </div>
        <div className="p-4 space-y-2 text-xs text-gray-600">
          <p>{__('The engine computes each time to the second, then this setting caps how much that time may move from the previous day. Take Sept 1 Fajr ', 'fiveprayer')}<strong>04:37:44</strong>{__(' → Sept 2 Fajr ', 'fiveprayer')}<strong>04:39:52</strong>{' '}{__('(a natural +2:08 step). With', 'fiveprayer')}{' '}
            {manualStepZero ? (
              <>{__('your ', 'fiveprayer')}<strong>{__('Fajr step at 0', 'fiveprayer')}</strong>{__(' in ', 'fiveprayer')}<strong>{__('Manual', 'fiveprayer')}</strong>{__(' mode, Sept 2 keeps its true time', 'fiveprayer')}{' '}
                <strong className="text-emerald-700">04:39:52</strong>{__(' — a 0 step leaves every day untouched.', 'fiveprayer')}</>
            ) : isManual ? (
              <>{__('your ', 'fiveprayer')}<strong>{__('Fajr step of ', 'fiveprayer')}{String(manualSteps.fajr ?? 0)}{__('s', 'fiveprayer')}</strong>{__(' in ', 'fiveprayer')}<strong>{__('Manual', 'fiveprayer')}</strong>{' '}{__('mode, Sept 2', 'fiveprayer')}{' '}
              </>
            ) : (
              <>{__('a ', 'fiveprayer')}<strong>{maxSeconds}{__('s', 'fiveprayer')}</strong>{__(' cap in', 'fiveprayer')}{' '}
                <strong>
                  {mode === 'noDrift' ? 'No drift' : mode === 'strict' ? 'Strict' : 'Hybrid'}
                </strong>{' '}{__('mode, Sept 2', 'fiveprayer')}{' '}
              </>
            )}
            {!manualStepZero && ex.capped && (
              <>{__('is capped to ', 'fiveprayer')}<strong className="text-emerald-700">{ex.out}</strong>{__(' — it moves', 'fiveprayer')}{' '}
                +{ex.step}{__('s instead of the full +2:08.', 'fiveprayer')}</>
            )}
            {!manualStepZero && !ex.capped && (
              <>{__('keeps its true time ', 'fiveprayer')}<strong className="text-emerald-700">04:39:52</strong>{__(' — the +2:08 drift fits inside ', 'fiveprayer')}{isManual ? 'your step' : 'the cap'}{__(', so nothing is clamped.', 'fiveprayer')}</>
            )}
          </p>
          <p className="pt-1 border-t border-gray-100">
            <strong className="text-gray-700">{__('No drift (default):', 'fiveprayer')}</strong>{__(' every day stays within one cap of the', 'fiveprayer')}{' '}
            <em>{__('true', 'fiveprayer')}</em>{__(' calculation, forever — but in steep months (e.g. early September) consecutive days can still show ~2-minute steps.', 'fiveprayer')}<br />
            <strong className="text-gray-700">{__('Strict:', 'fiveprayer')}</strong>{__(' consecutive days never differ by more than the cap (a perfectly smooth curve) — but during long steep stretches the table falls behind the true times by many minutes, then recovers when the drift slows.', 'fiveprayer')}<br />
            <strong className="text-gray-700">{__('Hybrid:', 'fiveprayer')}</strong>{__(' smooth steps like Strict, ', 'fiveprayer')}<em>{__('but', 'fiveprayer')}</em>{__(' if the curve would fall more than your ', 'fiveprayer')}<strong>{__('max drift', 'fiveprayer')}</strong> ({driftBudget}{__('s = ', 'fiveprayer')}{Math.round(driftBudget / 60)}{' '}{__('min) behind the true time, the cap releases just enough to hold it inside that bound — it can never run away by many minutes. When the natural drift slows it walks back to the true time at ', 'fiveprayer')}{maxSeconds}{__('s per day. Set max drift to ', 'fiveprayer')}<strong>0</strong>{__(' to always follow the true time exactly.', 'fiveprayer')}<br />
            <strong className="text-gray-700">{__('Manual:', 'fiveprayer')}</strong>{__(' type each prayer\'s own daily step above (0 = keep the true time). While the natural drift is steeper than your step, consecutive days move by exactly your number, with the same ', 'fiveprayer')}{driftBudget}{__('s drift leash so the curve never runs away.', 'fiveprayer')}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>{__('💡 What it applies to:', 'fiveprayer')}</strong>{__(' the six Begins times — Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha. It runs at ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' time, after the calculation and before rounding — so your ', 'fiveprayer')}<strong>{__('Rounding Method', 'fiveprayer')}</strong>{__(' and ', 'fiveprayer')}<strong>{__('Seconds Threshold', 'fiveprayer')}</strong>{__(' still apply on top of the capped times. The hover-tooltip seconds always match what\'s stored, and when smoothing changed a time the tooltip shows ', 'fiveprayer')}<em>{__('natural → smoothed', 'fiveprayer')}</em>{__('. Disable it to keep the exact astronomical times.', 'fiveprayer')}</div>
    </div>
  );
};

export default DaySmoothingSettings;

/**
 * LivePreview
 *
 * Computes the REAL seconds (same engine + settings as generation) for the
 * first five days of the currently displayed month and shows, per prayer,
 * natural → smoothed so the admin SEES what the smoothing settings do before
 * generating. Raw days are cached by engine fingerprint — changing the cap /
 * mode / steps only re-runs the cheap smoothing pass over the cached days.
 */
const LivePreview: React.FC<{
  smoothingConfig: SmoothingConfig & { manualSteps?: Record<string, number> };
}> = ({ smoothingConfig }) => {
  const month = useLocationStore((state) => state.month);
  const calendar_type = useLocationStore((state) => state.calendar_type);
  const { MonthList } = useMonth();
  const { settingsPrayer } = useCalenderSettings();
  const [windowMeta, setWindowMeta] = React.useState<{
    rawDays: SmoothableDay[];
    startMs: number;
    endMs: number;
    label: string;
  } | null>(null);

  // Engine inputs that decide the RAW (pre-smoothing) seconds — subscribed as
  // stable references so the fingerprint below is only rebuilt when an input
  // ACTUALLY changes, never on every render (e.g. each arrow press on the cap
  // / steps above re-renders this preview with an unchanged engine, and
  // stringifying the full methods array — including chart data — on every
  // press is what made the arrows feel sluggish).
  const rawLocation = useLocationStore((state) => state.customLocationSelected || {});
  const rawMfc = useLocationStore((state) => state.mfc);
  const rawOaac = useLocationStore((state) => state.oaac);
  const rawMncm = useLocationStore((state) => state.mncm);
  const rawHlm = useLocationStore((state) => state.hlm);
  const rawMethods = useLocationStore((state) =>
    Array.isArray(state.methodsForCalculation) ? state.methodsForCalculation : []
  );
  const rawTune = useTuneStore((state) => state);
  const rawHijriVariant = resolveHijriVariant(
    (useTimeTableMonth.getState().HijraLocale as any)?.calenderType
  );

  // Fingerprint for the raw-day cache — the deps are stable store references,
  // so this recomputes only when the engine inputs change.
  const rawFingerprint = React.useMemo(
    () =>
      JSON.stringify([
        rawLocation.lat,
        rawLocation.lng,
        (rawMfc as any)?.meta ?? (rawMfc as any)?.method ?? rawMfc?.name,
        rawOaac?.method,
        rawMncm?.method,
        rawHlm?.method,
        rawMethods,
        calendar_type,
        rawHijriVariant,
        // Per-prayer tune offsets shift the raw computed seconds.
        rawTune.Imsak, rawTune.Fajr, rawTune.Sunrise, rawTune.Dhuhr, rawTune.Asr,
        rawTune.Maghrib, rawTune.Sunset, rawTune.Isha, rawTune.Midnight,
      ]),
    [
      rawLocation.lat,
      rawLocation.lng,
      rawMfc,
      rawOaac,
      rawMncm,
      rawHlm,
      rawMethods,
      calendar_type,
      rawHijriVariant,
      rawTune,
    ]
  );
  // JSON identity of the smoothing config — changes re-run the smoothing pass.
  const smoothingKey = JSON.stringify(smoothingConfig);

  // Compute (and cache) the RAW days for the chain window. Only depends on
  // engine settings (fingerprint), never on the smoothing config.
  React.useEffect(() => {
    const monthList = Array.isArray(MonthList) ? MonthList : [];
    const selected = resolveDisplayMonth(month, monthList, calendar_type, new Date());
    if (!selected) return;

    const hijriRange =
      selected.start && selected.end
        ? { start: new Date(selected.start), end: new Date(selected.end) }
        : null;
    let monthStart: Date;
    let monthEnd: Date;
    if (hijriRange) {
      monthStart = hijriRange.start;
      monthEnd = hijriRange.end;
    } else {
      const year = new Date().getFullYear();
      const monthIndex = Number(selected.method) - 1;
      if (monthIndex < 0 || monthIndex > 11) return;
      monthStart = new Date(Date.UTC(year, monthIndex, 1));
      monthEnd = new Date(Date.UTC(year, monthIndex + 1, 1));
    }

    // Preview the first 5 days of the displayed month.
    const windowEnd = new Date(Math.min(monthEnd.getTime(), monthStart.getTime() + 5 * 864e5));

    // Chain start: generation start (Jan 1 of the displayed year, or 1
    // Muharram / 1 Farvardin for non-Gregorian calendars) — correct for every
    // mode and one cache covers all modes (noDrift only depends on the
    // previous day, so the extra days are inert).
    const span = getCalendarYearSpan(
      calendar_type,
      new Date(),
      resolveHijriVariant((useTimeTableMonth.getState().HijraLocale as any)?.calenderType)
    );
    const chainStart = span
      ? new Date(span.start)
      : new Date(Date.UTC(new Date().getFullYear(), 0, 1));

    const windowKey = `${selected.method}|${monthStart.toISOString().slice(0, 10)}`;
    const cacheKey = `${rawFingerprint}|${windowKey}`;

    const cached = rawDaysCache.get(cacheKey);
    if (cached) {
      setWindowMeta({
        rawDays: cached,
        startMs: monthStart.getTime(),
        endMs: windowEnd.getTime(),
        label: selected.name,
      });
      return;
    }

    let cancelled = false;
    // Defer so the input keeps feeling responsive while the engine warms up.
    const t = setTimeout(() => {
      try {
        const computeDay = createDayTimesComputer(settingsPrayer);
        const wpOffset = getWordpressTimezoneOffset();
        const days: SmoothableDay[] = [];
        const cursor = new Date(chainStart.getTime());
        while (cursor < windowEnd) {
          const date = new Date(cursor.getTime());
          const r = computeDay(date, wpOffset);
          days.push({
            date,
            raw: r.raw,
            criteria: r.criteria,
            pinnedKeys: r.pinnedKeys,
          });
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        if (cancelled) return;
        rawDaysCache.set(cacheKey, days);
        if (rawDaysCache.size > RAW_CACHE_MAX) {
          const oldest = rawDaysCache.keys().next().value;
          if (oldest !== undefined) rawDaysCache.delete(oldest);
        }
        setWindowMeta({
          rawDays: days,
          startMs: monthStart.getTime(),
          endMs: windowEnd.getTime(),
          label: selected.name,
        });
      } catch {
        // Never let a preview error break the settings page.
        setWindowMeta(null);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // The fingerprint covers every engine input; typing cap/mode/step never
    // recomputes raw days (those live in the smoothing-only memo below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawFingerprint, month?.method, calendar_type]);

  const location = useLocationStore((state) => state.customLocationSelected || {});
  const hasLocation = !!location?.lat && !!location?.lng;
  if (!hasLocation) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">{__('⚠️ Select a ', 'fiveprayer')}<strong>{__('Location', 'fiveprayer')}</strong>{__(' (Prayer Settings page) to see the real-time preview.', 'fiveprayer')}</div>
    );
  }
  if (!windowMeta) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-400">{__('Computing real times… (one moment)', 'fiveprayer')}</div>
    );
  }

  return (
    <LivePreviewResult
      rawDays={windowMeta.rawDays}
      startMs={windowMeta.startMs}
      endMs={windowMeta.endMs}
      label={windowMeta.label}
      smoothingKey={smoothingKey}
      disabled={!smoothingConfig.enabled}
    />
  );
};

/**
 * Re-smooths the cached raw days with the CURRENT smoothing config (cheap,
 * runs on every cap/mode/step change — this is what makes the preview live)
 * and renders a day × prayer table: each cell shows the natural time, and the
 * smoothed time when smoothing changed it (before → after).
 */
const LivePreviewResult: React.FC<{
  rawDays: SmoothableDay[];
  startMs: number;
  endMs: number;
  label: string;
  smoothingKey: string;
  disabled: boolean;
}> = ({ rawDays, startMs, endMs, label, smoothingKey, disabled }) => {
  // `smoothingKey` is the memo dep — any change to cap/mode/steps re-runs
  // smoothDayTimes over the cached raw days and the table updates live.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const smoothed = React.useMemo(() => smoothDayTimes(rawDays), [rawDays, smoothingKey]);

  // natural = rawDays[i].raw (unchanged by smoothing — smoothDayTimes clones
  // internally), smoothed = smoothed[i].raw. Both arrays are 1:1 in order.
  const previewPairs: { date: Date; natural: Record<string, string>; smoothed: Record<string, string> }[] = [];
  for (let i = 0; i < Math.min(rawDays.length, smoothed.length); i++) {
    const t = rawDays[i].date.getTime();
    if (t < startMs || t >= endMs) continue;
    previewPairs.push({
      date: rawDays[i].date,
      natural: rawDays[i].raw,
      smoothed: smoothed[i].raw,
    });
  }

  if (previewPairs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-400">{__('No computable days for this month.', 'fiveprayer')}</div>
    );
  }

  const validKey = (v: unknown): v is string =>
    typeof v === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(v);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{__('Live preview — your real times', 'fiveprayer')}</h3>
          <p className="text-xs text-gray-500">{__('First days of ', 'fiveprayer')}<strong>{label}</strong>{__(' · computed with your current location, method and tune', 'fiveprayer')}</p>
        </div>
        {disabled ? (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-gray-200 text-gray-600 shrink-0">{__('Off — true times only', 'fiveprayer')}</span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 shrink-0">{__('Live', 'fiveprayer')}</span>
        )}
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="text-[11px] w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-3 pb-1.5 font-medium whitespace-nowrap">{__('Prayer', 'fiveprayer')}</th>
              {previewPairs.map((p) => (
                <th key={p.date.toISOString()} className="px-2 pb-1.5 font-medium whitespace-nowrap">
                  {p.date.getUTCMonth() + 1}/{p.date.getUTCDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SMOOTHING_PRAYERS.map((key) => (
              <tr key={key} className="border-t border-gray-100">
                <td className="pr-3 py-1.5 font-medium text-gray-600 whitespace-nowrap">
                  {PRAYER_LABELS[key]}
                </td>
                {previewPairs.map((p) => {
                  const natural = p.natural[key];
                  const out = p.smoothed[key];
                  const changed = validKey(natural) && validKey(out) && natural !== out;
                  return (
                    <td key={p.date.toISOString()} className="px-2 py-1.5 whitespace-nowrap">
                      {changed ? (
                        <span className="flex items-baseline gap-1">
                          <span className="text-gray-400 line-through decoration-gray-300">{natural}</span>
                          <span className="text-emerald-600 font-semibold">→ {out}</span>
                        </span>
                      ) : (
                        <span className="text-gray-700">{natural}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 mt-2">{__('Green values were changed by your current smoothing settings. Hover the generated calendar cells for the same before/after with seconds.', 'fiveprayer')}</p>
      </div>
    </div>
  );
};
