/**
 * Tune Prayer Meta Loader
 *
 * Maps API meta responses (Fajr, Dhuhr, Asr, etc.) to the Zustand tune prayer store.
 * These are minute offsets applied to each prayer time for fine-tuning.
 * Called by `useRefreshMetaData` during the initial data load cycle.
 *
 * @module useGetMetaTune
 */
import { useTuneStore } from '../state/storeTunePrayer';

export const useGetMetaTune = () => {
	const updateImsak = useTuneStore( ( state ) => state.updateImsak );
	const updateFajr = useTuneStore( ( state ) => state.updateFajr );
	const updateSunrise = useTuneStore( ( state ) => state.updateSunrise );
	const updateDhuhr = useTuneStore( ( state ) => state.updateDhuhr );
	const updateAsr = useTuneStore( ( state ) => state.updateAsr );
	const updateMaghrib = useTuneStore( ( state ) => state.updateMaghrib );
	const updateSunset = useTuneStore( ( state ) => state.updateSunset );
	const updateIsha = useTuneStore( ( state ) => state.updateIsha );
	const updateMidnight = useTuneStore( ( state ) => state.updateMidnight );

	/**
	 * Map a single API meta item to the corresponding tune store setter.
	 * @param meta - The meta item from the API response with `meta-key` and `value`
	 */
	const tuneMetaUpdate = ( meta: { 'meta-key': string; value?: unknown } ) => {
		const keyMap: Record<string, (v: any) => void> = {
			'Imsak': updateImsak,
			'Fajr': updateFajr,
			'Sunrise': updateSunrise,
			'Dhuhr': updateDhuhr,
			'Asr': updateAsr,
			'Sunset': updateSunset,
			'Maghrib': updateMaghrib,
			'Isha': updateIsha,
			'Midnight': updateMidnight,
		};

		const updater = keyMap[meta['meta-key']];
		if (updater) {
			try {
				updater(typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value);
			} catch {
				updater(meta.value);
			}
		}
	};

	return { tuneMetaUpdate };
};
