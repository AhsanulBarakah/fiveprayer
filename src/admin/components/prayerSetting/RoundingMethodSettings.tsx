/**
 * RoundingMethodSettings
 *
 * Configuration panel for the "Rounding Method" category in the Calculation
 * Settings page. Lets the admin pick how generated prayer times are rounded:
 *   - Nearest  → the standard method (round to the closest minute)
 *   - Up       → always round up (ceil) to the next minute
 *   - Down     → always round down (floor) to the previous minute
 *   - None     → keep the exact computed timestamp (no rounding)
 *
 * The selection is stored in the `rounding_selected` meta (persisted when the
 * calendar is generated, like the other dropdowns) and applied by
 * `useCalenderSettings` via `prayerTime.round()`.
 *
 * The options list below is editable via the shared SettingsManager, exactly
 * like the Asr / Midnight / Higher Latitude categories.
 *
 * @module prayerSetting/RoundingMethodSettings
 */
import React from 'react';
import { useLocationStore } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import Dropdown from '../ui/Dropdown';
import SettingsManager from './SettingsManager';
import { normalizeUnifiedParams } from '../../utils/seasonalMethod';
import { __ } from '@wordpress/i18n';

interface RoundingMethodSettingsProps {
  settings: any[];
  onUpdateStore: (settings: any[]) => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  placeholders?: { name?: string; method?: string };
}

const ROUNDING_EXPLANATION: Record<string, string> = {
  nearest: 'Below your Seconds Threshold the minute does NOT change; when the seconds reach your number or more, it rounds up to the next minute (e.g. threshold 37: 04:07:36 stays 04:07, 04:07:37 becomes 04:08).',
  up: 'Always round up to the next minute (like a ceiling). Times get slightly later.',
  down: 'Always round down to the previous minute (like a floor). Times get slightly earlier.',
  none: 'Use the exact computed timestamp without rounding to a minute.',
};

const clampThreshold = (v: string | number): number => {
  const n = parseInt(String(v), 10);
  if (isNaN(n)) return 30;
  return Math.min(59, Math.max(0, n));
};

/** Two-digit helper for the live example line. */
const pad2 = (n: number): string => String(n).padStart(2, '0');

const RoundingMethodSettings: React.FC<RoundingMethodSettingsProps> = ({
  settings,
  onUpdateStore,
  title,
  description,
  icon,
  placeholders,
}) => {
  const roundingCal = useLocationStore((state) => state.roundingCal);
  const rounding_selected = useLocationStore((state) => state.rounding_selected);
  const rounding_selected_select = useLocationStore((state) => state.rounding_selected_select);
  const roundingEnabled = useLocationStore((state) => state.roundingEnabled);
  const updateRoundingEnabled = useLocationStore((state) => state.updateRoundingEnabled);
  const methodsForCalculation = useLocationStore((state) => state.methodsForCalculation);
  const { saveBatch } = usePostMeta();
  const [selected, setSelected] = React.useState(rounding_selected);
  const [threshold, setThreshold] = React.useState<number>(rounding_selected?.threshold ?? 30);

  /**
   * Persist the rounding selection + enabled flag to the DATABASE immediately.
   * The store alone is wiped on page refresh, which made the "Enable custom
   * rounding" checkbox come back Disabled every reload — the DB meta is the
   * source of truth restored by useGetMetaPrayerSettings on load.
   */
  const persistToDB = (sel: any, enabled: boolean) => {
    const payload: Record<string, any> = { rounding_enabled: enabled };
    if (sel?.name || sel?.method || typeof sel?.threshold === 'number') {
      payload.rounding_selected = sel;
    }
    saveBatch(payload).catch(() => {});
  };

  React.useEffect(() => {
    setSelected(rounding_selected);
    if (rounding_selected?.threshold !== undefined) setThreshold(rounding_selected.threshold);
  }, [rounding_selected]);

  const options = Array.isArray(roundingCal?.value) && roundingCal.value.length > 0
    ? roundingCal
    : { id: '', 'meta-key': 'Rounding_Method', value: settings };

  // The Seconds Threshold only applies to Nearest rounding (it decides when
  // the second-count rounds up vs down). Up / Down / None ignore it entirely,
  // so the input is hidden for those — it would only confuse otherwise.
  const selectedMethod = selected?.method || 'nearest';
  const isNearest = selectedMethod === 'nearest';

  const activeExplanation = ROUNDING_EXPLANATION[selectedMethod];

  /**
   * Persist the selection (with the current threshold) to the store AND make
   * sure custom rounding is switched ON. Interacting with this panel means
   * the admin wants the rounding applied — silently staying disabled (e.g. a
   * previously saved 'off') made it look like Nearest/Up/Down/None and the
   * Seconds Threshold did nothing at all.
   */
  const pushSelection = (sel: any) => {
    const withThreshold = { ...sel, threshold };
    setSelected(withThreshold);
    rounding_selected_select(withThreshold);
    if (!roundingEnabled) updateRoundingEnabled(true);
    persistToDB(withThreshold, true);
  };

  const handleMethodChange = (sel: any) => {
    const withThreshold = { ...sel, threshold };
    setSelected(withThreshold);
    rounding_selected_select(withThreshold);
    if (!roundingEnabled) updateRoundingEnabled(true);
    persistToDB(withThreshold, true);
  };

  // The STORE write for the Seconds Threshold is debounced (the local state +
  // live example update instantly). Writing the store on every keystroke /
  // arrow press re-renders every `rounding_selected` subscriber (including
  // useCalenderSettings consumers across the page), which made holding the
  // arrow keys on the threshold input feel slow. One write happens shortly
  // after you stop.
  const thresholdTimerRef = React.useRef<any>(null);
  const thresholdPendingRef = React.useRef<any>(null);
  React.useEffect(() => {
    return () => {
      if (thresholdTimerRef.current) clearTimeout(thresholdTimerRef.current);
      if (thresholdPendingRef.current) {
        rounding_selected_select(thresholdPendingRef.current);
        persistToDB(thresholdPendingRef.current, true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThresholdChange = (value: string) => {
    const v = clampThreshold(value);
    setThreshold(v);
    const base = rounding_selected?.method ? rounding_selected : selected;
    thresholdPendingRef.current = { ...base, threshold: v };
    if (thresholdTimerRef.current) clearTimeout(thresholdTimerRef.current);
    thresholdTimerRef.current = setTimeout(() => {
      if (thresholdPendingRef.current) {
        rounding_selected_select(thresholdPendingRef.current);
        persistToDB(thresholdPendingRef.current, true);
      }
      thresholdPendingRef.current = null;
    }, 350);
    if (!roundingEnabled) updateRoundingEnabled(true);
  };

  // Unified Method Exact-chart days pin the published minute (Fajr/Isha) —
  // rounding intentionally never touches those days. Tell the admin up front
  // instead of letting it look like the rounding is broken.
  const chartDaysActive = (Array.isArray(methodsForCalculation) ? methodsForCalculation : []).some((m: any) => {
    try {
      const up = normalizeUnifiedParams(m?.params);
      return up.enabled !== false && up.seasonMode === 'chart';
    } catch {
      return false;
    }
  });

  return (
    <div className="space-y-6">
      {/* Active rounding selector */}
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
          {/* On/off switch for the custom rounding feature */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{__('Enable custom rounding', 'fiveprayer')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{__('On: your Rounding Method + Seconds Threshold are applied. Off: every time uses the standard', 'fiveprayer')}{' '}
                <strong>{__('Nearest', 'fiveprayer')}</strong>{__(' rounding (30s cutoff), like the plain engine.', 'fiveprayer')}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !roundingEnabled;
                updateRoundingEnabled(next);
                persistToDB(rounding_selected, next);
              }}
              className={`h-10 px-4 flex items-center gap-2 rounded-lg border text-sm font-medium transition-all focus:outline-hidden shrink-0 ${
                roundingEnabled
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
            >
              <span>{roundingEnabled ? 'Enabled' : 'Disabled'}</span>
              <span
                className={`w-9 h-5 rounded-full relative transition-colors ${
                  roundingEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                    roundingEnabled ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl ${roundingEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <Dropdown
                label={__('Active Rounding Method', 'fiveprayer')}
                meta="rounding_selected"
                options={options}
                value={selected}
                onChange={(value) => handleMethodChange(value)}
                onSave={(value) => pushSelection(value)}
              />
            </div>
            {isNearest ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Seconds Threshold ', 'fiveprayer')}<span className="text-gray-400">{__('(0–59, Nearest only)', 'fiveprayer')}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={String(threshold)}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                  title={__('Round up when the seconds reach this value; below it, round down (0-59)', 'fiveprayer')}
                />
              </div>
            ) : (
              <div className="flex items-end">
                <div className="h-10 w-full px-3 flex items-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50">{__('Seconds Threshold only applies to ', 'fiveprayer')}<strong className="text-gray-600 ml-1">{__('Nearest', 'fiveprayer')}</strong>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {roundingEnabled
              ? (
                <>
                  {activeExplanation}{' '}
                  <span className="text-gray-400">{__('The chosen method is used when you click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' and is saved automatically with it. ', 'fiveprayer')}{!isNearest && 'The Seconds Threshold is ignored for this method — it only applies to Nearest.'}
                  </span>
                </>
              ) : (
                <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">{__('Custom rounding is ', 'fiveprayer')}<strong>{__('off', 'fiveprayer')}</strong>{__(' — every time is rounded with standard Nearest (30s cutoff). Generate Calendar to apply this to the timetable.', 'fiveprayer')}</span>
              )}
          </p>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <strong className="text-gray-700">{__('How the Seconds Threshold works (Nearest)', 'fiveprayer')}</strong>{__(' — when the seconds are', 'fiveprayer')}<strong>{__(' below your number', 'fiveprayer')}</strong>{__(' the minute does ', 'fiveprayer')}<strong>{__('NOT change', 'fiveprayer')}</strong>{__('; once they', 'fiveprayer')}{' '}
            <strong>{__('reach your number or more', 'fiveprayer')}</strong>{__(' it rounds ', 'fiveprayer')}<strong>{__('up', 'fiveprayer')}</strong>{__(' to the next minute. Live example with your current number:', 'fiveprayer')}<span className="inline-block mt-1.5">
              {threshold === 0 ? (
                <>{__('Threshold ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">0</code>{__(': always round up (same as Up)', 'fiveprayer')}</>
              ) : (
                <>{__('Threshold ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">{threshold}</code>: 04:07:{pad2(threshold - 1)} →{' '}
                  <code className="bg-white px-1 rounded-sm border">04:07</code> · 04:07:{pad2(threshold)} →{' '}
                  <code className="bg-white px-1 rounded-sm border">04:08</code>
                </>
              )}
            </span>
          </div>
          {isNearest && chartDaysActive && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>{__('⚠️ Unified Method Exact chart is on.', 'fiveprayer')}</strong>{__(' Days imported from the chart keep their published minute exactly (Fajr/Isha) — rounding intentionally does not change those days. All other prayers (Sunrise, Dhuhr, Asr, Maghrib) round normally. If you want your threshold applied to Fajr/Isha too, use the Monthly curve instead of the Exact chart, or tune those prayers.', 'fiveprayer')}</div>
          )}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <strong>{__('💡 Why it matters:', 'fiveprayer')}</strong>{__(' rounding decides whether a computed time like 04:37:40 becomes 04:38 (nearest), 04:38 (up), 04:37 (down) or stays exact. If your mosque\'s timetable is a minute earlier/later than your generated one, switching Down/Up is often the fix — but first check the tune offsets, which are usually the real cause.', 'fiveprayer')}</div>
        </div>
      </div>

      {/* Editable options list */}
      <SettingsManager
        settingKey="Rounding_Method"
        storeKey="roundingCalculationMethods"
        settings={settings}
        onUpdateStore={onUpdateStore}
        placeholders={placeholders}
        title={__('Rounding Methods List', 'fiveprayer')}
        description="Edit the available rounding options shown in the dropdown"
        icon={icon}
      />
    </div>
  );
};

export default RoundingMethodSettings;