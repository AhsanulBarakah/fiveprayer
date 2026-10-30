import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
	SelectSchemaValid,
	SelectOptionIsValid,
} from '../validations/locationIsValid';
type Location = {
	value?: {
		id?: string | undefined;
        name?: string | undefined;
        method?: string | undefined;
    }[];
	'meta-key'?: string | undefined;
	id?: string | undefined;

	country?: string | undefined;
	city?: string | undefined;
	lat?: string | undefined;
	lng?: string | undefined;
  }

/**
 * One optional "extra prayer" slot (Jumu'ah / Eid style). `name` and `note`
 * are free text looked up in the Translate system (More → Translate → Extra
 * Info); `time` is stored as 24-hour HH:MM.
 */
export type ExtraPrayerSlot = {
	name: string;
	time: string;
	note: string;
};

/** Six empty slots — the factory shape of the extra-prayers meta. */
export const createDefaultExtraPrayers = (): ExtraPrayerSlot[] =>
	Array.from({ length: 6 }, () => ({ name: '', time: '', note: '' }));

type State = {
	Selected: SelectOptionIsValid;
	oaac: SelectOptionIsValid;
	mncm: SelectOptionIsValid;
	mfc: SelectOptionIsValid;
	hlm: SelectOptionIsValid;
	customLocationSelected: Location;
	OnSelect: SelectOptionIsValid;
	month: SelectOptionIsValid;
	mcMode: SelectSchemaValid;
	asrCal: SelectSchemaValid;
	highLittude: SelectSchemaValid;
	methodsForCal: SelectSchemaValid;
	customLocationData: Location;
	skipIqamahMidnight: boolean;
	skipIqamah: boolean;
	skipBegins: boolean;
	skipMidnight: boolean;
	skipDate: boolean;
	showSunrise: boolean;
	showHijriDate: boolean;
	hidePrinterButton: boolean;
	hideMonthSelection: boolean;
	printerButtonUrl: string;
	hideCustomUrlButton: boolean;
	autoPrintPageUrl: string;
	// Settings arrays
	methodsForCalculation: any[];
	asrCalculationMethods: any[];
	midnightCalculationModes: any[];
	higherLatitudeMethods: any[];
	roundingCalculationMethods: any[];
	// Rounding
	roundingCal: SelectSchemaValid;
	rounding_selected: SelectOptionIsValid & { threshold?: number };
// Per-feature on/off switch for the custom Rounding Method / Seconds
// Threshold. When false, every time is rounded with standard nearest@30.
roundingEnabled: boolean;
// How a turned-off feature appears in the Configure Settings sidebar:
//  - 'hide'  — the sidebar entry is removed completely (display: none).
//  - 'badge' — the entry stays, dimmed, with an "Off" badge.
// The Feature Switches entry itself is ALWAYS visible in both modes.
feature_off_display: 'hide' | 'badge';
	// Day-to-day smoothing of Begins times (cap the per-day change)
	smoothing_selected: {
		enabled: boolean;
		maxSeconds: number;
		/**
		 * 'noDrift' (anchor to true time, never drifts) | 'strict' (never
		 * jump more than the cap) | 'hybrid' (cap jumps AND bound the drift
		 * from the true time via driftBudget) | 'manual' (each prayer moves
		 * by exactly the typed seconds-per-day instead of the natural drift;
		 * driftBudget still bounds how far it may stray from the true time).
		 */
		mode: 'noDrift' | 'strict' | 'hybrid' | 'manual';
		/** Seconds the smoothed time may stray from the true time (hybrid & manual). */
		driftBudget: number;
		/**
		 * Manual daily-step mode: the exact change per day (seconds, may be
		 * negative) for each Begins prayer — e.g. fajr: 60 = +1 minute per
		 * day instead of following the natural astronomical drift. Only read
		 * when mode === 'manual'.
		 */
		manualSteps?: Partial<
			Record<'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>
		>;
	};
	// Calendar type for the full-year generation:
	//  - 'gregorian' — the current Gregorian (solar) year, Jan 1 → Dec 31.
	//  - 'persian'   — the current Solar Hijri (Persian) year, 1 Farvardin →
	//    Dhu al-Hijjah-equivalent (Esfand end). Solar, so dates align with the
	//    seasons (Nowruz ≈ 21 March) — prayer times are nearly identical to
	//    Gregorian; only the covered days differ slightly (leap years).
	//  - 'hijri'     — the current Lunar Hijri (Islamic) year, 1 Muharram →
	//    Dhu al-Hijjah. 354/355 days, drifts ~11 days earlier each solar year,
	//    so its dates land on DIFFERENT physical days → genuinely different
	//    prayer times from the Gregorian table.
	// The stored timetable keeps Gregorian dates in both non-Gregorian cases —
	// the calendar type decides WHICH days get generated.
	calendar_type: 'gregorian' | 'persian' | 'hijri';
	// How the month dropdown shows the generated span when Calendar Type is
	// Persian/Hijri:
	//  - 'span'     — list every Gregorian month the generated span touches,
	//    with year labels (e.g. "June 2026" … "September 2027").
	//  - 'fixed12'  — always list the 12 Gregorian months of the current year;
	//    months the generated span skips show an empty table.
	calendar_display: 'span' | 'fixed12';
	// Master on/off switches for every feature on the Configure Settings
	// page (the bottom "Feature Switches" panel). Keyed by the SettingsPage
	// category key (e.g. 'Rounding_Method', 'Unified_Method_Settings'). When a
	// feature is OFF its settings card is hidden/disabled so users are not
	// confused by features they don't use. For engine-backed features
	// (Rounding, Smoothing, Unified Method) turning the switch off also
	// disables the underlying behavior; the stored values are never modified.
	feature_toggles: Record<string, boolean>;
	// Customization for the live "time remaining until the next prayer"
	// countdown ([Fp_Single_Next_Prayer_Remaining] / the Vertical Daily Prayer
	// notice). The value is the real remaining time — there is no rounding
	// step. The master on/off for this feature lives in
	// feature_toggles['Next_Prayer_Countdown'].
	next_prayer_countdown: {
		format: 'long' | 'short' | 'clock';
		/** Show the "in" connector before the time (word comes from Translate). */
		show_prefix: boolean;
		/** Show the "remaining" connector after the time (from Translate). */
		show_suffix: boolean;
		/** Show the translated "Now" text once the prayer time arrives. */
		show_now: boolean;
		/** Show the seconds part (updates every second vs once a minute). */
		show_seconds: boolean;
	};
	// Six optional "extra prayer" slots (Jumu'ah / Eid etc.), rendered by
	// [Fp_Extra_Prayer_1] … [Fp_Extra_Prayer_6]. The master on/off lives in
	// feature_toggles['Extra_Prayers'] and ships OFF.
	extra_prayers: ExtraPrayerSlot[];
};

type Action = {
	updateSelected: ( Selected: State[ 'Selected' ] ) => void;
	mncm_selected: ( mncm: State[ 'mncm' ] ) => void;
	oaac_selected: ( oaac: State[ 'oaac' ] ) => void;
	hlm_selected: ( hlm: State[ 'hlm' ] ) => void;
	mfc_selected: ( mfc: State[ 'mfc' ] ) => void;
	cl_selected: ( customLocationSelected: State[ 'customLocationSelected' ] ) => void;

	updateOnSelected: ( OnSelect: State[ 'OnSelect' ] ) => void;
	updateSetMCMode: ( mcMode: State[ 'mcMode' ] ) => void;
	updateSetMethodsForCal: ( methodsForCal: State[ 'methodsForCal' ] ) => void;
	updateCustomLocationData: ( customLocationData: State[ 'customLocationData' ] ) => void;
	updateSetHighLittude: ( highLittude: State[ 'highLittude' ] ) => void;
	updateSetASRCAL: ( asrCal: State[ 'asrCal' ] ) => void;
	updateMonth: ( month: State[ 'month' ] ) => void;
	updateSetSkipIqamahMidnight: ( skipIqamahMidnight: boolean ) => void;
	updateSkipIqamah: ( skipIqamah: boolean ) => void;
	updateSkipBegins: ( skipBegins: boolean ) => void;
	updateSkipMidnight: ( skipMidnight: boolean ) => void;
	updateSkipDate: ( skipDate: boolean ) => void;
	updateShowSunrise: ( show: boolean ) => void;
	updateShowHijriDate: ( show: boolean ) => void;
	updateHidePrinterButton: ( hidePrinterButton: boolean ) => void;
	updateHideMonthSelection: ( hideMonthSelection: boolean ) => void;
	updatePrinterButtonUrl: ( printerButtonUrl: string ) => void;
	updateHideCustomUrlButton: ( hideCustomUrlButton: boolean ) => void;
	updateAutoPrintPageUrl: ( autoPrintPageUrl: string ) => void;
	// Settings arrays actions
	updateMethodsForCalculation: ( methodsForCalculation: any[] ) => void;
	updateAsrCalculationMethods: ( asrCalculationMethods: any[] ) => void;
	updateMidnightCalculationModes: ( midnightCalculationModes: any[] ) => void;
	updateHigherLatitudeMethods: ( higherLatitudeMethods: any[] ) => void;
	updateRoundingCalculationMethods: ( roundingCalculationMethods: any[] ) => void;
	updateSetRoundingCal: ( roundingCal: State[ 'roundingCal' ] ) => void;
	rounding_selected_select: ( rounding_selected: State[ 'rounding_selected' ] ) => void;
	updateRoundingEnabled: ( enabled: boolean ) => void;
	smoothing_selected_update: ( smoothing_selected: State[ 'smoothing_selected' ] ) => void;
	updateCalendarType: ( calendar_type: State[ 'calendar_type' ] ) => void;
	updateCalendarDisplay: ( calendar_display: State[ 'calendar_display' ] ) => void;
	feature_toggles_update: ( key: string, enabled: boolean ) => void;
	feature_toggles_set: ( toggles: Record<string, boolean> ) => void;
	updateFeatureOffDisplay: ( mode: 'hide' | 'badge' ) => void;
	updateNextPrayerCountdown: ( config: State[ 'next_prayer_countdown' ] ) => void;
	updateExtraPrayers: ( slots: State[ 'extra_prayers' ] ) => void;
};

// The Feature Switches shipped with every category ON (used by installs that
// predate the feature — kept so the loader can tell "still on factory
// defaults" apart from "deliberately customized").
export const LEGACY_FEATURE_TOGGLES: Record<string, boolean> = {
	'Methods_For_Calculation': true,
	'Only_affects_Asr_calculation': true,
	'midnight_calculation_mode': true,
	'Higher_Latitudes_Methods': true,
	'Unified_Method_Settings': true,
	'Rounding_Method': true,
	'Day_to_day_Smoothing': true,
	'Calendar_Type': true,
};

// Current factory defaults — only Prayer Calculation Methods + Unified Method
// ship ON; every other feature starts OFF (users enable them from the Feature
// Switches page). Engine-backed OFF features are fully disabled at generation.
//
// 'Advanced_Schedules' is the Configure Settings category that used to live
// under More Settings as "Advanced Schedules". It is engine-backed: turning it
// off also flips the custom-schedules master switch, so date-specific overrides
// stop replacing the calculated times.
export const DEFAULT_FEATURE_TOGGLES: Record<string, boolean> = {
	'Methods_For_Calculation': true,
	'Only_affects_Asr_calculation': false,
	'midnight_calculation_mode': false,
	'Higher_Latitudes_Methods': false,
	'Unified_Method_Settings': true,
	'Rounding_Method': false,
	'Day_to_day_Smoothing': false,
	'Calendar_Type': false,
	'Advanced_Schedules': false,
	// The next-prayer countdown ships OFF, like every other optional feature:
	// nothing is added to the Vertical Daily Prayer until it is turned on from
	// Configure Settings → Next Prayer Countdown (or the Feature Switches
	// page). The front end uses the same default (see NextPrayerCountdown).
	'Next_Prayer_Countdown': false,
	// Optional Jumu'ah / Eid style extra prayers ([Fp_Extra_Prayer_1..6]).
	// Ships OFF: the slots render nothing until it is turned on.
	'Extra_Prayers': false,
	// Master switch of the optional "Day" column / day line (full weekday name,
	// short name and day-of-month number in a configurable order). Ships OFF;
	// its customization lives in the `day_display` meta and is edited from
	// Configure Settings → Day Display. The front end reads the same default
	// (see DayNameFormatter::isEnabled()).
	'Day_Display': false,
	// Master switch of TV Display Mode (the "Enable TV Mode" box in Pages and
	// Posts plus the TV / Phone network switch). It is a **beta** feature, so it
	// ships OFF like the other optional features: nothing of it is offered until
	// it is turned on here, and a stored map without this key resolves to OFF,
	// exactly like the PHP reader (TVDisplayMode::is_feature_enabled()). Turning
	// it OFF switches its sub-switches off with it.
	'TV_Display_Mode': false,
	// NOTE: the two editor-only design aids of the TV Display Mode page —
	// Canvas Force and the Safe Zone Guide — are NOT entries of this map. They
	// are switches of that page, stored in their own options
	// (TvCanvasLocker::CANVAS_FORCE_OPTION / SAFE_ZONE_OPTION) exactly like the
	// Pages, Posts and TV / Phone switches, so they are saved through the TV
	// Display Mode page and not through Feature Switches.
};

/**
 * Resolve a stored `feature_toggles` map into the map the store should hold.
 *
 * Rules:
 *  - A map that is still the pre-Feature-Switches "everything ON" set AND never
 *    stored the Next Prayer Countdown switch is treated as untouched factory
 *    defaults and is replaced by the current defaults.
 *  - Anything else keeps what it stored. Keys the map does not carry fall back
 *    to the current factory default (several of which are OFF, e.g.
 *    `Next_Prayer_Countdown`).
 *  - An explicitly stored `Next_Prayer_Countdown: true` always sticks, so
 *    enabling the countdown is never reverted by the legacy migration.
 *
 * Pure on purpose: it is the one place that decides "on" vs "off" for a
 * toggle map, and it is unit-tested directly.
 */
export const resolveFeatureToggles = (
	stored: unknown
): Record<string, boolean> => {
	const value =
		stored && typeof stored === 'object' && !Array.isArray(stored)
			? (stored as Record<string, unknown>)
			: {};

	const isLegacyDefault =
		Object.keys(LEGACY_FEATURE_TOGGLES).every(
			(k) => value[k] === LEGACY_FEATURE_TOGGLES[k]
		) && value['Next_Prayer_Countdown'] !== true;

	if (isLegacyDefault) return { ...DEFAULT_FEATURE_TOGGLES };

	// Every known switch starts at its factory default, then the stored map is
	// layered on top. Stored booleans (or their "1"/"true" equivalents) win;
	// unknown keys are preserved so custom switches keep working.
	const resolved: Record<string, boolean> = { ...DEFAULT_FEATURE_TOGGLES };
	for (const [key, raw] of Object.entries(value)) {
		resolved[key] = raw === true || raw === 1 || raw === 'true' || raw === '1';
	}

	return resolved;
};

// Create your store, which includes both state and (optionally) actions
const sessionStorageAdapter = {
	getItem: (name: string) => { const v = sessionStorage.getItem(name); return v ? JSON.parse(v) : null; },
	setItem: (name: string, value: any) => sessionStorage.setItem(name, JSON.stringify(value)),
	removeItem: (name: string) => sessionStorage.removeItem(name),
};

export const useLocationStore = create< State & Action >()(
	devtools(
		persist(
			( set ) => ( {
		Selected: {
			name: '',
			meta: '',
		},
		customLocationSelected: {
			country: '',
			city: '',
			lat: '',
			lng: '',

		},
		mncm: {
			name: '',
			meta: '',
		},
		oaac: {
			name: '',
			meta: '',
		},
		hlm: {
			name: '',
			meta: '',
		},
		mfc: {
			name: '',
			meta: '',
		},
		OnSelect: {
			name: '',
			meta: '',
		},
		month: {
			id: '',
			'meta-key': '',
			value: [
				{
					name: '',
					method: '',
				},
			],
		},
		mcMode: {
			id: '',
			'meta-key': '',
			value: [
				{
					name: '',
					method: '',
				},
			],
		},
		asrCal: {
			id: '',
			'meta-key': '',
			value: [
				{
					name: '',
					method: '',
				},
			],
		},
		highLittude: {
			id: '',
			'meta-key': '',
			value: [
				{
					name: '',
					method: '',
				},
			],
		},
		roundingCal: {
			id: '',
			'meta-key': '',
			value: [
				{
					name: '',
					method: '',
				},
			],
		},
		rounding_selected: {
			name: '',
			meta: '',
		},
		roundingEnabled: true,
		smoothing_selected: {
			enabled: true,
			maxSeconds: 90,
			mode: 'noDrift',
			driftBudget: 180,
			manualSteps: {},
		},
		calendar_type: 'gregorian',
		calendar_display: 'span',
		// Only Prayer Calculation Methods + Unified Method start ON; the rest
		// are enabled from the Feature Switches page when needed.
		feature_off_display: 'hide',
		feature_toggles: { ...DEFAULT_FEATURE_TOGGLES },
		next_prayer_countdown: {
			format: 'long',
			show_prefix: false,
			show_suffix: false,
			show_now: false,
			show_seconds: false,
		},
		extra_prayers: createDefaultExtraPrayers(),
		methodsForCal: {
			id: '',
			'meta-key': '',
			value: [
				{
					name: '',
					method: '',
				},
			],
		},
		customLocationData:[],
		skipIqamahMidnight: false,
		skipIqamah: false,
		skipBegins: false,
		skipMidnight: false,
		skipDate: false,
		showSunrise: true,
		showHijriDate: true,
		hidePrinterButton: false,
		hideMonthSelection: false,
		printerButtonUrl: '',
		hideCustomUrlButton: false,
		autoPrintPageUrl: '',

		updateSelected: ( Selected ) => set( () => ( { Selected: Selected } ) ),
		updateMonth: ( month ) => set( () => ( { month: month } ) ),
		mncm_selected: ( mncm ) => set( () => ( { mncm: mncm } ) ),
		oaac_selected: ( oaac ) => set( () => ( { oaac: oaac } ) ),
		hlm_selected: ( hlm ) => set( () => ( { hlm: hlm } ) ),
		mfc_selected: ( mfc ) => set( () => ( { mfc: mfc } ) ),
		cl_selected: ( customLocationSelected ) => set( () => ( { customLocationSelected: customLocationSelected } ) ),
		updateOnSelected: ( OnSelect ) =>
			set( () => ( { OnSelect: OnSelect } ) ),
		updateSetMCMode: ( mcMode ) => set( () => ( { mcMode: mcMode } ) ),
		updateSetMethodsForCal: ( methodsForCal ) =>
			set( () => ( { methodsForCal: methodsForCal } ) ),
		updateSetASRCAL: ( asrCal ) => set( () => ( { asrCal: asrCal } ) ),
		updateSetHighLittude: ( highLittude ) =>
			set( () => ( { highLittude: highLittude } ) ),
		updateCustomLocationData: ( customLocationData ) =>
			set( () => ( { customLocationData: customLocationData } ) ),
		updateSetSkipIqamahMidnight: ( skipIqamahMidnight ) =>
			set( () => ( { skipIqamahMidnight: skipIqamahMidnight } ) ),
		updateSkipIqamah: ( skipIqamah ) =>
			set( () => ( { skipIqamah: skipIqamah } ) ),
		updateSkipBegins: ( skipBegins ) =>
			set( () => ( { skipBegins: skipBegins } ) ),
		updateSkipMidnight: ( skipMidnight ) =>
			set( () => ( { skipMidnight: skipMidnight } ) ),
		updateSkipDate: ( skipDate ) =>
			set( () => ( { skipDate: skipDate } ) ),
		updateShowSunrise: ( showSunrise ) =>
			set( () => ( { showSunrise: showSunrise } ) ),
		updateShowHijriDate: ( showHijriDate ) =>
			set( () => ( { showHijriDate: showHijriDate } ) ),
		updateHidePrinterButton: ( hidePrinterButton ) =>
			set( () => ( { hidePrinterButton: hidePrinterButton } ) ),
		updateHideMonthSelection: ( hideMonthSelection ) =>
			set( () => ( { hideMonthSelection: hideMonthSelection } ) ),
		updatePrinterButtonUrl: ( printerButtonUrl ) =>
			set( () => ( { printerButtonUrl: printerButtonUrl } ) ),
		updateHideCustomUrlButton: ( hideCustomUrlButton ) =>
			set( () => ( { hideCustomUrlButton: hideCustomUrlButton } ) ),
		updateAutoPrintPageUrl: ( autoPrintPageUrl ) =>
			set( () => ( { autoPrintPageUrl: autoPrintPageUrl } ) ),
		// Settings arrays actions
		methodsForCalculation: [],
		asrCalculationMethods: [],
		midnightCalculationModes: [],
		higherLatitudeMethods: [],
		roundingCalculationMethods: [],
		updateMethodsForCalculation: ( methodsForCalculation ) =>
			set( () => ( { methodsForCalculation: methodsForCalculation } ) ),
		updateAsrCalculationMethods: ( asrCalculationMethods ) =>
			set( () => ( { asrCalculationMethods: asrCalculationMethods } ) ),
		updateMidnightCalculationModes: ( midnightCalculationModes ) =>
			set( () => ( { midnightCalculationModes: midnightCalculationModes } ) ),
		updateHigherLatitudeMethods: ( higherLatitudeMethods ) =>
			set( () => ( { higherLatitudeMethods: higherLatitudeMethods } ) ),
		updateRoundingCalculationMethods: ( roundingCalculationMethods ) =>
			set( () => ( { roundingCalculationMethods: roundingCalculationMethods } ) ),
		updateSetRoundingCal: ( roundingCal ) =>
			set( () => ( { roundingCal: roundingCal } ) ),
		rounding_selected_select: ( rounding_selected ) =>
			set( () => ( { rounding_selected: rounding_selected } ) ),
		updateRoundingEnabled: ( enabled ) =>
			set( () => ( { roundingEnabled: enabled } ) ),
		smoothing_selected_update: ( smoothing_selected ) =>
			set( () => ( { smoothing_selected: smoothing_selected } ) ),
		updateCalendarType: ( calendar_type ) =>
			set( () => ( { calendar_type } ) ),
		updateCalendarDisplay: ( calendar_display ) =>
			set( () => ( { calendar_display } ) ),
		feature_toggles_update: ( key, enabled ) =>
			set( ( state ) => ( {
				feature_toggles: { ...state.feature_toggles, [ key ]: enabled },
			} ) ),
		// Bulk replace (used when loading from the database). Merged over the
		// in-memory map so a partially-stored map keeps the factory default for
		// every key it does not carry (see DEFAULT_FEATURE_TOGGLES — some of
		// those defaults are OFF, e.g. Next_Prayer_Countdown).
		feature_toggles_set: ( toggles ) =>
			set( ( state ) => ( {
				feature_toggles: { ...state.feature_toggles, ...toggles },
			} ) ),
		updateFeatureOffDisplay: ( mode ) =>
			set( () => ( { feature_off_display: mode } ) ),
		updateNextPrayerCountdown: ( config ) =>
			set( () => ( { next_prayer_countdown: config } ) ),
		updateExtraPrayers: ( slots ) =>
			set( () => ( { extra_prayers: slots } ) ),

	} ),
		{ name: 'storeLocation', storage: sessionStorageAdapter }
		),
		{ name: 'storeLocation' }
	)
);
