/**
 * StateManagement
 *
 * Hook providing schedule editing state management.
 *
 * @module ScheduleComponents/StateManagement
 */
import { useState, useEffect } from 'react';
import type { CustomPrayerTimeSchedule } from '../../../state/useCustomPrayerTimeSchedulesStore';
import { 
  formatDate,
  getFirstDayOfMonth
} from './FormatterFunctions';
import {
  handleInputChange,
  handleDateChange
} from './FormHandlers';
import {
  handleEdit,
  handleDeleteSchedule,
  handlePrayerTimeChange,
  togglePrayerTime
} from './ScheduleHandlers';
import { __ } from '@wordpress/i18n';

export const useScheduleStateManagement = (
  customSchedules: any[],
  removeSchedule: (id: string) => void,
  updateSchedule: (id: string, schedule: any) => void,
  addSchedule: (schedule: any) => void,
  updateIsReadyGenerator: (ready: boolean) => void,
  getTranslatedPrayerName: (name: string) => string,
  getTranslatedTimetableTerm: (term: string) => string,
  toggleCustomSchedules: (enabled: boolean) => void,
  isCustomSchedulesEnabled: boolean
) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initialize with default times
  const [newSchedule, setNewSchedule] = useState(() => {
    const firstDay = new Date();
    firstDay.setDate(1);
    return {
      name: '',
      enabled: true,
      startDate: formatDate(firstDay),
      endDate: formatDate(new Date()),
      prayerTimes: {
        fajr: '',
        fajrIqamah: '',
        dhuhr: '',
        dhuhrIqamah: '',
        asr: '',
        asrIqamah: '',
        maghrib: '',
        maghribIqamah: '',
        isha: '',
        ishaIqamah: '',
      },
      prayerTimeEnabledFlags: {
        isFajrEnabled: false,
        isFajrIqamahEnabled: false,
        isDhuhrEnabled: false,
        isDhuhrIqamahEnabled: false,
        isAsrEnabled: false,
        isAsrIqamahEnabled: false,
        isMaghribEnabled: false,
        isMaghribIqamahEnabled: false,
        isIshaEnabled: false,
        isIshaIqamahEnabled: false,
      },
      daysOfWeek: [] as number[],
      isFajrEnabled: false,
      isFajrIqamahEnabled: false,
      isDhuhrEnabled: false,
      isDhuhrIqamahEnabled: false,
      isAsrEnabled: false,
      isAsrIqamahEnabled: false,
      isMaghribEnabled: false,
      isMaghribIqamahEnabled: false,
      isIshaEnabled: false,
      isIshaIqamahEnabled: false,
      dateOverrides: undefined
    };
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showFajrManager, setShowFajrManager] = useState(false);
  const [openScheduleId, setOpenScheduleId] = useState<string | null>(null);

  // Effect to handle dynamic text change for details/summary elements
  useEffect(() => {
    const updateSummaryText = () => {
      // Process each schedule to update its toggle text
      customSchedules.forEach(schedule => {
        const textElement = document.getElementById(`prayer-times-toggle-text-${schedule.id}`);
        if (textElement) {
          // Find the closest details element to check its open state
          const detailsElement = textElement.closest('details');
          if (detailsElement) {
            if (detailsElement.hasAttribute('open')) {
              textElement.textContent = 'Click to Hide Prayer Times';
            } else {
              textElement.textContent = 'Click to View Prayer Times';
            }
          }
        }
      });
    };

    // Run initially to set correct text
    updateSummaryText();

    // Add event listeners to all details elements
    const detailsElements = document.querySelectorAll('.schedule-details');
    const handleToggle = (event: Event) => {
      // Small timeout to ensure the 'open' attribute is updated before we read it
      setTimeout(updateSummaryText, 0);
    };

    detailsElements.forEach((details) => {
      details.addEventListener('toggle', handleToggle);
    });

    // Cleanup event listeners on unmount
    return () => {
      detailsElements.forEach((details) => {
        details.removeEventListener('toggle', handleToggle);
      });
    };
  }, [customSchedules]);

  const handleToggleCustomSchedules = (enabled: boolean) => {
    toggleCustomSchedules(enabled);
    if (enabled) {
      alert(__('Custom schedules enabled! Your custom prayer times will now be used.', 'fiveprayer'));
    } else {
      alert(__('Custom schedules disabled. Default prayer times will be used.', 'fiveprayer'));
    }
  };

  const handleDayToggle = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  return {
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
    openScheduleId,
    // Functions
    handleEdit: (schedule: any) => handleEdit(
      schedule,
      newSchedule,
      setNewSchedule,
      setSelectedDays,
      setEditingId,
      setShowForm
    ),
    handleDeleteSchedule: (id: string) => handleDeleteSchedule(
      id,
      removeSchedule,
      updateIsReadyGenerator
    ),
    handleSubmit: (e: React.FormEvent) => {
      e.preventDefault();
      
      // Check required fields
      const requiredFields = [
        { field: newSchedule.name, name: 'Schedule Name' },
        { field: newSchedule.startDate, name: 'Start Date' },
        { field: newSchedule.endDate, name: 'End Date' },
        // Only require times if they are enabled
        ...(newSchedule.isFajrEnabled ? [{ field: newSchedule.prayerTimes.fajr, name: `${getTranslatedPrayerName('Fajr')} ${getTranslatedTimetableTerm('Begins')}` }] : []),
        ...(newSchedule.isFajrIqamahEnabled ? [{ field: newSchedule.prayerTimes.fajrIqamah, name: `${getTranslatedPrayerName('Fajr')} ${getTranslatedTimetableTerm('Iqamah')} Time` }] : []),
        ...(newSchedule.isDhuhrEnabled ? [{ field: newSchedule.prayerTimes.dhuhr, name: `${getTranslatedPrayerName('Dhuhr')} ${getTranslatedTimetableTerm('Begins')}` }] : []),
        ...(newSchedule.isDhuhrIqamahEnabled ? [{ field: newSchedule.prayerTimes.dhuhrIqamah, name: `${getTranslatedPrayerName('Dhuhr')} ${getTranslatedTimetableTerm('Iqamah')} Time` }] : []),
        ...(newSchedule.isAsrEnabled ? [{ field: newSchedule.prayerTimes.asr, name: `${getTranslatedPrayerName('Asr')} ${getTranslatedTimetableTerm('Begins')}` }] : []),
        ...(newSchedule.isAsrIqamahEnabled ? [{ field: newSchedule.prayerTimes.asrIqamah, name: `${getTranslatedPrayerName('Asr')} ${getTranslatedTimetableTerm('Iqamah')} Time` }] : []),
        ...(newSchedule.isMaghribEnabled ? [{ field: newSchedule.prayerTimes.maghrib, name: `${getTranslatedPrayerName('Maghrib')} ${getTranslatedTimetableTerm('Begins')}` }] : []),
        ...(newSchedule.isMaghribIqamahEnabled ? [{ field: newSchedule.prayerTimes.maghribIqamah, name: `${getTranslatedPrayerName('Maghrib')} ${getTranslatedTimetableTerm('Iqamah')} Time` }] : []),
        ...(newSchedule.isIshaEnabled ? [{ field: newSchedule.prayerTimes.isha, name: `${getTranslatedPrayerName('Isha')} ${getTranslatedTimetableTerm('Begins')}` }] : []),
        ...(newSchedule.isIshaIqamahEnabled ? [{ field: newSchedule.prayerTimes.ishaIqamah, name: `${getTranslatedPrayerName('Isha')} ${getTranslatedTimetableTerm('Iqamah')} Time` }] : [])
      ].filter(Boolean);

      const missingField = requiredFields.find(({ field }) => !field);
      if (missingField) {
        alert(`Please fill in the ${missingField.name} field`);
        return;
      }

      if (selectedDays.length === 0) {
        alert(__('Please select at least one day of the week', 'fiveprayer'));
        return;
      }

      // Ensure end date is not before start date
      if (new Date(newSchedule.endDate) < new Date(newSchedule.startDate)) {
        alert(__('End date cannot be before start date', 'fiveprayer'));
        return;
      }

      // Check if the schedule spans multiple months
      const start = new Date(newSchedule.startDate);
      const end = new Date(newSchedule.endDate);
      
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      
      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      
      // If the schedule spans multiple months, we might want to show a modal
      if (totalMonths > 1 && !editingId) {
        // In a real implementation, we would set state to show the modal
        // For now, we'll just continue with the original behavior
      }

      // Include only enabled prayer times to avoid overwriting existing DB values when disabled
      const prayerTimes: Partial<CustomPrayerTimeSchedule['prayerTimes']> = {};
      if (newSchedule.isFajrEnabled && newSchedule.prayerTimes.fajr) prayerTimes.fajr = newSchedule.prayerTimes.fajr;
      if (newSchedule.isFajrIqamahEnabled && newSchedule.prayerTimes.fajrIqamah) prayerTimes.fajrIqamah = newSchedule.prayerTimes.fajrIqamah;
      if (newSchedule.isDhuhrEnabled && newSchedule.prayerTimes.dhuhr) prayerTimes.dhuhr = newSchedule.prayerTimes.dhuhr;
      if (newSchedule.isDhuhrIqamahEnabled && newSchedule.prayerTimes.dhuhrIqamah) prayerTimes.dhuhrIqamah = newSchedule.prayerTimes.dhuhrIqamah;
      if (newSchedule.isAsrEnabled && newSchedule.prayerTimes.asr) prayerTimes.asr = newSchedule.prayerTimes.asr;
      if (newSchedule.isAsrIqamahEnabled && newSchedule.prayerTimes.asrIqamah) prayerTimes.asrIqamah = newSchedule.prayerTimes.asrIqamah;
      if (newSchedule.isMaghribEnabled && newSchedule.prayerTimes.maghrib) prayerTimes.maghrib = newSchedule.prayerTimes.maghrib;
      if (newSchedule.isMaghribIqamahEnabled && newSchedule.prayerTimes.maghribIqamah) prayerTimes.maghribIqamah = newSchedule.prayerTimes.maghribIqamah;
      if (newSchedule.isIshaEnabled && newSchedule.prayerTimes.isha) prayerTimes.isha = newSchedule.prayerTimes.isha;
      if (newSchedule.isIshaIqamahEnabled && newSchedule.prayerTimes.ishaIqamah) prayerTimes.ishaIqamah = newSchedule.prayerTimes.ishaIqamah;

      // When updating an existing schedule, merge with existing prayer times to avoid losing values
      let finalPrayerTimes = prayerTimes;
      if (editingId) {
        const existingSchedule = customSchedules.find(s => s.id === editingId);
        if (existingSchedule) {
          // Merge existing prayer times with new ones, keeping existing values when new ones aren't provided and enabled flag is false
          finalPrayerTimes = {
            ...existingSchedule.prayerTimes,
            ...prayerTimes
          };
        }
      }

      // Prepare the prayer time enabled flags
      // When updating an existing schedule, merge with existing enabled flags to avoid losing values
      let finalPrayerTimeEnabledFlags = {
        isFajrEnabled: newSchedule.isFajrEnabled,
        isFajrIqamahEnabled: newSchedule.isFajrIqamahEnabled,
        isDhuhrEnabled: newSchedule.isDhuhrEnabled,
        isDhuhrIqamahEnabled: newSchedule.isDhuhrIqamahEnabled,
        isAsrEnabled: newSchedule.isAsrEnabled,
        isAsrIqamahEnabled: newSchedule.isAsrIqamahEnabled,
        isMaghribEnabled: newSchedule.isMaghribEnabled,
        isMaghribIqamahEnabled: newSchedule.isMaghribIqamahEnabled,
        isIshaEnabled: newSchedule.isIshaEnabled,
        isIshaIqamahEnabled: newSchedule.isIshaIqamahEnabled,
      };
      
      if (editingId) {
        const existingSchedule = customSchedules.find(s => s.id === editingId);
        if (existingSchedule && existingSchedule.prayerTimeEnabledFlags) {
          // Merge existing enabled flags with new ones, preserving existing values when not explicitly changed
          finalPrayerTimeEnabledFlags = {
            ...existingSchedule.prayerTimeEnabledFlags,
            ...finalPrayerTimeEnabledFlags
          };
        }
      }

      // Prepare the schedule data with the correct enabled states
      const scheduleData = {
        ...newSchedule,
        daysOfWeek: selectedDays,
        prayerTimes: finalPrayerTimes,
        prayerTimeEnabledFlags: finalPrayerTimeEnabledFlags
      };

      // When updating an existing schedule, merge with existing date overrides to avoid losing values
      let finalDateOverrides = newSchedule.dateOverrides;
      if (editingId) {
        const existingSchedule = customSchedules.find(s => s.id === editingId);
        if (existingSchedule && existingSchedule.dateOverrides) {
          // Merge existing date overrides with new ones, preserving existing values
          finalDateOverrides = {
            ...existingSchedule.dateOverrides,
            ...(newSchedule.dateOverrides || {})
          };
        }
      }

      // Create the final schedule object excluding the individual enabled flags from the update payload
      const finalSchedule = {
        ...scheduleData,
        dateOverrides: finalDateOverrides,
        isFajrEnabled: undefined, // Don't include these in the update payload
        isFajrIqamahEnabled: undefined,
        isDhuhrEnabled: undefined,
        isDhuhrIqamahEnabled: undefined,
        isAsrEnabled: undefined,
        isAsrIqamahEnabled: undefined,
        isMaghribEnabled: undefined,
        isMaghribIqamahEnabled: undefined,
        isIshaEnabled: undefined,
        isIshaIqamahEnabled: undefined,
      };

      try {
        if (editingId) {
          updateSchedule(editingId, finalSchedule);
          updateIsReadyGenerator(true);
          alert(__('Schedule updated successfully!', 'fiveprayer'));
        } else {
          // Create a new schedule object for adding (without id property)
          const newScheduleForAdd = {
            name: finalSchedule.name,
            enabled: finalSchedule.enabled,
            startDate: finalSchedule.startDate,
            endDate: finalSchedule.endDate,
            prayerTimes: finalSchedule.prayerTimes,
            prayerTimeEnabledFlags: finalSchedule.prayerTimeEnabledFlags,
            daysOfWeek: finalSchedule.daysOfWeek,
            dateOverrides: finalSchedule.dateOverrides
          };
          addSchedule(newScheduleForAdd);
          updateIsReadyGenerator(true);
          alert(__('Schedule added successfully!', 'fiveprayer'));
        }

        // Reset form
        setNewSchedule((prev: any) => ({
          ...prev, // Preserve the structure
          name: '',
          enabled: true,
          startDate: formatDate(new Date()),
          endDate: formatDate(new Date()),
          prayerTimes: {
            fajr: '',
            fajrIqamah: '',
            dhuhr: '',
            dhuhrIqamah: '',
            asr: '',
            asrIqamah: '',
            maghrib: '',
            maghribIqamah: '',
            isha: '',
            ishaIqamah: '',
          },
          prayerTimeEnabledFlags: {
            isFajrEnabled: false,
            isFajrIqamahEnabled: false,
            isDhuhrEnabled: false,
            isDhuhrIqamahEnabled: false,
            isAsrEnabled: false,
            isAsrIqamahEnabled: false,
            isMaghribEnabled: false,
            isMaghribIqamahEnabled: false,
            isIshaEnabled: false,
            isIshaIqamahEnabled: false,
          },
          daysOfWeek: [],
          isFajrEnabled: false,
          isFajrIqamahEnabled: false,
          isDhuhrEnabled: false,
          isDhuhrIqamahEnabled: false,
          isAsrEnabled: false,
          isAsrIqamahEnabled: false,
          isMaghribEnabled: false,
          isMaghribIqamahEnabled: false,
          isIshaEnabled: false,
          isIshaIqamahEnabled: false,
          dateOverrides: undefined
        }));
        setSelectedDays([]);
        setEditingId(null);
        setShowForm(false);
      } catch (error) {
        console.error('Failed to save schedule:', error);
        alert(`Failed to ${editingId ? 'update' : 'add'} schedule. Please try again.`);
      }
    },
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(
      e,
      setNewSchedule
    ),
    handlePrayerTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => handlePrayerTimeChange(
      e,
      setNewSchedule
    ),
    togglePrayerTime: (field: 'fajr' | 'fajrIqamah' | 'dhuhr' | 'dhuhrIqamah' | 'asr' | 'asrIqamah' | 'maghrib' | 'maghribIqamah' | 'isha' | 'ishaIqamah') => togglePrayerTime(
      field,
      setNewSchedule
    ),
    handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(
      e,
      setNewSchedule
    ),
    handleToggleCustomSchedules,
    handleDayToggle
  };
};