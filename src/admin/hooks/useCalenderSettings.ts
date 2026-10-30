import { useCallback } from 'react';
import { useLocationStore } from '../state/storeLocation';
import { useTuneStore } from '../state/storeTunePrayer';

// Parse a Unified Method margin param to a number, falling back to `fallback`.
const paramNumber = (value: any, fallback: number): number => {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
};

// Helper function to convert param values to proper format
const convertParamValue = (value: any): any => {
	// If it's a string that looks like a number, convert it
	if (typeof value === 'string') {
		// Match pure numbers (e.g., "15", "18.5")
		if (value.match(/^\d+(\.\d+)?$/)) {
			return parseFloat(value);
		}
		// Boolean strings (the Unified Method's enabled flag)
		if (value.toLowerCase() === 'true') return true;
		if (value.toLowerCase() === 'false') return false;
		// Keep strings like "90 min", "Jafari", "Standard", etc.
		return value;
	}
	// If it's already a number or other type, return as-is
	return value;
};

export const useCalenderSettings = () => {
	const imsak = useTuneStore( ( state ) => state.Imsak );
	const fajr = useTuneStore( ( state ) => state.Fajr );
	const sunrise = useTuneStore( ( state ) => state.Sunrise );
	const dhuhr = useTuneStore( ( state ) => state.Dhuhr );
	const asr = useTuneStore( ( state ) => state.Asr );
	const maghrib = useTuneStore( ( state ) => state.Maghrib );
	const sunset = useTuneStore( ( state ) => state.Sunset );
	const isha = useTuneStore( ( state ) => state.Isha );
	const midnight = useTuneStore( ( state ) => state.Midnight );
	const mfc = useLocationStore( ( state ) => state.mfc);
	const oaac = useLocationStore( ( state ) => state.oaac );
	const mncm = useLocationStore( ( state ) => state.mncm );
	const hlm = useLocationStore( ( state ) => state.hlm );
	const methodsForCalculation = useLocationStore( ( state ) => state.methodsForCalculation || [] );
	const rounding_selected = useLocationStore( ( state ) => state.rounding_selected );
	const feature_toggles = useLocationStore( ( state ) => state.feature_toggles || {} );

	// Feature Switches master toggles for the display-only cards. When one is
	// OFF the card is hidden AND its stored dropdown selection is ignored — the
	// engine uses the plain default instead, so a turned-off feature can never
	// silently keep applying its chosen rule.
	const methodsFeatureOff = feature_toggles['Methods_For_Calculation'] === false;
	const asrFeatureOff = feature_toggles['Only_affects_Asr_calculation'] === false;
	const midnightFeatureOff = feature_toggles['midnight_calculation_mode'] === false;
	const highLatsFeatureOff = feature_toggles['Higher_Latitudes_Methods'] === false;

	const settingsPrayer = useCallback( ( prayerTime: {
		adjust: (arg0: Record<string, any>) => void;
		setMethod: (arg0: string | undefined) => void;
		method: (arg0: string | undefined) => void;
		addMethod: (name: string, params: any) => void;
		tune: (arg0: { imsak: string; fajr: string; sunrise: string; dhuhr: string; asr: string; sunset: string; maghrib: string; isha: string; midnight: string; }) => void;
		round: (rounding: string, roundingThreshold?: number) => void;
		methods: any;
	} ) => {
		let selectedMethodParams: any = null;
		let selectedMethodCode: string = 'MWL';
		const rawMethodCode = (mfc.meta || (mfc as any).method || mfc.name || 'MWL').toString();
		const isUnifiedMethod =
			rawMethodCode.toLowerCase() === 'unified_method' ||
			rawMethodCode.toLowerCase() === 'unified method';

		if (Array.isArray(methodsForCalculation) && methodsForCalculation.length > 0) {
			let matchedMethod: any = null;
			
			methodsForCalculation.forEach((method: any) => {
				if (method.method && method.params) {
					const params: any = {};
					Object.entries(method.params).forEach(([key, value]: [string, any]) => {
						const lowerKey = key.toLowerCase();
						params[lowerKey] = convertParamValue(value);
					});

					prayerTime.addMethod(method.method, params);

					if (method.method.toLowerCase() === rawMethodCode.toLowerCase()) {
						matchedMethod = { code: method.method, params };
					}
					else if (method.name && method.name.toLowerCase() === rawMethodCode.toLowerCase()) {
						matchedMethod = { code: method.method, params };
					}
					else if (method.name) {
						const nameMatch = method.name.match(/\(([^)]+)\)/);
						if (nameMatch && nameMatch[1].toLowerCase() === rawMethodCode.toLowerCase()) {
							matchedMethod = { code: method.method, params };
						}
					}
				}
			});

			if (matchedMethod) {
				selectedMethodParams = matchedMethod.params;
				selectedMethodCode = matchedMethod.code;
			} else {
				const match = rawMethodCode.match(/\(([^)]+)\)/);
				if (match) {
					selectedMethodCode = match[1];
				}
			}
		}

		// When the Unified Method is selected but its "Enable Unified Method
		// criteria" switch is OFF, its custom params are ignored entirely — the
		// engine behaves like a standard method (default Fajr/Isha from MWL +
		// Asr/Midnight/Higher Latitude from the dropdowns). Computed BEFORE the
		// method() call so the disabled method's own fajr/isha are never selected.
		const unifiedDisabled =
			isUnifiedMethod &&
			(selectedMethodParams?.enabled === false ||
				// Feature Switches "Unified Method" master switch — OFF bypasses the
				// criteria (margins included) even if the entry flag is stale.
				useLocationStore.getState().feature_toggles?.['Unified_Method_Settings'] === false);

		// Fall back to MWL as the base method when the Unified Method is
		// disabled — method() copies the registered params (fajr/isha/…) into
		// the settings, so selecting UNIFIED_METHOD would apply its criteria
		// even without an adjust() call below. "Prayer Calculation Methods"
		// OFF ignores the method dropdown entirely and always uses MWL (the
		// plain engine default).
		prayerTime.method( methodsFeatureOff || unifiedDisabled ? 'MWL' : selectedMethodCode );

		// Build the adjust object without undefined values so the method's own
		// params (set by method()/addMethod) are never overwritten. The unified
		// fajr/isha are skipped entirely when the feature is off.
		const adjustParams: Record<string, any> = {};
		if (!unifiedDisabled && selectedMethodParams?.fajr !== undefined) adjustParams.fajr = selectedMethodParams.fajr;
		if (!unifiedDisabled && selectedMethodParams?.isha !== undefined) adjustParams.isha = selectedMethodParams.isha;

		// NOTE: dhuhr/maghrib minute offsets come from the tune store below (tune()),
		// so adjust() must NOT receive them again — otherwise they are applied twice
		// (e.g. Tune Dhuhr = 5 would shift Dhuhr by 10 minutes).
		if (isUnifiedMethod && !unifiedDisabled) {
			// Unified Method maps exact custom criteria: fajr/isha (and optionally
			// dhuhr/maghrib) come from its params. Asr, Midnight and Higher Latitude
			// are deliberately NOT stored in the Unified Method — they are always
			// taken from the Prayer Settings page dropdowns so there is exactly one
			// place controlling them.
			adjustParams.dhuhr = selectedMethodParams?.dhuhr !== undefined ? selectedMethodParams.dhuhr : '0 min';
			adjustParams.maghrib = selectedMethodParams?.maghrib !== undefined ? selectedMethodParams.maghrib : '0 min';
			// Feature OFF forces the plain default for that rule (Asr Standard /
			// Midnight Standard / Higher Latitudes None — no adjustment) so a
			// hidden card's stored dropdown never silently applies.
			adjustParams.asr = asrFeatureOff ? 'Standard' : oaac.method;
			adjustParams.midnight = midnightFeatureOff ? 'Standard' : mncm.method;
			adjustParams.highLats = highLatsFeatureOff ? 'None' : hlm.method;
			if (selectedMethodParams?.iterations !== undefined) {
				adjustParams.iterations = Math.min(5, Math.max(1, Number(selectedMethodParams.iterations) || 1));
			}
		} else {
			// Standard methods keep the existing behavior: asr/midnight/high latitudes
			// from the dropdowns; dhuhr/maghrib offsets come from the tune store only.
			adjustParams.dhuhr = '0 min';
			adjustParams.asr = asrFeatureOff ? 'Standard' : oaac.method;
			adjustParams.maghrib = '0 min';
			adjustParams.midnight = midnightFeatureOff ? 'Standard' : mncm.method;
			adjustParams.highLats = highLatsFeatureOff ? 'None' : hlm.method;
		}

		prayerTime.adjust( adjustParams );

		// Rounding method from Configure Settings (nearest | up | down | none)
		// plus the custom seconds threshold for 'nearest' (0-59, default 30).
		// Falls back to the library defaults when nothing is selected. When the
		// per-feature rounding switch is OFF every consumer gets the standard
		// nearest@30 (the plain engine behavior) — same rule the generation
		// pipeline enforces via getRoundingConfig.
		const roundingEnabledStore = useLocationStore.getState().roundingEnabled;
		// The Feature Switches "Rounding Method" OFF also forces standard
		// nearest@30 — belt and braces on top of the loader's derived flag, so
		// a hidden/off feature can never still apply its custom rounding.
		const roundingFeatureOff =
			useLocationStore.getState().feature_toggles?.['Rounding_Method'] === false;
		const customRoundingOn = roundingEnabledStore !== false && !roundingFeatureOff;
		const roundingMethod = customRoundingOn
			? (rounding_selected?.method || 'nearest')
			: 'nearest';
		const roundingThreshold = customRoundingOn
			? rounding_selected?.threshold
			: 30;
		prayerTime.round( roundingMethod, roundingThreshold );

		// London Unified safety margins (published timetable): while the
		// Unified Method is active and its margins are enabled, the fixed
		// Sunrise −3 / Dhuhr +6 / Asr +1 minute offsets REPLACE the global
		// Tune Prayer values for those three prayers (they are the method's own
		// published-table rules — stacking them on the Tune Prayer values would
		// double-apply if a user had tuned those prayers globally).
		const unifiedMarginsOn =
			isUnifiedMethod && !unifiedDisabled && selectedMethodParams?.marginsenabled !== false;
		const tuneSunrise = unifiedMarginsOn
			? String( paramNumber( selectedMethodParams?.sunriseoffset, -3 ) )
			: sunrise;
		const tuneDhuhr = unifiedMarginsOn
			? String( paramNumber( selectedMethodParams?.dhuhroffset, 6 ) )
			: dhuhr;
		const tuneAsr = unifiedMarginsOn
			? String( paramNumber( selectedMethodParams?.asroffset, 1 ) )
			: asr;

		prayerTime.tune( {
			imsak,
			fajr,
			sunrise: tuneSunrise,
			dhuhr: tuneDhuhr,
			asr: tuneAsr,
			sunset,
			maghrib,
			isha,
			midnight,
		} );
	}, [
		imsak, fajr, sunrise, dhuhr, asr, maghrib, sunset, isha, midnight,
		mfc, oaac, mncm, hlm, methodsForCalculation, rounding_selected, feature_toggles,
	] );

	return { settingsPrayer };
};
