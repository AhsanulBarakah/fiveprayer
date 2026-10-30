/**
 * Number Input Component
 *
 * Debounced numeric input for prayer time settings (tune offsets, iqamah delays).
 * Updates parent via `onUpdate` callback after 300ms debounce or on blur.
 * Automatically sets `isReadyGenerator` flag when value changes.
 *
 * @module ui/Input
 */
import React from 'react';
import { useConditional } from '../../state/storeConditional';

type Props = {
    label?: string;
    name?: string;
    value?: string;
    disabled?: boolean;
    disabledReason?: string;
    store?: 'tune' | 'iqama';
    onUpdate?: (value: string) => void;
};

const Input = React.memo((props: Props) => {
    const [value, setValue] = React.useState(props.value ?? '');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { updateIsReadyGenerator } = useConditional();

    // Only sync from props on mount
    React.useEffect(() => {
        setValue(props.value ?? '');
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value;
        setValue(newValue);

        // Debounce — no store update or parent re-render while pressing arrows
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            props.onUpdate?.(newValue);
            updateIsReadyGenerator(true);
        }, 300);
    };

    const handleBlur = () => {
        // Flush immediately on blur
        clearTimeout(debounceRef.current);
        props.onUpdate?.(value ?? '');
        updateIsReadyGenerator(true);
    };

    const metaName = props.name || props.label;
    const inputId = `input-${metaName?.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div>
            <label htmlFor={inputId} className="block text-xs font-medium text-gray-600 mb-1.5">{props.label}</label>
            <input
                id={inputId}
                className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                type="number"
                name={metaName}
                onChange={handleChange}
                onBlur={handleBlur}
                value={value}
                disabled={props.disabled}
                title={props.disabled ? (props.disabledReason || '') : ''}
            />
            {props.disabled && props.disabledReason ? (
                <p className="text-[10px] text-gray-400 mt-1">{props.disabledReason}</p>
            ) : null}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
