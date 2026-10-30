/**
 * SettingsPage
 *
 * Page displaying categorized calculation setting cards.
 *
 * @module customizing/pages/SettingsPage
 */
import * as React from 'react';
import SettingsManager from '../../prayerSetting/SettingsManager';
import UnifiedMethodSettings from '../../prayerSetting/UnifiedMethodSettings';
import RoundingMethodSettings from '../../prayerSetting/RoundingMethodSettings';
import DaySmoothingSettings from '../../prayerSetting/DaySmoothingSettings';
import CalendarTypeSettings from '../../prayerSetting/CalendarTypeSettings';
import AdvancedSchedulesSettings from '../../prayerSetting/AdvancedSchedulesSettings';
import NextPrayerCountdownSettings from '../../prayerSetting/NextPrayerCountdownSettings';
import ExtraPrayersSettings from '../../prayerSetting/ExtraPrayersSettings';
import DayDisplaySettings from '../../prayerSetting/DayDisplaySettings';
import FeatureSwitchesPanel from '../../prayerSetting/FeatureSwitchesPanel';
import TVDisplayModeSettings from '../../prayerSetting/TVDisplayModeSettings';
import { useLocationStore } from '../../../state/storeLocation';
import { __ } from '@wordpress/i18n';

interface SettingCategory {
  key: string;
  storeKey: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settingsKey: string;
  updateKey: string;
  placeholders?: { name?: string; method?: string };
  /** Still being improved — shows a small "Beta" chip in the sidebar. */
  beta?: boolean;
}

// Stable fallbacks for useLocationStore selectors. Returning a fresh `[]` or
// `() => {}` on every call makes React 18's useSyncExternalStore compare a
// different snapshot each render and re-render forever ("Maximum update depth
// exceeded") — exactly what happened when the Unified Method category was
// selected, since its `unifiedMethodSettings` key does not exist in the store.
const EMPTY_ARRAY: any[] = [];
const NOOP: () => void = () => {};

/**
 * Prevents a crash inside the Unified Method panel from taking down the whole
 * settings route — shows a friendly message instead of the router error page.
 */
class PanelBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h3 className="text-sm font-semibold text-red-800">{__('The Unified Method panel failed to load.', 'fiveprayer')}</h3>
          <p className="text-xs text-red-600 mt-1">{__('Reload the page. If it keeps happening, the stored calculation settings may be corrupted — try the "Reset calculation settings to defaults" option in the settings admin.', 'fiveprayer')}</p>
        </div>
      );
    }
    return this.props.children;
  }
}	const SettingsPage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Methods_For_Calculation');
  // Sidebar entry for the Feature Switches page (its own category-like item).
  const FEATURE_SWITCHES_KEY = 'Feature_Switches';
  // The TV Display Mode entry lives in the `categories` list below (key
  // 'TV_Display_Mode'), so it renders as a normal Categories item — gated by the
  // TV Display Mode master switch on the Feature Switches page through
  // isCategoryOn(): on → the entry is listed; off → it is hidden (or dimmed with
  // an Off badge in 'badge' mode), exactly like every other feature.

  const categories: SettingCategory[] = [
    {
      key: 'Methods_For_Calculation',
      storeKey: 'methodsForCalculation',
      settingsKey: 'methodsForCalculation',
      updateKey: 'updateMethodsForCalculation',
      title: __('Prayer Calculation Methods', 'fiveprayer'),
      description: __('Define methods to calculate prayer times (MWL, ISNA, Umm Al-Qura)', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1 8.646-4.186M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A8.959 8.959 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
        </svg>
      ),
      placeholders: {
        name: 'e.g., Muslim World League',
        method: 'e.g., MWL',
      },
    },
    {
      key: 'Only_affects_Asr_calculation',
      storeKey: 'asrCalculationMethods',
      settingsKey: 'asrCalculationMethods',
      updateKey: 'updateAsrCalculationMethods',
      title: __('Asr Calculation', 'fiveprayer'),
      description: __("Shafi'i, Maliki and Hanbali use 1 Mithl; Hanafi uses 2 Mithl", 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ),
      placeholders: {
        name: 'e.g., Shafii, Maliki, Jafari and Hanbali',
        method: 'e.g., Standard',
      },
    },
    {
      key: 'midnight_calculation_mode',
      storeKey: 'midnightCalculationModes',
      settingsKey: 'midnightCalculationModes',
      updateKey: 'updateMidnightCalculationModes',
      title: __('Midnight Modes', 'fiveprayer'),
      description: __('Standard or Jafari midnight calculation', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      ),
      placeholders: {
        name: 'e.g., Standard (Mid Sunset to Sunrise)',
        method: 'e.g., Standard',
      },
    },
    {
      key: 'Higher_Latitudes_Methods',
      storeKey: 'higherLatitudeMethods',
      settingsKey: 'higherLatitudeMethods',
      updateKey: 'updateHigherLatitudeMethods',
      title: __('Higher Latitudes', 'fiveprayer'),
      description: __('Methods for high latitude regions', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1 8.646-4.186M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A8.959 8.959 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
        </svg>
      ),
      placeholders: {
        name: 'e.g., Middle of The Night Method',
        method: 'e.g., NightMiddle',
      },
    },
    {
      key: 'Unified_Method_Settings',
      storeKey: 'unifiedMethodSettings',
      settingsKey: 'unifiedMethodSettings',
      updateKey: 'unifiedMethodSettings',
      title: __('Unified Method', 'fiveprayer'),
      description: __('Map the exact custom criteria for the Unified Method calculation profile', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      ),
    },
    {
      key: 'Rounding_Method',
      storeKey: 'roundingCalculationMethods',
      settingsKey: 'roundingCalculationMethods',
      updateKey: 'updateRoundingCalculationMethods',
      title: __('Rounding Method', 'fiveprayer'),
      description: __('Choose how generated prayer times are rounded (nearest, up, down, exact)', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      ),
      placeholders: {
        name: 'e.g., Nearest (Standard)',
        method: 'e.g., nearest',
      },
    },
    {
      key: 'Day_to_day_Smoothing',
      storeKey: 'daySmoothing',
      settingsKey: 'daySmoothing',
      updateKey: 'daySmoothing',
      title: __('Day-to-Day Smoothing', 'fiveprayer'),
      description: __('Cap how much Begins times may change between consecutive days', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M4.5 15.75V18a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18v-2.25m-13.5-3V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v6.75" />
        </svg>
      ),
    },
    {
      key: 'Calendar_Type',
      storeKey: 'calendarType',
      settingsKey: 'calendarType',
      updateKey: 'calendarType',
      title: __('Calendar Type', 'fiveprayer'),
      description: __('Generate the full-year timetable based on the Gregorian or Hijri year', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      // Moved here from More Settings → Advanced Schedules. The feature switch
      // of the same key gates this card like every other category.
      key: 'Advanced_Schedules',
      storeKey: 'customSchedules',
      settingsKey: 'customSchedules',
      updateKey: 'setCustomSchedules',
      title: __('Advanced Schedules', 'fiveprayer'),
      description: __('Override prayer times for specific dates or periods. Still being improved, so expect changes.', 'fiveprayer'),
      // Same beta marking as the Feature Switches list and the TV Display Mode
      // entry, so the Categories list shows “Advanced Schedules  Beta” too.
      beta: true,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
      ),
    },
    {
      // Optional Jumu'ah / Eid style prayers rendered by the
      // [Fp_Extra_Prayer_1..6] shortcodes. The feature switch of the same key
      // is the master on/off and ships OFF.
      key: 'Extra_Prayers',
      storeKey: 'extra_prayers',
      settingsKey: 'extra_prayers',
      updateKey: 'updateExtraPrayers',
      title: __('Extra Prayers', 'fiveprayer'),
      description: __('Add up to six optional prayers such as multiple Jumu\u2018ah congregations or Eid prayers', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      // TV Display Mode — just another entry in the Categories list. Holds the
      // three switches that decide whether the per-page box is offered in the
      // Pages editors, in the Posts editors, and whether the site answers on the
      // computer's network address so a TV or phone on the same Wi-Fi can open
      // it. All three start off. The entry itself follows the `TV_Display_Mode`
      // master switch on the Feature Switches page (isCategoryOn), so it is
      // listed while that switch is on and disappears when it is turned off.
      key: 'TV_Display_Mode',
      storeKey: 'tvDisplayMode',
      settingsKey: 'tvDisplayMode',
      updateKey: 'updateTvDisplayMode',
      title: __('TV Display Mode', 'fiveprayer'),
      description: __('Offer the "Enable TV Mode" box in Pages editors, in Posts editors, and let a TV or phone on your Wi-Fi open the site — each switch is independent and off by default. Still being improved, so expect changes.', 'fiveprayer'),
      beta: true,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
    },
    {
      // Optional Day column in the monthly timetable and day line in the
      // Vertical Daily Prayer. The feature switch of the same key is the
      // master on/off and ships OFF.
      key: 'Day_Display',
      storeKey: 'day_display',
      settingsKey: 'day_display',
      updateKey: 'updateDayDisplay',
      title: __('Day Display', 'fiveprayer'),
      description: __('Optional Day column in the monthly timetable and Day parts in the [Fp_Single_CurrentDate] shortcode — full weekday name, short name and/or day-of-month number, in your chosen order', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      // Live "time remaining until the next prayer" shown in the Vertical
      // Daily Prayer and via [Fp_Single_Next_Prayer_Remaining]. The feature
      // switch of the same key is the master on/off.
      key: 'Next_Prayer_Countdown',
      storeKey: 'next_prayer_countdown',
      settingsKey: 'next_prayer_countdown',
      updateKey: 'updateNextPrayerCountdown',
      title: __('Next Prayer Countdown', 'fiveprayer'),
      description: __('Customize the live time-remaining display for the next prayer (format and labels)', 'fiveprayer'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
  ];

  const currentCategory = categories.find(cat => cat.key === selectedCategory) || categories[0];

  const settings = useLocationStore((state: any) => {
    const val = state[currentCategory.settingsKey];
    return Array.isArray(val) ? val : EMPTY_ARRAY;
  });
  const onUpdateStore = useLocationStore((state: any) => {
    const fn = state[currentCategory.updateKey];
    return typeof fn === 'function' ? fn : NOOP;
  });

  // Master Feature Switches — its own sidebar entry + page (always visible).
  // When a category is turned OFF its card is replaced by a placeholder and,
  // depending on the chosen display mode, the sidebar entry is either removed
  // completely (feature_off_display === 'hide', the default) or dimmed with an
  // "Off" badge ('badge'). Toggling one feature never changes the others'
  // stored values.
  const feature_toggles = useLocationStore((state: any) => state.feature_toggles || {});
  const feature_off_display = useLocationStore((state: any) => state.feature_off_display || 'hide');
  // Only the Feature Switches page itself is exempt: it is the place where a
  // turned-off feature is switched back on, so it must never disappear.
  const isCategoryOn = (key: string): boolean =>
    key === FEATURE_SWITCHES_KEY || feature_toggles[key] !== false;

  const featureSwitchesIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        {/* Sidebar — full-width chip strip on small screens, vertical rail from lg */}
        <div className="w-full lg:w-72 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">{__('Categories', 'fiveprayer')}</h2>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
            {categories.map((category) => {
              const on = isCategoryOn(category.key);
              // 'hide' mode (default): a turned-off feature disappears from the
              // sidebar entirely — the user does not see it until they switch
              // it back on in Feature Switches.
              if (!on && feature_off_display === 'hide') return null;
              const offBadge = !on && feature_off_display === 'badge';
              return (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal text-left px-3 py-2.5 rounded-lg transition-all focus:outline-hidden ${
                    selectedCategory === category.key
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${on ? '' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`shrink-0 ${selectedCategory === category.key ? 'text-green-600' : 'text-gray-400'}`}>
                      {category.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium lg:truncate">{category.title}</p>
                    </div>
                    {category.beta && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm shrink-0">{__('beta', 'fiveprayer')}</span>
                    )}
                    {offBadge && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-sm shrink-0">{__('Off', 'fiveprayer')}</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Feature Switches — own entry, always available (cannot be turned off).
                `contents` on small screens makes the button a direct flex item of the
                horizontal chip strip; from lg it becomes the bordered block again. */}
            <div className="contents lg:block lg:pt-2 lg:mt-2 lg:border-t lg:border-gray-100">
              <button
                onClick={() => setSelectedCategory(FEATURE_SWITCHES_KEY)}
                className={`shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal text-left px-3 py-2.5 rounded-lg transition-all focus:outline-hidden ${
                  selectedCategory === FEATURE_SWITCHES_KEY
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`shrink-0 ${selectedCategory === FEATURE_SWITCHES_KEY ? 'text-purple-600' : 'text-gray-400'}`}>
                    {featureSwitchesIcon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium lg:truncate">{__('Feature Switches', 'fiveprayer')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {selectedCategory === FEATURE_SWITCHES_KEY ? (
              <FeatureSwitchesPanel />
            ) : selectedCategory === 'TV_Display_Mode' ? (
              <TVDisplayModeSettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : !isCategoryOn(currentCategory.key) ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  {currentCategory.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{currentCategory.title}{__(' is turned off', 'fiveprayer')}</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">{__('This feature was switched off in the ', 'fiveprayer')}<strong>{__('Feature Switches', 'fiveprayer')}</strong>{__(' page. Turn it back on there to edit it again — your saved values are untouched.', 'fiveprayer')}</p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(FEATURE_SWITCHES_KEY)}
                  className="mt-4 text-xs font-medium px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-hidden"
                >{__('Open Feature Switches', 'fiveprayer')}</button>
              </div>
            ) : currentCategory.key === 'Unified_Method_Settings' ? (
              <PanelBoundary>
                <UnifiedMethodSettings standalone />
              </PanelBoundary>
            ) : currentCategory.key === 'Rounding_Method' ? (
              <RoundingMethodSettings
                settings={settings}
                onUpdateStore={onUpdateStore}
                placeholders={currentCategory.placeholders}
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : currentCategory.key === 'Day_to_day_Smoothing' ? (
              <DaySmoothingSettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : currentCategory.key === 'Calendar_Type' ? (
              <CalendarTypeSettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : currentCategory.key === 'Advanced_Schedules' ? (
              <AdvancedSchedulesSettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : currentCategory.key === 'Day_Display' ? (
              <DayDisplaySettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : currentCategory.key === 'Next_Prayer_Countdown' ? (
              <NextPrayerCountdownSettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : currentCategory.key === 'Extra_Prayers' ? (
              <ExtraPrayersSettings
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            ) : (
              <SettingsManager
                settingKey={currentCategory.key}
                storeKey={currentCategory.storeKey}
                settings={settings}
                onUpdateStore={onUpdateStore}
                placeholders={currentCategory.placeholders}
                title={currentCategory.title}
                description={currentCategory.description}
                icon={currentCategory.icon}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
