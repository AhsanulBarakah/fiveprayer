/**
 * Printer Meta Loader
 *
 * Maps API meta responses for printer settings to the Zustand printer store.
 * Handles 7 left text lines, 7 right text lines, logo, and enable/disable toggle.
 * Also provides live-update for real-time UI feedback.
 *
 * @module useGetMetaPrinter
 */
import { usePrinterExtraStore } from '../state/storePrinterExtra';
import { useShallow } from 'zustand/react/shallow';

export const useGetMetaPrinter = () => {
	const updaters = usePrinterExtraStore(
		useShallow((state) => ({
			left1: state.updateprinter_left1,
			left2: state.updateprinter_left2,
			left3: state.updateprinter_left3,
			left4: state.updateprinter_left4,
			left5: state.updateprinter_left5,
			left6: state.updateprinter_left6,
			left7: state.updateprinter_left7,
			right1: state.updateprinter_right1,
			right2: state.updateprinter_right2,
			right3: state.updateprinter_right3,
			right4: state.updateprinter_right4,
			right5: state.updateprinter_right5,
			right6: state.updateprinter_right6,
			right7: state.updateprinter_right7,
			boolean: state.updateprinter_boolean,
			logo: state.updateprinter_logo,
		}))
	);

	/**
	 * Load printer settings from an API meta item.
	 * @param meta - The meta item with key 'printer' and a JSON value containing all printer fields
	 */
	const metaPrinter = (meta: { 'meta-key': string; value?: unknown }) => {
		if (meta['meta-key'] !== 'printer') return;

		try {
			const data = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
			if (!data || typeof data !== 'object') return;

			updaters.left1(data.printer_left1 ?? '');
			updaters.left2(data.printer_left2 ?? '');
			updaters.left3(data.printer_left3 ?? '');
			updaters.left4(data.printer_left4 ?? '');
			updaters.left5(data.printer_left5 ?? '');
			updaters.left6(data.printer_left6 ?? '');
			updaters.left7(data.printer_left7 ?? '');
			updaters.right1(data.printer_right1 ?? '');
			updaters.right2(data.printer_right2 ?? '');
			updaters.right3(data.printer_right3 ?? '');
			updaters.right4(data.printer_right4 ?? '');
			updaters.right5(data.printer_right5 ?? '');
			updaters.right6(data.printer_right6 ?? '');
			updaters.right7(data.printer_right7 ?? '');
			updaters.boolean(data.printer_boolean ?? false);
			updaters.logo(data.printer_logo ?? '');
		} catch (e) {
			console.error('Failed to parse printer meta:', e);
		}
	};

	/** Map of field names to updater functions for live updates */
	const fieldUpdaters: Record<string, (v: any) => void> = {
		'printer_left1': updaters.left1,
		'printer_left2': updaters.left2,
		'printer_left3': updaters.left3,
		'printer_left4': updaters.left4,
		'printer_left5': updaters.left5,
		'printer_left6': updaters.left6,
		'printer_left7': updaters.left7,
		'printer_right1': updaters.right1,
		'printer_right2': updaters.right2,
		'printer_right3': updaters.right3,
		'printer_right4': updaters.right4,
		'printer_right5': updaters.right5,
		'printer_right6': updaters.right6,
		'printer_right7': updaters.right7,
		'printer_boolean': updaters.boolean,
		'printer_logo': updaters.logo,
	};

	/**
	 * Live-update a single printer field from the UI.
	 * @param newData - Object with `meta` (field name) and `value`
	 */
	const liveUpdateMetaPrinter = (newData: { meta: string; value: any }) => {
		const updater = fieldUpdaters[newData.meta];
		if (updater) updater(newData.value);
	};

	return { metaPrinter, liveUpdateMetaPrinter };
};
