/**
 * RamadanActivate
 *
 * Toggle switch to enable/disable Ramadan-specific display mode.
 *
 * @module hijra/RamadanActivate
 */
import { useConditional } from '../../state/storeConditional';
import { __ } from '@wordpress/i18n';

const RamadanActivate = () => {
    const { updateIsRamadan, isRamadan, updateIsOnChangeInHijra } = useConditional();

    const handleToggle = () => {
        const newValue = !isRamadan.ramadan;
        updateIsRamadan({ ...isRamadan, ramadan: newValue });
        updateIsOnChangeInHijra(true);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            updateIsRamadan({ ...isRamadan, ramadan_custom: val });
            updateIsOnChangeInHijra(true);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{__('Activate Ramadan', 'fiveprayer')}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {isRamadan.ramadan
                            ? 'Adjust the starting day offset below'
                            : 'Show Ramadan month in the calendar'}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={isRamadan.ramadan}
                    onClick={handleToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        isRamadan.ramadan ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                >
                    <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
                            isRamadan.ramadan ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`}
                    />
                </button>
            </div>

            {isRamadan.ramadan && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">{__('Adjust the starting day of Ramadan offset', 'fiveprayer')}</p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                updateIsRamadan({ ...isRamadan, ramadan_custom: isRamadan.ramadan_custom - 1 });
                                updateIsOnChangeInHijra(true);
                            }}
                            className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium text-lg hover:bg-gray-50 transition-colors focus:outline-hidden"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={isRamadan.ramadan_custom}
                            onChange={handleValueChange}
                            className="w-16 h-10 text-center text-sm font-medium border border-gray-200 rounded-lg bg-white focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden box-border [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                        <button
                            onClick={() => {
                                updateIsRamadan({ ...isRamadan, ramadan_custom: isRamadan.ramadan_custom + 1 });
                                updateIsOnChangeInHijra(true);
                            }}
                            className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium text-lg hover:bg-gray-50 transition-colors focus:outline-hidden"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RamadanActivate;
