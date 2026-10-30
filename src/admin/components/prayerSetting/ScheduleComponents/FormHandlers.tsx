/**
 * FormHandlers
 *
 * Pure handler functions for the schedule form.
 *
 * @module ScheduleComponents/FormHandlers
 */
import type { CustomPrayerTimeSchedule } from '../../../state/useCustomPrayerTimeSchedulesStore';
import { __ } from '@wordpress/i18n';

export const handleSubmit = (
  e: React.FormEvent,
  newSchedule: any,
  editingId: string | null,
  selectedDays: number[],
  getTranslatedPrayerNameFn: (name: string) => string,
  getTranslatedTimetableTermFn: (term: string) => string,
  updateSchedule: (id: string, schedule: any) => void,
  addSchedule: (schedule: any) => void,
  updateIsReadyGenerator: (ready: boolean) => void,
  setNewSchedule: (schedule: any) => void,
  setSelectedDays: (days: number[]) => void,
  setEditingId: (id: string | null) => void,
  setShowForm: (show: boolean) => void,
  formatDateFn: (date: Date | string) => string
) => {
  e.preventDefault();
  
  // Check required fields
  const requiredFields = [
    { field: newSchedule.name, name: 'Schedule Name' },
    { field: newSchedule.startDate, name: 'Start Date' },
    { field: newSchedule.endDate, name: 'End Date' },
    // Only require times if they are enabled
    ...(newSchedule.isFajrEnabled ? [{ field: newSchedule.prayerTimes.fajr, name: `${getTranslatedPrayerNameFn('Fajr')} ${getTranslatedTimetableTermFn('Begins')}` }] : []),
    ...(newSchedule.isFajrIqamahEnabled ? [{ field: newSchedule.prayerTimes.fajrIqamah, name: `${getTranslatedPrayerNameFn('Fajr')} ${getTranslatedTimetableTermFn('Iqamah')} Time` }] : []),
    ...(newSchedule.isDhuhrEnabled ? [{ field: newSchedule.prayerTimes.dhuhr, name: `${getTranslatedPrayerNameFn('Dhuhr')} ${getTranslatedTimetableTermFn('Begins')}` }] : []),
    ...(newSchedule.isDhuhrIqamahEnabled ? [{ field: newSchedule.prayerTimes.dhuhrIqamah, name: `${getTranslatedPrayerNameFn('Dhuhr')} ${getTranslatedTimetableTermFn('Iqamah')} Time` }] : []),
    ...(newSchedule.isAsrEnabled ? [{ field: newSchedule.prayerTimes.asr, name: `${getTranslatedPrayerNameFn('Asr')} ${getTranslatedTimetableTermFn('Begins')}` }] : []),
    ...(newSchedule.isAsrIqamahEnabled ? [{ field: newSchedule.prayerTimes.asrIqamah, name: `${getTranslatedPrayerNameFn('Asr')} ${getTranslatedTimetableTermFn('Iqamah')} Time` }] : []),
    ...(newSchedule.isMaghribEnabled ? [{ field: newSchedule.prayerTimes.maghrib, name: `${getTranslatedPrayerNameFn('Maghrib')} ${getTranslatedTimetableTermFn('Begins')}` }] : []),
    ...(newSchedule.isMaghribIqamahEnabled ? [{ field: newSchedule.prayerTimes.maghribIqamah, name: `${getTranslatedPrayerNameFn('Maghrib')} ${getTranslatedTimetableTermFn('Iqamah')} Time` }] : []),
    ...(newSchedule.isIshaEnabled ? [{ field: newSchedule.prayerTimes.isha, name: `${getTranslatedPrayerNameFn('Isha')} ${getTranslatedTimetableTermFn('Begins')}` }] : []),
    ...(newSchedule.isIshaIqamahEnabled ? [{ field: newSchedule.prayerTimes.ishaIqamah, name: `${getTranslatedPrayerNameFn('Isha')} ${getTranslatedTimetableTermFn('Iqamah')} Time` }] : [])
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

  // Prepare the prayer time enabled flags
  const prayerTimeEnabledFlags = {
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

  // Prepare the schedule data with the correct enabled states
  const scheduleData = {
    ...newSchedule,
    daysOfWeek: selectedDays,
    prayerTimes,
    prayerTimeEnabledFlags
  };

  // Create the final schedule object excluding the individual enabled flags from the update payload
  const finalSchedule = {
    ...scheduleData,
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
        daysOfWeek: finalSchedule.daysOfWeek
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
      startDate: formatDateFn(new Date()),
      endDate: formatDateFn(new Date()),
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
    }));
    setSelectedDays([]);
    setEditingId(null);
    setShowForm(false);
  } catch (error) {
    console.error('Failed to save schedule:', error);
    alert(`Failed to ${editingId ? 'update' : 'add'} schedule. Please try again.`);
  }
};

export const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setNewSchedule: (schedule: any) => void
) => {
  const { name, value } = e.target;
  
  // Special handling for date inputs to ensure proper formatting
  if (name === 'startDate' || name === 'endDate') {
    setNewSchedule((prev: any) => ({
      ...prev,
      [name]: value
    }));
  } else {
    setNewSchedule((prev: any) => ({
      ...prev,
      [name]: value
    }));
  }
};

export const handleDateChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setNewSchedule: (schedule: any) => void
) => {
  const { name, value } = e.target;
  setNewSchedule((prev: any) => ({
    ...prev,
    [name]: value
  }));
};