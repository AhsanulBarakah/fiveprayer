/**
 * GregorianNumbersEditor
 *
 * Editor for translating Gregorian calendar number strings.
 *
 * @module More/translates/GregorianNumbersEditor
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

const GregorianNumbersEditor: React.FC = () => (
  <TranslationEditor
    category="gregorian_numbers"
    title={__('Edit Gregorian Numbers', 'fiveprayer')}
    successMessage={__('Gregorian numbers updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save Gregorian numbers.', 'fiveprayer')}
  />
);

export default GregorianNumbersEditor;
