/**
 * PrayerTimesManager
 *
 * Applies custom prayer time schedules to timetable entries.
 *
 * @module prayerSetting/PrayerTimesManager
 */
import React, { useState, useEffect } from 'react';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { getMatchingSchedule, useCustomPrayerTimeSchedulesStore } from '../../state/useCustomPrayerTimeSchedulesStore';
import type { CustomPrayerTimeSchedule } from '../../state/useCustomPrayerTimeSchedulesStore';
import { useConditional } from '../../state/storeConditional';
import { __ } from '@wordpress/i18n';

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type IqamahFieldKey = 'fajrIqamah' | 'dhuhrIqamah' | 'asrIqamah' | 'maghribIqamah' | 'ishaIqamah';
type BeginsFieldKey = 'fajrBegins' | 'dhuhrBegins' | 'asrBegins' | 'maghribBegins' | 'ishaBegins';

interface TimetableEntry {
  date: string;
  fajr_begins: string;
  fajr_iqamah: string;
  dhuhr_begins: string;
  dhuhr_iqamah: string;
  asr_begins: string;
  asr_iqamah: string;
  maghrib_begins: string;
  maghrib_iqamah: string;
  isha_begins: string;
  isha_iqamah: string;
  [key: string]: any;
}

interface TimeEntry {
  date: string;
  begins: string;
  iqamah: string;
  hasCustomBegins: boolean;
  hasCustomIqamah: boolean;
  isEnabled: boolean;
  scheduleId?: string;
}

interface TimesManagerProps {
  startDate: string;
  endDate: string;
  onClose: () => void;
}

const PRAYER_LABEL: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const BEGINS_KEY: Record<PrayerKey, keyof TimetableEntry> = {
  fajr: 'fajr_begins',
  dhuhr: 'dhuhr_begins',
  asr: 'asr_begins',
  maghrib: 'maghrib_begins',
  isha: 'isha_begins',
};

const IQAMAH_KEY: Record<PrayerKey, keyof TimetableEntry> = {
  fajr: 'fajr_iqamah',
  dhuhr: 'dhuhr_iqamah',
  asr: 'asr_iqamah',
  maghrib: 'maghrib_iqamah',
  isha: 'isha_iqamah',
};

const SCHEDULE_IQAMAH_FIELD: Record<PrayerKey, IqamahFieldKey> = {
  fajr: 'fajrIqamah',
  dhuhr: 'dhuhrIqamah',
  asr: 'asrIqamah',
  maghrib: 'maghribIqamah',
  isha: 'ishaIqamah',
};

const SCHEDULE_BEGINS_FIELD: Record<PrayerKey, BeginsFieldKey> = {
  fajr: 'fajrBegins',
  dhuhr: 'dhuhrBegins',
  asr: 'asrBegins',
  maghrib: 'maghribBegins',
  isha: 'ishaBegins',
};

export const PrayerTimesManager: React.FC<TimesManagerProps> = ({ startDate, endDate, onClose }) => {
  const { TimeTableMonthFullYear } = useTimeTableMonth();
  const { customSchedules, updateSchedule, addSchedule } = useCustomPrayerTimeSchedulesStore();
  const { updateIsReadyGenerator } = useConditional();

  const [currentPrayer, setCurrentPrayer] = useState<PrayerKey>('fajr');
  const [entriesByPrayer, setEntriesByPrayer] = useState<Record<PrayerKey, TimeEntry[]>>({
    fajr: [],
    dhuhr: [],
    asr: [],
    maghrib: [],
    isha: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [applyMode, setApplyMode] = useState<'single' | 'schedule'>('single');

  useEffect(() => {
    if (!TimeTableMonthFullYear || !Array.isArray(TimeTableMonthFullYear)) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    setEntriesByPrayer((prev) => {
      const next: Record<PrayerKey, TimeEntry[]> = { fajr: [], dhuhr: [], asr: [], maghrib: [], isha: [] };

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const timetableEntry = (TimeTableMonthFullYear as unknown as TimetableEntry[]).find(
          (entry) => entry.date === dateStr
        );
        if (!timetableEntry) continue;

        const matchingSchedule = getMatchingSchedule(d, customSchedules);
        const scheduleTimes = matchingSchedule?.prayerTimes || {};
        const dateKey = dateStr;

        (['fajr','dhuhr','asr','maghrib','isha'] as PrayerKey[]).forEach((p) => {
          const begins = timetableEntry[BEGINS_KEY[p]] as string;
          const fallbackIqamah = timetableEntry[IQAMAH_KEY[p]] as string;

          // Handle Begins time
          const scheduleBeginsField = SCHEDULE_BEGINS_FIELD[p] as BeginsFieldKey;
          const overrideBegins = matchingSchedule?.dateOverrides?.[dateKey]?.[scheduleBeginsField];
          const beginsTime = overrideBegins || (scheduleTimes as any)[scheduleBeginsField] || begins;
          const hasCustomBegins = Boolean(overrideBegins || (scheduleTimes as any)[scheduleBeginsField]);

          // Handle Iqamah time
          const scheduleIqamahField = SCHEDULE_IQAMAH_FIELD[p] as IqamahFieldKey;
          const overrideIqamah = matchingSchedule?.dateOverrides?.[dateKey]?.[scheduleIqamahField];
          const iqamah = overrideIqamah || (scheduleTimes as any)[scheduleIqamahField] || fallbackIqamah;
          const hasCustomIqamah = Boolean(overrideIqamah || (scheduleTimes as any)[scheduleIqamahField]);

          const previousEnabled = (prev[p] || []).find((e) => e.date === dateStr)?.isEnabled;
          next[p].push({
            date: dateStr,
            begins: beginsTime,
            iqamah,
            hasCustomBegins,
            hasCustomIqamah,
            isEnabled: previousEnabled !== undefined ? previousEnabled : hasCustomIqamah,
            scheduleId: matchingSchedule?.id,
          });
        });
      }

      return next;
    });
  }, [TimeTableMonthFullYear, startDate, endDate, customSchedules]);

  const handleBeginsChange = (date: string, newBegins: string) => {
    setEntriesByPrayer(prev => {
      const currentList = prev[currentPrayer];
      const target = currentList.find(e => e.date === date);
      if (!target) return prev;
      // In single-day mode, allow editing regardless of Include
      // In schedule mode, only allow editing for checked rows
      if (applyMode === 'schedule' && !target.isEnabled) return prev;
      // In schedule mode, propagate the change to all rows within the same schedule (only checked rows)
      if (applyMode === 'schedule' && target.scheduleId) {
        const updated = currentList.map(e =>
          e.scheduleId === target.scheduleId && e.isEnabled
            ? { ...e, begins: newBegins, hasCustomBegins: true }
            : e
        );
        return { ...prev, [currentPrayer]: updated };
      }
      // Single mode: only update this date
      const updated = currentList.map(e =>
        e.date === date ? { ...e, begins: newBegins, hasCustomBegins: true } : e
      );
      return { ...prev, [currentPrayer]: updated };
    });
  };

  const handleIqamahChange = (date: string, newIqamah: string) => {
    setEntriesByPrayer(prev => {
      const currentList = prev[currentPrayer];
      const target = currentList.find(e => e.date === date);
      if (!target) return prev;
      // In single-day mode, allow editing regardless of Include
      // In schedule mode, only allow editing for checked rows
      if (applyMode === 'schedule' && !target.isEnabled) return prev;
      // In schedule mode, propagate the change to all rows within the same schedule (only checked rows)
      if (applyMode === 'schedule' && target.scheduleId) {
        const updated = currentList.map(e =>
          e.scheduleId === target.scheduleId && e.isEnabled
            ? { ...e, iqamah: newIqamah, hasCustomIqamah: true }
            : e
        );
        return { ...prev, [currentPrayer]: updated };
      }
      // Single mode: only update this date
      const updated = currentList.map(e =>
        e.date === date ? { ...e, iqamah: newIqamah, hasCustomIqamah: true } : e
      );
      return { ...prev, [currentPrayer]: updated };
    });
  };

  const toggleTimeEnabled = (date: string) => {
    setEntriesByPrayer(prev => {
      // Option A: only rows within an existing schedule can be toggled
      const list = prev[currentPrayer].map(e => {
        if (e.date !== date) return e;
        if (!e.scheduleId) return e;
        return { ...e, isEnabled: !e.isEnabled };
      });
      return { ...prev, [currentPrayer]: list };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const iqamahField = SCHEDULE_IQAMAH_FIELD[currentPrayer] as string;
      const beginsField = SCHEDULE_BEGINS_FIELD[currentPrayer] as string;
      const entries = entriesByPrayer[currentPrayer];
      const visibleSchedules = Array.from(new Set(entries.filter(e => e.scheduleId).map(e => e.scheduleId as string)));
      if (visibleSchedules.length === 0) { onClose(); return; }

      if (applyMode === 'single') {
        // Write per-date overrides for rows whose begins and/or iqamah changed vs baseline
        for (const e of entries) {
          if (!e.scheduleId) continue;
          // Compute baseline: existing override -> schedule-wide -> timetable fallback
          const timetableEntry = (TimeTableMonthFullYear as unknown as TimetableEntry[]).find((t) => t.date === e.date);
          if (!timetableEntry) continue;
          const schedule = customSchedules.find(cs => cs.id === e.scheduleId);
          const scheduleTimes = schedule?.prayerTimes || {};

          // Handle Begins time
          const scheduleBeginsField = SCHEDULE_BEGINS_FIELD[currentPrayer] as BeginsFieldKey;
          const overrideBegins = schedule?.dateOverrides?.[e.date]?.[scheduleBeginsField];
          const fallbackBegins = timetableEntry[BEGINS_KEY[currentPrayer]] as string;
          const baselineBegins = overrideBegins || (scheduleTimes as any)[scheduleBeginsField] || fallbackBegins;
          if (e.begins && e.begins !== baselineBegins) {
            updateSchedule(e.scheduleId, { dateOverrides: { [e.date]: { [beginsField]: e.begins } } as any });
          }

          // Handle Iqamah time
          const scheduleIqamahField = SCHEDULE_IQAMAH_FIELD[currentPrayer] as IqamahFieldKey;
          const overrideIqamah = schedule?.dateOverrides?.[e.date]?.[scheduleIqamahField];
          const fallbackIqamah = timetableEntry[IQAMAH_KEY[currentPrayer]] as string;
          const baselineIqamah = overrideIqamah || (scheduleTimes as any)[scheduleIqamahField] || fallbackIqamah;
          if (e.iqamah && e.iqamah !== baselineIqamah) {
            updateSchedule(e.scheduleId, { dateOverrides: { [e.date]: { [iqamahField]: e.iqamah } } as any });
          }
        }
      } else {
        // All days in schedule: apply only to CHECKED rows by writing per-date overrides
        const enabledBySchedule = new Map<string, Array<TimeEntry>>();
        for (const e of entries) {
          if (!e.scheduleId) continue;
          if (!e.isEnabled) continue;
          const list = enabledBySchedule.get(e.scheduleId) || [];
          list.push(e);
          enabledBySchedule.set(e.scheduleId, list);
        }

        for (const sid of visibleSchedules) {
          const enabledRows = enabledBySchedule.get(sid) || [];
          if (enabledRows.length === 0) continue;
          // Use the last enabled row's time as the applied value for that schedule's checked rows
          const last = enabledRows[enabledRows.length - 1];
          // Apply Begins time if it exists
          if (last.begins && last.begins.trim()) {
            for (const row of enabledRows) {
              updateSchedule(sid, { dateOverrides: { [row.date]: { [beginsField]: last.begins } } as any });
            }
          }
          // Apply Iqamah time if it exists
          if (last.iqamah && last.iqamah.trim()) {
            for (const row of enabledRows) {
              updateSchedule(sid, { dateOverrides: { [row.date]: { [iqamahField]: last.iqamah } } as any });
            }
          }
        }
      }

      // Signal that data changed and calendar can be regenerated
      try { updateIsReadyGenerator(true); } catch {}
      onClose();
    } catch (e) {
      console.error('Failed to save times:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const entries = entriesByPrayer[currentPrayer];
  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 text-sm text-gray-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" aria-hidden="true" />{__('Loading times...', 'fiveprayer')}</div>
    );
  }

  // Helper function to convert time from "HH:MM AM/PM" format to "HH:MM" format for time input
  const convertToTimeInputFormat = (timeString: string): string => {
    if (!timeString || timeString === '--:--' || timeString === '00:00:00') {
      return ''; // Return empty string for invalid times
    }

    // If it's already in HH:MM format (24-hour), return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }

    // If it's in HH:MM:SS format, convert to HH:MM
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString.substring(0, 5); // Extract HH:MM
    }

    // If it's in HH:MM AM/PM format, convert to 24-hour format
    if (/[AP]M/.test(timeString)) {
      const trimmedTime = timeString.trim();
      const timePart = trimmedTime.substring(0, trimmedTime.indexOf(' ')).trim();
      const period = trimmedTime.substring(trimmedTime.indexOf(' ') + 1).trim();

      let [hours, minutes] = timePart.split(':').map(Number);

      if (period === 'AM' && hours === 12) {
        hours = 0;
      } else if (period === 'PM' && hours !== 12) {
        hours += 12;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return timeString; // Return as is if format is unrecognized
  };

  const timeInputClass =
    'h-10 w-full min-w-[7.5rem] rounded-lg border border-gray-200 bg-white px-2.5 text-sm tabular-nums text-gray-900 transition-colors focus:border-green-300 focus:outline-hidden focus:ring-1 focus:ring-green-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400';

  return (
    <div className="flex max-h-[90vh] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-start gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
          <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{__('Manage ', 'fiveprayer')}{PRAYER_LABEL[currentPrayer]}{__(' Times', 'fiveprayer')}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{__('Adjust the Begins and Iqamah times day by day, then choose how your changes are applied.', 'fiveprayer')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={__('Close', 'fiveprayer')}
          title={__('Close', 'fiveprayer')}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-green-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {/* Prayer tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1.5">
          {(['fajr','dhuhr','asr','maghrib','isha'] as PrayerKey[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPrayer(p)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-green-500 ${
                currentPrayer === p
                  ? 'bg-white text-green-700 shadow-xs ring-1 ring-green-200'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              {PRAYER_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Apply mode */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">{__('Apply changes to', 'fiveprayer')}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {applyMode === 'single'
                ? 'Only the days you edit will be updated.'
                : 'Every day you tick with Include gets the time of the last edited day.'}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1" role="group">
            <button
              type="button"
              onClick={() => setApplyMode('single')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-green-500 ${
                applyMode === 'single' ? 'bg-white text-green-700 shadow-xs ring-1 ring-green-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >{__('Only selected days', 'fiveprayer')}</button>
            <button
              type="button"
              onClick={() => setApplyMode('schedule')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-green-500 ${
                applyMode === 'schedule' ? 'bg-white text-green-700 shadow-xs ring-1 ring-green-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >{__('All days in schedule', 'fiveprayer')}</button>
          </div>
        </div>

        {/* Times table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">{__('Date', 'fiveprayer')}</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">{__('Schedule', 'fiveprayer')}</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">{PRAYER_LABEL[currentPrayer]}{__(' Begins', 'fiveprayer')}</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">{__('Iqamah Time', 'fiveprayer')}</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">{__('Include', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {entries.map(entry => (
                <tr
                  key={entry.date}
                  className={`transition-colors hover:bg-gray-50 ${entry.hasCustomBegins || entry.hasCustomIqamah ? 'bg-green-50/60' : ''} ${!entry.isEnabled ? 'opacity-60' : ''}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {entry.scheduleId ? (
                      (() => { const s = customSchedules.find(cs => cs.id === entry.scheduleId); return s ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700" title={`Schedule ${s.name} (${s.startDate} to ${s.endDate})`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          {s.name}
                        </span>
                      ) : (<span className="text-xs text-gray-500">{__('Schedule', 'fiveprayer')}</span>); })()
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700" title={__('No custom schedule for this date', 'fiveprayer')}>{__('No schedule', 'fiveprayer')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={convertToTimeInputFormat(entry.begins)}
                      onChange={(e) => handleBeginsChange(entry.date, e.target.value)}
                      className={timeInputClass}
                      disabled={(applyMode === 'schedule' && !entry.isEnabled) || !entry.scheduleId}
                      title={!entry.scheduleId
                        ? __('Not part of any custom schedule. Only dates inside a custom schedule can be updated.', 'fiveprayer')
                        : (applyMode === __('schedule', 'fiveprayer') && !entry.isEnabled ? __('Enable Include to edit this time in schedule mode.', 'fiveprayer') : '')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={convertToTimeInputFormat(entry.iqamah)}
                      onChange={(e) => handleIqamahChange(entry.date, e.target.value)}
                      className={timeInputClass}
                      disabled={(applyMode === 'schedule' && !entry.isEnabled) || !entry.scheduleId}
                      title={!entry.scheduleId
                        ? __('Not part of any custom schedule. Only dates inside a custom schedule can be updated.', 'fiveprayer')
                        : (applyMode === __('schedule', 'fiveprayer') && !entry.isEnabled ? __('Enable Include to edit this time in schedule mode.', 'fiveprayer') : '')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={entry.isEnabled}
                        onChange={() => toggleTimeEnabled(entry.date)}
                        disabled={!entry.scheduleId || applyMode === 'single'}
                        title={!entry.scheduleId
                          ? __('Not part of any custom schedule.', 'fiveprayer')
                          : (applyMode === __('single', 'fiveprayer')
                            ? __('Include is only used in "All days in schedule" mode.', 'fiveprayer')
                            : (() => { const s = customSchedules.find(cs => cs.id === entry.scheduleId); return s ? `Apply to schedule "${s.name}" for ${PRAYER_LABEL[currentPrayer]} Times` : __('Include in save', 'fiveprayer'); })())}
                        className="peer sr-only"
                      />
                      <span className="relative h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-xs after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-4 peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></span>
                      <span className="sr-only">{__('Include this day', 'fiveprayer')}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <p className="text-xs text-gray-500">
          {(applyMode === 'single' && 'Only the days you edit are saved') || 'Tick Include to choose which days are saved'}
          {' · '}
          {entries.length} {entries.length === 1 ? 'day' : 'days'}{__(' shown', 'fiveprayer')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          >{__('Cancel', 'fiveprayer')}</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-green-800 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
