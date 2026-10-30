/**
 * ScheduleForm
 *
 * Form for creating/editing a custom prayer schedule.
 *
 * @module ScheduleComponents/ScheduleForm
 */
import React from 'react';
import { DaySelector } from './DaySelector';
import { PrayerTimeInputs } from './PrayerTimeInputs';
import { __ } from '@wordpress/i18n';

// Interfaces for the components that will be passed as props
interface DaySelectorProps {
  selectedDays: number[];
  handleDayToggle: (dayId: number) => void;
  setSelectedDays: (days: number[]) => void;
  daysOfWeek: { id: number; name: string }[];
}

interface PrayerTimeInputsProps {
  newSchedule: any;
  togglePrayerTime: (field: 'fajr' | 'fajrIqamah' | 'dhuhr' | 'dhuhrIqamah' | 'asr' | 'asrIqamah' | 'maghrib' | 'maghribIqamah' | 'isha' | 'ishaIqamah') => void;
  handlePrayerTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getTranslatedPrayerName: (name: string) => string;
  getTranslatedTimetableTerm: (term: string) => string;
}

interface ScheduleFormProps {
  newSchedule: any;
  showForm: boolean;
  editingId: string | null;
  selectedDays: number[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  togglePrayerTime: (field: 'fajr' | 'fajrIqamah' | 'dhuhr' | 'dhuhrIqamah' | 'asr' | 'asrIqamah' | 'maghrib' | 'maghribIqamah' | 'isha' | 'ishaIqamah') => void;
  handlePrayerTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDayToggle: (dayId: number) => void;
  setSelectedDays: (days: number[]) => void;
  daysOfWeek: { id: number; name: string }[];
  handleSubmit: (e: React.FormEvent) => void;
  setShowForm: (show: boolean) => void;
  getTranslatedPrayerName: (name: string) => string;
  getTranslatedTimetableTerm: (term: string) => string;
}

const fieldClass =
  'h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-green-300 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-green-200';

const labelClass = 'mb-1.5 block text-xs font-medium text-gray-600';

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  newSchedule,
  showForm,
  editingId,
  selectedDays,
  handleInputChange,
  handleDateChange,
  togglePrayerTime,
  handlePrayerTimeChange,
  handleDayToggle,
  setSelectedDays,
  daysOfWeek,
  handleSubmit,
  setShowForm,
  getTranslatedPrayerName,
  getTranslatedTimetableTerm
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      onClick={e => e.stopPropagation()}
      className="flex max-h-[85vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
          {editingId ? (
            <svg className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {editingId ? 'Edit Schedule' : 'New Schedule'}
          </h3>
          <p className="text-xs text-gray-500">
            {editingId
              ? 'Update the dates or prayer times for this schedule.'
              : 'Name it, choose the dates and switch on the prayer times you want to override.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          aria-label={__('Close', 'fiveprayer')}
          title={__('Close', 'fiveprayer')}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-green-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {/* Name + dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>{__('Schedule Name ', 'fiveprayer')}<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={newSchedule.name}
              onChange={handleInputChange}
              placeholder={__('e.g., November Special Schedule', 'fiveprayer')}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>{__('Start Date ', 'fiveprayer')}<span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={newSchedule.startDate}
              onChange={handleDateChange}
              className={fieldClass}
              min={new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01'}
            />
          </div>

          <div>
            <label className={labelClass}>{__('End Date ', 'fiveprayer')}<span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={newSchedule.endDate}
              onChange={handleDateChange}
              className={fieldClass}
              min={newSchedule.startDate}
            />
          </div>
        </div>

        {/* Prayer times */}
        <PrayerTimeInputs
          newSchedule={newSchedule}
          togglePrayerTime={togglePrayerTime}
          handlePrayerTimeChange={handlePrayerTimeChange}
          getTranslatedPrayerName={getTranslatedPrayerName}
          getTranslatedTimetableTerm={getTranslatedTimetableTerm}
        />

        {/* Days of week */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">{__('Days of Week ', 'fiveprayer')}<span className="text-red-500">*</span>
          </h4>
          <DaySelector
            selectedDays={selectedDays}
            handleDayToggle={handleDayToggle}
            setSelectedDays={setSelectedDays}
            daysOfWeek={daysOfWeek}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
        >{__('Cancel', 'fiveprayer')}</button>
        <button
          type="submit"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-green-800 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          {editingId ? 'Update Schedule' : 'Save Schedule'}
        </button>
      </div>
    </form>
  );
};
