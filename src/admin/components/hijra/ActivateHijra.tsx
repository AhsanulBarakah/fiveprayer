/**
 * ActivateHijra
 *
 * Toggle switch to enable/disable Hijri calendar display.
 *
 * @module hijra/ActivateHijra
 */
import { useConditional } from '../../state/storeConditional';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { __ } from '@wordpress/i18n';

const ActivateHijra = () => {
    const { updateIsOnChangeInHijra } = useConditional();
    const { HijraLocale, updateHijraLocale } = useTimeTableMonth();

    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-gray-900">{__('Activate Hijra Calendar', 'fiveprayer')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{__('Show Hijra calendar dates alongside Gregorian', 'fiveprayer')}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={HijraLocale.isActive}
                onClick={() => {
                    updateHijraLocale({ ...HijraLocale, isActive: !HijraLocale.isActive });
                    updateIsOnChangeInHijra(true);
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    HijraLocale.isActive ? 'bg-green-600' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
                        HijraLocale.isActive ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`}
                />
            </button>
        </div>
    );
};

export default ActivateHijra;
