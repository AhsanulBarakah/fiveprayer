/**
 * ExtraInfo
 *
 * Editor for translating extra info labels.
 *
 * The configured "extra prayer" names and notes (Configure Settings → Extra
 * Prayers) are free text stored in the `extra_prayers` meta. Their translations
 * live in the `extra_info` collection, so this editor lists them alongside the
 * built-in labels and shows the shortcode each one drives.
 *
 * @module More/translates/ExtraInfo
 */
import React, { useEffect, useMemo } from 'react';
import TranslationEditor from './TranslationEditor';
import { useLocationStore } from '../../../state/storeLocation';
import { useTranslationStore } from '../../../state/useTranslationStore';
import { __ } from '@wordpress/i18n';

// Map known extra info labels to shortcode tags
const EXTRA_INFO_SHORTCODES: Record<string, string> = {
  'Current Local Time': '[Fp_Single_CurrentTime]',
  'Current Date': '[Fp_Single_CurrentDate]',
  'Current Title': '[Fp_Single_Current_Title]',
  'Current Prayer': '[Fp_Single_Current_Title]',
  'The Current Prayer': '[Fp_Single_Current_Title]',
  'Current Location': '[Fp_Single_Current_Location]',
  'Masjid Name': '[Fp_Single_Masjid_Name]',
  'Next Prayer Title': '[Fp_Single_Next_Prayer_Title]',
  'Next Prayer Begins Title': '[Fp_Single_Next_Prayer_Begins_Title]',
  'Next Prayer Begins Time': '[Fp_Single_Next_Prayer_Begins_Time]',
  'Next Prayer Iqamah Title': '[Fp_Single_Next_Prayer_Iqamah_Title]',
  'Next Prayer Iqamah Time': '[Fp_Single_Next_Prayer_Iqamah_Time]',
  'Prayer Times For Today': '[Fp_Single_PTFT]',
  // Printer Button Text - no shortcode, just custom text for printer button
};

const ExtraInfo: React.FC = () => {
  const extraPrayers = useLocationStore((state) => state.extra_prayers);
  const fetchTranslations = useTranslationStore((state) => state.fetchTranslations);

  // The phrase list is built server-side from the saved extra-prayer slots, so
  // re-fetch on open: the store is otherwise only loaded once at app start and
  // would still show the snapshot from before the admin configured the slots.
  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  // Add the six configurable extra-prayer slots so each configured name/note
  // shows the [Fp_Extra_Prayer_N] badge it drives.
  const shortcodes = useMemo(() => {
    const map: Record<string, string> = { ...EXTRA_INFO_SHORTCODES };
    (Array.isArray(extraPrayers) ? extraPrayers : []).forEach((slot, index) => {
      const shortcode = `[Fp_Extra_Prayer_${index + 1}]`;
      const name = (slot?.name || '').trim();
      const note = (slot?.note || '').trim();
      if (name) map[name] = shortcode;
      if (note) map[note] = shortcode;
    });
    return map;
  }, [extraPrayers]);

  return (
    <TranslationEditor
      category="extra_info"
      title={__('Edit Extra Info Translations', 'fiveprayer')}
      shortcodes={shortcodes}
      successMessage={__('Extra info translations updated successfully!', 'fiveprayer')}
      errorMessage={__('Failed to save extra info translations.', 'fiveprayer')}
    />
  );
};

export default ExtraInfo;
