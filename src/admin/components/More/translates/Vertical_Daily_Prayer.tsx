/**
 * Vertical_Daily_Prayer
 *
 * Editor for translating Vertical Daily Prayer display labels.
 *
 * @module More/translates/Vertical_Daily_Prayer
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

// Map known labels to shortcode tags for Vertical Daily Prayer
const VDP_SHORTCODES: Record<string, string> = {
  'Current Local Time': '[Fp_Single_CurrentTime]',
  // Next-prayer countdown unit words
  hour: '[Fp_Single_Next_Prayer_Remaining]',
  hours: '[Fp_Single_Next_Prayer_Remaining]',
  minute: '[Fp_Single_Next_Prayer_Remaining]',
  minutes: '[Fp_Single_Next_Prayer_Remaining]',
  second: '[Fp_Single_Next_Prayer_Remaining]',
  seconds: '[Fp_Single_Next_Prayer_Remaining]',
  Now: '[Fp_Single_Next_Prayer_Remaining]',
  // Countdown connector words (switched on/off in Configure Settings)
  in: '[Fp_Single_Next_Prayer_Remaining]',
  remaining: '[Fp_Single_Next_Prayer_Remaining]',
  left: '[Fp_Single_Next_Prayer_Remaining]',
  'Current Date': '[Fp_Single_CurrentDate]',
  'Current Prayer': '[Fp_Single_Current_Title]',
  Prayer: '[Fp_Single_Prayer_Title]',
  'Next Prayer': '[Fp_Single_Next_Prayer_Title]',
  Begins: '[Fp_Single_Prayer_Begins_Title]',
  Iqamah: '[Fp_Single_Prayer_Iqamah_Title]',
  // fallback prayer names if present here
  Fajr: '[Fp_Single_Fajr_Name]',
  Sunrise: '[Fp_Single_Sunrise_Name]',
  Dhuhr: '[Fp_Single_Dhuhr_Name]',
  Asr: '[Fp_Single_Asr_Name]',
  Maghrib: '[Fp_Single_Maghrib_Name]',
  Isha: '[Fp_Single_Isha_Name]',
};

const Vertical_Daily_Prayer: React.FC = () => (
  <TranslationEditor
    category="vertical_daily_prayer"
    title={__('Edit Vertical Daily Prayer', 'fiveprayer')}
    shortcodes={VDP_SHORTCODES}
    successMessage={__('Vertical daily prayer updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save vertical daily prayer.', 'fiveprayer')}
  />
);

export default Vertical_Daily_Prayer;
