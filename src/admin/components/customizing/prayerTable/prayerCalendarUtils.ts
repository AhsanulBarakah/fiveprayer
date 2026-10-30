/**
 * Prayer Calendar Utilities
 *
 * Helper functions for translating prayer names and sub-header labels
 * in the timetable calendar components.
 */
export const getTranslatedPrayerNames = (
    prayer_names: any[],
    activeLanguage: string,
    hijralocales: any
  ) => {
    const hijraIsActive = hijralocales && hijralocales.isActive === true;
    const useLanguage = hijraIsActive ? activeLanguage : 'en';
    const useCustomLan = hijraIsActive && hijralocales.customLan;
    
    return ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"].map((prayer) => {
      const translation = prayer_names.filter(
        (p) => p.original_text === prayer && p.language_code === useLanguage
      );
      return translation.length > 0 && useCustomLan
        ? translation[0].translated_text
        : prayer;
    });
  };

  export const getSubHeaders = (
    timetable_prayer: any[],
    activeLanguage: string,
    hijralocales: any,
    monthMethod: string
  ) => {
    const hijraIsActive = hijralocales && hijralocales.isActive === true;
    const useLanguage = hijraIsActive ? activeLanguage : 'en';
    const useCustomLan = hijraIsActive && hijralocales.customLan;
    
    return [
      "Date",
      monthMethod === "13" ? "Suhoor End" : "Fajr Begins",
      "Fajr Iqamah",
      "Sunrise",
      "Dhuhr Begins",
      "Dhuhr Iqamah",
      "Asr Begins",
      "Asr Iqamah",
      monthMethod === "13" ? "Iftar Start" : "Maghrib Begins",
      "Maghrib Iqamah",
      "Isha Begins",
      "Isha Iqamah",
      "Midnight"
    ].map((prayer) => {
      const translation = timetable_prayer.find(
        (p) => p.original_text === prayer && p.language_code === useLanguage
      );
      return translation && useCustomLan
        ? translation.translated_text
        : prayer.replace(/^(Fajr|Dhuhr|Asr|Maghrib|Isha|Midnight)\s/, '');
    });
  };
