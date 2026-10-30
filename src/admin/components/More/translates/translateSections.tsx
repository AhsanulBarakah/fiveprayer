/**
 * translateSections
 *
 * Single source of truth for the translation sections: the sidebar nav, the
 * landing page and the shared editor all read from here so labels, icons and
 * routes never drift apart.
 *
 * @module More/translates/translateSections
 */
import React from 'react';
import {
  FaPray,
  FaCalendarAlt,
  FaHashtag,
  FaMoon,
  FaListOl,
  FaTable,
  FaAlignLeft,
  FaBook,
  FaCalendarDay,
} from 'react-icons/fa';
import { __ } from '@wordpress/i18n';

export type TranslationCategory =
  | 'prayer_names'
  | 'gregorian_months'
  | 'gregorian_numbers'
  | 'hijra_months'
  | 'hijra_numbers'
  | 'timetable_prayer'
  | 'vertical_daily_prayer'
  | 'day_names'
  | 'extra_info';

export interface TranslateSection {
  /** Store category key holding the translation list */
  key: TranslationCategory;
  /** Route relative to /moresettings */
  path: string;
  /** Human readable name */
  label: string;
  /** Short explanation shown on cards */
  description: string;
  /** Icon element */
  icon: React.ReactNode;
}

export const TRANSLATE_SECTIONS: TranslateSection[] = [
  {
    key: 'prayer_names',
    path: 'translate/prayernames',
    label: __('Prayer Names', 'fiveprayer'),
    description: __(
      'Translate the prayer names shown across your website.',
      'fiveprayer'
    ),
    icon: <FaPray />,
  },
  {
    key: 'gregorian_months',
    path: 'translate/gregorianmonths',
    label: __('Gregorian Months', 'fiveprayer'),
    description: __(
      'Translate the Gregorian month names used in dates and titles.',
      'fiveprayer'
    ),
    icon: <FaCalendarAlt />,
  },
  {
    key: 'gregorian_numbers',
    path: 'translate/gregoriannumbers',
    label: __('Gregorian Numbers', 'fiveprayer'),
    description: __(
      'Translate the digits used in Gregorian dates and times.',
      'fiveprayer'
    ),
    icon: <FaHashtag />,
  },
  {
    key: 'hijra_months',
    path: 'translate/hijramonths',
    label: __('Hijra Months', 'fiveprayer'),
    description: __(
      'Translate the Hijri calendar month names.',
      'fiveprayer'
    ),
    icon: <FaMoon />,
  },
  {
    key: 'hijra_numbers',
    path: 'translate/hijranumbers',
    label: __('Hijra Numbers', 'fiveprayer'),
    description: __(
      'Translate the digits used in Hijri dates.',
      'fiveprayer'
    ),
    icon: <FaListOl />,
  },
  {
    key: 'timetable_prayer',
    path: 'translate/timetableprayer',
    label: __('Timetable Prayer', 'fiveprayer'),
    description: __(
      'Translate the column and row labels in the prayer timetable.',
      'fiveprayer'
    ),
    icon: <FaTable />,
  },
  {
    key: 'vertical_daily_prayer',
    path: 'translate/verticaldailyprayer',
    label: __('Vertical Daily Prayer', 'fiveprayer'),
    description: __(
      'Translate the labels used in the vertical daily prayer display.',
      'fiveprayer'
    ),
    icon: <FaAlignLeft />,
  },
  {
    key: 'day_names',
    path: 'translate/daynames',
    label: __('Day Names', 'fiveprayer'),
    description: __(
      'Translate weekday names, their short forms and day-of-month numbers used by the optional Day column.',
      'fiveprayer'
    ),
    icon: <FaCalendarDay />,
  },
  {
    key: 'extra_info',
    path: 'translate/extra_info',
    label: __('Extra Info', 'fiveprayer'),
    description: __(
      'Translate extra labels such as the current time, date and location.',
      'fiveprayer'
    ),
    icon: <FaBook />,
  },
];

export const getTranslateSection = (key: TranslationCategory): TranslateSection | undefined =>
  TRANSLATE_SECTIONS.find((section) => section.key === key);
