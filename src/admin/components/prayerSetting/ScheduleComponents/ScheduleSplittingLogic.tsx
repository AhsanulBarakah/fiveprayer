/**
 * ScheduleSplittingLogic
 *
 * Handles splitting multi-month schedules into per-month schedules.
 *
 * @module ScheduleComponents/ScheduleSplittingLogic
 */
import { useState } from 'react';
import { useCustomPrayerTimeSchedulesStore } from '../../../state/useCustomPrayerTimeSchedulesStore';
import { formatDate } from './FormatterFunctions';
import { usePostMeta } from '../../../hooks/usePostMeta';
import { __ } from '@wordpress/i18n';

interface ScheduleSplittingLogicProps {
  tempScheduleData: any;
  setTempScheduleData: (data: any) => void;
  setShowSplitModal: (show: boolean) => void;
  setNewSchedule: (schedule: any) => void;
  setSelectedDays: (days: number[]) => void;
  setEditingId: (id: string | null) => void;
  setShowForm: (show: boolean) => void;
  updateIsReadyGenerator: (ready: boolean) => void;
}

export const useScheduleSplittingLogic = ({
  tempScheduleData,
  setTempScheduleData,
  setShowSplitModal,
  setNewSchedule,
  setSelectedDays,
  setEditingId,
  setShowForm,
  updateIsReadyGenerator
}: ScheduleSplittingLogicProps) => {
  const { addSchedule, customSchedules } = useCustomPrayerTimeSchedulesStore();
  const { saveBatch } = usePostMeta();
  
  // Function to split the schedule into monthly schedules
  const splitScheduleIntoMonths = () => {
    if (!tempScheduleData) {
      console.error('No temporary schedule data provided for splitting');
      return;
    }
    
    // Validate dates
    const start = new Date(tempScheduleData.startDate);
    const end = new Date(tempScheduleData.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid start or end date provided for schedule splitting');
      alert(__('Invalid dates provided. Cannot split schedule.', 'fiveprayer'));
      return;
    }
    
    if (end < start) {
      console.error('End date is before start date');
      alert(__('End date cannot be before start date. Cannot split schedule.', 'fiveprayer'));
      return;
    }
    
    // Calculate the start and end months
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    let currentDate = new Date(startMonth);
    let monthIndex = 0;
    
    // Array to collect the schedules that will be created
    const schedulesToCreate = [];
    
    try {
      while (currentDate <= endMonth) {
        // Calculate start and end dates for this month
        const monthStart = new Date(currentDate);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const monthEnd = new Date(nextMonth);
        monthEnd.setDate(0); // Last day of the current month
        
        // If this is the first month, start from the actual start date
        if (monthIndex === 0) {
          monthStart.setTime(Math.max(monthStart.getTime(), start.getTime()));
        }
        
        // If this is the last month, end at the actual end date
        if (currentDate.getFullYear() === end.getFullYear() && currentDate.getMonth() === end.getMonth()) {
          monthEnd.setTime(Math.min(monthEnd.getTime(), end.getTime()));
        }
        
        // Helper function to generate a truly unique ID
        const generateUniqueId = () => {
          return `split-schedule-${tempScheduleData.id || 'original'}-${monthIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.floor(Math.random() * 1000)}`;
        };
        
        // Determine the actual enabled state by checking all possible sources
        // This addresses the inconsistency between individual flags and prayerTimeEnabledFlags in the source data
        const determineActualEnabledState = (flagName: string, individualFlag: any, timeValue: any) => {
          // Check if the individual flag is explicitly true
          const isIndividualFlagTrue = individualFlag === true || individualFlag === 'true' || individualFlag === 1;
          
          // Check if there's a time value that suggests it should be enabled
          const hasTimeValue = timeValue && typeof timeValue === 'string' && timeValue.trim() !== '';
          
          // Check the prayerTimeEnabledFlags
          const prayerTimeFlag = tempScheduleData.prayerTimeEnabledFlags?.[flagName];
          const isPrayerTimeFlagTrue = prayerTimeFlag === true || prayerTimeFlag === 'true' || prayerTimeFlag === 1;
          
          // Return true if any of the indicators suggest it should be enabled
          return isIndividualFlagTrue || hasTimeValue || isPrayerTimeFlagTrue;
        };
        
        // Create consistent flags based on the actual state
        const isFajrActuallyEnabled = determineActualEnabledState('isFajrEnabled', tempScheduleData.isFajrEnabled, tempScheduleData.prayerTimes?.fajr);
        const isFajrIqamahActuallyEnabled = determineActualEnabledState('isFajrIqamahEnabled', tempScheduleData.isFajrIqamahEnabled, tempScheduleData.prayerTimes?.fajrIqamah);
        const isDhuhrActuallyEnabled = determineActualEnabledState('isDhuhrEnabled', tempScheduleData.isDhuhrEnabled, tempScheduleData.prayerTimes?.dhuhr);
        const isDhuhrIqamahActuallyEnabled = determineActualEnabledState('isDhuhrIqamahEnabled', tempScheduleData.isDhuhrIqamahEnabled, tempScheduleData.prayerTimes?.dhuhrIqamah);
        const isAsrActuallyEnabled = determineActualEnabledState('isAsrEnabled', tempScheduleData.isAsrEnabled, tempScheduleData.prayerTimes?.asr);
        const isAsrIqamahActuallyEnabled = determineActualEnabledState('isAsrIqamahEnabled', tempScheduleData.isAsrIqamahEnabled, tempScheduleData.prayerTimes?.asrIqamah);
        const isMaghribActuallyEnabled = determineActualEnabledState('isMaghribEnabled', tempScheduleData.isMaghribEnabled, tempScheduleData.prayerTimes?.maghrib);
        const isMaghribIqamahActuallyEnabled = determineActualEnabledState('isMaghribIqamahEnabled', tempScheduleData.isMaghribIqamahEnabled, tempScheduleData.prayerTimes?.maghribIqamah);
        const isIshaActuallyEnabled = determineActualEnabledState('isIshaEnabled', tempScheduleData.isIshaEnabled, tempScheduleData.prayerTimes?.isha);
        const isIshaIqamahActuallyEnabled = determineActualEnabledState('isIshaIqamahEnabled', tempScheduleData.isIshaIqamahEnabled, tempScheduleData.prayerTimes?.ishaIqamah);
        
        // Create consistent prayerTimeEnabledFlags based on the determined actual state
        const consistentPrayerTimeEnabledFlags = {
          isFajrEnabled: isFajrActuallyEnabled,
          isFajrIqamahEnabled: isFajrIqamahActuallyEnabled,
          isDhuhrEnabled: isDhuhrActuallyEnabled,
          isDhuhrIqamahEnabled: isDhuhrIqamahActuallyEnabled,
          isAsrEnabled: isAsrActuallyEnabled,
          isAsrIqamahEnabled: isAsrIqamahActuallyEnabled,
          isMaghribEnabled: isMaghribActuallyEnabled,
          isMaghribIqamahEnabled: isMaghribIqamahActuallyEnabled,
          isIshaEnabled: isIshaActuallyEnabled,
          isIshaIqamahEnabled: isIshaIqamahActuallyEnabled
        };
        
        // Create the monthly schedule with consistent flags
        const monthlySchedule = {
          id: generateUniqueId(), // Generate unique ID for each monthly schedule
          name: `${tempScheduleData.name} - ${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          enabled: tempScheduleData.enabled,
          startDate: formatDate(monthStart),
          endDate: formatDate(monthEnd),
          prayerTimes: tempScheduleData.prayerTimes ? JSON.parse(JSON.stringify(tempScheduleData.prayerTimes)) : {},
          prayerTimeEnabledFlags: consistentPrayerTimeEnabledFlags,
          daysOfWeek: tempScheduleData.daysOfWeek ? [...tempScheduleData.daysOfWeek] : [], // Copy days of week array
          // Use the consistent enabled states
          isFajrEnabled: isFajrActuallyEnabled,
          isFajrIqamahEnabled: isFajrIqamahActuallyEnabled,
          isDhuhrEnabled: isDhuhrActuallyEnabled,
          isDhuhrIqamahEnabled: isDhuhrIqamahActuallyEnabled,
          isAsrEnabled: isAsrActuallyEnabled,
          isAsrIqamahEnabled: isAsrIqamahActuallyEnabled,
          isMaghribEnabled: isMaghribActuallyEnabled,
          isMaghribIqamahEnabled: isMaghribIqamahActuallyEnabled,
          isIshaEnabled: isIshaActuallyEnabled,
          isIshaIqamahEnabled: isIshaIqamahActuallyEnabled,
          dateOverrides: tempScheduleData.dateOverrides ? JSON.parse(JSON.stringify(tempScheduleData.dateOverrides)) : undefined
        };
        
        // Function to recursively remove empty keys from objects
        const removeEmptyKeys = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(removeEmptyKeys);
          } else if (obj !== null && typeof obj === 'object') {
            const cleanedObj: any = {};
            Object.keys(obj).forEach(key => {
              if (key !== '') { // Remove keys that are literally empty strings
                const value = removeEmptyKeys(obj[key]);
                // Only add non-null/undefined values to prevent issues
                if (value !== null && value !== undefined) {
                  cleanedObj[key] = value;
                }
              }
            });
            return cleanedObj;
          }
          return obj;
        };
        
        // Clean the schedule data to remove any potentially problematic empty values
        // Make sure all values are properly defined and no empty keys exist
        const cleanedSchedule = {
          id: monthlySchedule.id || '',
          name: monthlySchedule.name || '',
          enabled: Boolean(monthlySchedule.enabled),
          startDate: monthlySchedule.startDate || '',
          endDate: monthlySchedule.endDate || '',
          prayerTimes: monthlySchedule.prayerTimes ? removeEmptyKeys(monthlySchedule.prayerTimes) : {},
          prayerTimeEnabledFlags: monthlySchedule.prayerTimeEnabledFlags ? removeEmptyKeys(monthlySchedule.prayerTimeEnabledFlags) : {},
          daysOfWeek: Array.isArray(monthlySchedule.daysOfWeek) ? monthlySchedule.daysOfWeek.filter(d => d !== null && d !== undefined) : [],
          isFajrEnabled: Boolean(monthlySchedule.isFajrEnabled),
          isFajrIqamahEnabled: Boolean(monthlySchedule.isFajrIqamahEnabled),
          isDhuhrEnabled: Boolean(monthlySchedule.isDhuhrEnabled),
          isDhuhrIqamahEnabled: Boolean(monthlySchedule.isDhuhrIqamahEnabled),
          isAsrEnabled: Boolean(monthlySchedule.isAsrEnabled),
          isAsrIqamahEnabled: Boolean(monthlySchedule.isAsrIqamahEnabled),
          isMaghribEnabled: Boolean(monthlySchedule.isMaghribEnabled),
          isMaghribIqamahEnabled: Boolean(monthlySchedule.isMaghribIqamahEnabled),
          isIshaEnabled: Boolean(monthlySchedule.isIshaEnabled),
          isIshaIqamahEnabled: Boolean(monthlySchedule.isIshaIqamahEnabled),
          dateOverrides: monthlySchedule.dateOverrides ? removeEmptyKeys(monthlySchedule.dateOverrides) : undefined
        };
        
        // Add to the collection for later sync
        schedulesToCreate.push(cleanedSchedule);
        
        // Add the monthly schedule to the store
        addSchedule(cleanedSchedule);
        
        monthIndex++;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      updateIsReadyGenerator(true);
      alert(`Successfully split schedule into ${monthIndex} monthly schedules!`);
    } catch (error) {
      console.error('Error occurred while splitting schedule:', error);
      alert(__('An error occurred while splitting the schedule. Please try again.', 'fiveprayer'));
      return;
    }
    
    updateIsReadyGenerator(true);
    alert(`Successfully split schedule into ${monthIndex} monthly schedules!`);
    
    // Close modal and reset form
    setShowSplitModal(false);
    setTempScheduleData(null);
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
    }));
    setSelectedDays([]);
    setEditingId(null);
    setShowForm(false);
    
    // Save the data to WordPress database with the required structure
    const dataToSend = {
      state: {
        customSchedules: schedulesToCreate,
        isCustomSchedulesEnabled: true
      },
      version: 0
    };
    
    saveBatch({ 'custom-prayer-time-schedules': dataToSend });
  };

  // Function to keep the schedule as one
  const keepScheduleTogether = () => {
    // Close modal and continue with normal flow
    setShowSplitModal(false);
    setTempScheduleData(null);
  };

  return {
    splitScheduleIntoMonths,
    keepScheduleTogether
  };
};