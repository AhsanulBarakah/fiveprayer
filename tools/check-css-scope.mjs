#!/usr/bin/env node
/**
 * css-scope lint
 *
 * Every stylesheet the plugin prints on the front end is loaded into a page
 * that also contains a theme, page builders and other plugins, so a rule like
 * `.card { … }` or `:root { --border-size: … }` leaks out of the plugin and
 * collides with everything else. The admin app (`src/`, `build-admin/`) is
 * exempt: PostCSS scopes that bundle to `.fiveprayer` at build time.
 *
 * It scans every `.css` and `.scss` file under php/, utils/ and blocks/, plus
 * the `<style>` blocks the PHP renderers print, and fails when one contains:
 *   - a selector that is not namespaced (`.fiveprayer…`, `.fiveprayer__…`);
 *   - a custom property that does not start with `--fiveprayer-`;
 *   - a `@keyframes` name that is not namespaced (animation names are global).
 *
 * `@keyframes` steps are exempt (they are not selectors), and so are at-rule
 * preludes such as `@media (min-width: 40em)`. Nested rules are resolved onto
 * their parent first, so SCSS such as `.fiveprayer-x { .prayer-time { … } }`
 * is recognised as scoped.
 *
 * Usage:
 *   node tools/check-css-scope.mjs                 # the whole plugin
 *   node tools/check-css-scope.mjs some/file.css   # explicit files
 *
 * Run by `npm run lint:css`, which `npm run build` calls first.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Directories outside the admin app whose stylesheets are printed in a page. */
const DEFAULT_ROOTS = ['php', 'utils', 'blocks'];

/** A selector is ours when it carries the plugin's full name. */
const NAMESPACE = /fiveprayer/i;

/** Custom properties are ours under `--fiveprayer-` (the documented theme API). */
const PROPERTY_NAMESPACE = /^--fiveprayer-/;

const KEYFRAMES = /^(-[a-z]+-)?keyframes$/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Blank out a slice while keeping newlines, so line numbers stay correct. */
function blank(text) {
  return text.replace(/[^\n]/g, ' ');
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, blank);
}

/**
 * Template placeholders (`{{ … }}`) and inline PHP (`<?php … ?>`) carry their
 * own braces and colons. Remove them from the scan without shifting offsets.
 */
function stripPlaceholders(text) {
  return text
    .replace(/\{\{[\s\S]*?\}\}/g, blank)
    .replace(/\{%.*?%\}/g, blank)
    .replace(/<\?(?:php|=)?[\s\S]*?\?>/g, blank);
}

function lineOf(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

/**
 * Split a selector list on top-level commas, so `:is(.a, .b)` stays together.
 */
function splitSelectors(selector) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(selector.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(selector.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Check one stylesheet. Returns `[{ line, message }]`, empty when clean.
 */
export function checkStylesheet(source, { scss = false } = {}) {
  const withoutLineComments = scss
    ? source.replace(/^[ \t]*\/\/.*$/gm, (line) => blank(line))
    : source;
  const css = stripComments(stripPlaceholders(withoutLineComments));
  const problems = [];

  let preludeStart = 0;
  let quote = null;
  /**
   * Stack of open blocks. `keyframes` skips the selector check; `selectors`
   * carries the enclosing rule's selector list so SCSS nesting (and CSS
   * nesting) is resolved before the namespace is tested.
   */
  const stack = [];

  /** Join a nested selector onto its parents, resolving `&`. */
  const combine = (parents, selector) => {
    if (!parents || parents.length === 0) return [selector];
    if (selector.includes('&')) {
      return parents.map((parent) => selector.replace(/&/g, parent));
    }
    return parents.map((parent) => `${parent} ${selector}`);
  };

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '{') {
      const rawPrelude = css.slice(preludeStart, i);
      const prelude = rawPrelude.trim();
      const parent = stack.length > 0 ? stack[stack.length - 1] : null;
      const insideKeyframes = Boolean(parent && parent.keyframes);

      if (prelude.startsWith('@')) {
        const name = /^@([\w-]+)/.exec(prelude)?.[1] ?? '';
        const isKeyframes = KEYFRAMES.test(name);

        if (isKeyframes) {
          // Animation names are global too: a plain `spin` can be triggered by,
          // or shadow, any other stylesheet on the page.
          const animation = prelude
            .replace(/^@[\w-]+\s+/, '')
            .trim()
            .replace(/^['"]|['"]$/g, '');

          if (!NAMESPACE.test(animation)) {
            problems.push({
              line: lineOf(css, preludeStart + rawPrelude.indexOf(prelude)),
              message: `unscoped @keyframes name \`${animation}\``,
            });
          }
        }

        stack.push({
          keyframes: insideKeyframes || isKeyframes,
          // A rule nested in @media still belongs to the rule around it.
          selectors: isKeyframes ? null : parent?.selectors ?? null,
        });
      } else if (insideKeyframes) {
        stack.push({ keyframes: true, selectors: null });
      } else {
        const selectors = splitSelectors(prelude).flatMap((selector) =>
          combine(parent?.selectors, selector)
        );
        for (const selector of selectors) {
          if (!NAMESPACE.test(selector)) {
            problems.push({
              line: lineOf(css, preludeStart + rawPrelude.indexOf(prelude)),
              message: `unscoped selector \`${selector}\``,
            });
          }
        }
        stack.push({ keyframes: false, selectors });
      }

      preludeStart = i + 1;
      continue;
    }

    if (ch === '}') {
      stack.pop();
      preludeStart = i + 1;
    }
  }

  const declaration = /(^|[;{\s])(--[\w-]+)\s*:/g;
  let match;
  while ((match = declaration.exec(css)) !== null) {
    const property = match[2];
    if (PROPERTY_NAMESPACE.test(property)) continue;
    problems.push({
      line: lineOf(css, match.index + match[1].length),
      message: `custom property \`${property}\` is not namespaced`,
    });
  }

  return problems.sort((a, b) => a.line - b.line);
}

function readStylesheets(file) {
  const absolute = path.resolve(ROOT, file);
  const source = fs.readFileSync(absolute, 'utf8');

  if (path.extname(file).toLowerCase() !== '.php') {
    return [{ source, scss: path.extname(file).toLowerCase() === '.scss' }];
  }

  // PHP renderers print their own `<style>` blocks; those are page CSS too.
  const blocks = [];
  const style = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = style.exec(source)) !== null) {
    blocks.push({ source: match[1], scss: false });
  }
  return blocks;
}

function main(argv) {
  const explicit = argv.filter((arg) => !arg.startsWith('-'));
  let files;

  if (explicit.length > 0) {
    files = explicit;
  } else {
    files = [];
    for (const root of DEFAULT_ROOTS) {
      const dir = path.join(ROOT, root);
      if (!fs.existsSync(dir)) continue;
      files.push(
        ...walk(dir)
          .map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
          .filter((file) => /\.(css|scss|php)$/i.test(file) && !/\.(min|bundle)\.css$/i.test(file))
      );
    }
  }

  const failures = [];
  let checked = 0;

  for (const file of files) {
    let sources;
    try {
      sources = readStylesheets(file);
    } catch (error) {
      failures.push({ file, line: 0, message: error.message });
      continue;
    }

    sources.forEach(({ source, scss }, index) => {
      if (!source.trim()) return;
      checked++;
      for (const problem of checkStylesheet(source, { scss })) {
        const where = sources.length > 1 ? `${file} (style block ${index + 1})` : file;
        failures.push({ file: where, ...problem });
      }
    });
  }

  if (failures.length > 0) {
    console.error(
      `\n\x1b[31mcss-scope: ${failures.length} problem(s) in stylesheets outside the admin app\x1b[0m\n`
    );
    for (const failure of failures) {
      console.error(`  ${failure.file}:${failure.line}  ${failure.message}`);
    }
    console.error(
      '\nEvery stylesheet printed outside the admin app must stay inside the\n' +
        "plugin's namespace: prefix selectors with `.fiveprayer…` and name\n" +
        'custom properties `--fiveprayer-…`.\n' +
        'See Documentation → Theme with CSS Variables and tests/php/test-css-scoping.php.\n'
    );
    return 1;
  }

  console.log(`css-scope: ${checked} stylesheet(s) checked, all selectors namespaced.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
