/**
 * Hijra Locale Meta Loader
 *
 * Maps API meta responses for hijra calendar settings to the Zustand store.
 * Handles locale activation, language, calendar type, and live updates.
 *
 * @module useGetMetaHijraLocale
 */
import { useTimeTableMonth } from '../state/storeTimeTable';

export const useGetMetaHijraLocale = () => {
	const { updateHijraLocale, updateISActive, updateHijraLan, updateHijraCalenderType } = useTimeTableMonth();

	/**
	 * Load hijra locale settings from an API meta item.
	 * @param meta - The meta item with key 'hijralocale' and a JSON value
	 */
	const getMetaHijraLocale = (meta: { 'meta-key': string; value?: unknown }) => {
		if (meta['meta-key'] === 'hijralocale' && meta.value && typeof meta.value === 'string') {
			try {
				const converter = JSON.parse(meta.value);
				updateISActive(converter.isActive);
				updateHijraLan(converter.lan);
				updateHijraCalenderType(converter.calenderType);
				updateHijraLocale(converter);
			} catch (e) {
				console.error('Failed to parse hijra locale:', e);
			}
		}
	};

	/**
	 * Live-update the hijra locale when the user changes settings in the UI.
	 * @param data - The updated hijra locale object
	 */
	const liveUpdateHijraLocale = (data: any) => {
		updateHijraLocale(data);
	};

	return { getMetaHijraLocale, liveUpdateHijraLocale };
};
