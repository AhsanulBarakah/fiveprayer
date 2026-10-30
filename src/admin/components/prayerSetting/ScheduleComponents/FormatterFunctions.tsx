/**
 * FormatterFunctions
 *
 * Pure utility functions for date formatting.
 *
 * @module ScheduleComponents/FormatterFunctions
 */
// Format date as yyyy-MM-dd
export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const daysOfWeek = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

export const getFirstDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getTranslatedPrayerName = (prayer_names: any[], activeLanguage: string, originalName: string): string => {
  const translation = prayer_names.find(
    (prayer: any) =>
      prayer.original_text.toLowerCase() === originalName.toLowerCase() &&
      prayer.language_code === activeLanguage
  );
  return translation?.translated_text || originalName;
};

export const getTranslatedTimetableTerm = (timetable_prayer: any[], activeLanguage: string, originalTerm: string): string => {
  // Look for exact match first (case-insensitive)
  const exactMatch = timetable_prayer.find(
    (term: any) =>
      term.original_text.toLowerCase().trim() === originalTerm.toLowerCase().trim() &&
      term.language_code === activeLanguage
  );

  if (exactMatch?.translated_text) {
    return exactMatch.translated_text;
  }

  // If no exact match, try partial match as fallback
  const partialMatch = timetable_prayer.find(
    (term: any) =>
      term.original_text.toLowerCase().includes(originalTerm.toLowerCase()) &&
      term.language_code === activeLanguage
  );

  return partialMatch?.translated_text || originalTerm;
};