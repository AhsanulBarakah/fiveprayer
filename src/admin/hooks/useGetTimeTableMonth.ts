import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useLocationStore } from '../state/storeLocation';
import { toast } from 'sonner';
import { useTuneStore } from '../state/storeTunePrayer';
import { UseEndPoints } from './api/endpoints';

export const useGetTimeTableMonth = () => {
	const GenerateClick = useTuneStore( ( state ) => state.GenerateClick );
	const month = useLocationStore( ( state ) => state.month );
	  const endpoint = UseEndPoints();
	

	const reFreshTimeTableMonth = () => {
		// In Hijri Calendar Type mode the month key is `hijri-<year>-<month>`
		// (not a plain 1-12 number), and this endpoint only understands numeric
		// months of the current Gregorian year — skip the dead fetch instead of
		// sending `newMonth=NaN` and showing a misleading error toast.
		if( !month?.method || !/^\d+$/.test( String( month.method ) ) ) return;
			apiFetch( {
				path: addQueryArgs( `${endpoint}/fp_prayertimetable`, {
					newMonth: Number( month?.method ),
				} ),
			} )
				.then( ( posts ) => {
					// updateTimeTable( posts as string[] );

				} )
				.catch( ( error ) => {
					// updateTimeTable( [] as string[] );
					GenerateClick( 'no datas' );
					toast.error(
						` it's ${ error.code } you dont have any data please generate new data  `
					);
				} );
		
		
		
	};


	return { reFreshTimeTableMonth };
};
