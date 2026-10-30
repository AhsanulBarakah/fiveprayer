/**
 * Tune Prayer Component
 *
 * Input grid for prayer time offsets (Imsak, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Midnight).
 * Also contains the "Generate Calendar" button that saves all settings and triggers calendar generation.
 * Disabled when custom prayer time schedules are active and override tune settings.
 *
 * @module prayerSetting/TunePrayer
 */
import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useTuneStore } from '../../state/storeTunePrayer';
import { useIqamaStore } from '../../state/storeIqamaDelay';
import { useConditional } from '../../state/storeConditional';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { useCustomPrayerTimeSchedulesStore } from '../../state/useCustomPrayerTimeSchedulesStore';
import type { CustomPrayerTimeSchedule } from '../../state/useCustomPrayerTimeSchedulesStore';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useLocationStore } from '../../state/storeLocation';
import { useTranslationStore } from '../../state/useTranslationStore';
import { __ } from '@wordpress/i18n';

const hasActiveCustomScheduleForTune = (customSchedules: CustomPrayerTimeSchedule[]) => {
  return customSchedules.some(schedule => {
    if (!schedule.enabled) return false;
    return schedule.prayerTimeEnabledFlags && (
      (schedule.prayerTimeEnabledFlags.isFajrEnabled && schedule.prayerTimes?.fajr) ||
      (schedule.prayerTimeEnabledFlags.isDhuhrEnabled && schedule.prayerTimes?.dhuhr) ||
      (schedule.prayerTimeEnabledFlags.isAsrEnabled && schedule.prayerTimes?.asr) ||
      (schedule.prayerTimeEnabledFlags.isMaghribEnabled && schedule.prayerTimes?.maghrib) ||
      (schedule.prayerTimeEnabledFlags.isIshaEnabled && schedule.prayerTimes?.isha)
    );
  });
};

const TunePrayer = () => {
  // Tune values
  const Imsak = useTuneStore((state) => state.Imsak);
  const Fajr = useTuneStore((state) => state.Fajr);
  const Sunrise = useTuneStore((state) => state.Sunrise);
  const Dhuhr = useTuneStore((state) => state.Dhuhr);
  const Asr = useTuneStore((state) => state.Asr);
  const Sunset = useTuneStore((state) => state.Sunset);
  const Maghrib = useTuneStore((state) => state.Maghrib);
  const Isha = useTuneStore((state) => state.Isha);
  const Midnight = useTuneStore((state) => state.Midnight);
  const updateImsak = useTuneStore((state) => state.updateImsak);
  const updateFajr = useTuneStore((state) => state.updateFajr);
  const updateSunrise = useTuneStore((state) => state.updateSunrise);
  const updateDhuhr = useTuneStore((state) => state.updateDhuhr);
  const updateAsr = useTuneStore((state) => state.updateAsr);
  const updateSunset = useTuneStore((state) => state.updateSunset);
  const updateMaghrib = useTuneStore((state) => state.updateMaghrib);
  const updateIsha = useTuneStore((state) => state.updateIsha);
  const updateMidnight = useTuneStore((state) => state.updateMidnight);
  // Iqamah values
  const IQFajr = useIqamaStore((state) => state.IQFajr);
  const IQDhuhr = useIqamaStore((state) => state.IQDhuhr);
  const IQAsr = useIqamaStore((state) => state.IQAsr);
  const IQMaghrib = useIqamaStore((state) => state.IQMaghrib);
  const IQIsha = useIqamaStore((state) => state.IQIsha);
  // Dropdown values
  const month = useLocationStore((state) => state.month);
  const mncm = useLocationStore((state) => state.mncm);
  const oaac = useLocationStore((state) => state.oaac);
  const hlm = useLocationStore((state) => state.hlm);
  const mfc = useLocationStore((state) => state.mfc);
  const rounding_selected = useLocationStore((state) => state.rounding_selected);
  const roundingEnabled = useLocationStore((state) => state.roundingEnabled);
  const smoothing_selected = useLocationStore((state) => state.smoothing_selected);
  const calendar_type = useLocationStore((state) => state.calendar_type);
  const calendar_display = useLocationStore((state) => state.calendar_display);
  const feature_toggles = useLocationStore((state) => state.feature_toggles);
  const feature_off_display = useLocationStore((state) => state.feature_off_display);
  const customLocationSelected = useLocationStore((state) => state.customLocationSelected);

  const TimeTableMonthFullYear = useTimeTableMonth((state) => state.TimeTableMonthFullYear);
  const { isReadyGenerator, requestGenerate, updateIsReadyToPost } = useConditional();
  const [loading, setLoading] = useState(false);
  const { isCustomSchedulesEnabled, customSchedules } = useCustomPrayerTimeSchedulesStore();
  const { saveBatch } = usePostMeta();
  const { fetchTranslations } = useTranslationStore();

  const isDisabled = isCustomSchedulesEnabled && hasActiveCustomScheduleForTune(customSchedules);

  /**
   * Collect ALL settings into one JSON — one POST, everything included.
   * Used by both the Save Settings and Generate Calendar buttons so they
   * always persist exactly the same data.
   */
  const buildAllSettings = (): Record<string, any> => ({
    // Tune prayer
    Imsak: String(Imsak || '0'),
    Fajr: String(Fajr || '0'),
    Sunrise: String(Sunrise || '0'),
    Dhuhr: String(Dhuhr || '0'),
    Asr: String(Asr || '0'),
    Sunset: String(Sunset || '0'),
    Maghrib: String(Maghrib || '0'),
    Isha: String(Isha || '0'),
    Midnight: String(Midnight || '0'),
    // Iqamah delay
    IQFajr: String(IQFajr || '0'),
    IQDhuhr: String(IQDhuhr || '0'),
    IQAsr: String(IQAsr || '0'),
    IQMaghrib: String(IQMaghrib || '0'),
    IQIsha: String(IQIsha || '0'),
    // Dropdown selections
    ...(mncm?.name || mncm?.method ? { mncm_selected: mncm } : {}),
    ...(oaac?.name || oaac?.method ? { oaac_selected: oaac } : {}),
    ...(hlm?.name || hlm?.method ? { hlm_selected: hlm } : {}),
    ...(mfc?.name || mfc?.method ? { mfc_selected: mfc } : {}),
    ...(rounding_selected?.name || rounding_selected?.method ? { rounding_selected } : {}),
    ...(typeof roundingEnabled === 'boolean' ? { rounding_enabled: roundingEnabled } : {}),
    ...(smoothing_selected ? { smoothing_selected } : {}),
    ...(calendar_type ? { calendar_type } : {}),
    ...(calendar_display ? { calendar_display: calendar_display } : {}),
    ...(feature_toggles ? { feature_toggles: feature_toggles } : {}),
    ...(feature_off_display ? { feature_off_display: feature_off_display } : {}),
    ...(month?.name ? { month: month } : {}),
    // Selected location ("Location, City" dropdown). Persisted here so the
    // dropdown auto-selects the saved location again after a reload. This was
    // dropped from the batch when per-field saving was removed, which left the
    // field empty on every fresh load.
    ...(customLocationSelected &&
    (customLocationSelected.country || customLocationSelected.city || customLocationSelected.lat || customLocationSelected.lng)
      ? { location: customLocationSelected }
      : {}),
    // Custom schedules
    'custom-prayer-time-schedules': {
      state: {
        customSchedules,
        isCustomSchedulesEnabled,
      },
      version: 0,
    },
  });

  /**
   * Generate Calendar — saves the settings first, then triggers calendar
   * generation via the generateRequestId counter (PrayerCalendar listens to
   * it). Decoupled from the isReadyGenerator/isReadyToPost flags so the
   * first click always generates, never silently just saves.
   */
  const handlerGenerate = () => {
    if (loading) return;
    setLoading(true);
    saveBatch(buildAllSettings())
      .then(() => {
        fetchTranslations();
        // Let the per-field hooks (usePostTune / usePostIqama) flush any
        // pending individual saves — they watch this flag.
        updateIsReadyToPost(true);
        requestGenerate();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handlerDownloadCSV = () => {
    let timeTableMonth = typeof TimeTableMonthFullYear !== 'object' && TimeTableMonthFullYear !== undefined
      ? JSON.parse(TimeTableMonthFullYear) : TimeTableMonthFullYear;
    if (!timeTableMonth || !timeTableMonth[0]) return;
    let timeTableColumnKey = `${Object.keys(timeTableMonth[0]).map((v) => `"${v}"`).join(',')}` + '\r\n';
    let csvContent = timeTableMonth.reduce((acc: string, next: { [s: string]: unknown } | ArrayLike<unknown>) => {
      acc += `${Object.values(next).map((v) => `"${v}"`).join(',')}` + '\r\n';
      return acc;
    }, timeTableColumnKey);
    let element = document.createElement('a');
    element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent);
    element.target = '_blank';
    element.download = 'fiveprayer.csv';
    element.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden relative">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{__('Tune Prayer', 'fiveprayer')}</h2>
            <p className="text-xs text-gray-500">{__('Adjust prayer times in minutes', 'fiveprayer')}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3">
          <Input value={Imsak} label={__('Imsak', 'fiveprayer')} disabled={isDisabled} disabledReason={isDisabled ? 'Custom schedules active' : ''} onUpdate={(v) => updateImsak(v)} />
          <Input value={Fajr} label={__('Fajr', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateFajr(v)} />
          <Input value={Sunrise} label={__('Sunrise', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateSunrise(v)} />
          <Input value={Dhuhr} label={__('Dhuhr', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateDhuhr(v)} />
          <Input value={Asr} label={__('Asr', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateAsr(v)} />
          <Input value={Sunset} label={__('Sunset', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateSunset(v)} />
          <Input value={Maghrib} label={__('Maghrib', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateMaghrib(v)} />
          <Input value={Isha} label={__('Isha', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateIsha(v)} />
        </div>
        <div className="grid grid-cols-[1fr_3fr_2fr] gap-3 mt-3">
          <Input value={Midnight} label={__('Midnight', 'fiveprayer')} disabled={isDisabled} onUpdate={(v) => updateMidnight(v)} />
          <Button
            onPress={handlerGenerate}
            text={loading ? 'Generating...' : isReadyGenerator ? 'Generate Calendar!' : 'Generate Calendar'}
            label={__('Generate Time', 'fiveprayer')}
            classBtnWrapper=""
            className={`w-full h-10 text-sm font-medium rounded-lg transition-colors focus:outline-hidden ${
              loading
                ? 'bg-gray-400 text-white cursor-wait'
                : isReadyGenerator
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 animate-pulse'
                  : 'bg-green-700 text-white hover:bg-green-800'
            }`}
          />
          <Button
            onPress={handlerDownloadCSV}
            text="Download"
            label={__('File CSV', 'fiveprayer')}
            classBtnWrapper=""
            className="w-full h-10 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-hidden"
          />
        </div>
      </div>
      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-white opacity-70" />
          <div className="relative z-10 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm shadow-lg">{__('Disabled — Custom schedules override prayer tune settings.', 'fiveprayer')}</div>
        </div>
      )}
    </div>
  );
};

export default TunePrayer;
