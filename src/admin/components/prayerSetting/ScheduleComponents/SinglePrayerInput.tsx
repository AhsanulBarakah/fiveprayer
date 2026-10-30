/**
 * SinglePrayerInput
 *
 * Toggle-and-time-input row for a single prayer time.
 *
 * @module ScheduleComponents/SinglePrayerInput
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

interface SinglePrayerInputProps {
  label: string;
  timeValue: string;
  isEnabled: boolean;
  onToggle: () => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  timeName: string;
}

export const SinglePrayerInput: React.FC<SinglePrayerInputProps> = ({
  label,
  timeValue,
  isEnabled,
  onToggle,
  onTimeChange,
  timeName
}) => {
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isEnabled ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <label className="text-xs font-medium leading-snug text-gray-700">
          {label}
        </label>
        <label
          className="relative inline-flex shrink-0 cursor-pointer items-center"
          title={isEnabled ? __('Disable this time', 'fiveprayer') : __('Enable this time', 'fiveprayer')}
        >
          <input
            type="checkbox"
            name={`${timeName}Enabled`}
            checked={isEnabled}
            onChange={onToggle}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 rounded-full bg-gray-300 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-xs after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-4 peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2"></span>
          <span className="sr-only">{isEnabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>
      <input
        type="time"
        name={timeName}
        value={timeValue}
        onChange={onTimeChange}
        className={`h-10 w-full rounded-lg border px-3 text-sm tabular-nums transition-colors focus:outline-hidden ${
          isEnabled
            ? 'border-gray-200 bg-white text-gray-900 focus:border-green-300 focus:ring-1 focus:ring-green-200'
            : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
        }`}
        disabled={!isEnabled}
      />
    </div>
  );
};
