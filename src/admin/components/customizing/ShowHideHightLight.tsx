/**
 * ShowHideHightLight
 *
 * Toggle button to show/hide the highlight overlay on the timetable.
 *
 * @module customizing/ShowHideHightLight
 */
import * as React from "react"
import { useTimeTableColor } from '../../state/storeTimeTableColor';

function ShowHideHightLight() {
	const updateShowHightLight = useTimeTableColor((state) => state.updateShowHightLight);
	const ShowHightLight = useTimeTableColor((state) => state.ShowHightLight);

	return (
		<button
			onClick={() => updateShowHightLight(!ShowHightLight)}
			className={`w-full text-sm font-medium px-3 py-2 rounded-lg transition-colors focus:outline-hidden ${
				ShowHightLight
					? 'bg-green-50 text-green-700 hover:bg-green-100'
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
			}`}
		>
			{ShowHightLight ? 'Hide Highlight' : 'Show Highlight'}
		</button>
	);
}

export default ShowHideHightLight;
