/**
 * ColorPickerText
 *
 * Modern RGBA color picker for text colors.
 * Color pickers flow in a responsive grid that fills the available width.
 *
 * @module customizing/ColorPickerText
 */
import * as React from "react";
import { RgbaColorPicker } from "react-colorful";
import { useTimeTableColor } from "../../state/storeTimeTableColor";
import ShowHideHightLight from "./ShowHideHightLight";
import SaveColorBtn from "./SaveColorBtn";
import { useControlScroll } from "../../hooks/useControlScroll";
import { __ } from '@wordpress/i18n';

interface ColorSectionProps {
    label: string;
    colorKey: string;
    updateKey: string;
    accent: string;
}

const ColorSection = React.memo(({ label, colorKey, updateKey, accent }: ColorSectionProps) => {
    const color = useTimeTableColor((s: any) => s[colorKey]);
    const onChange = useTimeTableColor((s: any) => s[updateKey]);
    return (
        <div className="flex-1 min-w-[200px] max-w-[200px]">
            <label className="block text-[11px] font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${accent}`} />
                {label}
            </label>
            <RgbaColorPicker color={color} onChange={onChange} />
        </div>
    );
});

const SectionLabel = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
    <div className="flex items-center gap-2 mb-3">
        <span className={`w-6 h-6 rounded-md ${color} flex items-center justify-center text-xs`}>{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
    </div>
);

const ColorPickerText = () => {
    const updateShowTextColor = useTimeTableColor((state) => state.updateShowTextColor);
    const hoverEnabled = useTimeTableColor((state) => state.hoverEnabled);
    const { controlCustomScroll, refScroll } = useControlScroll();

    return (
        <div
            onScroll={controlCustomScroll}
            ref={refScroll}
            className="h-full overflow-y-auto"
        >
            {/* Top Actions */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 space-y-2">
                <button
                    onClick={() => updateShowTextColor(false)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors focus:outline-hidden"
                >{__('Switch to Background Colors', 'fiveprayer')}</button>
                <div className="grid grid-cols-2 gap-2">
                    <ShowHideHightLight />
                    <SaveColorBtn />
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Header Text Colors */}
                <div>
                    <SectionLabel icon="🎨" title={__('Header Text', 'fiveprayer')} color="bg-indigo-100" />
                    <div className="flex flex-wrap gap-[3rem]">
                        <ColorSection label={__('First Header Text', 'fiveprayer')} colorKey="rgba_first_text" updateKey="updateFirstText" accent="bg-indigo-500" />
                        <ColorSection label={__('Second Header Text', 'fiveprayer')} colorKey="rgba_second_text" updateKey="updateSecondText" accent="bg-emerald-500" />
                    </div>
                </div>

                {/* Row Text Colors */}
                <div>
                    <SectionLabel icon="📊" title={__('Row Text', 'fiveprayer')} color="bg-green-100" />
                    <div className="flex flex-wrap gap-[3rem]">
                        <ColorSection label={__('Odd Row Text', 'fiveprayer')} colorKey="rgba_odd_text" updateKey="updateOddText" accent="bg-green-500" />
                        <ColorSection label={__('Even Row Text', 'fiveprayer')} colorKey="rgba_even_text" updateKey="updateEvenText" accent="bg-sky-500" />
                        <ColorSection label={__('Highlight Text', 'fiveprayer')} colorKey="rgba_light_text" updateKey="updateLightText" accent="bg-amber-500" />
                    </div>
                </div>

                {/* Hover Text — every text colour lives in this panel and every
                    background colour in the other one, so the two hover
                    colours are no longer side by side: Hover Row stays with
                    the backgrounds (Switch to Background Colors) and the row
                    hover mode is set there too. */}
                <div>
                    <SectionLabel icon="🖱️" title={__('Hover', 'fiveprayer')} color="bg-rose-100" />
                    <div className={`flex flex-wrap gap-[3rem] transition-opacity ${hoverEnabled ? '' : 'opacity-40 pointer-events-none select-none'}`}>
                        <ColorSection label={__('Hover Text', 'fiveprayer')} colorKey="rgba_hover_text" updateKey="updateHoverText" accent="bg-rose-300" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-snug">
                        {__('Leave Hover Text transparent to keep the row text colour.', 'fiveprayer')}
                    </p>
                    {!hoverEnabled && (
                        <p className="text-[10px] text-gray-400 mt-1">{__('Hover effect is turned off — enable it to use these settings.', 'fiveprayer')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ColorPickerText;
