/**
 * Keeps README's "Tested up to" and the core the release verification installs
 * in step.
 *
 * verify-release.yml downloads the published zip and installs WordPress from a
 * tarball whose version is written into the workflow. Nothing linked that
 * number to the readme header, so the plugin shipped claiming "Tested up to:
 * 7.2" while no such release existed and the only capture anyone had was 7.1.
 * These tests fail when the header and the release run disagree.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const README = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const VERIFY_RELEASE = fs.readFileSync(
  path.join(ROOT, '.github', 'workflows', 'verify-release.yml'),
  'utf8'
);

/** `Tested up to: 7.1` → "7.1" */
const testedUpTo = README.match(/^Tested up to:\s*(\d+\.\d+)\s*$/m)?.[1];

/** `https://wordpress.org/wordpress-7.1.tar.gz` → "7.1" */
const installedCore = VERIFY_RELEASE.match(
  /wordpress\.org\/wordpress-(\d+\.\d+)\.tar\.gz/
)?.[1];

describe('README "Tested up to"', () => {
  it('is a WordPress minor version', () => {
    expect(testedUpTo, 'README.md has a "Tested up to:" header').toMatch(/^\d+\.\d+$/);
  });

  it('matches the core the release verification installs', () => {
    expect(installedCore, 'verify-release.yml installs WordPress from a tarball').toBeDefined();
    expect(installedCore).toBe(testedUpTo);
  });
});
