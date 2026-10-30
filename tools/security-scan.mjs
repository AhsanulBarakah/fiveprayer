#!/usr/bin/env node
/**
 * php-security scan
 *
 * The WordPress hardening suite runs the plugin against a real install and
 * checks the REST and capability layer. It cannot see a file that calls
 * `eval()` or shells out, because nothing in the test path reaches that code.
 * This scan does: it reads every shipped PHP file and fails on the constructs
 * that turn a sanitisation bug into remote code execution.
 *
 * It fails on:
 *   - `eval()` / `create_function()` — execute a string as PHP;
 *   - `exec()`, `shell_exec()`, `system()`, `passthru()`, `popen()`,
 *     `proc_open()`, `pcntl_exec()` — run a shell command;
 *   - `unserialize()` — PHP object injection (use `maybe_unserialize()`);
 *   - `preg_replace()` with the `/e` modifier — evaluates the replacement;
 *   - `include`/`require` of a request-controlled path — loads an arbitrary file;
 *   - `extract()` — turns array keys into variables that overwrite locals;
 *   - request data interpolated straight into a `$wpdb` call;
 *   - `base64_decode()` of request data — hides a payload from review.
 *
 * A finding is only accepted when the file and rule appear in
 * `tools/security-scan-allowlist.json` with a reason, so silencing one is a
 * reviewable, commented change rather than a blanket disable.
 *
 * Usage:
 *   node tools/security-scan.mjs             # the whole plugin
 *   node tools/security-scan.mjs some.php    # explicit files
 *
 * Run by `npm run lint:php-security` and the Security workflow.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Shipped PHP only: the admin bundle and the docs are not PHP. */
const DEFAULT_ROOTS = ['php', 'utils', 'blocks'];

/** Entry points that live at the repository root. */
const DEFAULT_FILES = ['Fiveprayer.php', 'index.php'];

/** Never scanned, even when a caller points the tool at a directory. */
const SKIP_DIRS = new Set(['node_modules', 'vendor', '.git', 'build-admin', 'build-blocks', 'docs', 'tests']);

const ALLOWLIST_FILE = 'tools/security-scan-allowlist.json';

/** One entry per dangerous construct. `id` is what the allowlist refers to. */
const RULES = [
  {
    id: 'eval',
    message: 'eval()/create_function() execute a string as PHP',
    pattern: /\b(eval|create_function)\s*\(/,
  },
  {
    id: 'shell-exec',
    message: 'shell command execution',
    pattern: /\b(exec|shell_exec|system|passthru|popen|proc_open|pcntl_exec)\s*\(/,
  },
  {
    id: 'unserialize',
    message: 'unserialize() on untrusted data is PHP object injection — use maybe_unserialize()',
    pattern: /(?<!->)\bunserialize\s*\(/,
  },
  {
    id: 'preg-replace-e',
    message: 'the /e modifier evaluates the replacement as PHP',
    pattern: /preg_replace\s*\(\s*(['"])(?:(?!\1).)*\1\s*,\s*(['"])(?:(?!\2).)*\2\s*[a-z]*e[a-z]*\s*[,)]/i,
  },
  {
    // Including a path built from PathService or __DIR__ is how a plugin loads
    // its own files; only a path that carries request data is the vulnerability.
    id: 'include-request-data',
    message: 'including a request-controlled path can load an arbitrary file',
    pattern: /\b(?:include|include_once|require|require_once)\s*\(?\s*[^;]*\$_(?:GET|POST|REQUEST|COOKIE|FILES|GLOBALS)/,
  },
  {
    id: 'extract',
    message: 'extract() turns array keys into variables and can overwrite locals',
    pattern: /\bextract\s*\(/,
  },
  {
    id: 'sql-interpolation',
    message: 'request data interpolated into SQL — use $wpdb->prepare()',
    pattern: /\$wpdb->\w+\s*\(\s*["'][^"']*\$_(?:GET|POST|REQUEST|COOKIE|SERVER)/,
  },
  {
    id: 'decode-request-data',
    message: 'base64_decode() of request data hides a payload — validate before decoding',
    pattern: /base64_decode\s*\(\s*(?:\$_(?:GET|POST|REQUEST|COOKIE)|SecurityHelper::get_\w+_input)/,
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.toLowerCase().endsWith('.php')) out.push(full);
  }
  return out;
}

/** A commented line is documentation; only executable lines are reported. */
function isComment(line) {
  const trimmed = line.trimStart();
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('#');
}

function loadAllowlist() {
  const absolute = path.join(ROOT, ALLOWLIST_FILE);
  if (!fs.existsSync(absolute)) return new Map();

  const entries = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (!Array.isArray(entries)) {
    throw new Error(`${ALLOWLIST_FILE} must be a JSON array.`);
  }

  const allowed = new Map();
  for (const entry of entries) {
    if (!entry.file || !entry.rule || !entry.reason) {
      throw new Error(`${ALLOWLIST_FILE}: every entry needs "file", "rule" and "reason".`);
    }
    allowed.set(`${entry.file}:${entry.rule}`, entry.reason);
  }
  return allowed;
}

function main(argv) {
  const explicit = argv.filter((arg) => !arg.startsWith('-'));
  const files = [];

  if (explicit.length > 0) {
    for (const file of explicit) {
      const absolute = path.resolve(ROOT, file);
      if (!fs.existsSync(absolute)) {
        console.error(`php-security: no such file: ${file}`);
        return 1;
      }
      files.push(absolute);
    }
  } else {
    for (const root of DEFAULT_ROOTS) {
      const dir = path.join(ROOT, root);
      if (fs.existsSync(dir)) files.push(...walk(dir));
    }
    for (const file of DEFAULT_FILES) {
      const absolute = path.join(ROOT, file);
      if (fs.existsSync(absolute)) files.push(absolute);
    }
  }

  let allowlist;
  try {
    allowlist = loadAllowlist();
  } catch (error) {
    console.error(`php-security: ${error.message}`);
    return 1;
  }

  const findings = [];
  const excused = [];

  for (const absolute of files) {
    const relative = path.relative(ROOT, absolute).split(path.sep).join('/');
    const lines = fs.readFileSync(absolute, 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (isComment(line)) return;
      for (const rule of RULES) {
        if (!rule.pattern.test(line)) continue;
        const reason = allowlist.get(`${relative}:${rule.id}`);
        const finding = { file: relative, line: index + 1, rule: rule.id, message: rule.message, reason };
        (reason ? excused : findings).push(finding);
      }
    });
  }

  if (findings.length > 0) {
    console.error(`\n\x1b[31mphp-security: ${findings.length} dangerous construct(s)\x1b[0m\n`);
    for (const finding of findings) {
      console.error(`  ${finding.file}:${finding.line}  [${finding.rule}] ${finding.message}`);
    }
    console.error(
      '\nRemove the construct, or — when it is genuinely needed — add the file and\n' +
        `rule to ${ALLOWLIST_FILE} with the reason it is safe. Do not weaken a rule\n` +
        'to make one file pass: every other file is scanned by it too.\n'
    );
    return 1;
  }

  const reviewed = excused.length > 0 ? `, ${excused.length} reviewed exception(s)` : '';
  console.log(`php-security: ${files.length} PHP file(s) scanned${reviewed}, no dangerous constructs.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
