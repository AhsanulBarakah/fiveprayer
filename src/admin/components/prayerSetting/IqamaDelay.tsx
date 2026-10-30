/**
 * Iqamah Delay Component
 *
 * Input grid for iqamah delay values (Fajr, Dhuhr, Asr, Maghrib, Isha).
 * Also provides CSV upload for bulk import. Disabled when custom schedules
 * override iqamah delays.
 *
 * @module prayerSetting/IqamaDelay
 */
import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useIqamaStore } from '../../state/storeIqamaDelay';
import { useCustomPrayerTimeSchedulesStore } from '../../state/useCustomPrayerTimeSchedulesStore';
import type { CustomPrayerTimeSchedule } from '../../state/useCustomPrayerTimeSchedulesStore';
import { __ } from '@wordpress/i18n';


const hasActiveCustomSchedule = (customSchedules: CustomPrayerTimeSchedule[]) => {
  return customSchedules.some(schedule => {
    if (!schedule.enabled) return false;
    return schedule.prayerTimeEnabledFlags && (
      (schedule.prayerTimeEnabledFlags.isFajrIqamahEnabled && schedule.prayerTimes?.fajrIqamah) ||
      (schedule.prayerTimeEnabledFlags.isDhuhrIqamahEnabled && schedule.prayerTimes?.dhuhrIqamah) ||
      (schedule.prayerTimeEnabledFlags.isAsrIqamahEnabled && schedule.prayerTimes?.asrIqamah) ||
      (schedule.prayerTimeEnabledFlags.isMaghribIqamahEnabled && schedule.prayerTimes?.maghribIqamah) ||
      (schedule.prayerTimeEnabledFlags.isIshaIqamahEnabled && schedule.prayerTimes?.ishaIqamah)
    );
  });
};

const IqamaDelay = () => {
  const IQFajr = useIqamaStore((state) => state.IQFajr);
  const IQDhuhr = useIqamaStore((state) => state.IQDhuhr);
  const IQAsr = useIqamaStore((state) => state.IQAsr);
  const IQMaghrib = useIqamaStore((state) => state.IQMaghrib);
  const IQIsha = useIqamaStore((state) => state.IQIsha);
  const updateIQFajr = useIqamaStore((state) => state.updateIQFajr);
  const updateIQDhuhr = useIqamaStore((state) => state.updateIQDhuhr);
  const updateIQAsr = useIqamaStore((state) => state.updateIQAsr);
  const updateIQMaghrib = useIqamaStore((state) => state.updateIQMaghrib);
  const updateIQIsha = useIqamaStore((state) => state.updateIQIsha);
  const { isCustomSchedulesEnabled, customSchedules } = useCustomPrayerTimeSchedulesStore();
  const refUpload = React.useRef<HTMLDialogElement>(null);
  const handlePress = () => { refUpload.current?.showModal(); };

  const isDisabled = isCustomSchedulesEnabled && hasActiveCustomSchedule(customSchedules);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden relative">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{__('Iqamah Delay', 'fiveprayer')}</h2>
            <p className="text-xs text-gray-500">{__('Set iqamah delays in minutes', 'fiveprayer')}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          <Input value={IQFajr} label={__('Fajr', 'fiveprayer')} name="IQFajr" disabled={isDisabled} disabledReason={isDisabled ? 'Custom schedules active' : ''} onUpdate={(v) => updateIQFajr(v)} />
          <Input value={IQDhuhr} label={__('Dhuhr', 'fiveprayer')} name="IQDhuhr" disabled={isDisabled} onUpdate={(v) => updateIQDhuhr(v)} />
          <Input value={IQAsr} label={__('Asr', 'fiveprayer')} name="IQAsr" disabled={isDisabled} onUpdate={(v) => updateIQAsr(v)} />
          <Input value={IQMaghrib} label={__('Maghrib', 'fiveprayer')} name="IQMaghrib" disabled={isDisabled} onUpdate={(v) => updateIQMaghrib(v)} />
          <Input value={IQIsha} label={__('Isha', 'fiveprayer')} name="IQIsha" disabled={isDisabled} onUpdate={(v) => updateIQIsha(v)} />
          <Button
            refUpload={refUpload}
            onPress={handlePress}
            text="Upload"
            label={__('Upload CSV', 'fiveprayer')}
            classBtnWrapper=""
            className="w-full h-10 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-hidden"
          />
        </div>
      </div>
      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-white opacity-70" />
          <div className="relative z-10 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm shadow-lg">{__('Disabled — Custom schedules override Iqamah delays.', 'fiveprayer')}</div>
        </div>
      )}
    </div>
  );
};

export default IqamaDelay;
