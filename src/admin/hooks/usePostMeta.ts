/**
 * Post Meta API Hook
 *
 * Provides methods to save settings to the FivePrayer REST API.
 * - `saveBatch`: Saves all settings in one request (used by Generate Calendar)
 * - `saveOnly`: Saves a single meta key-value pair
 * - `appendDataPost`: Saves a single meta item and triggers a full data refresh
 *
 * @module usePostMeta
 */
import apiFetch from '@wordpress/api-fetch';
import { useLocationStore } from '../state/storeLocation';
import type { InputAndSelectSchemaValid } from '../validations/locationIsValid';
import { toast } from 'sonner';
import { useRefreshMetaData } from './useRefreshMetaData';
import { useConditional } from '../state/storeConditional';
import { useTranslationStore } from '../state/useTranslationStore';
import { UseEndPoints } from './api/endpoints';
import { __ } from '@wordpress/i18n';

export const usePostMeta = () => {
	const { updateIsReadyGenerator, updateIsReadyToPost } = useConditional();
	const { getPrayerSettingMeta } = useRefreshMetaData();
	const { fetchTranslations } = useTranslationStore();
	const updateOnSelected = useLocationStore((state) => state.updateOnSelected);
	const endpoint = UseEndPoints();

	/**
	 * Save a single meta key-value pair without triggering a refresh.
	 * @param meta - The meta item to save
	 */
	const saveOnly = (meta: InputAndSelectSchemaValid): Promise<void> => {
		return apiFetch({
			path: `${endpoint}/fp_prayersettings_meta`,
			method: 'POST',
			data: { meta: meta.meta, value: meta.value },
		})
			.then(() => undefined)
			.catch((err) => {
				console.error('Save error:', err);
			});
	};

	/**
	 * Save multiple settings in a single batch request.
	 * Shows a success toast on completion. Does NOT re-fetch from DB.
	 * @param settings - Object keyed by meta-key with values to save
	 * @returns The API response
	 */
	const saveBatch = (settings: Record<string, any>): Promise<any> => {
		return apiFetch({
			path: `${endpoint}/fp_prayersettings_meta/batch`,
			method: 'POST',
			data: { settings },
		})
			.then((result) => {
				toast.success(__('Settings saved', 'fiveprayer'));
				return result;
			})
			.catch((err) => {
				console.error('Batch save error:', err);
				throw err;
			});
	};

	/**
	 * Save a single meta item and trigger a full data refresh.
	 * Used by individual setting controls (iqamah, tune, etc.).
	 * @param meta - The meta item to save
	 */
	const appendDataPost = (meta: InputAndSelectSchemaValid) => {
		apiFetch({
			path: `${endpoint}/fp_prayersettings_meta`,
			method: 'POST',
			data: { meta: meta.meta, value: meta.value },
		})
			.then(() => {
				toast.success(`Settings saved: ${meta.meta}`);
				updateOnSelected({ name: meta.meta });
				getPrayerSettingMeta();
				updateIsReadyGenerator(false);
				updateIsReadyToPost(false);
				fetchTranslations();
			})
			.catch((err) => console.error('Save error:', err));
	};

	return { appendDataPost, saveOnly, saveBatch };
};
