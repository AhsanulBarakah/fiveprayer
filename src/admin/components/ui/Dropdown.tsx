/**
 * Dropdown Select Component
 *
 * Custom dropdown with search-like display. Shows selected value or placeholder.
 * Supports optional "Add Custom Location" link at the bottom.
 * Calls `getSelectedFromUI` on selection to update both local and store state.
 *
 * @module ui/Dropdown
 */
import React from 'react';
import { usePostControlFromUI } from '../../hooks/usePostControlFromUI';
import { useNavigate } from 'react-router';
import { useConditional } from '../../state/storeConditional';
import { __ } from '@wordpress/i18n';

type Location = {
	name?: string | undefined;
	method?: string | undefined;
	id?: string | undefined;
	country?: string | undefined;
	city?: string | undefined;
	lat?: string | undefined;
	lng?: string | undefined;
};

type Props = {
	onChange: (value: Location) => void;
	// `{ value: [...] }` meta rows — SelectSchemaValid, a saved location list, …
	options?: { value?: unknown };
	label: string;
	meta: string;
	value: Location;
	placeholder?: string;
	skipReady?: boolean;
	onSave?: (value: Location) => void;
};

const Dropdown = ({ options, label, meta, value, onChange, placeholder, skipReady, onSave }: Props) => {
	const { updateIsReadyGenerator } = useConditional();
	const { getSelectedFromUI } = usePostControlFromUI();
	const navigate = useNavigate();
	const [open, setOpen] = React.useState(false);

	const selectedOption = (opt: Location) => {
		onChange(opt);
		getSelectedFromUI({ meta, value: opt });
		if (onSave) {
			onSave(opt);
		}
		if (!skipReady) {
			updateIsReadyGenerator(true);
		}
	};

	// The saved options are `{ value: [...] }` meta rows; the value is stored
	// untyped so any row shape can be passed in, hence the guard.
	const optionList: Location[] = Array.isArray(options?.value)
		? (options.value as Location[])
		: [];

	// Check if any display-relevant field exists
	const hasValue = value && (value.name || value.method || value.country || value.city);

	const displayValue = hasValue
		? value.name || value.method || `${value.country}${value.city ? ` - ${value.city}` : ''}`
		: placeholder || 'Select an option';

	return (
		<div
			onBlur={() => setOpen(false)}
			tabIndex={0}
			onClick={() => setOpen((prev) => !prev)}
			className="relative w-full"
		>
			<label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
			<div className={`h-10 px-3 flex items-center justify-between text-sm border rounded-lg cursor-pointer transition-all box-border ${
				open ? 'border-green-400 ring-1 ring-green-200' : 'border-gray-200 hover:border-gray-300'
			} ${!hasValue ? 'bg-gray-50 text-gray-400' : 'bg-gray-50 text-gray-900'}`}>
				<span className="truncate whitespace-nowrap overflow-hidden">
					{!hasValue ? (
						<span className="text-gray-400">{placeholder || 'Select an option'}</span>
					) : (
						displayValue
					)}
				</span>
				<svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</div>
			{open && (
				<div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
					{optionList.map((item: Location, index) => (
						<div
							onClick={(e) => {
								e.stopPropagation();
								selectedOption(item);
								setOpen(false);
							}}
							className="px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
							key={index}
						>
							{item?.name || item?.method || `${item?.country} - ${item?.city}`}
						</div>
					))}
					{meta === 'location' && (
						<div
							onClick={(e) => {
								e.stopPropagation();
								navigate('/customizing/location');
							}}
							className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer border-t border-gray-100 transition-colors"
						>{__('+ Add Custom Location', 'fiveprayer')}</div>
					)}
				</div>
			)}
		</div>
	);
};

export default Dropdown;
