/**
 * HijraOptions
 *
 * Container panel for all Hijri calendar settings with save button.
 *
 * @module hijra/HijraOptions
 */
import React, { useState } from 'react';
import { useTimeTableMonth } from '../../state/storeTimeTable';
import { usePostMeta } from '../../hooks/usePostMeta';
import { toast } from 'sonner';
import ActivateHijra from './ActivateHijra';
import CalenderTypeHijra from './CalenderTypeHijra';
import LanguageHijra from './LanguageHijra';
import RamadanActivate from './RamadanActivate';
import { useConditional } from '../../state/storeConditional';
import { __ } from '@wordpress/i18n';

const HijraOptions = () => {
    const { updateIsOnChangeInHijra, isOnChangeInHijra, isRamadan } = useConditional();
    const { HijraLocale } = useTimeTableMonth();
    const { saveBatch } = usePostMeta();
    const [isLoading, setIsLoading] = useState(false);

    const isSaveDisabled =
        (HijraLocale.isActive && (!HijraLocale.lan || !HijraLocale.calenderType)) ||
        (isRamadan.ramadan && (!HijraLocale.isActive || !HijraLocale.lan || !HijraLocale.calenderType));

    const saveHandler = async () => {
        if (isLoading || !isOnChangeInHijra) return;
        setIsLoading(true);
        try {
            await saveBatch({
                hijralocale: HijraLocale,
                ramadan: isRamadan,
            });
            updateIsOnChangeInHijra(false);
            toast.success(__('Hijra settings saved', 'fiveprayer'));
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error(__('Failed to save settings', 'fiveprayer'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Activate Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">{__('Hijra Calendar', 'fiveprayer')}</h2>
                            <p className="text-xs text-gray-500">{__('Enable Islamic Hijra calendar display', 'fiveprayer')}</p>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    <ActivateHijra />

                    {HijraLocale.isActive && (
                        <div className="mt-5 space-y-0">
                            <div className="h-px bg-gray-100 my-4" />
                            <CalenderTypeHijra />
                            <div className="h-px bg-gray-100 my-4" />
                            <LanguageHijra />
                            <div className="h-px bg-gray-100 my-4" />
                            <RamadanActivate />
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={saveHandler}
                    disabled={isSaveDisabled || isLoading || !isOnChangeInHijra}
                    className={`text-sm font-medium px-6 py-2.5 rounded-lg transition-colors focus:outline-hidden ${
                        isSaveDisabled || !isOnChangeInHijra
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isLoading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-700 text-white hover:bg-green-800'
                    }`}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>{__('Saving...', 'fiveprayer')}</span>
                    ) : 'Save Settings'}
                </button>
                {isSaveDisabled && (
                    <span className="text-xs text-red-500">
                        {HijraLocale.isActive && (!HijraLocale.lan || !HijraLocale.calenderType)
                            ? 'Select calendar type and language first'
                            : !HijraLocale.isActive && isRamadan.ramadan
                                ? 'Cannot deactivate Hijra while Ramadan is active — disable Ramadan first'
                                : 'Complete all required fields to save'}
                    </span>
                )}
            </div>
        </div>
    );
};

export default HijraOptions;
