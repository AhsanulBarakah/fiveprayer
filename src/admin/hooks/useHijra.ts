import { useCallback, useMemo } from "react";
import { useConditional } from "../state/storeConditional";
import { useTimeTableMonth } from "../state/storeTimeTable";
import { useTranslationStore } from "../state/useTranslationStore";
import useFormatDataLocale from "./translate/useFormatDataLocale";


export const useHijra = () => {
  const { HijraLocale } = useTimeTableMonth();
  const { isRamadan, isRamadanDate } = useConditional();
  const memoizedHijraLocale = useMemo(() => HijraLocale, [HijraLocale]);
  const memoizedIsRamadan = useMemo(() => isRamadan, [isRamadan]);
  const memoizedIsRamadanDate = useMemo(() => isRamadanDate, [isRamadanDate]);
  const { hijra_months, hijra_numbers ,activeLanguage } = useTranslationStore();
  const { hijra_format } = useFormatDataLocale();

  // Memoize the hijraLocale function to avoid recreating it on every render
  const hijraLocale = useCallback(
    (data: string | number | Date) => {
      // Check if Hijra Calendar is active - if NOT active, return English format
      const hijraIsActive = memoizedHijraLocale && memoizedHijraLocale.isActive === true;
      
      // Create a new Date object to avoid mutating the input
      const localeFormat = new Date(data);
      // Adjust the date if Ramadan conditions are met
      if (memoizedIsRamadan.ramadan) {
        localeFormat.setDate(localeFormat.getDate() + memoizedIsRamadan.ramadan_custom);
      }

      // If Hijra Calendar is NOT active, return English format
      if (!hijraIsActive) {
        return localeFormat.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      // Format the date if HijraLocale settings are valid
      if (memoizedHijraLocale.lan && memoizedHijraLocale.calenderType) {
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
        };

        const hijraDate = new Intl.DateTimeFormat(
          `${memoizedHijraLocale.lan}-u-ca-${memoizedHijraLocale.calenderType}`,
          options
        ).format(localeFormat);

        if(memoizedHijraLocale.customLan) {
          return hijra_format(hijraDate,  hijra_numbers, hijra_months,activeLanguage);
        }
        return hijraDate;
      }

      // Return a fallback value if conditions are not met
      return localeFormat.toLocaleDateString(); // Fallback to default locale
    },
    [memoizedHijraLocale.lan, memoizedHijraLocale.calenderType, memoizedHijraLocale.isActive, memoizedIsRamadan.ramadan, memoizedIsRamadanDate, memoizedIsRamadan.ramadan_custom, hijra_months, hijra_numbers, activeLanguage, memoizedHijraLocale.customLan]
  );

  return { hijraLocale };
};