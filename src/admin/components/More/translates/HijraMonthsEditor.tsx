/**
 * HijraMonthsEditor
 *
 * Editor for translating Hijri calendar month names.
 *
 * @module More/translates/HijraMonthsEditor
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

const HijraMonthsEditor: React.FC = () => (
  <TranslationEditor
    category="hijra_months"
    title={__('Edit Hijra Months', 'fiveprayer')}
    successMessage={__('Hijra months updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save Hijra months.', 'fiveprayer')}
  />
);

export default HijraMonthsEditor;
