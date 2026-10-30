/**
 * PrinterInputs
 *
 * Controlled input field for printer configuration.
 *
 * @module customizing/PrinterInputs
 */
import * as React from "react";
import { useGetMetaPrinter } from '../../hooks/useGetMetaPrinter';

type Props = {
    label?: string;
    value?: string;
    type: string | 'text';
};

const PrinterInputs = ( props: Props ) => {
    const { liveUpdateMetaPrinter } = useGetMetaPrinter();
    const [ value, SetValue ] = React.useState( props.value || "" );

    React.useEffect(() => {
        SetValue(props.value || "");
    }, [props.value]);

	// FormEvent (not ChangeEvent): the handler is wired to both onChange and
	// onInput, and React types the latter with FormEvent.
	const handleChange = ( e: React.FormEvent<HTMLInputElement> ) => {
		const newData = {
			meta: e.currentTarget.name,
			value: e.currentTarget.value,
		};
		liveUpdateMetaPrinter( newData );
		SetValue( newData.value );
	};

    // Extract line number from label (e.g., "printer_left3" -> "3")
    const lineNum = props.label?.match(/\d/)?.[0] || '';
    const displayLabel = lineNum ? `Line ${lineNum}` : (props.label || '');

    return (
        <div className="mb-2">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-400 w-12 text-right tabular-nums shrink-0">{displayLabel}</span>
                <input
                    className="flex-1 h-8 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:outline-hidden transition-all placeholder:text-gray-300"
                    type={ props.type }
                    name={ props.label }
                    value={ value }
                    onChange={ handleChange }
                    onInput={ handleChange }
                    placeholder={`Enter ${displayLabel.toLowerCase()}`}
                />
            </div>
        </div>
    );
};

export default PrinterInputs;
