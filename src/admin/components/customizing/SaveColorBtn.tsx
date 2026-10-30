/**
 * SaveColorBtn
 *
 * Button that saves all timetable color settings in a single batch request
 * to post meta (instead of many individual POSTs).
 *
 * @module customizing/SaveColorBtn
 */
import * as React from "react"
import { useTimeTableColor } from '../../state/storeTimeTableColor';
import { usePostMeta } from '../../hooks/usePostMeta';

const SaveColorBtn = () => {
	const { saveBatch } = usePostMeta();
	const rgba_first_bg = useTimeTableColor((state) => state.rgba_first_bg);
	const rgba_second_bg = useTimeTableColor((state) => state.rgba_second_bg);
	const rgba_even_bg = useTimeTableColor((state) => state.rgba_even_bg);
	const rgba_odd_bg = useTimeTableColor((state) => state.rgba_odd_bg);
	const rgba_border_clr = useTimeTableColor((state) => state.rgba_border_clr);
	const rgba_hover_bg = useTimeTableColor((state) => state.rgba_hover_bg);
	const rgba_hover_text = useTimeTableColor((state) => state.rgba_hover_text);
	const hoverMode = useTimeTableColor((state) => state.hoverMode);
	const hoverEnabled = useTimeTableColor((state) => state.hoverEnabled);
	const rgba_light_bg = useTimeTableColor((state) => state.rgba_light_bg);
	const rgba_border_size = useTimeTableColor((state) => state.rgba_border_size);
	const rgba_border_style = useTimeTableColor((state) => state.rgba_border_style);
	const rgba_border_radius = useTimeTableColor((state) => state.rgba_border_radius);
	const rgba_first_text = useTimeTableColor((state) => state.rgba_first_text);
	const rgba_second_text = useTimeTableColor((state) => state.rgba_second_text);
	const rgba_light_text = useTimeTableColor((state) => state.rgba_light_text);
	const rgba_even_text = useTimeTableColor((state) => state.rgba_even_text);
	const rgba_odd_text = useTimeTableColor((state) => state.rgba_odd_text);

	const [isSaving, setIsSaving] = React.useState(false);
	const [showSaved, setShowSaved] = React.useState(false);

	/** Check if an RGBA value has any non-zero channel */
	const hasColor = (value: any) =>
		value && (value.r > 0 || value.g > 0 || value.b > 0 || value.a > 0);

	const clickHandle = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const settings: Record<string, any> = {};

		// Color pairs (RGBA objects)
		const colorPairs: Record<string, any> = {
			'firstbg': rgba_first_bg, 'firstclr': rgba_first_text,
			'secondbg': rgba_second_bg, 'secondclr': rgba_second_text,
			'evenbg': rgba_even_bg, 'evenclr': rgba_even_text,
			'oddbg': rgba_odd_bg, 'oddclr': rgba_odd_text,
			'highlightbg': rgba_light_bg, 'highlightclr': rgba_light_text,
			'borderclr': rgba_border_clr, 'hoverbg': rgba_hover_bg, 'hoverclr': rgba_hover_text,
		};

		for (const [meta, value] of Object.entries(colorPairs)) {
			if (hasColor(value)) {
				settings[meta] = value;
			}
		}

		if (rgba_border_style) settings['borderstyle'] = rgba_border_style;
		// Persist the border size even when it is 0 — 0 means "no border", and the
		// old truthiness check dropped it, so picking 0 never reached the database
		// and the previously saved width came straight back.
		if (typeof rgba_border_size === 'number' && Number.isFinite(rgba_border_size)) {
			settings['bordersize'] = rgba_border_size;
		}
		// Persist the border radius even when it is 0 — 0 means "square corners"
		// and must reach the database, or picking it back would not stick.
		if (typeof rgba_border_radius === 'number' && Number.isFinite(rgba_border_radius)) {
			settings['borderradius'] = rgba_border_radius;
		}
		// Always persist the hover mode/state so switching back to the default is saved too.
		settings['hover_mode'] = hoverMode;
		settings['hover_enabled'] = hoverEnabled;

		try {
			await saveBatch(settings);
			setShowSaved(true);
			setTimeout(() => setShowSaved(false), 2000);
		} catch (err) {
			console.error('Color batch save error:', err);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<button
			onClick={clickHandle}
			disabled={isSaving}
			className={`w-full text-sm font-medium px-3 py-2 rounded-lg transition-colors focus:outline-hidden ${
				showSaved
					? 'bg-green-100 text-green-800'
					: isSaving
					? 'bg-gray-100 text-gray-400 cursor-not-allowed'
					: 'bg-green-700 text-white hover:bg-green-800'
			}`}
		>
			{isSaving ? 'Saving...' : showSaved ? 'Saved!' : 'Save Colors'}
		</button>
	);
};

export default SaveColorBtn;
