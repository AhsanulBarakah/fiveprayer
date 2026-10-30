/**
 * PrayerTimeDisplay
 *
 * Read-only display of a schedule's prayer times.
 *
 * @module ScheduleComponents/PrayerTimeDisplay
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

interface PrayerTimeDisplayProps {
  schedule: any;
  daysOfWeek: { id: number; name: string }[];
  getTranslatedPrayerName: (name: string) => string;
  getTranslatedTimetableTerm: (term: string) => string;
}

const TimeChip = ({ label, value }: { label: string; value?: string }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
    <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</span>
    <span className="text-xs font-semibold tabular-nums text-gray-900">{value || '—'}</span>
  </span>
);

export const PrayerTimeDisplay: React.FC<PrayerTimeDisplayProps> = ({
  schedule,
  daysOfWeek,
  getTranslatedPrayerName,
  getTranslatedTimetableTerm
}) => {
  const flags = schedule.prayerTimeEnabledFlags || {};
  const times = schedule.prayerTimes || {};

  const prayers = [
    { name: 'Fajr', beginsEnabled: flags.isFajrEnabled, iqamahEnabled: flags.isFajrIqamahEnabled, begins: times.fajr, iqamah: times.fajrIqamah },
    { name: 'Dhuhr', beginsEnabled: flags.isDhuhrEnabled, iqamahEnabled: flags.isDhuhrIqamahEnabled, begins: times.dhuhr, iqamah: times.dhuhrIqamah },
    { name: 'Asr', beginsEnabled: flags.isAsrEnabled, iqamahEnabled: flags.isAsrIqamahEnabled, begins: times.asr, iqamah: times.asrIqamah },
    { name: 'Maghrib', beginsEnabled: flags.isMaghribEnabled, iqamahEnabled: flags.isMaghribIqamahEnabled, begins: times.maghrib, iqamah: times.maghribIqamah },
    { name: 'Isha', beginsEnabled: flags.isIshaEnabled, iqamahEnabled: flags.isIshaIqamahEnabled, begins: times.isha, iqamah: times.ishaIqamah }
  ].filter(prayer => prayer.beginsEnabled || prayer.iqamahEnabled);

  return (
    <div>
      {/* Information for user */}
      <p className="mb-3 text-xs text-gray-500">{__('Displaying enabled prayer times for the selected period. Times with values are enabled; empty fields are disabled.', 'fiveprayer')}</p>

      {prayers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-xs text-gray-500">{__('No prayer times are enabled for this schedule.', 'fiveprayer')}</p>
      ) : (
        /* Modern styled prayer times display */
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {prayers.map(prayer => (
            <div
              key={prayer.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="text-sm font-semibold text-gray-800">
                {getTranslatedPrayerName(prayer.name)}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {prayer.beginsEnabled && (
                  <TimeChip label={getTranslatedTimetableTerm(__('Begins', 'fiveprayer'))} value={prayer.begins} />
                )}
                {prayer.iqamahEnabled && (
                  <TimeChip label={getTranslatedTimetableTerm(__('Iqamah', 'fiveprayer'))} value={prayer.iqamah} />
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-700">{__('Days: ', 'fiveprayer')}<span className="font-normal text-gray-600">{schedule.daysOfWeek.map((d: number) => daysOfWeek[d]?.name.slice(0, 3)).join(', ')}</span>
        </p>
      </div>
    </div>
  );
};
