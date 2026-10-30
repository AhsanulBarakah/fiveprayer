/**
 * SplitScheduleModal
 *
 * Confirmation modal for splitting cross-month schedules.
 *
 * @module ScheduleComponents/SplitScheduleModal
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

interface SplitScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSplit: () => void;
  onKeepTogether: () => void;
  startDate: string;
  endDate: string;
  scheduleName: string;
}

export const SplitScheduleModal: React.FC<SplitScheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirmSplit,
  onKeepTogether,
  startDate,
  endDate,
  scheduleName
}) => {
  if (!isOpen) return null;

  // Calculate the number of months spanned
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50 px-6 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
            <svg className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">{__('Split into monthly schedules?', 'fiveprayer')}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{__('This schedule covers more than one calendar month.', 'fiveprayer')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-green-500"
            aria-label={__('Close', 'fiveprayer')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Schedule summary */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="truncate text-sm font-semibold text-gray-900">{scheduleName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {startDate} &rarr; {endDate}
            </p>
            <span className="mt-2 inline-flex items-center rounded-full border border-green-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-green-700">{__('Spans ', 'fiveprayer')}{totalMonths} {totalMonths === 1 ? 'month' : 'months'}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-gray-600">{__('Splitting creates one schedule per month so each period is easier to find and edit later. You can also keep it as a single schedule covering the whole range.', 'fiveprayer')}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onKeepTogether}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >{__('Keep Together', 'fiveprayer')}</button>
          <button
            type="button"
            onClick={onConfirmSplit}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-green-800 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
          >{__('Split into Monthly Schedules', 'fiveprayer')}</button>
        </div>
      </div>
    </div>
  );
};
