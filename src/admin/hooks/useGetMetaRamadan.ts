/**
 * Ramadan Meta Loader
 *
 * Maps API meta responses for Ramadan settings to the Zustand conditional store.
 * Handles Ramadan status, suhoor/iftar labels, and custom Ramadan day config.
 *
 * @module useGetMetaRamadan
 */
import { useConditional } from '../state/storeConditional';

const useGetMetaRamadan = () => {
	const { updateIsRamadan } = useConditional();

	/**
	 * Load Ramadan settings from an API meta item.
	 * @param meta - The meta item with key 'ramadan' and a JSON value
	 */
	const getMetaRamadan = (meta: { 'meta-key': string; value?: unknown }) => {
		if (meta['meta-key'] === 'ramadan' && meta.value && typeof meta.value === 'string') {
			try {
				const converter = JSON.parse(meta.value);
				updateIsRamadan(converter);
			} catch (e) {
				console.error('Failed to parse ramadan meta:', e);
			}
		}
	};

	return { getMetaRamadan };
};

export default useGetMetaRamadan;
