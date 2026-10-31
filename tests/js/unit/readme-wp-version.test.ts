/**
 * Keeps the WordPress version this plugin claims in step with the one the
 * repository actually tests.
 *
 * Three things go stale independently: the readme header ("Tested up to"), the
 * prose that repeats the claim in README.md and changelog.txt ("compatible with
 * WordPress X.Y"), and the core the release and security workflows download.
 * Nothing linked them, so the plugin shipped claiming 7.2 where no such release
 * existed while every run installed 6.7. These tests fail when any of the three
 * disagrees with the readme header.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const read = (...segments: string[]) =>
  fs.readFileSync(path.join(ROOT, ...segments), 'utf8');

const README = read('README.md');
const CHANGELOG = read('changelog.txt');
const VERSION = JSON.parse(read('package.json')).version;

/** `Tested up to: 7.1` → "7.1" */
const testedUpTo = README.match(/^Tested up to:\s*(\d+\.\d+)\s*$/m)?.[1];

/**
 * Workflows that install a core of their own. Both are pinned to the version
 * the readme promises; the PHP and E2E suites deliberately stay on 6.7 so the
 * oldest supported release keeps being exercised.
 */
const WORKFLOWS = ['verify-release.yml', 'security.yml'].map((name) => ({
  name,
  source: read('.github', 'workflows', name),
}));

/** Every `compatible with WordPress X.Y` claim, wherever it is written. */
function claims(label: string, source: string) {
  const found = [...source.matchAll(/compatible with\s+\*{0,2}WordPress\s+(\d+\.\d+)/gi)];
  return found.map((match) => ({ label, version: match[1] }));
}

/** A tarball URL, its cached file name, or an actions/cache key. */
function installedCores({ name, source }: { name: string; source: string }) {
  const tarballs = [...source.matchAll(/wordpress-(\d+\.\d+)\.tar\.gz/g)];
  const cacheKeys = [...source.matchAll(/wp-tarball-[^-\s]*-(\d+\.\d+)/g)];
  return [...tarballs, ...cacheKeys].map((match) => ({ label: name, version: match[1] }));
}

/**
 * The changelog text that speaks for the current release: the release notes at
 * the top of the file plus the entry for the version in package.json. Older
 * entries name the core they shipped against and are history — a 2.x release
 * that said 6.8.1 must go on saying 6.8.1.
 */
function currentChangelog(source: string): string {
  const [notes = '', history = ''] = source.split(/^Five Prayer — Changelog$/m);
  const start = history.indexOf(`= ${VERSION} =`);
  if (start === -1) {
    return notes;
  }
  const rest = history.slice(start + 1);
  const nextHeading = rest.search(/^= \S+ =$/m);
  const entry = nextHeading === -1 ? history.slice(start) : history.slice(start, start + 1 + nextHeading);
  return `${notes}\n${entry}`;
}

const allClaims = [
  ...claims('README.md', README),
  ...claims(`changelog.txt (${VERSION})`, currentChangelog(CHANGELOG)),
];
const allCores = WORKFLOWS.flatMap(installedCores);

describe('README "Tested up to"', () => {
  it('is a WordPress minor version', () => {
    expect(testedUpTo, 'README.md has a "Tested up to:" header').toMatch(/^\d+\.\d+$/);
  });

  it('matches every "compatible with WordPress" claim', () => {
    expect(allClaims.length, 'README.md and changelog.txt state the claim').toBeGreaterThan(0);
    for (const claim of allClaims) {
      expect(claim.version, `${claim.label} says "compatible with WordPress ${claim.version}"`).toBe(
        testedUpTo
      );
    }
  });

  it('matches the core the release and security workflows install', () => {
    expect(allCores.length, 'a workflow downloads a WordPress tarball').toBeGreaterThan(0);
    for (const core of allCores) {
      expect(core.version, `${core.label} installs WordPress ${core.version}`).toBe(testedUpTo);
    }
  });
});
