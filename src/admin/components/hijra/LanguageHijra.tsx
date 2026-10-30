/**
 * LanguageHijra
 *
 * Language selector for the Hijri calendar locale.
 *
 * @module hijra/LanguageHijra
 */
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { useConditional } from '../../state/storeConditional';
import { NavLink } from 'react-router';
import { __ } from '@wordpress/i18n';

const LanguageHijra = () => {
    const { updateIsOnChangeInHijra } = useConditional();
    const { updateHijraLocale, HijraLocale } = useTimeTableMonth();

    const languages = [
        { value: 'ar-SA', label: __('Arabic', 'fiveprayer'), flag: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
        { value: 'en-US', label: __('English', 'fiveprayer'), flag: 'EN' },
        { value: 'es-ES', label: __('Spanish (Spain)', 'fiveprayer'), flag: 'ES' },
        { value: 'tr-TR', label: __('Turkish', 'fiveprayer'), flag: 'TR' },
        { value: 'hi-IN', label: __('India (Hindi)', 'fiveprayer'), flag: 'IN' },
    ];

    const handleSelect = (value: string, custom?: boolean) => {
        updateHijraLocale({
            ...HijraLocale,
            lan: value,
            customLan: custom || false,
        });
        updateIsOnChangeInHijra(true);
    };

    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{__('Language', 'fiveprayer')}</h3>
            <div className="space-y-2">
                {languages.map(({ value, label, flag }) => (
                    <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            HijraLocale.lan === value && !HijraLocale.customLan
                                ? 'border-green-400 bg-green-50 ring-1 ring-green-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <input
                            type="radio"
                            name="language"
                            value={value}
                            checked={HijraLocale.lan === value && !HijraLocale.customLan}
                            onChange={() => handleSelect(value)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-sm bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {flag}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{label}</span>
                        </div>
                    </label>
                ))}

                {/* Custom Language */}
                <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        HijraLocale.customLan
                            ? 'border-green-400 bg-green-50 ring-1 ring-green-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    <input
                        type="radio"
                        name="language"
                        checked={HijraLocale.customLan === true}
                        onChange={() => handleSelect('en-GB', true)}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-900">{__('Custom Language', 'fiveprayer')}</span>
                        <p className="text-xs text-gray-500">{__('Go to ', 'fiveprayer')}<NavLink to="/moresettings" className="text-green-600 hover:underline">{__('More Settings', 'fiveprayer')}</NavLink>{__(' and click Translate on the left sidebar', 'fiveprayer')}</p>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default LanguageHijra;
