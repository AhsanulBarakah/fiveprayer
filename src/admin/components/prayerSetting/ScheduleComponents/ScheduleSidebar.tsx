/**
 * ScheduleSidebar
 *
 * Sidebar listing schedules grouped by month.
 *
 * @module ScheduleComponents/ScheduleSidebar
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

interface ScheduleSidebarProps {
  schedulesByMonth: Record<string, any[]>;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const ScheduleSidebar: React.FC<ScheduleSidebarProps> = ({
  schedulesByMonth,
  selectedMonth,
  setSelectedMonth
}) => {
  const monthEntries = Object.entries(schedulesByMonth);

  return (
    <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs lg:sticky lg:top-6">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{__('Schedule Groups', 'fiveprayer')}</h2>
      </div>

      {monthEntries.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs leading-relaxed text-gray-500">{__('No schedules yet. Once you create one it will appear here, grouped by month.', 'fiveprayer')}</p>
      ) : (
        /* Month List */
        <nav className="max-h-[65vh] space-y-1 overflow-y-auto p-2">
          {monthEntries.map(([monthYear, schedules]) => {
            // Count how many schedules span multiple months
            const multiMonthSchedules = schedules.filter(schedule => {
              const start = new Date(schedule.startDate);
              const end = new Date(schedule.endDate);
              return start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear();
            }).length;

            const isActive = selectedMonth === monthYear;

            return (
              <button
                key={monthYear}
                onClick={() => setSelectedMonth(monthYear)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-800 ring-1 ring-inset ring-green-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {monthYear}
                  </span>
                  {multiMonthSchedules > 0 && (
                    <span className={`block text-[11px] ${isActive ? 'text-green-700/70' : 'text-gray-400'}`}>
                      {multiMonthSchedules}{__(' spanning multiple months', 'fiveprayer')}</span>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {schedules.length}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </aside>
  );
};
