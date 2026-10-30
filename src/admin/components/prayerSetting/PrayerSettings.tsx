/**
 * Prayer Settings Dropdowns Component
 *
 * Configuration panel for calculation method, location, month, ASR calculation,
 * higher latitude method, and midnight calculation mode. Includes auto-sync
 * of midnight mode when calculation method changes, and month update with save.
 *
 * @module prayerSetting/PrayerSettings
 */
import React from 'react';
import { useLocationStore } from '../../state/storeLocation';
import Dropdown from '../ui/Dropdown';
import { useMonth } from '../../hooks/useMonth';
import { usePostControlFromUI } from '../../hooks/usePostControlFromUI';
import { useConditional } from '../../state/storeConditional';
import { toast } from 'sonner';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useTimetableLayoutStore } from '../../state/storeTimetableLayout';
import UnifiedMethodSettings from './UnifiedMethodSettings';
import { __ } from '@wordpress/i18n';

type Location = {
  name?: string | undefined;
  method?: string | undefined;
  id?: string | undefined;
  country?: string | undefined;
  city?: string | undefined;
  lat?: string | undefined;
  lng?: string | undefined;
};

const PrayerSettingDropDown = () => {
  const month = useLocationStore((state) => state.month);
  const oaac = useLocationStore((state) => state.oaac);
  const mncm = useLocationStore((state) => state.mncm);
  const hlm = useLocationStore((state) => state.hlm);
  const mfc = useLocationStore((state) => state.mfc);
  const asrCal = useLocationStore((state) => state.asrCal);
  const mcMode = useLocationStore((state) => state.mcMode);
  const highLittude = useLocationStore((state) => state.highLittude);
  const { customLocationData, customLocationSelected, cl_selected, mncm_selected } = useLocationStore((state) => state);
  const methodsForCal = useLocationStore((state) => state.methodsForCal);
  const { MonthList } = useMonth();
  const [asr, setAsr] = React.useState(oaac);
  const [mnc, setMncm] = React.useState(mncm);
  const [mf, setMfc] = React.useState(mfc);
  const [hl, setHlm] = React.useState(hlm);
  const [CustomLocationS, setCustomLocationS] = React.useState<Location>(customLocationSelected);
  const [months, setMonth] = React.useState(month);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [monthChanged, setMonthChanged] = React.useState(false);
  const { isReadyGenerator, updateIsReadyGenerator, updateIsReadyToPost } = useConditional();
  const { getSelectedFromUI } = usePostControlFromUI();

  const lastSyncedMethodRef = React.useRef<string>('');
  const prevMethodRef = React.useRef<string>('');

  React.useEffect(() => {
    const currentMethod = mf?.method || '';
    if (currentMethod === lastSyncedMethodRef.current) return;
    if (prevMethodRef.current === '' || currentMethod === prevMethodRef.current) {
      prevMethodRef.current = currentMethod;
      lastSyncedMethodRef.current = currentMethod;
      return;
    }
    prevMethodRef.current = currentMethod;
    if (!mf || !mcMode?.value) return;
    const methodParams = mf.params as Record<string, unknown> | undefined;
    if (!methodParams) return;
    const midnightFromMethod = String(methodParams.midnight ?? methodParams.Midnight ?? 'Standard').toLowerCase();
    const mcModeOptions = Array.isArray(mcMode.value) ? mcMode.value : [];
    const matchingMode = mcModeOptions.find((mode: any) => {
      const modeName = mode.name || '';
      const modeMethod = mode.method || '';
      if (midnightFromMethod.includes('jafari')) {
        return modeName.toLowerCase().includes('jafari') || modeMethod.toLowerCase() === 'jafari';
      } else {
        return modeName.toLowerCase().includes('standard') || modeMethod.toLowerCase() === 'standard';
      }
    });
    if (matchingMode) {
      const isDifferent = !mnc || mnc.method?.toLowerCase() !== matchingMode.method?.toLowerCase();
      if (isDifferent) {
        setMncm(matchingMode);
        getSelectedFromUI({ meta: 'mncm_selected', value: matchingMode });
        lastSyncedMethodRef.current = currentMethod;
        toast.info(__('🌙 Midnight Mode Auto-Updated', 'fiveprayer'), {
          description: `Set to "${matchingMode.name}" based on selected method`,
          duration: 3000,
        });
      } else {
        lastSyncedMethodRef.current = currentMethod;
      }
    }
  }, [mf, mcMode, mnc, getSelectedFromUI, updateIsReadyGenerator, updateIsReadyToPost]);

  React.useEffect(() => { cl_selected(CustomLocationS); }, [CustomLocationS]);
  React.useEffect(() => { setAsr(oaac); setHlm(hlm); setMfc(mfc); setMncm(mncm); setMonth(month); }, [oaac, hlm, mfc, mncm, month, methodsForCal]);

  React.useEffect(() => {
    if ((mfc?.meta || mfc?.method) && methodsForCal?.value) {
      const methods = Array.isArray(methodsForCal.value) ? methodsForCal.value : [];
      const selectedMethod = methods.find((method: any) =>
        method.method?.toLowerCase() === mfc.meta?.toLowerCase() ||
        method.method?.toLowerCase() === (mfc as any).method?.toLowerCase() ||
        method.method?.toLowerCase() === mfc.name?.toLowerCase()
      );
      if (selectedMethod && selectedMethod.params) {
        setMfc({ ...mfc, params: selectedMethod.params });
      }
    }
  }, [mfc?.meta, (mfc as any)?.method, mfc?.name, methodsForCal]);

  React.useEffect(() => { setCustomLocationS(customLocationSelected); }, [customLocationSelected]);

  /**
   * Choosing the combined “Shafii, Maliki, Jafari, Hanbali and Hanafi
   * (Asr + Hanafi)” option means both ‘Asr times should print, so the Hanafi
   * column is raised here right away; the save persists the same flag
   * server-side (PrayerSettingsMetaController → enable_asr2_column_for_combined_asr).
   */
  const handleAsrChange = (value: any) => {
    setAsr(value);
    const combinedName = String(value?.name || '').toLowerCase();
    const isCombined =
      Number(value?.id) === 31 ||
      combinedName.includes('(asr + hanafi)') ||
      // The label an older release shipped, for a selection saved before
      // the upgrade renamed it.
      combinedName.includes('(asr + asr 2)');
    if (isCombined) {
      useTimetableLayoutStore.getState().updateOption('showAsr2', true);
    }
  };

  // The saved selection can be missing (older data, first load, or after a
  // reset) while the saved-locations list is present. Auto-select the first
  // entry so the "Location, City" field is never left empty.
  React.useEffect(() => {
    const list = Array.isArray(customLocationData?.value) ? (customLocationData.value as Location[]) : [];
    const hasSelection = !!(customLocationSelected && (customLocationSelected.country || customLocationSelected.city || customLocationSelected.lat || customLocationSelected.lng));
    if (!hasSelection && list.length > 0) {
      const first = list[0];
      setCustomLocationS(first);
      cl_selected(first);
    }
  }, [customLocationData, customLocationSelected, cl_selected]);

  const { saveBatch } = usePostMeta();

  const updateHandler = async () => {
    if (!monthChanged) return;
    setIsUpdating(true);
    setMonthChanged(false);
    try {
      await saveBatch({ month: months });
      toast.success(__('Month updated', 'fiveprayer'));
    } catch (error) {
      console.error('Failed to update month:', error);
      toast.error(__('Failed to save month', 'fiveprayer'));
    } finally {
      setTimeout(() => setIsUpdating(false), 2000);
    }
  };

  // Only meaningful for plain numeric months (1-12). In Hijri Calendar Type
  // mode the method key is `hijri-<year>-<month>`, which parseInt can't read.
  const isMonthStale =
    months?.method &&
    /^\d+$/.test(String(months.method)) &&
    parseInt(String(months.method)) !== new Date().getMonth() + 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{__('Prayer Settings', 'fiveprayer')}</h2>
            <p className="text-xs text-gray-500">{__('Configure calculation method, location and month', 'fiveprayer')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isMonthStale && !isUpdating && !monthChanged && (
            <span className="text-[11px] text-blue-600">{__('Month is outdated', 'fiveprayer')}</span>
          )}
          {monthChanged && (
            <span className="text-[11px] text-amber-600">{__('Month changed — save now', 'fiveprayer')}</span>
          )}
          <button
            onClick={updateHandler}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors focus:outline-hidden ${
              isUpdating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : monthChanged
                  ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse'
                  : isMonthStale
                    ? 'bg-blue-100 text-blue-600 cursor-default'
                    : 'bg-green-700 text-white hover:bg-green-800'
            }`}
            disabled={isUpdating || !monthChanged}
          >
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>{__('Updating...', 'fiveprayer')}</span>
          ) : 'Update Month'}
        </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          <Dropdown label={__('Month', 'fiveprayer')} meta="month" options={{ value: MonthList }} value={months} onChange={(value) => { setMonth(value); setMonthChanged(true); }} skipReady />
          <Dropdown label={__('Location, City', 'fiveprayer')} meta="location" options={customLocationData} value={CustomLocationS} onChange={(value) => setCustomLocationS(value)} />
          <Dropdown label={__('Higher Latitude Adjustment', 'fiveprayer')} meta="hlm_selected" options={highLittude} value={hl} onChange={(value) => setHlm(value)} />
          <Dropdown label={__('Calculation Method', 'fiveprayer')} meta="mfc_selected" options={methodsForCal} value={mf} onChange={(value) => setMfc(value)} />
          <Dropdown label={__('Asr Calculation', 'fiveprayer')} meta="oaac_selected" options={asrCal} value={asr} onChange={handleAsrChange} />
          <Dropdown label={__('Midnight Calculation Mode', 'fiveprayer')} meta="mncm_selected" options={mcMode} value={mnc} onChange={(value) => setMncm(value)} />
        </div>

      </div>
    </div>
  );
};

export default PrayerSettingDropDown;
