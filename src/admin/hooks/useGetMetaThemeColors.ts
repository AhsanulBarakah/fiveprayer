/**
 * Theme Colors Meta Loader
 *
 * Maps API meta responses (firstbg, oddclr, highlightbg, etc.) to the Zustand
 * color store. Handles 12 color settings for the timetable table styling.
 *
 * @module useGetMetaThemeColors
 */
import { useTimeTableColor } from '../state/storeTimeTableColor';
import type { RGBAColor } from '../state/storeTimeTableColor';

export const useGetMetaThemeColors = () => {
	const updateFirstBG = useTimeTableColor((state) => state.updateFirstBG);
	const updateFirstText = useTimeTableColor((state) => state.updateFirstText);
	const updateSecondBG = useTimeTableColor((state) => state.updateSecondBG);
	const updateSecondText = useTimeTableColor((state) => state.updateSecondText);
	const updateEvenBG = useTimeTableColor((state) => state.updateEvenBG);
	const updateEvenText = useTimeTableColor((state) => state.updateEvenText);
	const updateOddBG = useTimeTableColor((state) => state.updateOddBG);
	const updateOddText = useTimeTableColor((state) => state.updateOddText);
	const updateLightBG = useTimeTableColor((state) => state.updateLightBG);
	const updateLightText = useTimeTableColor((state) => state.updateLightText);
	const updateBorderClr = useTimeTableColor((state) => state.updateBorderClr);
	const updateHoverBG = useTimeTableColor((state) => state.updateHoverBG);
	const updateHoverText = useTimeTableColor((state) => state.updateHoverText);
	const updateHoverMode = useTimeTableColor((state) => state.updateHoverMode);
	const updateHoverEnabled = useTimeTableColor((state) => state.updateHoverEnabled);
	const updateBorderSize = useTimeTableColor((state) => state.updateBorderSize);
	const updateBorderStyle = useTimeTableColor((state) => state.updateBorderStyle);
	const updateBorderRadius = useTimeTableColor((state) => state.updateBorderRadius);


	const keyMap: Record<string, (v: any) => void> = {
		'firstbg': updateFirstBG,
		'firstclr': updateFirstText,
		'secondbg': updateSecondBG,
		'secondclr': updateSecondText,
		'evenbg': updateEvenBG,
		'evenclr': updateEvenText,
		'oddbg': updateOddBG,
		'oddclr': updateOddText,
		'highlightbg': updateLightBG,
		'highlightclr': updateLightText,
		'borderclr': updateBorderClr,
		'hoverbg': updateHoverBG,
		'hoverclr': updateHoverText,
		'hover_mode': updateHoverMode,
		'hover_enabled': updateHoverEnabled,
		'bordersize': updateBorderSize,
		'borderstyle': updateBorderStyle,
		// Stored as a numeric string ('0'…'80'); the setter clamps and rounds it,
		// so the preview mirrors exactly what the front end will render.
		'borderradius': updateBorderRadius,
	};

	/**
	 * Map a single API meta item to the corresponding color store setter.
	 * @param meta - The meta item from the API response with `meta-key` and `value`
	 */
	const GetMetaThemeColors = (meta: { 'meta-key': string; value?: unknown }) => {
		const updater = keyMap[meta['meta-key']];
		if (updater) {
			try {
				const parsed = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
				updater(parsed);
			} catch {
				// borderstyle / hover_mode are plain strings, not JSON
				if (meta['meta-key'] === 'borderstyle' || meta['meta-key'] === 'hover_mode') {
					updater(String(meta.value));
				}
			}
		}
	};

	return { GetMetaThemeColors };
};
