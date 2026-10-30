/**
 * CalenderTypeHijra
 *
 * Dropdown selector for Hijri calendar type.
 *
 * @module hijra/CalenderTypeHijra
 */
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { useConditional } from '../../state/storeConditional';
import { __ } from '@wordpress/i18n';

const CalenderTypeHijra = () => {
    const { updateIsOnChangeInHijra } = useConditional();
    const { HijraLocale, updateHijraLocale } = useTimeTableMonth();

    const options = [
        { value: 'islamic-umalqura', label: __('Islamic Umalqura', 'fiveprayer'), desc: __('Used by most Islamic countries', 'fiveprayer') },
        { value: 'islamic-civil', label: __('Islamic Civil', 'fiveprayer'), desc: __('Based on civil calendar conventions', 'fiveprayer') },
    ];

    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{__('Calendar Type', 'fiveprayer')}</h3>
            <div className="space-y-2">
                {options.map(({ value, label, desc }) => (
                    <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            HijraLocale.calenderType === value
                                ? 'border-green-400 bg-green-50 ring-1 ring-green-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <input
                            type="radio"
                            name="calender"
                            value={value}
                            checked={HijraLocale.calenderType === value}
                            onChange={() => {
                                updateHijraLocale({ ...HijraLocale, calenderType: value });
                                updateIsOnChangeInHijra(true);
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900">{label}</span>
                            <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default CalenderTypeHijra;
