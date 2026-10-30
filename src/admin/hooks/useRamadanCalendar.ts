import { useHijra } from "./useHijra";

export const useRamadanCalendar = () => {
    const { hijraLocale } = useHijra();

    // Precompute lowercase Ramadan variations for faster comparison
    const localeRamadanSet = new Set(["ramadan", "رمضان", "ramadán", "ramazan", "रमजान"].map(r => r.toLowerCase()));

    const isLocaleRamadan = (item: { currentDate: any; }) => {
        // console.log(" item ",item);
        const hijriDate = hijraLocale(item.currentDate);  
        if (!hijriDate) return false; // Avoid processing if the date is invalid

        return hijriDate
            .toLowerCase() // Normalize once
            .split(' ') // Split once
            .some(word => localeRamadanSet.has(word)); // Faster lookup with Set
    };

    return { isLocaleRamadan };
};
