import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Documentation → Theme with CSS Variables is the reference users get when they
 * want to restyle the tables. It is only useful while it lists every table
 * property the plugin actually reads or declares, so this guard compares the
 * page with the stylesheets and renderers that draw the timetable and the
 * daily tables: a property added there without a row in the docs fails here,
 * and so does a row left behind after a rename.
 *
 * The TV display's own `--fiveprayer-*` variables (canvas size, safe zone) are
 * a different feature and are documented with TV Display Mode, so they are out
 * of scope here.
 */
const root = path.resolve(__dirname, '../../..');
const docFile = path.join(root, 'src/admin/components/Docs/CSSCustomPropertiesDoc.tsx');
const pluginDirs = [
    'php/classes/core/ShortCodes',
    'php/classes/core/Daily',
    'php/classes/core/Calendar',
    'utils',
];

function walk(dir: string, files: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else files.push(full);
    }
    return files;
}

function pluginVariables(): Set<string> {
    const found = new Set<string>();

    for (const dir of pluginDirs) {
        const absolute = path.join(root, dir);
        if (!fs.existsSync(absolute)) continue;

        for (const file of walk(absolute)) {
            if (!/\.(php|css|scss|js|tsx?)$/i.test(file)) continue;
            const text = fs.readFileSync(file, 'utf8');
            for (const match of text.matchAll(/--fiveprayer-[a-z0-9-]+/gi)) {
                found.add(match[0]);
            }
        }
    }

    return found;
}

function documentedVariables(): Set<string> {
    const text = fs.readFileSync(docFile, 'utf8');
    return new Set([...text.matchAll(/'(--fiveprayer-[a-z0-9-]+)'/gi)].map((match) => match[1]));
}

describe('theming docs', () => {
    it('lists every --fiveprayer- property the plugin uses, and nothing it does not', () => {
        const used = pluginVariables();
        const documented = documentedVariables();

        const missing = [...used].filter((name) => !documented.has(name)).sort();
        const stale = [...documented].filter((name) => !used.has(name)).sort();

        expect(missing, 'properties used by the plugin but missing from the docs page').toEqual([]);
        expect(stale, 'properties documented but no longer used by the plugin').toEqual([]);
    });
});
