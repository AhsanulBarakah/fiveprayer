/**
 * Post Iqamah Delay Hook
 *
 * Handles saving individual iqamah delay values (IQFajr, IQDhuhr, etc.)
 * when the Generate Calendar button is clicked. Uses conditional flags
 * to trigger saves only when the generator is ready.
 *
 * @module usePostIqama
 */
import React from 'react';
import { useIqamaStore } from '../state/storeIqamaDelay';
import { usePostMeta } from './usePostMeta';
import type { InputSchemaValid } from '../validations/locationIsValid';
import { useConditional } from '../state/storeConditional';

type IqamahField = 'IQFajr' | 'IQDhuhr' | 'IQAsr' | 'IQMaghrib' | 'IQIsha';

const IQAMAH_FIELDS: IqamahField[] = ['IQFajr', 'IQDhuhr', 'IQAsr', 'IQMaghrib', 'IQIsha'];

export const usePostIqama = () => {
	const [pending, setPending] = React.useState<Record<IqamahField, InputSchemaValid | undefined>>({
		IQFajr: undefined, IQDhuhr: undefined, IQAsr: undefined, IQMaghrib: undefined, IQIsha: undefined,
	});

	const storeUpdaters: Record<IqamahField, (v: string) => void> = {
		IQFajr: useIqamaStore((s) => s.updateIQFajr),
		IQDhuhr: useIqamaStore((s) => s.updateIQDhuhr),
		IQAsr: useIqamaStore((s) => s.updateIQAsr),
		IQMaghrib: useIqamaStore((s) => s.updateIQMaghrib),
		IQIsha: useIqamaStore((s) => s.updateIQIsha),
	};

	const { isReadyGenerator, isReadyToPost } = useConditional();
	const { appendDataPost } = usePostMeta();

	React.useEffect(() => {
		if (!isReadyGenerator || !isReadyToPost) return;
		for (const field of IQAMAH_FIELDS) {
			const data = pending[field];
			if (data?.value) {
				appendDataPost(data);
				setPending((prev) => ({ ...prev, [field]: undefined }));
			}
		}
	}, [isReadyGenerator, isReadyToPost]);

	/**
	 * Handle an iqamah input change from the UI.
	 * @param data - The meta item with meta-key (e.g., 'IQFajr') and value
	 */
	const getInputIqama = (data: InputSchemaValid) => {
		const field = data.meta as IqamahField;
		if (IQAMAH_FIELDS.includes(field)) {
			setPending((prev) => ({ ...prev, [field]: data }));
			storeUpdaters[field](data.value as string);
		}
	};

	return { getInputIqama };
};
