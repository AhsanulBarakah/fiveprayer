import React from 'react';
import { useGenerateCalender } from '../../hooks/useGenerateCalender';
import { useConditional } from '../../state/storeConditional';
import ColumnLayoutCalendar from '../customizing/ColumnLayoutCalendar';

type Props = {
	show?: boolean;
};

const PrayerCalendar = ( props: Props ) => {
	const { GenerateCalender } = useGenerateCalender();
	// generateRequestId is bumped by the "Generate Calendar" button each time
	// the user clicks it. Generation is decoupled from the
	// isReadyGenerator/isReadyToPost flags because usePostTune/usePostIqama
	// reset those flags mid-flight — previously the first click could only
	// save settings and never generate (the calendar effect missed its window).
	const generateRequestId = useConditional( ( state ) => state.generateRequestId );
	const clearGenerateRequest = useConditional( ( state ) => state.clearGenerateRequest );

	React.useEffect( () => {
		if ( generateRequestId === 0 ) return;

		// Consume the request immediately so re-mounting this component
		// (navigating away and back to the page) does NOT re-trigger a
		// calendar generation. Only a fresh click bumps the id again.
		clearGenerateRequest();

		GenerateCalender().catch( ( error ) => {
			console.error( 'Calendar generation failed:', error );
		} );
	}, [ generateRequestId, clearGenerateRequest ] );

	return (
		<ColumnLayoutCalendar />
	);
};

export default PrayerCalendar;
