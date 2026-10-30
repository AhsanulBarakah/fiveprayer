/**
 * UI Control Post Hook
 *
 * Handles saving dropdown selections and toggle settings from the Prayer Settings UI.
 * Uses optimistic updates — the store is updated immediately, then the API call is made.
 * Reverts on error.
 *
 * @module usePostControlFromUI
 */
import React from 'react';
import { usePostMeta } from './usePostMeta';
import { useLocationStore } from '../state/storeLocation';
import { useConditional } from '../state/storeConditional';
import type { SelectIsValid } from '../validations/locationIsValid';

/** Create an optimistic update handler with automatic rollback on error */
function createOptimisticHandler<T>(
	setStateFn: (v: T) => void,
	revertFn: () => void,
	buildMeta: (v: T) => { meta: string; value: T },
	appendDataPost: (meta: any) => void
) {
	return (value: T): Promise<void> => {
		return new Promise((resolve, reject) => {
			setStateFn(value);
			try {
				appendDataPost(buildMeta(value));
				resolve();
			} catch (error) {
				console.error('Optimistic update error:', error);
				revertFn();
				reject(error);
			}
		});
	};
}

export const usePostControlFromUI = () => {
	const [mncm_selected, Setmncm_selected] = React.useState<SelectIsValid>();
	const [oaac_selected, Setoaac_selected] = React.useState<SelectIsValid>();
	const [hlm_selected, Sethlm_selected] = React.useState<SelectIsValid>();
	const [mfc_selected, Setmfc_selected] = React.useState<SelectIsValid>();
	const [LocationSelected, SetLocationSelected] = React.useState<SelectIsValid>();
	const [month_selected, SetMonth_selected] = React.useState<SelectIsValid>();

	const mncm_update = useLocationStore((state) => state.mncm_selected);
	const oaac_update = useLocationStore((state) => state.oaac_selected);
	const hlm_update = useLocationStore((state) => state.hlm_selected);
	const mfc_update = useLocationStore((state) => state.mfc_selected);
	const rounding_update = useLocationStore((state) => state.rounding_selected_select);
	const updateMonth = useLocationStore((state) => state.updateMonth);

	const { appendDataPost } = usePostMeta();

	/**
	 * Map a UI dropdown selection to the corresponding store updater.
	 * @param data - The select item with meta-key and value
	 */
	const getSelectedFromUI = (data: SelectIsValid) => {
		const keyMap: Record<string, (v: any) => void> = {
			'mncm_selected': mncm_update,
			'oaac_selected': oaac_update,
			'hlm_selected': hlm_update,
			'mfc_selected': mfc_update,
			'rounding_selected': rounding_update,
			'month': updateMonth,
		};

		const updater = data.meta ? keyMap[data.meta] : undefined;
		if (updater) updater(data.value);
	};

	const updateTheSkipIqamahMidnight = createOptimisticHandler<boolean>(
		(v) => useLocationStore.getState().updateSetSkipIqamahMidnight(v),
		() => useLocationStore.getState().updateSetSkipIqamahMidnight(false),
		(v) => ({ meta: 'skip_iqamah_midnight', value: v }),
		appendDataPost
	);

	const updateHidePrinterButton = createOptimisticHandler<boolean>(
		(v) => useLocationStore.getState().updateHidePrinterButton(v),
		() => useLocationStore.getState().updateHidePrinterButton(false),
		(v) => ({ meta: 'hide_printer_button', value: v }),
		appendDataPost
	);

	const updateHideMonthSelection = createOptimisticHandler<boolean>(
		(v) => useLocationStore.getState().updateHideMonthSelection(v),
		() => useLocationStore.getState().updateHideMonthSelection(false),
		(v) => ({ meta: 'hide_month_selection', value: v }),
		appendDataPost
	);

	const updatePrinterButtonUrl = createOptimisticHandler<string>(
		(v) => useLocationStore.getState().updatePrinterButtonUrl(v),
		() => useLocationStore.getState().updatePrinterButtonUrl(''),
		(v) => ({ meta: 'printer_button_url', value: v }),
		appendDataPost
	);

	const updateHideCustomUrlButton = createOptimisticHandler<boolean>(
		(v) => useLocationStore.getState().updateHideCustomUrlButton(v),
		() => useLocationStore.getState().updateHideCustomUrlButton(false),
		(v) => ({ meta: 'hide_custom_url_button', value: v }),
		appendDataPost
	);

	const updateAutoPrintPageUrl = createOptimisticHandler<string>(
		(v) => useLocationStore.getState().updateAutoPrintPageUrl(v),
		() => useLocationStore.getState().updateAutoPrintPageUrl(''),
		(v) => ({ meta: 'auto_print_page_url', value: v }),
		appendDataPost
	);

	return {
		getSelectedFromUI,
		updateTheSkipIqamahMidnight,
		updateHidePrinterButton,
		updateHideMonthSelection,
		updatePrinterButtonUrl,
		updateHideCustomUrlButton,
		updateAutoPrintPageUrl,
	};
};
