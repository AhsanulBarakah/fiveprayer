/**
 * PrayerTimeInputs
 *
 * Grid of prayer time input fields for all five prayers.
 *
 * @module ScheduleComponents/PrayerTimeInputs
 */
import React from 'react';
import { SinglePrayerInput } from './SinglePrayerInput';
import { __ } from '@wordpress/i18n';

interface PrayerTimeInputsProps {
  newSchedule: any;
  togglePrayerTime: (field: 'fajr' | 'fajrIqamah' | 'dhuhr' | 'dhuhrIqamah' | 'asr' | 'asrIqamah' | 'maghrib' | 'maghribIqamah' | 'isha' | 'ishaIqamah') => void;
  handlePrayerTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getTranslatedPrayerName: (name: string) => string;
  getTranslatedTimetableTerm: (term: string) => string;
}

export const PrayerTimeInputs: React.FC<PrayerTimeInputsProps> = ({
  newSchedule,
  togglePrayerTime,
  handlePrayerTimeChange,
  getTranslatedPrayerName,
  getTranslatedTimetableTerm
}) => {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{__('Prayer Times', 'fiveprayer')}</h4>
        <p className="mt-0.5 text-xs text-gray-500">{__('Switch on the times you want to override, then enter them. Anything left off keeps the calculated time.', 'fiveprayer')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Fajr Begins */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Fajr', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Begins', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.fajr}
          isEnabled={newSchedule.isFajrEnabled}
          onToggle={() => togglePrayerTime('fajr')}
          onTimeChange={handlePrayerTimeChange}
          timeName="fajr"
        />

        {/* Fajr Iqamah */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Fajr', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Iqamah', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.fajrIqamah}
          isEnabled={newSchedule.isFajrIqamahEnabled}
          onToggle={() => togglePrayerTime('fajrIqamah')}
          onTimeChange={handlePrayerTimeChange}
          timeName="fajrIqamah"
        />

        {/* Dhuhr Begins */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Dhuhr', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Begins', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.dhuhr}
          isEnabled={newSchedule.isDhuhrEnabled}
          onToggle={() => togglePrayerTime('dhuhr')}
          onTimeChange={handlePrayerTimeChange}
          timeName="dhuhr"
        />

        {/* Dhuhr Iqamah */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Dhuhr', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Iqamah', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.dhuhrIqamah}
          isEnabled={newSchedule.isDhuhrIqamahEnabled}
          onToggle={() => togglePrayerTime('dhuhrIqamah')}
          onTimeChange={handlePrayerTimeChange}
          timeName="dhuhrIqamah"
        />

        {/* Asr Begins */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Asr', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Begins', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.asr}
          isEnabled={newSchedule.isAsrEnabled}
          onToggle={() => togglePrayerTime('asr')}
          onTimeChange={handlePrayerTimeChange}
          timeName="asr"
        />

        {/* Asr Iqamah */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Asr', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Iqamah', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.asrIqamah}
          isEnabled={newSchedule.isAsrIqamahEnabled}
          onToggle={() => togglePrayerTime('asrIqamah')}
          onTimeChange={handlePrayerTimeChange}
          timeName="asrIqamah"
        />

        {/* Maghrib Begins */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Maghrib', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Begins', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.maghrib}
          isEnabled={newSchedule.isMaghribEnabled}
          onToggle={() => togglePrayerTime('maghrib')}
          onTimeChange={handlePrayerTimeChange}
          timeName="maghrib"
        />

        {/* Maghrib Iqamah */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Maghrib', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Iqamah', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.maghribIqamah}
          isEnabled={newSchedule.isMaghribIqamahEnabled}
          onToggle={() => togglePrayerTime('maghribIqamah')}
          onTimeChange={handlePrayerTimeChange}
          timeName="maghribIqamah"
        />

        {/* Isha Begins */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Isha', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Begins', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.isha}
          isEnabled={newSchedule.isIshaEnabled}
          onToggle={() => togglePrayerTime('isha')}
          onTimeChange={handlePrayerTimeChange}
          timeName="isha"
        />

        {/* Isha Iqamah */}
        <SinglePrayerInput
          label={`${getTranslatedPrayerName(__('Isha', 'fiveprayer'))} ${getTranslatedTimetableTerm(__('Iqamah', 'fiveprayer'))}`}
          timeValue={newSchedule.prayerTimes.ishaIqamah}
          isEnabled={newSchedule.isIshaIqamahEnabled}
          onToggle={() => togglePrayerTime('ishaIqamah')}
          onTimeChange={handlePrayerTimeChange}
          timeName="ishaIqamah"
        />
      </div>
    </section>
  );
};
