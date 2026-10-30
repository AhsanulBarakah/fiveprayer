import apiFetch from '@wordpress/api-fetch';
import React from 'react';
import { useTimeTableMonth } from '../state/storeTimeTable';
import { useLocationStore } from '../state/storeLocation';
import { toast } from 'sonner';
import { UseEndPoints } from './api/endpoints';

export const useGetTimeTableYear = () => {

	const {updateTimeTableFullYear} = useTimeTableMonth(
		( state ) => state
	);

	const reFreshTimeTableYear = () => {
		  const endpoint = UseEndPoints();
		
			apiFetch( {
				path: `${endpoint}/fp_prayertimetableyear`,
        })
				.then( ( posts ) => {
					updateTimeTableFullYear( posts as string[] );
					

				} )
				.catch( ( error ) => {
					updateTimeTableFullYear( [] as string[] );
					// GenerateClick( 'no datas' );
					toast.error(
						` it's ${ error.code } you dont have any data please generate new data  `
					);
				} );
		
		
	};


	return { reFreshTimeTableYear };
};
