/**
 * ScheduleCard
 *
 * Card displaying a schedule summary with edit/delete/toggle actions.
 *
 * @module ScheduleComponents/ScheduleCard
 */
import React from 'react';
import { PrayerTimeDisplay } from './PrayerTimeDisplay';
import { __ } from '@wordpress/i18n';
// Import fixed - file exists in same directory

interface ScheduleCardProps {
  schedule: any;
  handleEdit: (schedule: any) => void;
  handleDeleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  updateIsReadyGenerator: (ready: boolean) => void;
  setShowFajrManager: (show: boolean) => void;
  setNewSchedule: (schedule: any) => void;
  daysOfWeek: { id: number; name: string }[];
  getTranslatedPrayerName: (name: string) => string;
  getTranslatedTimetableTerm: (term: string) => string;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  handleEdit,
  handleDeleteSchedule,
  toggleSchedule,
  updateIsReadyGenerator,
  setShowFajrManager,
  setNewSchedule,
  daysOfWeek,
  getTranslatedPrayerName,
  getTranslatedTimetableTerm
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xs transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">{schedule.name}</h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              {schedule.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>
              {new Date(schedule.startDate).toLocaleDateString()} &rarr; {new Date(schedule.endDate).toLocaleDateString()}
            </span>
          </div>

          <div className="mt-3">
            {/* Collapsible container for the content inside the schedule card */}
            <details className="schedule-details group">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800">
                <svg
                  className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
                <span id={`prayer-times-toggle-text-${schedule.id}`}>{__('Click to View Prayer Times', 'fiveprayer')}</span>
              </summary>
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <PrayerTimeDisplay
                  schedule={schedule}
                  daysOfWeek={daysOfWeek}
                  getTranslatedPrayerName={getTranslatedPrayerName}
                  getTranslatedTimetableTerm={getTranslatedTimetableTerm}
                />
              </div>
            </details>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => handleEdit(schedule)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-50 hover:text-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500"
            title={__('Edit', 'fiveprayer')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => {
              setNewSchedule((prev: any) => ({
                ...prev, // Preserve the existing state
                name: schedule.name,
                enabled: schedule.enabled,
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                prayerTimes: {
                    fajr: schedule.prayerTimes.fajr ?? '',
                    fajrIqamah: schedule.prayerTimes.fajrIqamah ?? '',
                    dhuhr: schedule.prayerTimes.dhuhr ?? '',
                    dhuhrIqamah: schedule.prayerTimes.dhuhrIqamah ?? '',
                    asr: schedule.prayerTimes.asr ?? '',
                    asrIqamah: schedule.prayerTimes.asrIqamah ?? '',
                    maghrib: schedule.prayerTimes.maghrib ?? '',
                    maghribIqamah: schedule.prayerTimes.maghribIqamah ?? '',
                    isha: schedule.prayerTimes.isha ?? '',
                    ishaIqamah: schedule.prayerTimes.ishaIqamah ?? ''
                },
                prayerTimeEnabledFlags: {
                    isFajrEnabled: schedule.prayerTimeEnabledFlags?.isFajrEnabled ?? (schedule.prayerTimes.fajr !== undefined && schedule.prayerTimes.fajr !== ''),
                    isFajrIqamahEnabled: schedule.prayerTimeEnabledFlags?.isFajrIqamahEnabled ?? (schedule.prayerTimes.fajrIqamah !== undefined && schedule.prayerTimes.fajrIqamah !== ''),
                    isDhuhrEnabled: schedule.prayerTimeEnabledFlags?.isDhuhrEnabled ?? (schedule.prayerTimes.dhuhr !== undefined && schedule.prayerTimes.dhuhr !== ''),
                    isDhuhrIqamahEnabled: schedule.prayerTimeEnabledFlags?.isDhuhrIqamahEnabled ?? (schedule.prayerTimes.dhuhrIqamah !== undefined && schedule.prayerTimes.dhuhrIqamah !== ''),
                    isAsrEnabled: schedule.prayerTimeEnabledFlags?.isAsrEnabled ?? (schedule.prayerTimes.asr !== undefined && schedule.prayerTimes.asr !== ''),
                    isAsrIqamahEnabled: schedule.prayerTimeEnabledFlags?.isAsrIqamahEnabled ?? (schedule.prayerTimes.asrIqamah !== undefined && schedule.prayerTimes.asrIqamah !== ''),
                    isMaghribEnabled: schedule.prayerTimeEnabledFlags?.isMaghribEnabled ?? (schedule.prayerTimes.maghrib !== undefined && schedule.prayerTimes.maghrib !== ''),
                    isMaghribIqamahEnabled: schedule.prayerTimeEnabledFlags?.isMaghribIqamahEnabled ?? (schedule.prayerTimes.maghribIqamah !== undefined && schedule.prayerTimes.maghribIqamah !== ''),
                    isIshaEnabled: schedule.prayerTimeEnabledFlags?.isIshaEnabled ?? (schedule.prayerTimes.isha !== undefined && schedule.prayerTimes.isha !== ''),
                    isIshaIqamahEnabled: schedule.prayerTimeEnabledFlags?.isIshaIqamahEnabled ?? (schedule.prayerTimes.ishaIqamah !== undefined && schedule.prayerTimes.ishaIqamah !== '')
                },
                daysOfWeek: [...schedule.daysOfWeek],
                isFajrEnabled: schedule.prayerTimeEnabledFlags?.isFajrEnabled ?? (schedule.prayerTimes.fajr !== undefined && schedule.prayerTimes.fajr !== ''),
                isFajrIqamahEnabled: schedule.prayerTimeEnabledFlags?.isFajrIqamahEnabled ?? (schedule.prayerTimes.fajrIqamah !== undefined && schedule.prayerTimes.fajrIqamah !== ''),
                isDhuhrEnabled: schedule.prayerTimeEnabledFlags?.isDhuhrEnabled ?? (schedule.prayerTimes.dhuhr !== undefined && schedule.prayerTimes.dhuhr !== ''),
                isDhuhrIqamahEnabled: schedule.prayerTimeEnabledFlags?.isDhuhrIqamahEnabled ?? (schedule.prayerTimes.dhuhrIqamah !== undefined && schedule.prayerTimes.dhuhrIqamah !== ''),
                isAsrEnabled: schedule.prayerTimeEnabledFlags?.isAsrEnabled ?? (schedule.prayerTimes.asr !== undefined && schedule.prayerTimes.asr !== ''),
                isAsrIqamahEnabled: schedule.prayerTimeEnabledFlags?.isAsrIqamahEnabled ?? (schedule.prayerTimes.asrIqamah !== undefined && schedule.prayerTimes.asrIqamah !== ''),
                isMaghribEnabled: schedule.prayerTimeEnabledFlags?.isMaghribEnabled ?? (schedule.prayerTimes.maghrib !== undefined && schedule.prayerTimes.maghrib !== ''),
                isMaghribIqamahEnabled: schedule.prayerTimeEnabledFlags?.isMaghribIqamahEnabled ?? (schedule.prayerTimes.maghribIqamah !== undefined && schedule.prayerTimes.maghribIqamah !== ''),
                isIshaEnabled: schedule.prayerTimeEnabledFlags?.isIshaEnabled ?? (schedule.prayerTimes.isha !== undefined && schedule.prayerTimes.isha !== ''),
                isIshaIqamahEnabled: schedule.prayerTimeEnabledFlags?.isIshaIqamahEnabled ?? (schedule.prayerTimes.ishaIqamah !== undefined && schedule.prayerTimes.ishaIqamah !== '')
              }));
              setShowFajrManager(true);
            }}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-green-50 hover:text-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500"
            title={__('Manage Prayer Times', 'fiveprayer')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true"></span>
          <label
            className="relative inline-flex cursor-pointer items-center"
            title={schedule.enabled ? __('Disable schedule', 'fiveprayer') : __('Enable schedule', 'fiveprayer')}
          >
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={() => {
                toggleSchedule(schedule.id);
                updateIsReadyGenerator(true);
              }}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-xs after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-4 peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2"></span>
            <span className="sr-only">{__('Enabled', 'fiveprayer')}</span>
          </label>
          <button
            onClick={() => handleDeleteSchedule(schedule.id)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            title={__('Remove', 'fiveprayer')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};