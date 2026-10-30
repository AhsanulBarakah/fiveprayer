/**
 * Post Tune Prayer Hook
 *
 * Handles saving individual tune prayer offset values (Fajr, Dhuhr, etc.)
 * when the Generate Calendar button is clicked. Uses conditional flags
 * to trigger saves only when the generator is ready.
 *
 * @module usePostTune
 */
import React from 'react';
import { useTuneStore } from '../state/storeTunePrayer';
import { usePostMeta } from './usePostMeta';
import type { InputSchemaValid } from '../validations/locationIsValid';
import { useConditional } from '../state/storeConditional';

type TuneField = 'Imsak' | 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Sunset' | 'Maghrib' | 'Isha' | 'Midnight';

const TUNE_FIELDS: TuneField[] = ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha', 'Midnight'];

export const usePostTune = () => {
	const [pending, setPending] = React.useState<Record<TuneField, InputSchemaValid | undefined>>({
		Imsak: undefined, Fajr: undefined, Sunrise: undefined, Dhuhr: undefined,
		Asr: undefined, Sunset: undefined, Maghrib: undefined, Isha: undefined, Midnight: undefined,
	});

	const storeUpdaters: Record<TuneField, (v: string) => void> = {
		Imsak: useTuneStore((s) => s.updateImsak),
		Fajr: useTuneStore((s) => s.updateFajr),
		Sunrise: useTuneStore((s) => s.updateSunrise),
		Dhuhr: useTuneStore((s) => s.updateDhuhr),
		Asr: useTuneStore((s) => s.updateAsr),
		Sunset: useTuneStore((s) => s.updateSunset),
		Maghrib: useTuneStore((s) => s.updateMaghrib),
		Isha: useTuneStore((s) => s.updateIsha),
		Midnight: useTuneStore((s) => s.updateMidnight),
	};

	const { isReadyGenerator, isReadyToPost } = useConditional();
	const { appendDataPost } = usePostMeta();

	React.useEffect(() => {
		if (!isReadyGenerator || !isReadyToPost) return;
		for (const field of TUNE_FIELDS) {
			const data = pending[field];
			if (data?.value) {
				appendDataPost(data);
				setPending((prev) => ({ ...prev, [field]: undefined }));
			}
		}
	}, [isReadyGenerator, isReadyToPost]);

	/**
	 * Handle a tune prayer input change from the UI.
	 * @param data - The meta item with meta-key (e.g., 'Fajr') and value
	 */
	const getInputTune = (data: InputSchemaValid) => {
		const field = data.meta as TuneField;
		if (TUNE_FIELDS.includes(field)) {
			setPending((prev) => ({ ...prev, [field]: data }));
			storeUpdaters[field](data.value as string);
		}
	};

	return { getInputTune };
};
