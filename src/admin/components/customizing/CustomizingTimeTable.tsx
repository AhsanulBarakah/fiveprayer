/**
 * CustomizingTimeTable
 *
 * Timetable color customization with modern color pickers and live calendar preview.
 * Responsive breakpoint at 1310px:
 *   - ≥1310px: color picker sidebar + calendar side by side
 *   - <1310px: color picker stacked on top, calendar below (grid)
 *
 * @module customizing/CustomizingTimeTable
 */
import * as React from "react";
import ColorPickerText from './ColorPickerText';
import PrayerCalendar from '../prayerSetting/PrayerCalendar';
import { useTimeTableColor } from '../../state/storeTimeTableColor';
import ColorPickerBG from './ColorPickerBG';
import { useLocationStore } from "../../state/storeLocation";
import { __ } from '@wordpress/i18n';

const BREAKPOINT = 1310;

const CustomizingTimeTable = () => {
    const ShowTextColor = useTimeTableColor((state) => state.ShowTextColor);
    const month = useLocationStore((state) => state.month);
    const [isWide, setIsWide] = React.useState(
        () => typeof window !== 'undefined' && window.innerWidth >= BREAKPOINT
    );

    React.useEffect(() => {
        const handler = () => setIsWide(window.innerWidth >= BREAKPOINT);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const colorPanel = ShowTextColor ? <ColorPickerText /> : <ColorPickerBG />;

    const calendarPreview = month?.method === "13" ? (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-8 max-w-lg text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{__('Ramadan Mode', 'fiveprayer')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{__('Styling during Ramadan can be slow due to extra processing. Select a different month for a smoother experience when customizing colors.', 'fiveprayer')}</p>
            </div>
        </div>
    ) : (
        <PrayerCalendar show={false} />
    );

    // Wide: color picker sidebar + calendar side by side
    if (isWide) {
        return (
            <div className="flex h-[calc(100vh-94px)] overflow-hidden">
                <div className="w-[340px] shrink-0 h-full bg-white border-r border-gray-200">
                    {colorPanel}
                </div>
                <div className="flex-1 overflow-auto bg-gray-50 p-4 min-w-0">
                    {calendarPreview}
                </div>
            </div>
        );
    }

    // Narrow: color picker on top, calendar below
    return (
        <div className="flex flex-col h-[calc(100vh-94px)] overflow-hidden">
            <div className="shrink-0 max-h-[45%] bg-white border-b border-gray-200">
                {colorPanel}
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 min-h-0">
                {calendarPreview}
            </div>
        </div>
    );
};

export default CustomizingTimeTable;
