import { useIqamaStore } from '../state/storeIqamaDelay';
import { useCustomPrayerTimeSchedulesStore, getMatchingSchedule } from '../state/useCustomPrayerTimeSchedulesStore';
import { useMonth } from './useMonth';

interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fajr_begins?: string;
  dhuhr_begins?: string;
  asr_begins?: string;
  maghrib_begins?: string;
  isha_begins?: string;
  fajr_iqamah?: string;
  dhuhr_iqamah?: string;
  asr_iqamah?: string;
  maghrib_iqamah?: string;
  isha_iqamah?: string;
  today?: string;
  date?: string;
  currentDate?: string;
  currentMonth?: string;
  [key: string]: any; // For any additional properties
}

export const useTimes = () => {
  const IQFajr = useIqamaStore((state) => state.IQFajr);
  const IQDhuhr = useIqamaStore((state) => state.IQDhuhr);
  const IQAsr = useIqamaStore((state) => state.IQAsr);
  const IQMaghrib = useIqamaStore((state) => state.IQMaghrib);
  const IQIsha = useIqamaStore((state) => state.IQIsha);
  const { customSchedules, isCustomSchedulesEnabled } = useCustomPrayerTimeSchedulesStore();
  const { MonthName } = useMonth();
  
  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-UK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0');
  };
	/**
	 * Resolve one Iqamah column for a day.
	 *
	 * Precedence (highest first):
	 *   1. an Advanced Schedule override — applied by the branches below, which
	 *      replace the value this helper produced;
	 *   2. the imported printed Jamā'ah value for the day (Unified Method chart),
	 *      when present;
	 *   3. the computed Begins + Iqamah Delay.
	 *
	 * This is why the imported timetable no longer locks the Iqamah: a schedule
	 * you set in Advanced Schedules overrides it, and days with no imported
	 * Jamā'ah keep the normal Begins + Iqamah Delay behaviour.
	 */
	const timePrayer = async (
		times: PrayerTimes,
		startDate: Date,
		jamaah?: Record< string, string >
	): Promise<PrayerTimes> => {
		const day = startDate.getDate();
		const title =
			day +
			' ' +
			MonthName( startDate.getMonth() ) +
			' ' +
			startDate.getFullYear();
		times.fajr_begins = times.fajr;
		times.dhuhr_begins = times.dhuhr;
		times.asr_begins = times.asr;
		times.maghrib_begins = times.maghrib;
		times.isha_begins = times.isha;
		// Optional second 'Asr (2 Mithl / Hanafi) time — only present when the
		// imported Unified Method chart carried it. Stored in its own column so
		// the calendar can show it as an optional 'Asr 2 column.
		if (times.asr2) {
			times.asr_second_begins = times.asr2;
		}
		// Base Iqamah value per prayer: the imported Jamā'ah when the day has one,
		// otherwise Begins + Iqamah Delay. Advanced Schedule overrides (applied in
		// the branches below) always win over this base.
		const resolveIqamah = ( column: string, begins: string, delay: number ): string =>
			( jamaah && typeof jamaah[ column ] === 'string' && jamaah[ column ] !== '' )
				? jamaah[ column ]
				: addMinutes( begins, delay );
		// Check for custom schedule first
	   if (isCustomSchedulesEnabled) {
	     const customSchedule = getMatchingSchedule(startDate, customSchedules);
	     if (customSchedule) {
	       // Check if any prayer times are actually enabled in the custom schedule
	       const hasEnabledPrayerTimes = customSchedule.prayerTimeEnabledFlags && (
	         customSchedule.prayerTimeEnabledFlags.isFajrEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isFajrIqamahEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isDhuhrEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isDhuhrIqamahEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isAsrEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isAsrIqamahEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isMaghribEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isMaghribIqamahEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isIshaEnabled ||
	         customSchedule.prayerTimeEnabledFlags.isIshaIqamahEnabled
	       );

	       // Only use custom schedule if there are enabled prayer times
	       if (hasEnabledPrayerTimes) {
	         const dateKey = startDate.toISOString().split('T')[0];
	         const overrides = (customSchedule.dateOverrides && customSchedule.dateOverrides[dateKey]) || {};
	         // Check for date-specific overrides for fajr begins first, then fall back to schedule-wide
	         if (overrides.fajrBegins) {
	           times.fajr_begins = overrides.fajrBegins;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isFajrEnabled && customSchedule.prayerTimes.fajr) {
	           times.fajr_begins = customSchedule.prayerTimes.fajr;
	         }
	         // Only override iqamah if provided and enabled; otherwise, fall back to default offset
	         if (overrides.fajrIqamah) {
	           times.fajr_iqamah = overrides.fajrIqamah;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isFajrIqamahEnabled && customSchedule.prayerTimes.fajrIqamah) {
	           times.fajr_iqamah = customSchedule.prayerTimes.fajrIqamah;
	         } else {
	           times.fajr_iqamah = resolveIqamah('fajr_iqamah', times.fajr_begins as string, Number(IQFajr));
	         }

	         // Dhuhr
	         if (overrides.dhuhrBegins) {
	           times.dhuhr_begins = overrides.dhuhrBegins;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isDhuhrEnabled && customSchedule.prayerTimes.dhuhr) {
	           times.dhuhr_begins = customSchedule.prayerTimes.dhuhr;
	         }
	         if (overrides.dhuhrIqamah) {
	           times.dhuhr_iqamah = overrides.dhuhrIqamah;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isDhuhrIqamahEnabled && customSchedule.prayerTimes.dhuhrIqamah) {
	           times.dhuhr_iqamah = customSchedule.prayerTimes.dhuhrIqamah;
	         } else {
	           times.dhuhr_iqamah = resolveIqamah('dhuhr_iqamah', times.dhuhr_begins as string, Number(IQDhuhr));
	         }

	         // Asr
	         if (overrides.asrBegins) {
	           times.asr_begins = overrides.asrBegins;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isAsrEnabled && customSchedule.prayerTimes.asr) {
	           times.asr_begins = customSchedule.prayerTimes.asr;
	         }
	         if (overrides.asrIqamah) {
	           times.asr_iqamah = overrides.asrIqamah;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isAsrIqamahEnabled && customSchedule.prayerTimes.asrIqamah) {
	           times.asr_iqamah = customSchedule.prayerTimes.asrIqamah;
	         } else {
	           times.asr_iqamah = resolveIqamah('asr_iqamah', times.asr_begins as string, Number(IQAsr));
	         }

	         // Maghrib
	         if (overrides.maghribBegins) {
	           times.maghrib_begins = overrides.maghribBegins;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isMaghribEnabled && customSchedule.prayerTimes.maghrib) {
	           times.maghrib_begins = customSchedule.prayerTimes.maghrib;
	         }
	         if (overrides.maghribIqamah) {
	           times.maghrib_iqamah = overrides.maghribIqamah;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isMaghribIqamahEnabled && customSchedule.prayerTimes.maghribIqamah) {
	           times.maghrib_iqamah = customSchedule.prayerTimes.maghribIqamah;
	         } else {
	           times.maghrib_iqamah = resolveIqamah('maghrib_iqamah', times.maghrib_begins as string, Number(IQMaghrib));
	         }

	         // Isha
	         if (overrides.ishaBegins) {
	           times.isha_begins = overrides.ishaBegins;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isIshaEnabled && customSchedule.prayerTimes.isha) {
	           times.isha_begins = customSchedule.prayerTimes.isha;
	         }
	         if (overrides.ishaIqamah) {
	           times.isha_iqamah = overrides.ishaIqamah;
	         } else if (customSchedule.prayerTimeEnabledFlags?.isIshaIqamahEnabled && customSchedule.prayerTimes.ishaIqamah) {
	           times.isha_iqamah = customSchedule.prayerTimes.ishaIqamah;
	         } else {
	           times.isha_iqamah = resolveIqamah('isha_iqamah', times.isha_begins as string, Number(IQIsha));
	         }
	       } else {
	         // No enabled prayer times in custom schedule, fall back to default
	         times.fajr_iqamah = resolveIqamah('fajr_iqamah', times.fajr_begins as string, Number(IQFajr));
	         times.dhuhr_iqamah = resolveIqamah('dhuhr_iqamah', times.dhuhr_begins as string, Number(IQDhuhr));
	         times.asr_iqamah = resolveIqamah('asr_iqamah', times.asr_begins as string, Number(IQAsr));
	         times.maghrib_iqamah = resolveIqamah('maghrib_iqamah', times.maghrib_begins as string, Number(IQMaghrib));
	         times.isha_iqamah = resolveIqamah('isha_iqamah', times.isha_begins as string, Number(IQIsha));
	       }
	     } else {
	       times.fajr_iqamah = resolveIqamah('fajr_iqamah', times.fajr_begins as string, Number(IQFajr));
	       times.dhuhr_iqamah = resolveIqamah('dhuhr_iqamah', times.dhuhr_begins as string, Number(IQDhuhr));
	       times.asr_iqamah = resolveIqamah('asr_iqamah', times.asr_begins as string, Number(IQAsr));
	       times.maghrib_iqamah = resolveIqamah('maghrib_iqamah', times.maghrib_begins as string, Number(IQMaghrib));
	       times.isha_iqamah = resolveIqamah('isha_iqamah', times.isha_begins as string, Number(IQIsha));
	     }
	   } else {
	     times.fajr_iqamah = resolveIqamah('fajr_iqamah', times.fajr_begins as string, Number(IQFajr));
	     times.dhuhr_iqamah = resolveIqamah('dhuhr_iqamah', times.dhuhr_begins as string, Number(IQDhuhr));
	     times.asr_iqamah = resolveIqamah('asr_iqamah', times.asr_begins as string, Number(IQAsr));
	     times.maghrib_iqamah = resolveIqamah('maghrib_iqamah', times.maghrib_begins as string, Number(IQMaghrib));
	     times.isha_iqamah = resolveIqamah('isha_iqamah', times.isha_begins as string, Number(IQIsha));
	   }
		times.today = startDate.getDate().toString();
		times.date = title;
		times.currentDate =
			startDate.getDate() +
			' ' +
			MonthName( Number( startDate.getMonth() ) ) +
			' ' +
			startDate.getFullYear();
		times.currentMonth = MonthName( Number( startDate.getMonth() ) );

		times.title = title;
		
		// Ensure date is properly formatted as YYYY-MM-DD with zero-padding
		const year = startDate.getFullYear();
		const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
		const dayNum = startDate.getDate().toString().padStart(2, '0');
		times.date = `${year}-${month}-${dayNum}`;
		
		// Debug logging for invalid dates
		if (times.date === 'NaN-NaN-NaN' || times.date.includes('Invalid')) {
			console.error('[useTimes] Invalid date generated:', {
				startDate: startDate,
				year: year,
				month: month,
				dayNum: dayNum,
				getFullYear: startDate.getFullYear(),
				getMonth: startDate.getMonth(),
				getDate: startDate.getDate()
			});
		}
		
		return times;
	};

	return { timePrayer };
};
