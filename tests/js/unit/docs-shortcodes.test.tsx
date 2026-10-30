/**
 * Guard for the shortcode reference, in both places it is written down.
 *
 * `ShortCodeMap` (PHP) is what WordPress actually registers, while the admin
 * Docs page and `docs/SHORTCODES.md` each keep their own hand-written tables.
 * Nothing links them, so a shortcode added to the map — or renamed — could
 * silently go undocumented. These tests fail when either reference is missing
 * a registered tag, a deprecated alias, or that alias's replacement.
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomeDocs from '../../../src/admin/components/Docs/HomeDocs';
import SingleShortcodeDocs, {
  DEPRECATED_SHORTCODES,
} from '../../../src/admin/components/Docs/shortcodes/SingleShortCodeDocs';
import TimeTableShortCodeDocs from '../../../src/admin/components/Docs/shortcodes/TimeTableShortCodeDocs';

const MAP_FILE = path.resolve(__dirname, '../../../php/classes/core/ShortCodes/Data/ShortCodeMap.php');
const MARKDOWN_FILE = path.resolve(__dirname, '../../../docs/SHORTCODES.md');
const SHORTCODES_DIR = path.resolve(__dirname, '../../../php/classes/core/ShortCodes');
const DOCS_DIR = path.resolve(__dirname, '../../../src/admin/components/Docs');
const DOCS_MARKDOWN_DIR = path.resolve(__dirname, '../../../docs');
const README_FILE = path.resolve(__dirname, '../../../README.md');
const CHANGELOG_FILE = path.resolve(__dirname, '../../../changelog.txt');

/** Classes that register their own tag(s) instead of using ShortCodeMap. */
const OWN_REGISTERED_FILES = [
  'ShortCodeTimetableMonth.php',
  'ShortCodePrinterButton.php',
  'ShortCodeVerticalDailyPrayer.php',
];

const EXTRA_PRAYERS_FILE = path.join(SHORTCODES_DIR, 'ShortCodeExtraPrayers.php');

/** Pull one `public const NAME = [ 'tag' => 'field', … ]` block out of the map. */
function readShortcodeConst(source: string, name: string): Record<string, string> {
  const start = source.indexOf(`const ${name}`);
  if (start === -1) {
    throw new Error(`ShortCodeMap has no ${name} constant.`);
  }
  const block = source.slice(start, source.indexOf('];', start));
  const entries: Record<string, string> = {};
  for (const match of block.matchAll(/'([^']+)'\s*=>\s*'([^']*)'/g)) {
    entries[match[1]] = match[2];
  }
  return entries;
}

const mapSource = fs.readFileSync(MAP_FILE, 'utf8');
const activeShortcodes = Object.keys(readShortcodeConst(mapSource, 'ACTIVE_SHORTCODES'));
const deprecatedShortcodes = readShortcodeConst(mapSource, 'DEPRECATED_SHORTCODES');

/**
 * Tags registered outside `ShortCodeMap`: the timetable, printer-button and
 * vertical-prayer tags each live in their own class, and the six extra-prayer
 * slots are registered in a loop. All of them are read from that code rather
 * than restated here, so the test follows the plugin when a tag is added or
 * renamed.
 */
const ownRegisteredShortcodes = OWN_REGISTERED_FILES.flatMap((file) => {
  const source = fs.readFileSync(path.join(SHORTCODES_DIR, file), 'utf8');
  return [...source.matchAll(/add_shortcode\(\s*'([^']+)'/g)].map((match) => match[1]);
});

const extraPrayersSource = fs.readFileSync(EXTRA_PRAYERS_FILE, 'utf8');
const extraPrayerPrefix = extraPrayersSource.match(/add_shortcode\(\s*'([^'$]+)'\s*\./)?.[1];
const extraPrayerSlotCount = Number(
  extraPrayersSource.match(/const SLOT_COUNT\s*=\s*(\d+)/)?.[1]
);
const extraPrayerShortcodes = extraPrayerPrefix
  ? Array.from({ length: extraPrayerSlotCount }, (_, i) => `${extraPrayerPrefix}${i + 1}`)
  : [];

/** Every tag the plugin registers and documents, whatever registers it. */
const registeredShortcodes = [
  ...activeShortcodes,
  ...ownRegisteredShortcodes,
  ...extraPrayerShortcodes,
];

/** Every static `add_shortcode('…')` anywhere under ShortCodes (legacy aliases too). */
const staticallyRegisteredShortcodes = (
  fs.readdirSync(SHORTCODES_DIR, { recursive: true }) as string[]
)
  .filter((file) => file.endsWith('.php'))
  .flatMap((file) => {
    const source = fs.readFileSync(path.join(SHORTCODES_DIR, file), 'utf8');
    return [...source.matchAll(/add_shortcode\(\s*'([^']+)'/g)].map((match) => match[1]);
  });

/**
 * Tags a mention may legally use. Deprecated tags and legacy aliases are
 * genuinely registered, so a page documenting them is not stale — it is just
 * documenting something old.
 */
const knownShortcodes = new Set([
  ...registeredShortcodes,
  ...Object.keys(deprecatedShortcodes),
  ...staticallyRegisteredShortcodes,
]);

/**
 * Tags mentioned in the given files that nothing registers.
 *
 * Wildcard mentions such as `[Fp_Single_*]` describe a family rather than a
 * tag, so they are skipped.
 */
function findStaleMentions(files: { file: string; label: string }[]): string[] {
  const stale = new Set<string>();

  for (const { file, label } of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\[\s*(Fp_[A-Za-z0-9_]+)/g)) {
      const tag = match[1];
      const nextChar = source.charAt((match.index ?? 0) + match[0].length);
      if (tag.endsWith('_') || nextChar === '*') {
        continue;
      }
      if (!knownShortcodes.has(tag)) {
        stale.add(`${tag} (${label})`);
      }
    }
  }

  return [...stale];
}

/**
 * A tag that is also in the active list is a current shortcode (two of them are
 * double-listed for backwards compatibility), not an alias — only the rest are
 * expected in the deprecated table.
 */
const deprecatedAliases = Object.entries(deprecatedShortcodes).filter(
  ([tag]) => !activeShortcodes.includes(tag)
);

/** The current tag(s) that provide a deprecated entry's field. */
const replacementsFor = (field: string): string[] => {
  const activeBlock = mapSource.slice(mapSource.indexOf('const ACTIVE_SHORTCODES'));
  return activeShortcodes.filter((tag) =>
    new RegExp(`'${tag}'\\s*=>\\s*'${field}'`).test(activeBlock)
  );
};

/** Render one Docs page the way the router does, without a browser. */
const renderDocPage = (page: React.ComponentType): string =>
  renderToStaticMarkup(
    React.createElement(MemoryRouter, { initialEntries: ['/documentation'] }, React.createElement(page))
  );

// The Docs section is two pages: single-prayer tags on one, timetable/printer/
// extra-prayer tags on the other. Both count as the in-admin reference.
const adminPageHtml = `${renderDocPage(SingleShortcodeDocs)}${renderDocPage(
  TimeTableShortCodeDocs
)}`;

const markdown = fs.readFileSync(MARKDOWN_FILE, 'utf8');

/** Names everything a single reference is missing, ready for an assertion. */
function collectMissing(text: string): string[] {
  const missing: string[] = [];

  for (const tag of registeredShortcodes) {
    if (!text.includes(`[${tag}]`)) {
      missing.push(tag);
    }
  }

  for (const [oldTag, field] of deprecatedAliases) {
    if (!text.includes(`[${oldTag}]`)) {
      missing.push(oldTag);
      continue;
    }
    const replacements = replacementsFor(field);
    if (replacements.length === 0) {
      throw new Error(`No active shortcode provides the '${field}' field.`);
    }
    for (const tag of replacements) {
      if (!text.includes(`[${tag}]`)) {
        missing.push(`${oldTag} → [${tag}]`);
      }
    }
  }

  return missing;
}

describe('shortcode map', () => {
  it('is non-trivial and readable by the tests', () => {
    expect(activeShortcodes.length).toBeGreaterThan(20);
    expect(deprecatedAliases.length).toBeGreaterThan(10);
    expect(markdown.length).toBeGreaterThan(1000);
  });

  it('reads the timetable, printer and vertical-prayer tags from their registration code', () => {
    expect(ownRegisteredShortcodes).toContain('Fp_TimeTable_Monthly');
    expect(ownRegisteredShortcodes).toContain('Fp_Printer_Button');
    expect(ownRegisteredShortcodes).toContain('Fp_Printer_Button_URL');
    expect(ownRegisteredShortcodes).toContain('Fp_Vertical_Daily_Prayer');
    // Every listed class must actually yield a tag, so a renamed file fails here
    // instead of quietly shrinking the coverage.
    for (const file of OWN_REGISTERED_FILES) {
      const source = fs.readFileSync(path.join(SHORTCODES_DIR, file), 'utf8');
      expect(source, `${file} registers no tag`).toMatch(/add_shortcode\(\s*'[^']+'/);
    }
    expect(extraPrayerPrefix).toBe('Fp_Extra_Prayer_');
    expect(extraPrayerSlotCount).toBeGreaterThan(0);
    expect(extraPrayerShortcodes).toHaveLength(extraPrayerSlotCount);
    // The loop's last slot is the highest-numbered tag, not an empty string.
    expect(extraPrayerShortcodes[extraPrayerShortcodes.length - 1]).toBe(
      `Fp_Extra_Prayer_${extraPrayerSlotCount}`
    );
  });
});

describe('admin Docs shortcode reference', () => {
  it('documents every shortcode WordPress registers', () => {
    const missing = collectMissing(adminPageHtml);

    expect(missing, `Add these to the Docs page: ${missing.join(', ')}`).toEqual([]);
  });

  it('mentions no shortcode that is no longer registered', () => {
    // Tags appear in prose, code samples and shortcode attributes, e.g.
    // "[Fp_TimeTable_Monthly printer_option=\"inside\"]" — the scan matches the
    // base tag.
    const docsFiles = (fs.readdirSync(DOCS_DIR, { recursive: true }) as string[])
      .filter((file) => /\.tsx?$/.test(file))
      .map((file) => ({ file: path.join(DOCS_DIR, file), label: `Docs/${file}` }));

    expect(docsFiles.length).toBeGreaterThan(10);

    const stale = findStaleMentions(docsFiles);

    expect(stale.length, `Docs mention unregistered tags: ${stale.join(', ')}`).toBe(0);
  });
});

describe('Docs landing page', () => {
  it('shows the deprecated count that the reference table really has', () => {
    const landingHtml = renderDocPage(HomeDocs);
    const displayed = landingHtml.match(
      /Deprecated shortcodes still render:\s*<strong>(\d+)<\/strong>/
    )?.[1];

    expect(displayed, 'The landing page no longer states a deprecated count.').toBeTruthy();

    // Rows in the deprecated table, counted from the rendered markup rather
    // than from the array the page builds them from, plus the aliases the PHP
    // map actually registers — the two must agree with the displayed number.
    const tableRows = (adminPageHtml.match(/line-through/g) ?? []).length;

    expect(Number(displayed)).toBe(tableRows);
    expect(Number(displayed)).toBe(deprecatedAliases.length);
    expect(Number(displayed)).toBe(DEPRECATED_SHORTCODES.length);
  });
});

/** Word numbers used in prose, mapped to digits. */
const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const toNumber = (value: string): number =>
  WORD_NUMBERS[value.toLowerCase()] ?? Number(value);

describe.each([
  ['README.md', README_FILE],
  ['changelog.txt', CHANGELOG_FILE],
])('%s', (_name, file) => {
  const text = fs.readFileSync(file, 'utf8');

  it('states the extra-prayer slot count the plugin registers', () => {
    const slots = [...text.matchAll(/\[Fp_Extra_Prayer_(\d+)\]/g)].map((match) =>
      Number(match[1])
    );
    expect(slots.length, 'No extra-prayer shortcode is mentioned.').toBeGreaterThan(0);
    expect(Math.max(...slots)).toBe(extraPrayerSlotCount);

    // Worded claims ("up to six optional prayers") must agree with the code too.
    for (const match of text.matchAll(
      /(?:up to\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+optional\s+(?:extra[ -]?)?prayers?/gi
    )) {
      expect(toNumber(match[1]), `Stale count: "${match[0]}"`).toBe(extraPrayerSlotCount);
    }
  });

  it('states the deprecated count the map registers, when it states one', () => {
    for (const match of text.matchAll(/(\d+)\s+deprecated\s+(?:shortcodes|tags)/gi)) {
      expect(Number(match[1]), `Stale count: "${match[0]}"`).toBe(deprecatedAliases.length);
    }
  });
});

describe('markdown docs in docs/', () => {
  it('mention no shortcode that is no longer registered', () => {
    const markdownFiles = (fs.readdirSync(DOCS_MARKDOWN_DIR, { recursive: true }) as string[])
      .filter((file) => file.endsWith('.md'))
      .map((file) => ({ file: path.join(DOCS_MARKDOWN_DIR, file), label: `docs/${file}` }));

    expect(markdownFiles.length).toBeGreaterThan(10);

    const stale = findStaleMentions(markdownFiles);

    expect(stale.length, `docs/ mentions unregistered tags: ${stale.join(', ')}`).toBe(0);
  });
});

describe('docs/SHORTCODES.md', () => {
  it('documents every shortcode WordPress registers', () => {
    const missing = collectMissing(markdown);

    expect(missing, `Add these to the markdown reference: ${missing.join(', ')}`).toEqual([]);
  });
});
