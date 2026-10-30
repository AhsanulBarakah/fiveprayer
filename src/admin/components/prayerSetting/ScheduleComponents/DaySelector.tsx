/**
 * DaySelector
 *
 * Toggleable day-of-week chips for schedule selection.
 *
 * @module ScheduleComponents/DaySelector
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

interface DaySelectorProps {
  selectedDays: number[];
  handleDayToggle: (dayId: number) => void;
  setSelectedDays: (days: number[]) => void;
  daysOfWeek: { id: number; name: string }[];
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDays,
  handleDayToggle,
  setSelectedDays,
  daysOfWeek
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-500">
          {selectedDays.length}{__(' of ', 'fiveprayer')}{daysOfWeek.length}{__(' days selected', 'fiveprayer')}</span>
        <div className="flex items-center gap-2.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
            className="text-green-700 transition-colors hover:text-green-800"
          >{__('All days', 'fiveprayer')}</button>
          <span className="h-3 w-px bg-gray-200"></span>
          <button
            type="button"
            onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
            className="text-green-700 transition-colors hover:text-green-800"
          >{__('Weekdays', 'fiveprayer')}</button>
          <span className="h-3 w-px bg-gray-200"></span>
          <button
            type="button"
            onClick={() => setSelectedDays([0, 6])}
            className="text-green-700 transition-colors hover:text-green-800"
          >{__('Weekend', 'fiveprayer')}</button>
          <span className="h-3 w-px bg-gray-200"></span>
          <button
            type="button"
            onClick={() => setSelectedDays([])}
            className="text-gray-500 transition-colors hover:text-gray-700"
          >{__('Clear', 'fiveprayer')}</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {daysOfWeek.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => handleDayToggle(day.id)}
              aria-pressed={isSelected}
              title={day.name}
              className={`h-10 w-full rounded-lg border text-[11px] font-semibold uppercase tracking-wide transition-colors focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                isSelected
                  ? 'border-green-600 bg-green-600 text-white shadow-xs hover:bg-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700'
              }`}
            >
              {day.name.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
