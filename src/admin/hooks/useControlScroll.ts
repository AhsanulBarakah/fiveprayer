import { useEffect, useRef } from 'react';
import { useTimeTableColor } from '../state/storeTimeTableColor';

export const useControlScroll = () => {
	const scrollCustom = useTimeTableColor( ( state ) => state.scroll );
	const updateScroll = useTimeTableColor( ( state ) => state.updateScroll );
	const refScroll = useRef< HTMLDivElement >( null );

	useEffect( () => {
		refScroll?.current?.scrollTo( {
			top: scrollCustom,
			behavior: 'instant',
		} );
	}, [ refScroll.current?.scrollTop ] );

	const controlCustomScroll = () => {
		setTimeout( () => {
			updateScroll( Number( refScroll.current?.scrollTop ) );
		}, 500 );
	};

	return { controlCustomScroll, refScroll };
};
