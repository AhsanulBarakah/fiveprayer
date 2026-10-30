import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

/**
 * `tools/check-css-scope.mjs` is what makes `npm run build` (and the
 * pre-commit hook) fail when a stylesheet outside the admin app ships a rule
 * that is not namespaced. These tests run the real CLI on throwaway files so
 * the rule and its exemptions are pinned down.
 */
const checker = path.resolve(__dirname, '../../../tools/check-css-scope.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fiveprayer-css-scope-'));

afterAll(() => {
    fs.rmSync(temp, { recursive: true, force: true });
});

function lint(files: Record<string, string>) {
    const args = Object.entries(files).map(([name, contents]) => {
        const file = path.join(temp, name);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, contents);
        return file;
    });

    return spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8' });
}

describe('css-scope lint', () => {
    it('passes a stylesheet whose selectors and properties are namespaced', () => {
        const result = lint({
            'namespaced.css': [
                '.fiveprayer-container { --fiveprayer-bg-odd: #fff; color: var(--fiveprayer-bg-odd); }',
                'table.fiveprayer__DairyPrayer_ td, .fiveprayer__highlight { color: inherit; }',
                '@media (min-width: 40em) { .fiveprayer__printer .left-printer { margin: 0; } }',
            ].join('\n'),
        });

        expect(result.stderr).toBe('');
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('all selectors namespaced');
    });

    it('fails on an unscoped selector and names it', () => {
        const result = lint({
            'leaky.css': '.fiveprayer-container { color: red; }\n.card { padding: 1rem; }\n',
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('leaky.css:2');
        expect(result.stderr).toContain('unscoped selector `.card`');
    });

    it('catches an unscoped selector inside a comma list', () => {
        const result = lint({
            'list.css': '.fiveprayer-container .title, .subtitle { color: red; }\n',
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('unscoped selector `.subtitle`');
    });

    it('catches a custom property that is not --fiveprayer-', () => {
        const result = lint({
            'props.css': '.fiveprayer-container { --border-size: 1px; }\n',
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('custom property `--border-size`');
    });

    it('does not treat @keyframes steps as selectors', () => {
        const result = lint({
            'animation.css': [
                '@keyframes fiveprayer-spin {',
                '    from { transform: rotate(0deg); }',
                '    100% { transform: rotate(360deg); }',
                '}',
            ].join('\n'),
        });

        expect(result.status).toBe(0);
    });

    it('fails on a global @keyframes name', () => {
        const result = lint({
            'animation-global.css': [
                '@keyframes spin { from { opacity: 0; } to { opacity: 1; } }',
                '.fiveprayer-settings-admin .log-spinner { animation: spin 1s linear infinite; }',
            ].join('\n'),
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('unscoped @keyframes name `spin`');
    });

    it('checks the <style> blocks a PHP renderer prints', () => {
        const result = lint({
            'renderer.php': [
                '<?php echo "hi"; ?>',
                '<style>',
                '.fiveprayer-container .next-prayer-notice { display: flex; }',
                'body * { margin: 0 !important; }',
                '</style>',
            ].join('\n'),
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('unscoped selector `body *`');
    });

    it('resolves SCSS nesting before checking the namespace', () => {
        const scoped = lint({
            'nested.scss': [
                '// scss source, compiled into a block stylesheet',
                '.fiveprayer-times-element {',
                '    .prayer-time { color: red; }',
                '    &__title { color: blue; }',
                '}',
            ].join('\n'),
        });
        expect(scoped.status).toBe(0);

        // Nesting inside a namespaced rule is scoped by the compiler, so it
        // must not be reported; a top-level generic rule is still a leak.
        const leaky = lint({
            'nested-leak.scss': [
                '.fiveprayer-times-element {',
                '    .prayer-time { color: red; }',
                '}',
                '.card { color: blue; }',
            ].join('\n'),
        });
        expect(leaky.status).toBe(1);
        expect(leaky.stderr).toContain('unscoped selector `.card`');
        expect(leaky.stderr).not.toContain('prayer-time');
    });

    it('ignores template placeholders that contain braces', () => {
        const result = lint({
            'breakdance.css': [
                '.fiveprayer-times-element {',
                '    color: {{ design.colors.text }};',
                '}',
            ].join('\n'),
        });

        expect(result.status).toBe(0);
    });
});
