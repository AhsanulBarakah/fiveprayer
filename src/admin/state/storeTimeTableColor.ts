/**
 * Timetable Color Store
 *
 * Holds RGBA color values for the timetable table styling.
 * Used by the color picker components in the customizing page.
 * UI-only store — not persisted (colors are saved via the API separately).
 *
 * @module storeTimeTableColor
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** RGBA color value */
export type RGBAColor = { r: number; g: number; b: number; a: number };

/** How the hover colour is applied to a row */
export type HoverMode = 'blend' | 'replace';

type State = {
	rgba_first_bg: RGBAColor;
	rgba_second_bg: RGBAColor;
	rgba_even_bg: RGBAColor;
	rgba_odd_bg: RGBAColor;
	rgba_light_bg: RGBAColor;
	rgba_border_clr: RGBAColor;
	rgba_hover_bg: RGBAColor;
	rgba_hover_text: RGBAColor;
	hoverMode: HoverMode;
	hoverEnabled: boolean;
	rgba_border_size: number;
	rgba_border_style: string;
	/** Corner rounding of the timetable table, in whole pixels. 0 = square. */
	rgba_border_radius: number;
	ShowHightLight: boolean;
	ShowTextColor: boolean;
	scroll: number;
	rgba_first_text: RGBAColor;
	rgba_second_text: RGBAColor;
	rgba_even_text: RGBAColor;
	rgba_odd_text: RGBAColor;
	rgba_light_text: RGBAColor;
};

type Action = {
	updateFirstBG: ( rgba_first_bg: State[ 'rgba_first_bg' ] ) => void;
	updateSecondBG: ( rgba_second_bg: State[ 'rgba_second_bg' ] ) => void;
	updateEvenBG: ( rgba_even_bg: State[ 'rgba_even_bg' ] ) => void;
	updateOddBG: ( rgba_odd_bg: State[ 'rgba_odd_bg' ] ) => void;
	updateLightBG: ( rgba_light_bg: State[ 'rgba_light_bg' ] ) => void;
	updateBorderClr: ( rgba_border_clr: State[ 'rgba_border_clr' ] ) => void;
	updateHoverBG: ( rgba_hover_bg: State[ 'rgba_hover_bg' ] ) => void;
	updateHoverText: ( rgba_hover_text: State[ 'rgba_hover_text' ] ) => void;
	updateHoverMode: ( hoverMode: State[ 'hoverMode' ] ) => void;
	// Legacy rows store '1'/'0'/1/0, so the setter accepts raw values.
	updateHoverEnabled: ( hoverEnabled: unknown ) => void;
	updateBorderSize: ( rgba_border_size: State[ 'rgba_border_size' ] ) => void;
	updateBorderStyle: ( rgba_border_style: State[ 'rgba_border_style' ] ) => void;
	updateBorderRadius: ( rgba_border_radius: State[ 'rgba_border_radius' ] ) => void;
	updateShowHightLight: ( ShowHightLight: State[ 'ShowHightLight' ] ) => void;
	updateScroll: ( scroll: State[ 'scroll' ] ) => void;
	updateFirstText: ( rgba_first_text: State[ 'rgba_first_text' ] ) => void;
	updateSecondText: ( rgba_second_text: State[ 'rgba_second_text' ] ) => void;
	updateEvenText: ( rgba_even_text: State[ 'rgba_even_text' ] ) => void;
	updateOddText: ( rgba_odd_text: State[ 'rgba_odd_text' ] ) => void;
	updateLightText: ( rgba_light_text: State[ 'rgba_light_text' ] ) => void;
	updateShowTextColor: ( ShowTextColor: State[ 'ShowTextColor' ] ) => void;
};

const defaultColor: RGBAColor = { r: 0, g: 0, b: 0, a: 0 };

export const useTimeTableColor = create< State & Action >()(
	devtools( ( set ) => ( {
		rgba_first_bg: defaultColor,
		rgba_second_bg: defaultColor,
		rgba_even_bg: defaultColor,
		rgba_odd_bg: defaultColor,
		rgba_light_bg: defaultColor,
		rgba_border_clr: defaultColor,
		rgba_hover_bg: { r: 0, g: 0, b: 0, a: 0.08 },
		rgba_hover_text: { r: 0, g: 0, b: 0, a: 0 },
		hoverMode: 'blend',
		hoverEnabled: false,
		// Mirrors the plugin's default border width (1px); the loaded meta value
	// overrides it, and 0 is a valid stored value meaning "no border".
	rgba_border_size: 1,
		rgba_border_style: '',
		// Mirrors the plugin's default radius (0 = square corners, the look the
		// timetable has always had). The loaded meta value overrides it.
	rgba_border_radius: 0,
		ShowHightLight: false,
		scroll: 0,
		rgba_first_text: defaultColor,
		rgba_second_text: defaultColor,
		rgba_even_text: defaultColor,
		rgba_odd_text: defaultColor,
		rgba_light_text: defaultColor,
		ShowTextColor: false,

		updateFirstBG: ( rgba_first_bg ) => set( () => ( { rgba_first_bg } ) ),
		updateSecondBG: ( rgba_second_bg ) => set( () => ( { rgba_second_bg } ) ),
		updateEvenBG: ( rgba_even_bg ) => set( () => ( { rgba_even_bg } ) ),
		updateOddBG: ( rgba_odd_bg ) => set( () => ( { rgba_odd_bg } ) ),
		updateLightBG: ( rgba_light_bg ) => set( () => ( { rgba_light_bg } ) ),
		updateBorderClr: ( rgba_border_clr ) => set( () => ( { rgba_border_clr } ) ),
		updateHoverBG: ( rgba_hover_bg ) => set( () => ( { rgba_hover_bg } ) ),
		updateHoverText: ( rgba_hover_text ) => set( () => ( { rgba_hover_text } ) ),
		updateHoverMode: ( hoverMode ) => set( () => ( { hoverMode } ) ),
		// Coerce so values loaded from meta ('1'/'0'/1/0) become a real boolean.
		updateHoverEnabled: ( hoverEnabled ) => set( () => {
			const raw = String( hoverEnabled ).trim().toLowerCase();
			return {
				hoverEnabled: hoverEnabled === true || raw === '1' || raw === 'true',
			};
		} ),
		updateBorderSize: ( rgba_border_size ) => set( () => ( { rgba_border_size } ) ),
		updateBorderStyle: ( rgba_border_style ) => set( () => ( { rgba_border_style } ) ),
		// Whole pixels only, clamped to the range the control offers, so a value
		// typed into the number box, or a hand-edited meta row, can never leave
		// the preview and the front end disagreeing.
		updateBorderRadius: ( rgba_border_radius ) => set( () => ( {
			rgba_border_radius: Math.min( 80, Math.max( 0, Math.round( Number( rgba_border_radius ) || 0 ) ) ),
		} ) ),
		updateShowHightLight: ( ShowHightLight ) => set( () => ( { ShowHightLight } ) ),
		updateScroll: ( scroll ) => set( () => ( { scroll } ) ),
		updateFirstText: ( rgba_first_text ) => set( () => ( { rgba_first_text } ) ),
		updateSecondText: ( rgba_second_text ) => set( () => ( { rgba_second_text } ) ),
		updateEvenText: ( rgba_even_text ) => set( () => ( { rgba_even_text } ) ),
		updateOddText: ( rgba_odd_text ) => set( () => ( { rgba_odd_text } ) ),
		updateLightText: ( rgba_light_text ) => set( () => ( { rgba_light_text } ) ),
		updateShowTextColor: ( ShowTextColor ) => set( () => ( { ShowTextColor } ) ),
	} ),
	{ name: 'storeTimeTableColor' } )
);
