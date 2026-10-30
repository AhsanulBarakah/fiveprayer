/**
 * CustomPrayerTimeSchedules
 *
 * Main custom prayer time schedules manager with CRUD operations.
 *
 * @module prayerSetting/CustomPrayerTimeSchedules
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useCustomPrayerTimeSchedulesStore, type CustomPrayerTimeSchedule } from '../../state/useCustomPrayerTimeSchedulesStore';
import { useConditional } from '../../state/storeConditional';
import { useTranslationStore } from '../../state/useTranslationStore';
import { PrayerTimesManager } from './PrayerTimesManager';
import { toast } from 'sonner';
import { ScheduleSidebar } from './ScheduleComponents/ScheduleSidebar';
import { ScheduleCard } from './ScheduleComponents/ScheduleCard';
import { ScheduleForm } from './ScheduleComponents/ScheduleForm';
import { SplitScheduleModal } from './ScheduleComponents/SplitScheduleModal';
import { useScheduleSplittingLogic } from './ScheduleComponents/ScheduleSplittingLogic';
import {
  formatDate,
  daysOfWeek,
  getTranslatedPrayerName,
  getTranslatedTimetableTerm,
  getFirstDayOfMonth
} from './ScheduleComponents/FormatterFunctions';
import { useScheduleStateManagement } from './ScheduleComponents/StateManagement';
import { usePostMeta } from '../../hooks/usePostMeta';
import { saveCustomSchedulesToDatabase } from '../../utils/customSchedulesApi';
import { useLocationStore } from '../../state/storeLocation';
import { hasActiveIqamahAdjustment } from '../../utils/seasonalMethod';
import { __ } from '@wordpress/i18n';

// Stable empty fallback (see UnifiedMethodSettings) so a non-array persisted
// value can't produce a fresh reference on every render.
const EMPTY_METHODS: any[] = [];

const CustomPrayerTimeSchedules = () => {
  const {
    customSchedules,
    isCustomSchedulesEnabled,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleSchedule,
    toggleCustomSchedules
  } = useCustomPrayerTimeSchedulesStore();
  // Unified Method's global "Adjust every Iqamah time" — when it is on AND
  // schedules are enabled, the two controls overlap and the admin gets a
  // warning so they can turn one off instead of silently mixing both.
  const methodsForCalculation = useLocationStore((state) =>
    Array.isArray(state.methodsForCalculation) ? state.methodsForCalculation : EMPTY_METHODS
  );
  const iqamahAdjustActive = hasActiveIqamahAdjustment(methodsForCalculation);
  const { updateIsReadyGenerator } = useConditional();
  const { prayer_names, timetable_prayer, activeLanguage } = useTranslationStore();
  const { appendDataPost } = usePostMeta();

  // Custom function to save custom schedules to database without generic toast
  // (the shared helper is also used by Feature Switches when the feature is
  // switched off, so both screens always write the same payload shape).
  const persistCustomSchedules = async (schedulesData: any) => {
    try {
      await saveCustomSchedulesToDatabase(schedulesData);
    } catch (err) {
      console.error('Error saving custom schedules:', err);
      throw err;
    }
  };


  // Use the custom hook for state management
  const {
    newSchedule,
    setNewSchedule,
    editingId,
    setEditingId,
    showForm,
    setShowForm,
    selectedDays,
    setSelectedDays,
    selectedMonth,
    setSelectedMonth,
    showFajrManager,
    setShowFajrManager,
    handleEdit,
    // Temporarily removing handleDeleteSchedule to implement our own with enhanced logic
    handleSubmit: originalHandleSubmit,
    handleInputChange,
    handlePrayerTimeChange,
    togglePrayerTime,
    handleDateChange,
    handleToggleCustomSchedules: originalHandleToggleCustomSchedules,
    handleDayToggle
  } = useScheduleStateManagement(
    customSchedules,
    removeSchedule,
    updateSchedule,
    addSchedule,
    updateIsReadyGenerator,
    (name: string) => getTranslatedPrayerName(prayer_names, activeLanguage, name),
    (term: string) => getTranslatedTimetableTerm(timetable_prayer, activeLanguage, term),
    toggleCustomSchedules,
    isCustomSchedulesEnabled
  );

  // Override handleToggleCustomSchedules to save to database after toggling
  const handleToggleCustomSchedules = (enabled: boolean) => {
    originalHandleToggleCustomSchedules(enabled);

    // Save to database after toggling the main custom schedules setting
    setTimeout(async () => {
      const schedulesData = {
        state: {
          customSchedules: customSchedules,
          isCustomSchedulesEnabled: enabled // Use the new state value
        },
        version: 0
      };

      try {
        // Send the data to the API
        await persistCustomSchedules(schedulesData);
        toast.success(__('Custom schedules setting updated and saved to database successfully!', 'fiveprayer'));
      } catch (error) {
        toast.error(__('Failed to save custom schedules setting to database', 'fiveprayer'));
      }
    }, 100); // Small delay to ensure state is updated before saving
  };

  // Override handleSubmit to save to database after updating state
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    originalHandleSubmit(e); // Call original submit to update Zustand state

    // Save to database after updating Zustand state
    setTimeout(async () => {
      const schedulesData = {
        state: {
          customSchedules: customSchedules,
          isCustomSchedulesEnabled: isCustomSchedulesEnabled
        },
        version: 0
      };

      try {
        // Send the data to the API
        await persistCustomSchedules(schedulesData);
        toast.success(__('Schedule saved to database successfully!', 'fiveprayer'));
      } catch (error) {
        toast.error(__('Failed to save schedule to database', 'fiveprayer'));
      }
    }, 100); // Small delay to ensure state is updated before saving
  };

  // Enhanced delete schedule function with multi-schedule warning
  const handleDeleteSchedule = (id: string) => {
    // Find the schedule being deleted
    const scheduleToDelete = customSchedules.find(s => s.id === id);

    if (!scheduleToDelete) {
      alert(__('Schedule not found!', 'fiveprayer'));
      return;
    }

    // Check if this schedule is part of a multi-month series by looking for related schedules
    // Schedules that were split share a common base name (before the " - Month Year" part)
    const baseName = scheduleToDelete.name.includes(' - ')
      ? scheduleToDelete.name.split(' - ')[0]
      : scheduleToDelete.name;

    // Find other schedules with the same base name (indicating they're from the same original multi-month schedule)
    const relatedSchedules = customSchedules.filter(s =>
      s.id !== id &&
      s.name.startsWith(baseName + ' - ') // e.g. "Ramadan Schedule - January 2023"
    );

    let confirmMessage = `Are you sure you want to delete "${scheduleToDelete.name}"?`;
    if (relatedSchedules.length > 0) {
      confirmMessage += `\n\nWarning: This schedule is part of a multi-month series with ${relatedSchedules.length} other schedule(s). Only this specific month will be deleted, not the entire series.`;
    }

    if (window.confirm(confirmMessage)) {
      removeSchedule(id);
      updateIsReadyGenerator(true);

      // Save to database after removing the schedule
      setTimeout(async () => {
        const schedulesData = {
          state: {
            customSchedules: customSchedules, // Zustand state should be updated by now
            isCustomSchedulesEnabled: isCustomSchedulesEnabled
          },
          version: 0
        };

        try {
          // Send the data to the API
          await persistCustomSchedules(schedulesData);
          toast.success(__('Schedule deleted and saved to database successfully!', 'fiveprayer'));
        } catch (error) {
          toast.error(__('Failed to save schedule to database after deletion', 'fiveprayer'));
        }
      }, 100); // Small delay to ensure state is updated before saving
    }
  };

  // State for split schedule modal
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [tempScheduleData, setTempScheduleData] = useState<any>(null);

  // Wrapper for toggleSchedule to save to database after toggling
  const handleToggleSchedule = (id: string) => {
    toggleSchedule(id);

    // Save to database after toggling the schedule
    setTimeout(async () => {
      const schedulesData = {
        state: {
          customSchedules: customSchedules,
          isCustomSchedulesEnabled: isCustomSchedulesEnabled
        },
        version: 0
      };

      try {
        // Send the data to the API
        await persistCustomSchedules(schedulesData);
        toast.success(__('Schedule updated and saved to database successfully!', 'fiveprayer'));
      } catch (error) {
        toast.error(__('Failed to save schedule to database after toggle', 'fiveprayer'));
      }
    }, 100); // Small delay to ensure state is updated before saving
  };

  // Function to handle form submission with multi-month check
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate the number of months spanned
    const start = new Date(newSchedule.startDate);
    const end = new Date(newSchedule.endDate);
    
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    
    // If the schedule spans multiple months and it's a new schedule (not editing), show the modal
    if (totalMonths > 1 && !editingId) {
      setTempScheduleData({
        ...newSchedule,
        daysOfWeek: selectedDays
      });
      setShowSplitModal(true);
    } else {
      // Otherwise, proceed with the standard submit
      handleSubmit(e);
    }
  };

  // Import the splitting logic
  const { splitScheduleIntoMonths, keepScheduleTogether } = useScheduleSplittingLogic({
    tempScheduleData,
    setTempScheduleData,
    setShowSplitModal,
    setNewSchedule,
    setSelectedDays,
    setEditingId,
    setShowForm,
    updateIsReadyGenerator
  });


  // Group schedules by month, including schedules that span multiple months
  const schedulesByMonth = useMemo(() => {
    const groups: Record<string, CustomPrayerTimeSchedule[]> = {};
    
    customSchedules.forEach(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      
      // Calculate the start and end months
      const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      
      // Iterate through each month the schedule spans
      let currentDate = startMonth;
      while (currentDate <= endMonth) {
        const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        
        // Avoid adding the same schedule multiple times
        if (!groups[monthYear].some(s => s.id === schedule.id)) {
          groups[monthYear].push(schedule);
        }
        
        // Move to the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });
    
    // Sort months in descending order (newest first)
    const sortedGroups = Object.entries(groups).sort(([monthA], [monthB]) => {
      // Parse the month/year string to create dates for comparison
      const [monthAName, yearA] = monthA.split(' ');
      const [monthBName, yearB] = monthB.split(' ');
      
      const dateA = new Date(`${monthAName} 1, ${yearA}`);
      const dateB = new Date(`${monthBName} 1, ${yearB}`);
      
      return dateB.getTime() - dateA.getTime();
    });
    
    // Set the first month as selected if none is selected
    if (!selectedMonth && sortedGroups.length > 0) {
      setSelectedMonth(sortedGroups[0][0]);
    } else if (sortedGroups.length === 0) {
      setSelectedMonth('');
    }
    
    return Object.fromEntries(sortedGroups);
  }, [customSchedules, selectedMonth]);
  
  // Get schedules for the selected month
  const currentMonthSchedules = useMemo(() => {
    return selectedMonth ? (schedulesByMonth[selectedMonth] || []) : [];
  }, [selectedMonth, schedulesByMonth]);

  // Close the schedule editor modal on Escape
  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showForm, setShowForm]);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Sidebar */}
      <ScheduleSidebar
        schedulesByMonth={schedulesByMonth}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      {/* Main Content */}
      <div className="min-w-0 space-y-5">
        {/* Master switch */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isCustomSchedulesEnabled ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`h-4 w-4 ${isCustomSchedulesEnabled ? 'text-green-700' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{__('Enable Custom Schedules', 'fiveprayer')}</p>
              <p className="text-xs text-gray-500">{__('When on, the schedules below override the calculated timetable for their dates.', 'fiveprayer')}</p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center" title={__('Enable custom schedules', 'fiveprayer')}>
            <input
              type="checkbox"
              checked={isCustomSchedulesEnabled}
              onChange={(e) => handleToggleCustomSchedules(e.target.checked)}
              className="peer sr-only"
            />
            <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-xs after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2"></div>
            <span className="sr-only">{__('Enable custom schedules', 'fiveprayer')}</span>
          </label>
        </div>

        {isCustomSchedulesEnabled ? (
          <>
            {/* Unified Method conflict warning — both features can change the
                Iqamah, so warn before they silently mix. Schedules always win
                for the Iqamah times they set (generation skips those columns
                for the uniform adjustment), but keeping only one control active
                avoids confusing results. */}
            {iqamahAdjustActive && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.108-12.25c.866-1.5 3.032-1.5 3.898 0l7.108 12.25ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-900">
                    {__("The Unified Method's “Adjust every Iqamah time” is on", 'fiveprayer')}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                    {__('Both controls change the Iqamah times, so one should be turned off. Your schedules take priority for the Iqamah times they set — the uniform adjustment is skipped on those columns to avoid stacking — but for a clear, predictable timetable turn off', 'fiveprayer')}{' '}
                    <strong>{__('“Adjust every Iqamah time”', 'fiveprayer')}</strong>{' '}
                    {__('in Unified Method while you drive the Iqamah from Advanced Schedules, then click “Generate Calendar”.', 'fiveprayer')}
                  </p>
                </div>
              </div>
            )}

            {/* Period header + primary action */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedMonth || 'Schedules'}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedMonth
                    ? `${currentMonthSchedules.length} schedule${currentMonthSchedules.length === 1 ? '' : 's'} in this period`
                    : 'Pick a month on the left to see its schedules'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-green-800 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>{__('Add New Schedule', 'fiveprayer')}</button>
            </div>

            {/* Schedule editor modal */}
            {showForm && (
              <div
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 backdrop-blur-xs sm:items-center"
                onClick={() => setShowForm(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="w-full max-w-3xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <ScheduleForm
                    newSchedule={newSchedule}
                    showForm={showForm}
                    editingId={editingId}
                    selectedDays={selectedDays}
                    handleInputChange={handleInputChange}
                    handleDateChange={handleDateChange}
                    togglePrayerTime={togglePrayerTime}
                    handlePrayerTimeChange={handlePrayerTimeChange}
                    handleDayToggle={handleDayToggle}
                    setSelectedDays={setSelectedDays}
                    daysOfWeek={daysOfWeek}
                    handleSubmit={handleFormSubmit}
                    setShowForm={setShowForm}
                    getTranslatedPrayerName={(name: string) => getTranslatedPrayerName(prayer_names, activeLanguage, name)}
                    getTranslatedTimetableTerm={(term: string) => getTranslatedTimetableTerm(timetable_prayer, activeLanguage, term)}
                  />
                </div>
              </div>
            )}

            {/* Split Schedule Modal */}
            <SplitScheduleModal
              isOpen={showSplitModal}
              onClose={() => setShowSplitModal(false)}
              onConfirmSplit={splitScheduleIntoMonths}
              onKeepTogether={keepScheduleTogether}
              startDate={tempScheduleData?.startDate || ''}
              endDate={tempScheduleData?.endDate || ''}
              scheduleName={tempScheduleData?.name || ''}
            />

            {showFajrManager && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs"
                onClick={() => setShowFajrManager(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <PrayerTimesManager
                    startDate={newSchedule.startDate}
                    endDate={newSchedule.endDate}
                    onClose={() => setShowFajrManager(false)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!selectedMonth ? (
                <EmptyState
                  icon={
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  }
                  title={__('No month selected', 'fiveprayer')}
                  description="Select a month from the sidebar to view its schedules."
                />
              ) : currentMonthSchedules.length === 0 ? (
                <EmptyState
                  icon={
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  }
                  title={`No schedules for ${selectedMonth}`}
                  description="Get started by creating a new schedule for this period."
                />
              ) : (
                // Sort schedules by date within the month
                [...currentMonthSchedules].sort((a, b) =>
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                ).map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    handleEdit={handleEdit}
                    handleDeleteSchedule={handleDeleteSchedule}
                    toggleSchedule={handleToggleSchedule}
                    updateIsReadyGenerator={updateIsReadyGenerator}
                    setShowFajrManager={setShowFajrManager}
                    setNewSchedule={setNewSchedule}
                    daysOfWeek={daysOfWeek}
                    getTranslatedPrayerName={(name: string) => getTranslatedPrayerName(prayer_names, activeLanguage, name)}
                    getTranslatedTimetableTerm={(term: string) => getTranslatedTimetableTerm(timetable_prayer, activeLanguage, term)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">{__('Custom schedules are turned off', 'fiveprayer')}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{__('Your saved schedules are kept safe. Turn the switch on to start using them on your timetable.', 'fiveprayer')}</p>
            <button
              onClick={() => handleToggleCustomSchedules(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-green-800 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>{__('Enable Custom Schedules', 'fiveprayer')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Small presentational helper for the "nothing to show" states.
 */
const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
    </div>
    <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{description}</p>
  </div>
);

export default CustomPrayerTimeSchedules;