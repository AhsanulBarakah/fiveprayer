// Type definition for Prayer object
// Represents the structure of prayer timing data
type Prayer = {
    asr_begins: string;     // Time when Asr prayer begins
    asr_second_begins: string; // Optional second Asr time (2 Mithl / Hanafi)
    asr_iqamah: string;     // Time when Asr iqamah is called
    className: string;      // CSS class name for the prayer
    currentDate: string;    // The current date in string format
    date: string;           // The specific date for the prayer timings
    dhuhr_begins: string;   // Time when Dhuhr prayer begins
    dhuhr_iqamah: string;   // Time when Dhuhr iqamah is called
    fajr_begins: string;    // Time when Fajr prayer begins
    fajr_iqamah: string;    // Time when Fajr iqamah is called
    fajr_masjid_jamaah: string; // Time for Fajr masjid congregation (optional)
    isha_begins: string;    // Time when Isha prayer begins
    isha_iqamah: string;    // Time when Isha iqamah is called
    maghrib_begins: string; // Time when Maghrib prayer begins
    maghrib_iqamah: string; // Time when Maghrib iqamah is called
    midnight: string;       // Time for midnight
    sunrise: string;        // Time for sunrise
    today: string;          // Today's date string
};

// Type definition for Translation object
// Represents translation data for different elements like numbers and months
interface Translation {
    original_text: string;  // Original text in the source language (e.g., number or word)
    translated_text: string; // Translated text in the target language
    language_code: string;   // The language code (e.g., "en", "ar")
    language_name: string;   // The name of the language (e.g., "English", "Arabic")
}

// Main function to format the prayer times based on locale (language)
const useFormatDataLocale = () => {

    // Converts each digit in a string to the target locale
    const splitNumbersAndConvert = (num: string, numbers: Translation[]) => {
        return num.split('').map((digit) => {
            return numbers.find((n) => n.original_text === digit)?.translated_text || digit;
        }).join('');
    };

    // Format the prayer data in Gregorian calendar
    const gregorian_format = (calendar: Prayer[], gregorian_numbers: Translation[], gregorian_months: Translation[], activeLanguage: string) => {
        // Function to convert 24-hour time to 12-hour format with AM/PM
        const convert24To12Hour = (time: string): { time: string, period: string } => {
            if (!time || !time.includes(':')) return { time, period: '' };
    
            const [hoursStr, minutesStr] = time.split(':');
            let hours = parseInt(hoursStr, 10);
            const minutes = minutesStr || '00';
    
            const period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
            return {
                time: `${hours.toString().padStart(2, '0')}:${minutes}`,
                period
            };
        };
    
        // Function to update time fields with converted times
        const updateTimeFieldsNew = (prayer: Prayer, numbers: Translation[]) => {
            const timeFields = [
                'asr_begins', 'asr_second_begins', 'asr_iqamah',
                'dhuhr_begins', 'dhuhr_iqamah',
                'fajr_begins', 'fajr_iqamah',
                'fajr_masjid_jamaah',
                'isha_begins', 'isha_iqamah',
                'maghrib_begins', 'maghrib_iqamah',
                'sunrise', 'midnight'
            ];
    
            timeFields.forEach((field) => {
                const timeValue = prayer[field as keyof Prayer]?.toString().trim();
                if (!timeValue) return;
    
                // Skip if already in 12-hour format. Case-insensitive, because
                // the API output follows the WordPress time format and may use
                // lowercase "am"/"pm" (without this the value was treated as
                // 24-hour and the period was appended twice).
                if (/\b(am|pm)\b/i.test(timeValue)) {
                    const [time, period] = timeValue.split(' ');
                    const convertedTime = splitNumbersAndConvert(time, numbers);
                    const convertedPeriod = numbers.find(n => 
                        n.original_text === period.toUpperCase()
                    )?.translated_text || period;
                    prayer[field as keyof Prayer] = `${convertedTime} ${convertedPeriod}`;
                    return;
                }
    
                // Convert 24-hour to 12-hour format
                const { time: convertedTime, period } = convert24To12Hour(timeValue);
                const translatedTime = splitNumbersAndConvert(convertedTime, numbers);
                const translatedPeriod = numbers.find(n => 
                    n.original_text === period
                )?.translated_text || period;
    
                prayer[field as keyof Prayer] = `${translatedTime} ${translatedPeriod}`;
            });
        };
    
        // Filters translations based on the active language
        const filterTranslations = (translations: Translation[]) => {
            return translations.filter((item) => item.language_code === activeLanguage);
        };
    
        // Update the date field with localized numbers and month name
        const updateDateField = (prayer: Prayer, numbers: Translation[], months: Translation[]) => {
            const [year_num, month_name, day_num] = prayer.currentDate.split(' ');
            const updatedYear = splitNumbersAndConvert(year_num, numbers);
            const updatedDay = splitNumbersAndConvert(day_num, numbers);
            const updatedMonth = months.find((m) => m.original_text === month_name)?.translated_text || month_name;
            prayer.currentDate = `${updatedYear} ${updatedMonth} ${updatedDay}`;
        };
    
        // Converts the prayer times into the appropriate locale
        const convertGregorian = (numbers: Translation[], months: Translation[]) => {
            return calendar.map((prayer) => {
                const updatedPrayer = { ...prayer }; // Create a shallow copy
                updateDateField(updatedPrayer, numbers, months);
                updateTimeFieldsNew(updatedPrayer, numbers);
                return updatedPrayer;
            });
        };
    
        // Filters translations and converts the data based on the active language
        const convertGregorianLocales = () => {
            const numbers = filterTranslations(gregorian_numbers);
            const months = filterTranslations(gregorian_months);
            return convertGregorian(numbers, months);
        };
    
        return convertGregorianLocales();
    };

    // Format the prayer data in Hijri calendar
    const hijra_format = (data: string | number | Date, hijra_numbers: Translation[], hijra_months: Translation[], activeLanguage: string) => {
        // Filters translations based on the active language
        const filterTranslations = (translations: Translation[]) => {
            return translations.filter((item) => item.language_code === activeLanguage);
        };

        // Update the Hijri date field with localized numbers and month
        const updateDateHijra = (data: string | number | Date, numbers: Translation[], months: Translation[]) => {
            // Convert to string and normalize spaces
            const dateStr = data.toString()
                .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
                .trim();                       // Trim leading/trailing spaces
        
            // Initialize variables
            let month_name = '';
            let day_num = '';
            let year_num = '';
            let ah = '';
            let remainingString = dateStr;
        
            // First try to find AH suffix
            const ahMatch = remainingString.match(/(\bAH\b|\bh\b|\bهـ\b)/i);
            if (ahMatch) {
                ah = ahMatch[0];
                remainingString = remainingString.replace(ahMatch[0], '').trim();
            }
        
            // Get all possible month names sorted by length (longest first)
            const monthNames = months.map(m => m.original_text);
            monthNames.sort((a, b) => b.length - a.length);
        
            // Try to find each month name in the string (longest first)
            for (const month of monthNames) {
                // Create regex that matches the month exactly (case insensitive)
                const regex = new RegExp(`\\b${month.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(remainingString)) {
                    // Get the actual matched text (preserving original case)
                    month_name = remainingString.match(regex)![0];
                    // Remove the month from the string
                    remainingString = remainingString.replace(regex, '').trim();
                    break;
                }
            }
        
            // Now process the remaining parts (day and year)
            const parts = remainingString.split(/\s+/).filter(part => part.trim() !== '');
        
            // Assign remaining parts
            if (parts.length >= 2) {
                [day_num, year_num] = parts;
            } else if (parts.length === 1) {
                [year_num] = parts;
            }
        
            // If AH wasn't found earlier but should be present
            if (!ah && (dateStr.includes('AH') || dateStr.includes('هـ'))) {
                ah = 'AH';
            }
        
            // Convert numbers and get translations
            const updatedYear = year_num ? splitNumbersAndConvert(year_num, numbers) : '';
            const updatedDay = day_num ? splitNumbersAndConvert(day_num, numbers) : '';
            const updatedMonth = month_name ? 
                (months.find((m) => m.original_text.toLowerCase() === month_name.toLowerCase())?.translated_text || month_name) : 
                '';
            const updatedAH = ah ? 
                (months.find((m) => m.original_text.toLowerCase() === ah.toLowerCase())?.translated_text || ah) : 
                '';
        
            // Construct final string
            let result = [];
            if (updatedDay) result.push(updatedDay);
            if (updatedMonth) result.push(updatedMonth);
            if (updatedYear) result.push(updatedYear);
            if (updatedAH) result.push(updatedAH);
        
            return result.join(' ');
        };

        // Converts the Hijri date to the appropriate locale
        const convertHijra = (numbers: Translation[], months: Translation[]) => {
            return updateDateHijra(data.toString(), numbers, months); // Update Hijri date
        };

        // Filters translations and converts the data based on the active language
        const finalConvertHijraLocales = () => {
            const numbers = filterTranslations(hijra_numbers);
            const months = filterTranslations(hijra_months);
            return convertHijra(numbers, months);
        };

        // Return the converted prayer data in Hijri format
        return finalConvertHijraLocales();
    }

    return { gregorian_format, hijra_format }; // Return both functions for usage
}

// Export the function for use in other parts of the application
export default useFormatDataLocale;
