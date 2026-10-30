/**
 * HijraNumbersEditor
 *
 * Editor for translating Hijri calendar number strings.
 *
 * @module More/translates/HijraNumbersEditor
 */
import React from 'react';
import TranslationEditor from './TranslationEditor';
import { __ } from '@wordpress/i18n';

const HijraNumbersEditor: React.FC = () => (
  <TranslationEditor
    category="hijra_numbers"
    title={__('Edit Hijra Numbers', 'fiveprayer')}
    successMessage={__('Hijra numbers updated successfully!', 'fiveprayer')}
    errorMessage={__('Failed to save Hijra numbers.', 'fiveprayer')}
  />
);

export default HijraNumbersEditor;
