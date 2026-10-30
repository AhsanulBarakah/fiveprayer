/**
 * PrayerNamesEditor
 *
 * Editor for translating individual prayer names.
 *
 * @module More/translates/PrayerNamesEditor
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

// Map known prayer names to their shortcode tags
const PRAYER_NAME_SHORTCODES: Record<string, string> = {
  Fajr: '[Fp_Single_Fajr_Name]',
  Dhuhr: '[Fp_Single_Dhuhr_Name]',
  Asr: '[Fp_Single_Asr_Name]',
  Maghrib: '[Fp_Single_Maghrib_Name]',
  Isha: '[Fp_Single_Isha_Name]',
  Sunrise: '[Fp_Single_Sunrise_Name]',
  Midnight: '[Fp_Single_Midnight_Name]',
};

// Wording shown above a field, for names whose stored key alone is ambiguous.
// The second ‘Asr is stored under “Hanafi” (the school it belongs to), which
// reads like a school rather than a prayer in this list, so the field says what
// it is — “Hanafi Asr”. The entry itself is unchanged: the key stays “Hanafi”
// and the saved translation still resolves for the front end.
const PRAYER_NAME_LABELS: Record<string, string> = {
  Hanafi: __('Hanafi Asr', 'fiveprayer'),
};

const PrayerNamesEditor: React.FC = () => (
  <TranslationEditor
    category="prayer_names"
    title={__('Edit Prayer Names', 'fiveprayer')}
    shortcodes={PRAYER_NAME_SHORTCODES}
    labels={PRAYER_NAME_LABELS}
    successMessage={__('Prayer names updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save prayer names.', 'fiveprayer')}
  />
);

export default PrayerNamesEditor;
