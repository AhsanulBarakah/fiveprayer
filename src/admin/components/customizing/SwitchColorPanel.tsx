/**
 * SwitchColorPanel
 *
 * Toggle button to switch between background and text color panels.
 *
 * @module customizing/SwitchColorPanel
 */
import * as React from "react"
import { useTimeTableColor } from '../../state/storeTimeTableColor';
import { __ } from '@wordpress/i18n';

const SwitchColorPanel = () => {
	const updateShowTextColor = useTimeTableColor(
		( state ) => state.updateShowTextColor
	);
	const ShowTextColor = useTimeTableColor( ( state ) => state.ShowTextColor );

	return (
		<>
			{ ! ShowTextColor ? (
				<button
					className="bg-green-600 px-2 py-2 rounded-md text-white m-2"
					onClick={ () => {
						updateShowTextColor( true );
					} }
				>{__('Click To Switch: Now is BackGround', 'fiveprayer')}</button>
			) : (
				<button
					className="bg-blue-600 px-2 py-2 rounded-md text-white m-2"
					onClick={ () => {
						updateShowTextColor( false );
					} }
				>{__('Click To Switch: Now is Text', 'fiveprayer')}</button>
			) }
		</>
	);
};

export default SwitchColorPanel;
