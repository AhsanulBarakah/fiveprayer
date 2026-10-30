import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * `playground/blueprint.json` is what the README's live-preview links boot, and
 * Playground validates it against its JSON schema before running a single step:
 * every step definition sets `additionalProperties: false`, so one unknown key
 * aborts the boot. The login step used `accountUsername`/`accountPassword`,
 * which the schema rejects — the preview failed with "has unexpected property"
 * and nothing in the suite noticed, because nothing read this file.
 *
 * The schema is not vendored, so the keys below are transcribed from
 * `StepDefinition` in https://playground.wordpress.net/blueprint-schema.json
 * for the step types this blueprint uses.
 */
const BLUEPRINT_FILE = path.resolve(__dirname, '../../../playground/blueprint.json');
const SCHEMA_URL = 'https://playground.wordpress.net/blueprint-schema.json';

const STEP_KEYS: Record<string, string[]> = {
  login: ['step', 'progress', 'username', 'password'],
  installPlugin: [
    'step',
    'progress',
    'ifAlreadyInstalled',
    'pluginData',
    'pluginZipFile',
    'options',
  ],
  setSiteOptions: ['step', 'progress', 'options'],
};

type Step = Record<string, unknown> & { step: string };

const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_FILE, 'utf8')) as {
  $schema?: string;
  landingPage?: string;
  steps?: Step[];
};

const steps = blueprint.steps ?? [];

const stepOf = (name: string): Step => {
  const found = steps.find((candidate) => candidate.step === name);
  if (!found) {
    throw new Error(`The blueprint has no "${name}" step.`);
  }
  return found;
};

describe('Playground blueprint', () => {
  it('is not empty and declares the schema it is checked against', () => {
    expect(steps.length).toBeGreaterThan(2);
    expect(blueprint.$schema).toBe(SCHEMA_URL);
  });

  it('uses only step types the schema defines', () => {
    const unknown = steps
      .map((step) => step.step)
      .filter((name) => !Object.keys(STEP_KEYS).includes(name));

    expect(unknown, 'Add the new step type and its allowed keys to STEP_KEYS.').toEqual([]);
  });

  it('gives every step only the keys the schema allows', () => {
    const unexpected = steps.flatMap((step) =>
      Object.keys(step)
        .filter((key) => !STEP_KEYS[step.step].includes(key))
        .map((key) => `${step.step}.${key}`)
    );

    expect(unexpected, `Playground rejects these properties: ${unexpected.join(', ')}`).toEqual(
      []
    );
  });

  it('logs in with username, which is the schema property (password is deprecated)', () => {
    const login = stepOf('login');

    expect(login.username).toBe('admin');
    expect(login).not.toHaveProperty('password');
  });

  it('installs the release zip over https and activates it', () => {
    const install = stepOf('installPlugin');
    const pluginData = install.pluginData as { resource?: string; url?: string };
    const options = install.options as { activate?: boolean };

    expect(pluginData.resource).toBe('url');
    expect(pluginData.url).toMatch(/^https:\/\/github\.com\/.+\/releases\/download\/v[\d.]+\/fiveprayer-v[\d.]+\.zip$/);
    expect(options.activate).toBe(true);
  });

  it('lands on the plugin screen once the site is up', () => {
    expect(blueprint.landingPage).toMatch(/^\/wp-admin\/admin\.php\?page=fiveprayer$/);
  });
});
