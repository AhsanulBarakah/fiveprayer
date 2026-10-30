/**
 * The Prayer Names editor offers the Hanafi name.
 *
 * The optional second ‘Asr is the Hanafi (2 Mithl) time, printed as “Hanafi”. It
 * is a prayer name, so More → Translate → Prayer Names is where a mosque renames
 * it. It shipped later than the other names, which makes it easy for the editor
 * to drop it again (e.g. by filtering the collection): this renders the real
 * editor around a store that carries the entry and checks the field is there,
 * editable, and mapped to its place in the store.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const entries = vi.hoisted(() => [
  { original_text: 'Fajr', translated_text: 'Fajr', language_code: 'en', language_name: 'English' },
  { original_text: 'Asr', translated_text: 'Asr', language_code: 'en', language_name: 'English' },
  { original_text: 'Hanafi', translated_text: 'Hanafi (2 Mithl)', language_code: 'en', language_name: 'English' },
  { original_text: 'Maghrib', translated_text: 'Maghrib', language_code: 'en', language_name: 'English' },
]);

// The editor reads every value through the store's selector form, and the
// "Add Language" button calls the hook without one — the fake backs both.
vi.mock('../../../src/admin/state/useTranslationStore', () => {
  const state = {
    prayer_names: entries,
    activeLanguage: 'en',
    availableLanguages: [{ code: 'en', language: 'English' }],
    loading: false,
    selectLanguage: () => {},
    updateTranslation: () => {},
    saveTranslations: async () => {},
    addNewLanguage: () => {},
  };

  return {
    useTranslationStore: (selector?: (value: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

import PrayerNamesEditor from '../../../src/admin/components/More/translates/PrayerNamesEditor';

describe('Prayer Names editor', () => {
  const markup = renderToStaticMarkup(<PrayerNamesEditor />);

  it('lists the Hanafi name beside the five prayers', () => {
    expect(markup).toMatch(/<label[^>]*for="prayer_names-2"[^>]*>Hanafi Asr<\/label>/);
  });

  it('feeds its stored translation into the input', () => {
    expect(markup).toContain('id="prayer_names-2"');
    expect(markup).toContain('value="Hanafi (2 Mithl)"');
  });

  it('renders one field per prayer name, unlike the old hardcoded list', () => {
    expect(markup.match(/<input /g)).toHaveLength(entries.length);
  });
});
