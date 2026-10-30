/**
 * ColorPickerBG
 *
 * Modern RGBA color picker for background colors.
 * Color pickers flow in a responsive grid that fills the available width.
 *
 * @module customizing/ColorPickerBG
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

const BorderSizeControl = React.memo(() => {
    const borderSize = useTimeTableColor((s) => s.rgba_border_size);
    const updateBorderSize = useTimeTableColor((s) => s.updateBorderSize);

    // 0 is a real choice (no border drawn) and fractional widths such as 0.5px
    // are valid CSS, so the size moves in 0.1px steps and is clamped to 0-10.
    const setSize = (raw: string) => {
        const next = Number(raw);
        if (!Number.isFinite(next)) return;
        updateBorderSize(Math.min(10, Math.max(0, next)));
    };

    return (
        <div className="flex-1 min-w-[200px] max-w-[200px]">
            <label className="block text-[11px] font-medium text-gray-600 mb-2">{__('Border Size (', 'fiveprayer')}{borderSize}{__('px)', 'fiveprayer')}</label>
            <div className="flex items-center gap-2">
                <input
                    onChange={(e) => setSize(e.target.value)}
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={borderSize}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={borderSize}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-16 h-7 shrink-0 rounded-md border border-gray-200 bg-white px-1.5 text-[11px] text-gray-700 focus:border-green-300 focus:outline-hidden"
                />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">
                {borderSize === 0
                    ? __('No border is drawn.', 'fiveprayer')
                    : __('Fine steps of 0.1px are supported.', 'fiveprayer')}
            </p>
        </div>
    );
});

const BorderStyleControl = React.memo(() => {
    const borderStyle = useTimeTableColor((s) => s.rgba_border_style);
    const updateBorderStyle = useTimeTableColor((s) => s.updateBorderStyle);
    return (
        <div className="flex-1 min-w-[200px] max-w-[200px]">
            <label className="block text-[11px] font-medium text-gray-600 mb-2">{__('Border Style', 'fiveprayer')}</label>
            <div className="flex gap-2">
                {['solid', 'dashed', 'dotted'].map((style) => (
                    <button
                        key={style}
                        onClick={() => updateBorderStyle(style)}
                        className={`flex-1 text-[11px] px-2 py-1.5 rounded-lg border transition-colors focus:outline-hidden ${
                            borderStyle === style
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {style}
                    </button>
                ))}
            </div>
        </div>
    );
});

const BorderRadiusControl = React.memo(() => {
    const borderRadius = useTimeTableColor((s) => s.rgba_border_radius);
    const updateBorderRadius = useTimeTableColor((s) => s.updateBorderRadius);

    // 0 means square corners; whole pixels are all a timetable cell radius needs,
    // so unlike the border size this one moves in 1px steps. The 0-80 range is
    // the same ceiling the store, the REST route and the front-end stylesheet
    // enforce, so a value can never mean different things in different places.
    const setRadius = (raw: string) => {
        const next = Number(raw);
        if (!Number.isFinite(next)) return;
        updateBorderRadius(Math.min(80, Math.max(0, Math.round(next))));
    };

    return (
        <div className="flex-1 min-w-[200px] max-w-[200px]">
            <label className="block text-[11px] font-medium text-gray-600 mb-2">{__('Border Radius (', 'fiveprayer')}{borderRadius}{__('px)', 'fiveprayer')}</label>
            <div className="flex items-center gap-2">
                <input
                    onChange={(e) => setRadius(e.target.value)}
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={borderRadius}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <input
                    type="number"
                    min="0"
                    max="80"
                    step="1"
                    value={borderRadius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-16 h-7 shrink-0 rounded-md border border-gray-200 bg-white px-1.5 text-[11px] text-gray-700 focus:border-green-300 focus:outline-hidden"
                />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">
                {borderRadius === 0
                    ? __('Square corners.', 'fiveprayer')
                    : __('Rounds the corners of the timetable.', 'fiveprayer')}
            </p>
        </div>
    );
});

const HoverModeControl = React.memo(() => {
    const hoverMode = useTimeTableColor((s) => s.hoverMode);
    const updateHoverMode = useTimeTableColor((s) => s.updateHoverMode);
    const options: { value: 'blend' | 'replace'; label: string }[] = [
        { value: 'blend', label: __('Blend', 'fiveprayer') },
        { value: 'replace', label: __('Replace', 'fiveprayer') },
    ];
    return (
        <div className="flex-1 min-w-[200px] max-w-[200px]">
            <label className="block text-[11px] font-medium text-gray-600 mb-2">{__('Hover Mode', 'fiveprayer')}</label>
            <div className="flex gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => updateHoverMode(opt.value)}
                        className={`flex-1 text-[11px] px-2 py-1.5 rounded-lg border transition-colors focus:outline-hidden ${
                            hoverMode === opt.value
                                ? 'border-rose-500 bg-rose-50 text-rose-700'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">
                {hoverMode === 'replace'
                    ? __('Replaces the row colour on hover.', 'fiveprayer')
                    : __('Blends the colour on top of the row colour.', 'fiveprayer')}
            </p>
        </div>
    );
});

const HoverEnableToggle = React.memo(() => {
    const hoverEnabled = useTimeTableColor((s) => s.hoverEnabled);
    const updateHoverEnabled = useTimeTableColor((s) => s.updateHoverEnabled);
    return (
        <button
            onClick={() => updateHoverEnabled(!hoverEnabled)}
            role="switch"
            aria-checked={hoverEnabled}
            className={`flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors focus:outline-hidden ${
                hoverEnabled
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
        >
            <span className={`relative w-8 h-4 rounded-full transition-colors ${hoverEnabled ? 'bg-rose-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${hoverEnabled ? 'left-4' : 'left-0.5'}`} />
            </span>
            {hoverEnabled ? __('Hover Effect: On', 'fiveprayer') : __('Hover Effect: Off', 'fiveprayer')}
        </button>
    );
});

const SectionLabel = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
    <div className="flex items-center gap-2 mb-3">
        <span className={`w-6 h-6 rounded-md ${color} flex items-center justify-center text-xs`}>{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
    </div>
);

const ColorPickerBG = () => {
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
                    onClick={() => updateShowTextColor(true)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors focus:outline-hidden"
                >{__('Switch to Text Colors', 'fiveprayer')}</button>
                <div className="grid grid-cols-2 gap-2">
                    <ShowHideHightLight />
                    <SaveColorBtn />
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Header Colors */}
                <div>
                    <SectionLabel icon="🎨" title={__('Header', 'fiveprayer')} color="bg-indigo-100" />
                    <div className="flex flex-wrap gap-[3rem]">
                        <ColorSection label={__('First Header', 'fiveprayer')} colorKey="rgba_first_bg" updateKey="updateFirstBG" accent="bg-indigo-500" />
                        <ColorSection label={__('Second Header', 'fiveprayer')} colorKey="rgba_second_bg" updateKey="updateSecondBG" accent="bg-emerald-500" />
                    </div>
                </div>

                {/* Row Colors */}
                <div>
                    <SectionLabel icon="📊" title={__('Rows', 'fiveprayer')} color="bg-green-100" />
                    <div className="flex flex-wrap gap-[3rem]">
                        <ColorSection label={__('Odd Row', 'fiveprayer')} colorKey="rgba_odd_bg" updateKey="updateOddBG" accent="bg-green-500" />
                        <ColorSection label={__('Even Row', 'fiveprayer')} colorKey="rgba_even_bg" updateKey="updateEvenBG" accent="bg-sky-500" />
                        <ColorSection label={__('Highlight Row', 'fiveprayer')} colorKey="rgba_light_bg" updateKey="updateLightBG" accent="bg-amber-500" />
                    </div>
                </div>

                {/* Hover — the background half of the effect. The Hover Text
                    colour is a text colour, so it lives in the Text Colors
                    panel (Switch to Text Colors) next to the row text colours;
                    the mode and on/off switch stay here with the hover row. */}
                <div>
                    <SectionLabel icon="🖱️" title={__('Hover', 'fiveprayer')} color="bg-rose-100" />
                    <div className={`flex flex-wrap gap-[3rem] transition-opacity ${hoverEnabled ? '' : 'opacity-40 pointer-events-none select-none'}`}>
                        <ColorSection label={__('Hover Row', 'fiveprayer')} colorKey="rgba_hover_bg" updateKey="updateHoverBG" accent="bg-rose-500" />
                    </div>
                    {/* Kept outside the dimmed/disabled group so the effect can always be switched back on. */}
                    <div className="mt-4">
                        <HoverEnableToggle />
                    </div>
                    <div className={`flex flex-wrap gap-[3rem] mt-4 transition-opacity ${hoverEnabled ? '' : 'opacity-40 pointer-events-none select-none'}`}>
                        <HoverModeControl />
                    </div>
                    {!hoverEnabled && (
                        <p className="text-[10px] text-gray-400 mt-2">{__('Hover effect is turned off — enable it to use these settings.', 'fiveprayer')}</p>
                    )}
                </div>

                {/* Border */}
                <div>
                    <SectionLabel icon="🔲" title={__('Border', 'fiveprayer')} color="bg-purple-100" />
                    <div className="flex flex-wrap gap-[3rem]">
                        <ColorSection label={__('Border Line', 'fiveprayer')} colorKey="rgba_border_clr" updateKey="updateBorderClr" accent="bg-purple-500" />
                        <BorderSizeControl />
                        <BorderStyleControl />
                        <BorderRadiusControl />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorPickerBG;
