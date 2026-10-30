/**
 * ExtraPrayersSettings
 *
 * Configuration panel for the "Extra Prayers" category in the Calculation
 * Settings page. Six optional slots for the prayers a mosque prays on top of
 * the five daily prayers — e.g. two Jumu'ah (Friday) congregations or the
 * extra Eid prayers.
 *
 * Each slot has a name, a time and an optional note, rendered by
 * [Fp_Extra_Prayer_1] … [Fp_Extra_Prayer_6]. The name and note are free text
 * resolved through the site's Translate system (More → Translate → Extra
 * Info), so they display in the visitor's language. The time is stored as
 * 24-hour HH:MM and shown in the site's time format.
 *
 * The master on/off is the `Extra_Prayers` feature switch (Feature Switches
 * page); while it is off every slot renders nothing. The data is stored in the
 * `extra_prayers` meta and applies on the next page load — no calendar
 * regeneration is required.
 *
 * @module prayerSetting/ExtraPrayersSettings
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLocationStore, createDefaultExtraPrayers } from '../../state/storeLocation';
import type { ExtraPrayerSlot } from '../../state/storeLocation';
import { usePostMeta } from '../../hooks/usePostMeta';
import { useTranslationStore } from '../../state/useTranslationStore';
import { useCopyShortcode } from '../Docs/shortcodes/useCopyShortcode';
import { formatWpClock } from '../../utils/formatWpTime';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';
import { FaCheck, FaCopy } from 'react-icons/fa';

interface ExtraPrayersSettingsProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

const FEATURE_KEY = 'Extra_Prayers';

/** Admin path to the translate editor that holds the extra-prayer labels. */
const TRANSLATE_PATH = '/moresettings/translate/extra_info';

const slotShortcode = (index: number): string => `[Fp_Extra_Prayer_${index}]`;

/** A master-switch style on/off panel, matching the other settings panels. */
const SwitchPanel: React.FC<{
  title: React.ReactNode;
  description: React.ReactNode;
  on: boolean;
  onChange: (next: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}> = ({ title, description, on, onChange, onLabel = 'On', offLabel = 'Off' }) => (
  <div className="flex items-center justify-between gap-4 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`h-10 px-4 flex items-center gap-2 rounded-lg border text-sm font-medium transition-all focus:outline-hidden shrink-0 ${
        on ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
      }`}
    >
      <span>{on ? onLabel : offLabel}</span>
      <span className={`w-9 h-5 rounded-full relative transition-colors ${on ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  </div>
);

const ExtraPrayersSettings: React.FC<ExtraPrayersSettingsProps> = ({ title, description, icon }) => {
  const storedSlots = useLocationStore((state) => state.extra_prayers);
  const updateExtraPrayers = useLocationStore((state) => state.updateExtraPrayers);
  const feature_toggles = useLocationStore((state) => state.feature_toggles || {});
  const feature_toggles_update = useLocationStore((state) => state.feature_toggles_update);
  const { saveBatch } = usePostMeta();
  const fetchTranslations = useTranslationStore((state) => state.fetchTranslations);
  const activeLanguage = useTranslationStore((state) => state.activeLanguage);
  const hijralocales = useTranslationStore((state) => state.hijralocales);
  const gregorianNumbers = useTranslationStore((state) => state.gregorian_numbers);
  const { copied, copy } = useCopyShortcode();

  const enabled = feature_toggles[FEATURE_KEY] === true;

  // The input stores a plain 24-hour "HH:MM" (native <input type="time">), but
  // the site prints it in WordPress's own time format (Settings → General →
  // Time Format) with the seconds part dropped — exactly what
  // [Fp_Extra_Prayer_*] renders. Showing it here keeps panel and frontend
  // in agreement.
  const siteTimeFormat = (window.FivePrayerData?.time_format || 'g:i a').replace(':s', '');
  const customLan = hijralocales?.isActive === true && hijralocales?.customLan === true;
  const lang = activeLanguage || 'en';

  const digitMap = useMemo(() => {
    if (!customLan) return null;
    const map: Record<string, string> = {};
    for (const entry of gregorianNumbers || []) {
      if (entry.language_code === lang) map[entry.original_text] = entry.translated_text;
    }
    return map;
  }, [customLan, lang, gregorianNumbers]);

  /** Render a stored slot time the way the site will display it. */
  const formatSlotTime = (time: string): string => {
    const match = /^(\d{1,2}):(\d{2})/.exec((time || '').trim());
    if (!match) return '';

    return formatWpClock(
      { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10), seconds: 0 },
      siteTimeFormat,
      customLan
        ? {
            digit: (digit) => digitMap?.[digit] ?? digit,
            meridiem: (period) => {
              const entry = (gregorianNumbers || []).find(
                (row) => row.language_code === lang && row.original_text.toUpperCase() === period
              );
              return entry?.translated_text;
            },
          }
        : undefined
    );
  };

  const [slots, setSlots] = useState<ExtraPrayerSlot[]>(
    Array.isArray(storedSlots) && storedSlots.length ? storedSlots : createDefaultExtraPrayers()
  );
  const [dirty, setDirty] = useState(false);

  // Adopt the loaded values until the admin starts editing, so a late meta
  // load never overwrites in-progress typing.
  useEffect(() => {
    if (!dirty && Array.isArray(storedSlots) && storedSlots.length) {
      setSlots(storedSlots);
    }
  }, [storedSlots, dirty]);

  /** Normalize any edit into the fixed six-slot shape. */
  const normalize = (input: ExtraPrayerSlot[]): ExtraPrayerSlot[] =>
    createDefaultExtraPrayers().map((fallback, index) => {
      const row = input[index];
      return {
        name: typeof row?.name === 'string' ? row.name : fallback.name,
        time: typeof row?.time === 'string' ? row.time : fallback.time,
        note: typeof row?.note === 'string' ? row.note : fallback.note,
      };
    });

  const updateSlot = (index: number, field: keyof ExtraPrayerSlot, value: string) => {
    setSlots((prev) => {
      const next = normalize(prev);
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    const normalized = normalize(slots);
    updateExtraPrayers(normalized);
    setDirty(false);
    saveBatch({ extra_prayers: normalized })
      .then(() => {
        setDirty(false);
        // The saved names/notes become translatable entries in More →
        // Translate → Extra Info, so refresh that store right away instead of
        // waiting for the next full admin page load.
        fetchTranslations();
      })
      .catch(() => toast.error(__('Could not save the extra prayers.', 'fiveprayer')));
  };

  const toggleEnabled = () => {
    const next = !enabled;
    feature_toggles_update(FEATURE_KEY, next);
    saveBatch({ feature_toggles: { ...feature_toggles, [FEATURE_KEY]: next } }).catch(() => {});
  };

  const configuredCount = slots.filter((slot) => slot.name !== '' || slot.time !== '').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Master switch (shared with Feature Switches) */}
          <SwitchPanel
            title={__('Enable extra prayers', 'fiveprayer')}
            description={__('Turns on the six extra-prayer shortcodes and exposes the data in the Mosque Info API. While off, every [Fp_Extra_Prayer_*] shortcode renders nothing.', 'fiveprayer')}
            on={enabled}
            onChange={toggleEnabled}
            onLabel="Enabled"
            offLabel="Disabled"
          />

          <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{__('Extra prayer slots', 'fiveprayer')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {__('Add up to six prayers — for example two Jumu‘ah congregations, or the Eid prayers. Leave a slot blank to skip it. The name and note are translated under More → Translate → Extra Info.', 'fiveprayer')}
                </p>
              </div>
              <Link
                to={TRANSLATE_PATH}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 shrink-0"
              >
                {__('Translate the names', 'fiveprayer')}
              </Link>
            </div>

            <div className="space-y-4">
              {slots.map((slot, index) => {
                const shortcode = slotShortcode(index + 1);
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {__('Slot', 'fiveprayer')} {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(shortcode)}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                          copied[shortcode]
                            ? 'border-green-300 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700'
                        }`}
                        title={__('Copy this shortcode', 'fiveprayer')}
                      >
                        {copied[shortcode] ? <FaCheck className="h-3 w-3" /> : <FaCopy className="h-3 w-3" />}
                        {shortcode}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          {__('Prayer name', 'fiveprayer')}
                        </label>
                        <input
                          type="text"
                          value={slot.name}
                          onChange={(e) => updateSlot(index, 'name', e.target.value)}
                          placeholder={__('e.g. Jumu‘ah 1', 'fiveprayer')}
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          {__('Time', 'fiveprayer')}
                        </label>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={(e) => updateSlot(index, 'time', e.target.value)}
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden"
                        />
                        {formatSlotTime(slot.time) ? (
                          <p className="mt-1 text-[11px] text-gray-500">
                            {__('Shows on your site as', 'fiveprayer')}{' '}
                            <span className="font-medium text-gray-700">
                              {formatSlotTime(slot.time)}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          {__('Note (optional)', 'fiveprayer')}
                        </label>
                        <input
                          type="text"
                          value={slot.note}
                          onChange={(e) => updateSlot(index, 'note', e.target.value)}
                          placeholder={__('e.g. Khutbah', 'fiveprayer')}
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500">
                {configuredCount > 0
                  ? __('{count} slot(s) have data.', 'fiveprayer').replace('{count}', String(configuredCount))
                  : __('No slots configured yet.', 'fiveprayer')}
              </p>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {__('Save extra prayers', 'fiveprayer')}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            {__('Use the shortcode anywhere on your site, e.g. [Fp_Extra_Prayer_1]. Each shortcode also accepts name="…", time="…" and note="…" to override the saved slot for a single placement. Changes apply on the next page load.', 'fiveprayer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExtraPrayersSettings;
