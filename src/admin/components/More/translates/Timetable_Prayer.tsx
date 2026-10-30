/**
 * Timetable_Prayer
 *
 * Editor for translating Timetable Prayer display labels.
 *
 * @module More/translates/Timetable_Prayer
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

// Map known labels to shortcode tags for Timetable Prayer
const TIMETABLE_SHORTCODES: Record<string, string> = {
  Prayer: '', // no direct shortcode; leave empty to avoid badge
  Begins: '[Fp_Single_Prayer_Begins_Title]',
  Iqamah: '[Fp_Single_Prayer_Iqamah_Title]',
  'Current Local Time': '[Fp_Single_CurrentTime]',
  'Current Date': '[Fp_Single_CurrentDate]',
  'Current Title': '[Fp_Single_Current_Title]',
  'Current Location': '[Fp_Single_Current_Location]',
  'Prayer Times For Today': '[Fp_Single_PTFT]',
  // Prayer name fallbacks
  Fajr: '[Fp_Single_Fajr_Name]',
  Sunrise: '[Fp_Single_Sunrise_Name]',
  Dhuhr: '[Fp_Single_Dhuhr_Name]',
  Asr: '[Fp_Single_Asr_Name]',
  Maghrib: '[Fp_Single_Maghrib_Name]',
  Isha: '[Fp_Single_Isha_Name]',
};

const Timetable_Prayer: React.FC = () => (
  <TranslationEditor
    category="timetable_prayer"
    title={__('Edit Timetable Prayer', 'fiveprayer')}
    shortcodes={TIMETABLE_SHORTCODES}
    successMessage={__('Timetable prayer updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save timetable prayer.', 'fiveprayer')}
  />
);

export default Timetable_Prayer;
