/**
 * Post Timetable Hook
 *
 * Handles saving generated timetable data to the API.
 * Called by `useClickGenerate` after calendar generation completes.
 *
 * @module usePostTimeTable
 */
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { useConditional } from '../state/storeConditional';
import { useLocationStore } from '../state/storeLocation';
import { useGetTimeTableYear } from './useGetTimeTableYear';
import { UseEndPoints } from './api/endpoints';
import { __ } from '@wordpress/i18n';

export const usePostTimeTable = () => {
	const { updateIsReadyGenerator, updateIsReadyToPost } = useConditional();
	const { reFreshTimeTableYear } = useGetTimeTableYear();

	/**
	 * POST the generated timetable data to the API and refresh the store.
	 * @param timetable - Array of daily prayer time objects
	 */
	const appendDataPost = (timetable: object[]) => {
		const endpoint = UseEndPoints();

		apiFetch({
			path: `${endpoint}/fp_prayertimetable`,
			method: 'POST',
			data: timetable,
		})
			.then(() => {
				// Show the actual generated span + day count so the selected
				// calendar type is visible (Gregorian = Jan 1 → Apr 1 next year;
				// Hijri = the current Hijri year's Gregorian span, e.g.
				// 16 Jun 2026 → 2 Sep 2027). Same dates have identical prayer
				// times in both types — the difference is WHICH days exist.
				const dates = (timetable as any[])
					.map((row: any) => String(row?.date || ''))
					.filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
					.sort();
				const days = dates.length;
				const calendarLabel =
					useLocationStore.getState().calendar_type === 'hijri'
						? 'Lunar Hijri (Islamic) year'
						: useLocationStore.getState().calendar_type === 'persian'
							? 'Solar Hijri (Persian) year'
							: 'Gregorian year';
				toast.success(
					`Calendar generated: ${days} days (${dates[0]} → ${dates[dates.length - 1]}) · ${calendarLabel}`
				);
				reFreshTimeTableYear();
				updateIsReadyGenerator(false);
				updateIsReadyToPost(false);
			})
			.catch((err) => {
				console.error('Timetable save error:', err);
				toast.error(__('Failed to save timetable data', 'fiveprayer'));
			});
	};

	return { appendDataPost };
};
