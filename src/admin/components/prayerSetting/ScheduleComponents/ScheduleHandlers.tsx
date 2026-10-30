/**
 * ScheduleHandlers
 *
 * Pure handler functions for schedule CRUD operations.
 *
 * @module ScheduleComponents/ScheduleHandlers
 */
import type { CustomPrayerTimeSchedule } from '../../../state/useCustomPrayerTimeSchedulesStore';
import { __ } from '@wordpress/i18n';

export const handleEdit = (
  schedule: CustomPrayerTimeSchedule,
  newSchedule: any,
  setNewSchedule: (schedule: any) => void,
  setSelectedDays: (days: number[]) => void,
  setEditingId: (id: string | null) => void,
  setShowForm: (show: boolean) => void
) => {
  // Preserve existing time values from the current state if they exist
  const currentState = newSchedule;
  
  setNewSchedule((prev: any) => ({
    ...prev, // Preserve the existing state structure
    name: schedule.name,
    enabled: schedule.enabled,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    prayerTimes: {
      fajr: schedule.prayerTimes.fajr || currentState.prayerTimes.fajr || '',
      fajrIqamah: schedule.prayerTimes.fajrIqamah || currentState.prayerTimes.fajrIqamah || '',
      dhuhr: schedule.prayerTimes.dhuhr || currentState.prayerTimes.dhuhr || '',
      dhuhrIqamah: schedule.prayerTimes.dhuhrIqamah || currentState.prayerTimes.dhuhrIqamah || '',
      asr: schedule.prayerTimes.asr || currentState.prayerTimes.asr || '',
      asrIqamah: schedule.prayerTimes.asrIqamah || currentState.prayerTimes.asrIqamah || '',
      maghrib: schedule.prayerTimes.maghrib || currentState.prayerTimes.maghrib || '',
      maghribIqamah: schedule.prayerTimes.maghribIqamah || currentState.prayerTimes.maghribIqamah || '',
      isha: schedule.prayerTimes.isha || currentState.prayerTimes.isha || '',
      ishaIqamah: schedule.prayerTimes.ishaIqamah || currentState.prayerTimes.ishaIqamah || ''
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
    // Only set to false if the time is explicitly undefined
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
  // Restore selected days in the editor
  setSelectedDays([...schedule.daysOfWeek]);
  setEditingId(schedule.id);
  setShowForm(true);
};

export const handleDeleteSchedule = (
  id: string,
  removeSchedule: (id: string) => void,
  updateIsReadyGenerator: (ready: boolean) => void
) => {
  if (window.confirm(__('Are you sure you want to delete this schedule?', 'fiveprayer'))) {
    removeSchedule(id);
    updateIsReadyGenerator(true);
    alert(__('Schedule deleted successfully!', 'fiveprayer'));
  }
};

export const handlePrayerTimeChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setNewSchedule: (schedule: any) => void
) => {
  const { name, value } = e.target;
  
  // Only update if the value is a valid time format (HH:MM) or empty
  if (value === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    setNewSchedule((prev: any) => {
      const enabledMap: Record<string, boolean> = {
        fajr: prev.isFajrEnabled,
        fajrIqamah: prev.isFajrIqamahEnabled,
        dhuhr: prev.isDhuhrEnabled,
        dhuhrIqamah: prev.isDhuhrIqamahEnabled,
        asr: prev.isAsrEnabled,
        asrIqamah: prev.isAsrIqamahEnabled,
        maghrib: prev.isMaghribEnabled,
        maghribIqamah: prev.isMaghribIqamahEnabled,
        isha: prev.isIshaEnabled,
        ishaIqamah: prev.isIshaIqamahEnabled,
      };
      if (name in enabledMap && enabledMap[name] === false) return prev;
      return {
        ...prev,
        prayerTimes: {
          ...prev.prayerTimes,
          [name]: value
        }
      };
    });
  }
};

export const togglePrayerTime = (
  field: 'fajr' | 'fajrIqamah' | 'dhuhr' | 'dhuhrIqamah' | 'asr' | 'asrIqamah' | 'maghrib' | 'maghribIqamah' | 'isha' | 'ishaIqamah',
  setNewSchedule: (schedule: any) => void
) => {
  setNewSchedule((prev: any) => {
    // Define a mapping from field to its enabled key
    const enabledKeys = {
      fajr: 'isFajrEnabled',
      fajrIqamah: 'isFajrIqamahEnabled',
      dhuhr: 'isDhuhrEnabled',
      dhuhrIqamah: 'isDhuhrIqamahEnabled',
      asr: 'isAsrEnabled',
      asrIqamah: 'isAsrIqamahEnabled',
      maghrib: 'isMaghribEnabled',
      maghribIqamah: 'isMaghribIqamahEnabled',
      isha: 'isIshaEnabled',
      ishaIqamah: 'isIshaIqamahEnabled'
    } as const;

    const enabledKey = enabledKeys[field];
    const isCurrentlyEnabled = prev[enabledKey] as boolean;
    const timeValue = prev.prayerTimes[field] || '';

    return {
      ...prev,
      [enabledKey]: !isCurrentlyEnabled,
      prayerTimes: {
        ...prev.prayerTimes,
        [field]: timeValue // Preserve the existing time value
      }
    };
  });
};