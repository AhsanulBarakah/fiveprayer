/**
 * GregorianMonthsEditor
 *
 * Editor for translating Gregorian calendar month names.
 *
 * @module More/translates/GregorianMonthsEditor
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

const GregorianMonthsEditor: React.FC = () => (
  <TranslationEditor
    category="gregorian_months"
    title={__('Edit Gregorian Months', 'fiveprayer')}
    successMessage={__('Gregorian months updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save Gregorian months.', 'fiveprayer')}
  />
);

export default GregorianMonthsEditor;
