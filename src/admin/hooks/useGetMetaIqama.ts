/**
 * Iqamah Delay Meta Loader
 *
 * Maps API meta responses (IQFajr, IQDhuhr, etc.) to the Zustand iqamah delay store.
 * Called by `useRefreshMetaData` during the initial data load cycle.
 *
 * @module useGetMetaIqama
 */
import { useIqamaStore } from '../state/storeIqamaDelay';

/** Map of API meta-key names to store update functions */
const IQAMAH_KEY_MAP: Record<string, (value: any) => void> = {};

export const useGetMetaIqama = () => {
	const updateIQFajr = useIqamaStore( ( state ) => state.updateIQFajr );
	const updateIQDhuhr = useIqamaStore( ( state ) => state.updateIQDhuhr );
	const updateIQAsr = useIqamaStore( ( state ) => state.updateIQAsr );
	const updateIQMaghrib = useIqamaStore( ( state ) => state.updateIQMaghrib );
	const updateIQIsha = useIqamaStore( ( state ) => state.updateIQIsha );

	/**
	 * Map a single API meta item to the corresponding iqamah store setter.
	 * @param meta - The meta item from the API response with `meta-key` and `value`
	 */
	const iqamaMetaUpdate = ( meta: { 'meta-key': string; value?: unknown } ) => {
		const keyMap: Record<string, (v: any) => void> = {
			'IQFajr': updateIQFajr,
			'IQDhuhr': updateIQDhuhr,
			'IQAsr': updateIQAsr,
			'IQMaghrib': updateIQMaghrib,
			'IQIsha': updateIQIsha,
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

	return { iqamaMetaUpdate };
};
