/**
 * FeatureSwitchesPanel
 *
 * Master on/off switches for every feature on the Configure Settings page,
 * rendered as its OWN sidebar entry + page (independent from the per-category
 * cards) — toggling one feature never touches another's stored values.
 *
 * Turning a feature OFF hides/dims its settings card so users are not confused
 * by features they don't use. For engine-backed features the switch also
 * disables the actual behavior:
 *   - Rounding Method   → roundingEnabled = false (standard nearest@30)
 *   - Day-to-Day Smoothing → smoothing_selected.enabled = false
 *   - Unified Method    → the unified entry's params.enabled = false
 *   - Advanced Schedules → custom schedules' isCustomSchedulesEnabled = false
 * The other categories (Prayer Calculation Methods, Asr, Midnight, Higher
 * Latitudes, Calendar Type) are display-only: the stored selection is kept
 * untouched so generation still works — only the card is hidden.
 *
 * Conflicts: when two enabled features don't work together (e.g. Unified
 * Method exact-chart days vs Day-to-Day Smoothing), an amber warning is shown
 * right in the panel explaining which features clash and why.
 *
 * @module prayerSetting/FeatureSwitchesPanel
 */
import React from 'react';
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { useLocationStore } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import { UNIFIED_METHOD_CODE } from './UnifiedMethodSettings';
import { useCustomPrayerTimeSchedulesStore } from '../../state/useCustomPrayerTimeSchedulesStore';
import {
  buildCustomSchedulesPayload,
  saveCustomSchedulesToDatabase,
} from '../../utils/customSchedulesApi';
import { __ } from '@wordpress/i18n';

export const FEATURE_KEYS = [
  'Methods_For_Calculation',
  'Only_affects_Asr_calculation',
  'midnight_calculation_mode',
  'Higher_Latitudes_Methods',
  'Unified_Method_Settings',
  'Rounding_Method',
  'Day_to_day_Smoothing',
  'Calendar_Type',
  'Advanced_Schedules',
  'Next_Prayer_Countdown',
  'Extra_Prayers',
  'Day_Display',
  'TV_Display_Mode',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

interface FeatureDef {
  key: FeatureKey;
  title: string;
  description: string;
  /** Engine-backed — turning OFF also disables the actual behavior. */
  engine?: boolean;
  /** Still marked as beta in the UI. */
  beta?: boolean;
}

const FEATURES: FeatureDef[] = [
  {
    key: 'Methods_For_Calculation',
    title: __('Prayer Calculation Methods', 'fiveprayer'),
    description: __('Define the calculation methods (MWL, ISNA, Umm Al-Qura…) and their criteria.', 'fiveprayer'),
  },
  {
    key: 'Only_affects_Asr_calculation',
    title: __('Asr Calculation', 'fiveprayer'),
    description: __("Shafi'i, Maliki, Hanbali (1 Mithl) or Hanafi (2 Mithl) shadow length for Asr.", 'fiveprayer'),
  },
  {
    key: 'midnight_calculation_mode',
    title: __('Midnight Modes', 'fiveprayer'),
    description: __('Standard or Jafari midnight calculation.', 'fiveprayer'),
  },
  {
    key: 'Higher_Latitudes_Methods',
    title: __('Higher Latitudes', 'fiveprayer'),
    description: __('Adjustment methods for high-latitude regions.', 'fiveprayer'),
  },
  {
    key: 'Unified_Method_Settings',
    title: __('Unified Method', 'fiveprayer'),
    description: __('Custom criteria, seasonal/monthly switching, exact published chart and Jamā‘ah→Iqamah import.', 'fiveprayer'),
    engine: true,
  },
  {
    key: 'Rounding_Method',
    title: __('Rounding Method', 'fiveprayer'),
    description: __('Nearest / Up / Down / None + your Seconds Threshold.', 'fiveprayer'),
    engine: true,
  },
  {
    key: 'Day_to_day_Smoothing',
    title: __('Day-to-Day Smoothing', 'fiveprayer'),
    description: __('Cap how much Begins times may change between consecutive days.', 'fiveprayer'),
    engine: true,
  },
  {
    key: 'Calendar_Type',
    title: __('Calendar Type', 'fiveprayer'),
    description: __('Generate the full-year timetable by Gregorian or Hijri year.', 'fiveprayer'),
  },
  {
    key: 'Advanced_Schedules',
    title: __('Advanced Schedules', 'fiveprayer'),
    description: __('Override prayer times for specific dates or periods.', 'fiveprayer'),
    engine: true,
    beta: true,
  },
  {
    key: 'Next_Prayer_Countdown',
    title: __('Next Prayer Countdown', 'fiveprayer'),
    description: __('Live "time remaining until the next prayer" in the Vertical Daily Prayer and via shortcode.', 'fiveprayer'),
    engine: true,
  },
  {
    key: 'Extra_Prayers',
    title: __('Extra Prayers', 'fiveprayer'),
    description: __('Up to six optional prayers (multiple Jumu\u2018ah, Eid, …) via the [Fp_Extra_Prayer_1..6] shortcodes.', 'fiveprayer'),
    engine: true,
  },
  {
    key: 'Day_Display',
    title: __('Day Display', 'fiveprayer'),
    description: __('Optional Day column in the monthly timetable plus the weekday name / day-of-month number folded into the current-date line — full name, short name and/or number, in your chosen order.', 'fiveprayer'),
    engine: true,
  },
  {
    // Master switch of the TV Display Mode page. It is a beta feature, so it
    // ships OFF like every other optional feature — the same factory default as
    // DEFAULT_FEATURE_TOGGLES and TVDisplayMode::is_feature_enabled().
    // ON → its page is listed in the Categories list, where its switches
    // (Pages, Posts, Share on Local Network and the two editor design aids, Canvas
    // Force and Safe Zone Guide) are chosen. OFF → all of them are switched off
    // with it, so no editor shows the box and the site is reachable only from
    // this computer.
    key: 'TV_Display_Mode',
    title: __('TV Display Mode', 'fiveprayer'),
    description: __('The “Enable TV Mode” box in Pages and Posts, plus opening the site from a TV or phone on your Wi-Fi. Its switches — including the Canvas Force and Safe Zone Guide editor aids — have their own page in the Categories list. Still being improved, so expect changes.', 'fiveprayer'),
    engine: true,
    beta: true,
  },
];

/**
   * Force the three TV Display Mode sub-switches off (Pages, Posts and the
   * TV / Phone network switch) through their own endpoints.
   *
   * Called whenever the master switch is turned off, so "TV Display Mode off"
   * really means every checkbox it owns is off: no editor offers the box and the
   * network address stops being rewritten. Both endpoints re-check the
   * capability, the nonce and the master switch server-side; this only drives
   * them from the panel that turned the master off.
   */
  const resetTvDisplaySubSwitches = async (): Promise<void> => {
    const tv = window.FivePrayerData?.tvDisplay;
    const local = window.FivePrayerData?.localTesting;
    const ajaxUrl = window.FivePrayerData?.ajaxUrl || '';
    const requests: Array<Promise<any>> = [];

    // Form-encoded on purpose: admin-ajax reads `$_POST`, and apiFetch would
    // otherwise JSON-encode `data` and leave `$_POST` empty (nonce check fails).
    const post = (action: string, nonce: string, body: Record<string, string>) =>
      apiFetch({
        url: ajaxUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ action, nonce, ...body }),
      });

    if (tv) {
      const scopes = tv.postTypes && tv.postTypes.length > 0 ? tv.postTypes : ['page', 'post'];
      scopes.forEach((scope) => {
        requests.push(post(tv.ajaxAction, tv.nonce, { scope, enabled: '0' }));
      });
    }

    if (local) {
      requests.push(post(local.ajaxAction, local.nonce, { enabled: '0' }));
    }

    // The two editor-only design aids of the TV Display Mode page (Canvas Force
    // and the Safe Zone Guide) belong to that page too, so they are switched off
    // with it. Only the switches are reset; nothing is deleted.
    const canvas = window.FivePrayerData?.tvCanvas;
    if (canvas) {
      const guideField = canvas.guideField || 'guide';
      requests.push(
        post(canvas.ajaxAction, canvas.nonce, {
          [guideField]: canvas.canvasForceKey || 'canvas_force',
          enabled: '0',
        })
      );
      requests.push(
        post(canvas.ajaxAction, canvas.nonce, {
          [guideField]: canvas.safeZoneKey || 'safe_zone',
          enabled: '0',
        })
      );
    }

    await Promise.all(requests).catch(() => {});
  };



  /**
   * Feature combinations that do not work well together. `when` receives the
 * current toggle map plus the unified season mode so warnings can be specific
 * (e.g. the clash only exists in exact-chart mode).
 */
interface ConflictRule {
  a: FeatureKey;
  b: FeatureKey;
  /** Extra condition (unified mode etc.) for the conflict to apply. */
  when?: (toggles: Record<string, boolean>, unifiedMode: string) => boolean;
  message: string;
}

const CONFLICTS: ConflictRule[] = [
  {
    a: 'Unified_Method_Settings',
    b: 'Day_to_day_Smoothing',
    when: (_t, mode) => mode === 'chart' || mode === 'monthly',
    message:
      __('The Unified Method pins exact published minutes (chart) or a smooth angle curve (monthly). Day-to-Day Smoothing re-caps those day-to-day steps, which hides the printed table’s real shape. For an exact published timetable, turn Day-to-Day Smoothing off.', 'fiveprayer'),
  },
  {
    a: 'Unified_Method_Settings',
    b: 'Rounding_Method',
    when: (_t, mode) => mode === 'chart',
    message:
      __('In Exact chart mode, chart-pinned days bypass the Rounding Method (their minute is final). Rounding still applies to computed (non-chart) days, so the two can work together — but if you expected the chart minutes to be rounded, they will not be.', 'fiveprayer'),
  },
  {
    a: 'Day_to_day_Smoothing',
    b: 'Rounding_Method',
    when: (toggles) => {
      // Only a real clash when rounding is "none"/exact AND smoothing is on:
      // smoothing re-derives rounded minutes, so "none" times get rounded after all.
      const sel = useLocationStore.getState().rounding_selected;
      return String(sel?.method || 'nearest') === 'none';
    },
    message:
      __('Your Rounding Method is set to "None (Exact)" but Day-to-Day Smoothing re-rounds every capped time to a minute. The two fight: the smoothing pass produces whole minutes no matter what "None" says. Use "None" with smoothing off, or keep a minute rounding with smoothing on.', 'fiveprayer'),
  },
];

/** Cards that are hidden but whose stored value must keep working at generation. */
const isDisplayOnly = (key: FeatureKey): boolean => !FEATURES.find((f) => f.key === key)?.engine;

const FeatureSwitchesPanel: React.FC = () => {
  const feature_toggles = useLocationStore((state) => state.feature_toggles);
  const feature_toggles_update = useLocationStore((state) => state.feature_toggles_update);
  const updateRoundingEnabled = useLocationStore((state) => state.updateRoundingEnabled);
  const smoothing_selected = useLocationStore((state) => state.smoothing_selected);
  const smoothing_selected_update = useLocationStore((state) => state.smoothing_selected_update);
  const feature_off_display = useLocationStore((state) => state.feature_off_display || 'hide');
  const updateFeatureOffDisplay = useLocationStore((state) => state.updateFeatureOffDisplay);
  const methodsForCalculation = useLocationStore((state) =>
    Array.isArray(state.methodsForCalculation) ? state.methodsForCalculation : []
  );
  const { saveBatch } = usePostMeta();
  const setIsCustomSchedulesEnabled = useCustomPrayerTimeSchedulesStore(
    (state) => state.setIsCustomSchedulesEnabled
  );

  const toggles = { ...(feature_toggles || {}) };
  const isOn = (key: FeatureKey): boolean => toggles[key] !== false;

  // Live unified season mode (for specific conflict messages).
  const unifiedEntry = methodsForCalculation.find(
    (m: any) => String(m.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
  );
  const unifiedMode = String(unifiedEntry?.params?.seasonMode || unifiedEntry?.params?.seasonmode || 'manual');

  const activeConflicts = CONFLICTS.filter((rule) => {
    if (isOn(rule.a) && isOn(rule.b)) {
      return rule.when ? rule.when(toggles, unifiedMode) : true;
    }
    return false;
  });

  /** Flip the engine-backed flags so OFF really disables the behavior. */
  const syncEngineFlag = (key: FeatureKey, enabled: boolean) => {
    if (key === 'Rounding_Method') {
      updateRoundingEnabled(enabled);
    }
    if (key === 'Day_to_day_Smoothing') {
      smoothing_selected_update({
        enabled,
        maxSeconds: smoothing_selected?.maxSeconds ?? 90,
        mode: smoothing_selected?.mode ?? 'noDrift',
        driftBudget: smoothing_selected?.driftBudget ?? 180,
        // Keep the per-prayer Manual steps intact across enable/disable.
        manualSteps: smoothing_selected?.manualSteps ?? {},
      });
    }
    // Advanced Schedules → the custom-schedules master switch. The stored
    // schedules themselves are never touched, so switching the feature back on
    // restores the exact same overrides.
    if (key === 'Advanced_Schedules') {
      setIsCustomSchedulesEnabled(enabled);
    }
  };

  /** Toggle a feature and surface conflicts immediately. */
  const handleToggle = (key: FeatureKey, enabled: boolean) => {
    // TV Display Mode is the master switch of its own page: turning it off
    // switches every switch on that page off with it — Pages, Posts, TV / Phone
    // Display and the two editor-only design aids (Canvas Force, Safe Zone
    // Guide) — and turning it on brings its page back to the Categories list
    // with all of them off.
    if (key === 'TV_Display_Mode') {
      if (!enabled) {
        void resetTvDisplaySubSwitches().then(() => {
        toast.success(__('TV Display Mode is off', 'fiveprayer'), {
          description: __('Pages, Posts, Share on Local Network and the two editor design aids (Canvas Force, Safe Zone Guide) were switched off too, so no editor shows the box and the site is reachable from this computer only.', 'fiveprayer'),
          duration: 6000,
        });
        });
      } else {
        toast.success(__('TV Display Mode is on', 'fiveprayer'), {
          description: __('Its page is back in the Categories list. Turn on Pages, Posts or Share on Local Network there — all three are off until you do.', 'fiveprayer'),
          duration: 6000,
        });
      }
    }

    // Unified Method off → flip params.enabled on the unified entry too.
    if (key === 'Unified_Method_Settings' && unifiedEntry) {
      const updated = methodsForCalculation.map((m: any) =>
        String(m.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
          ? { ...m, params: { ...(m.params || {}), enabled } }
          : m
      );
      useLocationStore.getState().updateMethodsForCalculation(updated);
      const opts = useLocationStore.getState().methodsForCal;
      const optsValue = Array.isArray(opts?.value) ? opts.value : [];
      useLocationStore.getState().updateSetMethodsForCal({
        ...opts,
        value: optsValue.map((o: any) =>
          String(o.method || '').toLowerCase() === UNIFIED_METHOD_CODE.toLowerCase()
            ? { ...o, params: { ...(o.params || {}), enabled } }
            : o
        ),
      });
      saveBatch({ Methods_For_Calculation: updated });
    }
    syncEngineFlag(key, enabled);
    feature_toggles_update(key, enabled);
    // Persist to the DATABASE so every switch survives a page refresh — the
    // store alone is wiped on reload, which made the toggles come back ON
    // (or the derived engine flags revert) every time the page was opened.
    const next = { ...toggles, [key]: enabled };
    const dbPayload: Record<string, any> = { feature_toggles: next };
    if (key === 'Rounding_Method') {
      dbPayload.rounding_enabled = enabled;
    }
    if (key === 'Day_to_day_Smoothing') {
      dbPayload.smoothing_selected = {
        enabled,
        maxSeconds: smoothing_selected?.maxSeconds ?? 90,
        mode: smoothing_selected?.mode ?? 'noDrift',
        driftBudget: smoothing_selected?.driftBudget ?? 180,
        manualSteps: smoothing_selected?.manualSteps ?? {},
      };
    }
    saveBatch(dbPayload).catch(() => {});

    // The custom schedules live in their OWN meta, so the master switch has to
    // be written there as well — otherwise a refresh would turn Advanced
    // Schedules back on while the feature switch says Off.
    if (key === 'Advanced_Schedules') {
      const schedulesState = useCustomPrayerTimeSchedulesStore.getState();
      saveCustomSchedulesToDatabase(
        buildCustomSchedulesPayload(schedulesState.customSchedules, enabled)
      ).catch(() => {});
    }

    // Warn if this change creates a clash with another enabled feature.
    const newConflicts = CONFLICTS.filter((rule) => {
      const involved = rule.a === key || rule.b === key;
      if (!involved) return false;
      if (next[rule.a] === false || next[rule.b] === false) return false;
      return rule.when ? rule.when(next, unifiedMode) : true;
    });
    if (enabled && newConflicts.length > 0) {
      toast.warning(__('⚠️ These features don’t work together', 'fiveprayer'), {
        description: newConflicts[0].message,
        duration: 6000,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{__('Feature Switches', 'fiveprayer')}</h2>
          <p className="text-xs text-gray-500">{__('Turn each Configure Settings feature on or off. Turning one off hides its card in the sidebar and never changes the others’ values.', 'fiveprayer')}</p>
        </div>
      </div>

      <div className="p-6">
        {activeConflicts.length > 0 && (
          <div className="mb-4 space-y-2">
            {activeConflicts.map((rule, i) => (
              <div
                key={i}
                className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2"
              >
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p>
                  <strong>⚠️ {FEATURES.find((f) => f.key === rule.a)?.title} + {FEATURES.find((f) => f.key === rule.b)?.title}:</strong>{' '}
                  {rule.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map((feature) => {
            const on = isOn(feature.key);
            return (
              <div
                key={feature.key}
                className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
                  on ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-80'
                }`}
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {feature.title}
                    {feature.engine && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm">{__('engine', 'fiveprayer')}</span>
                    )}
                    {feature.beta && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm">{__('beta', 'fiveprayer')}</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{feature.description}</p>
                  {!on && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {isDisplayOnly(feature.key)
                        ? 'Card hidden — your saved selection still applies at generation.'
                        : 'Card hidden and the behavior is turned off.'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(feature.key, !on)}
                  className={`h-8 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 ${
                    on ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  <span>{on ? 'On' : 'Off'}</span>
                  <span className={`w-7 h-4 rounded-full relative transition-colors ${on ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[15px]' : 'left-0.5'}`}
                    />
                  </span>
                </button>
              </div>
            );
          })}

          {/* TV Display Mode has its own page in the Categories list now (one
              switch for Pages, one for Posts, plus the "Share on Local Network"
              network switch), so it is deliberately NOT a row of this grid: the
              three switches that belong together are chosen in one place. */}
        </div>

        <p className="text-[11px] text-gray-400 mt-3">{__('Rounding Method / Day-to-Day Smoothing / Unified Method / Advanced Schedules switches also disable the real behavior at generation (their internal on/off toggles are switched off too). TV Display Mode is the master switch of its own page in the Categories list: while it is on, its switches (Pages, Posts and “Share on Local Network” for opening the site from a TV or phone on your Wi-Fi, plus the two editor-only design aids “Canvas Force” and “Safe Zone Guide”) are chosen there and all start off; turn it off here and they are all switched off with it, so no editor shows the box and another device can no longer open the site. The other switches stop their card from being used — your stored dropdown selections are never deleted. Changes save automatically.', 'fiveprayer')}</p>

        {/* How turned-off features appear in the sidebar — user's choice */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900">{__('Sidebar appearance for turned-off features', 'fiveprayer')}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{__('How the ', 'fiveprayer')}<strong>{__('Categories', 'fiveprayer')}</strong>{__(' list on the left shows the features you switch off here. The', 'fiveprayer')}{' '}
            <strong>{__('Feature Switches', 'fiveprayer')}</strong>{__(' entry itself always stays visible either way.', 'fiveprayer')}</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {(
              [
                {
                  value: 'hide' as const,
                  title: __('Hide them completely', 'fiveprayer'),
                  desc: __('A turned-off feature disappears from the Categories list (display: none). You only see it again after switching it back on here.', 'fiveprayer'),
                },
                {
                  value: 'badge' as const,
                  title: __('Show them dimmed with Off', 'fiveprayer'),
                  desc: __('The entry stays in the list, dimmed, with an "Off" badge. Clicking it shows a “turned off” notice with a button straight to Feature Switches.', 'fiveprayer'),
                },
              ]
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  feature_off_display === opt.value
                    ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="feature_off_display"
                  value={opt.value}
                  checked={feature_off_display === opt.value}
                  onChange={() => {
                    updateFeatureOffDisplay(opt.value);
                    saveBatch({ feature_off_display: opt.value }).catch(() => {});
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{opt.title}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureSwitchesPanel;