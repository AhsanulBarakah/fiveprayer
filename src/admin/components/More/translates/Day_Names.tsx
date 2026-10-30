/**
 * Day_Names
 *
 * Editor for translating the optional Day column / day line: weekday full
 * names (Monday … Sunday), their short forms (Mon … Sun) and day-of-month
 * numbers (1st … 31st). English and Arabic ship as defaults; users can add
 * more languages like any other translation section.
 *
 * @module More/translates/Day_Names
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

// Best-effort badges so the editor shows where each family of entries is used.
const DAY_NAME_SHORTCODES: Record<string, string> = {
  Monday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
  Tuesday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
  Wednesday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
  Thursday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
  Friday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
  Saturday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
  Sunday: '[Fp_TimeTable_Monthly] · [Fp_Vertical_Daily_Prayer]',
};

const Day_Names: React.FC = () => (
  <TranslationEditor
    category="day_names"
    title={__('Edit Day Names', 'fiveprayer')}
    description={__(
      'Translate weekday full names, short names and day-of-month numbers used by the optional Day column and the Vertical Today header line.',
      'fiveprayer'
    )}
    shortcodes={DAY_NAME_SHORTCODES}
    successMessage={__('Day names updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save day names.', 'fiveprayer')}
  />
);

export default Day_Names;
