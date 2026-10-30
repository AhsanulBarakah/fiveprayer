import { useLocationStore } from "../state/storeLocation";
import { useTimeTableMonth } from "../state/storeTimeTable";
import { useTranslationStore } from "../state/useTranslationStore";
import useFormatDataLocale from "./translate/useFormatDataLocale";
import { useMonth } from "./useMonth";
import { useRamadanCalendar } from "./useRamadanCalendar";
import { resolveDisplayMonth } from "../utils/hijriCalendar";

type Prayer = {
  asr_begins: string;
  asr_second_begins: string;
  asr_iqamah: string;
  className: string;
  currentDate: string;
  date: string;
  dhuhr_begins: string;
  dhuhr_iqamah: string;
  fajr_begins: string;
  fajr_iqamah: string;
  fajr_masjid_jamaah: string;
  isha_begins: string;
  isha_iqamah: string;
  maghrib_begins: string;
  maghrib_iqamah: string;
  midnight: string;
  sunrise: string;
  today: string;
};

export const useMonthCalendar = (): Prayer[] => {
  const { MonthList } = useMonth();
  const { isLocaleRamadan } = useRamadanCalendar();
  const { month, calendar_type } = useLocationStore();
  const { TimeTableMonthFullYear } = useTimeTableMonth() as unknown as { TimeTableMonthFullYear: Prayer[] };
  const { gregorian_numbers, gregorian_months,activeLanguage,hijralocales } = useTranslationStore();
  const {gregorian_format} = useFormatDataLocale()
  
  if (!TimeTableMonthFullYear.length) return []; // Early return if empty

  // Ensure MonthList().value exists before accessing it
  const monthList = MonthList || [];
  
  // Try to find the selected month from stored settings; in Hijri Calendar
  // Type mode the list holds Gregorian months with year labels covering the
  // generated Hijri span (keys like `g-2027-2`) and falls back to the month
  // containing today. In Gregorian mode the behaviour is unchanged (selected
  // month → current month).
  const selectedMonth = resolveDisplayMonth(month, monthList, calendar_type, new Date());

  if (!selectedMonth) return []; // Handle case where month is not found

  // Hijri month entries carry their own Gregorian start/end range (a Hijri
  // month spans two Gregorian months and may cross a year boundary), so the
  // rows are filtered by that range instead of "current year + month".
  const hijriRange =
    selectedMonth.start && selectedMonth.end
      ? {
          start: new Date(selectedMonth.start).getTime(),
          end: new Date(selectedMonth.end).getTime(),
        }
      : null;

  // Filter the month data
  const calendar = TimeTableMonthFullYear.filter((date: any) => {
    const dateObj = new Date(date.date);

    if (hijriRange) {
      const t = dateObj.getTime();
      return t >= hijriRange.start && t < hijriRange.end;
    }

    const currentYear = new Date().getFullYear();
    const dateYear = dateObj.getFullYear();
    const dateMonth = dateObj.getMonth() + 1;

    if (Number(selectedMonth.method) === 13 && dateYear === currentYear && isLocaleRamadan({ currentDate: date.date })) {
      return true;
    }

    return dateYear === currentYear && dateMonth === Number(selectedMonth.method);
  }) as Prayer[];

  if(hijralocales.customLan){
    return gregorian_format(calendar, gregorian_numbers, gregorian_months, activeLanguage);
  } else {
    return calendar;
  }
};
