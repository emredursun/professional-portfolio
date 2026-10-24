// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { validate } from '@jsonresume/schema';
import { loadConstants } from '../scripts/lib/load-constants.js';
import { buildLlmsTxt, buildResume, dateRange, isoMonth } from '../scripts/generate-agent-profile.js';

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

let resumeJson: ReturnType<typeof buildResume>;
let llms: string;
beforeAll(async () => {
  const constants = await loadConstants();
  const about = read('public/locales/en/about.json');
  resumeJson = buildResume({ constants, resume: read('public/locales/en/resume.json'), about, builtAt: '2026-10-24T12:00:00.000Z' });
  llms = buildLlmsTxt({ constants, about, resumeJson });
});

describe('dates', () => {
  it('turns the CV date ranges into ISO months', () => {
    expect(isoMonth('Sep 2023')).toBe('2023-09');
    expect(isoMonth('September 2019')).toBe('2019-09');
    expect(isoMonth('2024')).toBe('2024');
    expect(dateRange('May 2026 - Present')).toEqual({ startDate: '2026-05' });
    expect(dateRange('Sep 2020 - Jan 2023')).toEqual({ startDate: '2020-09', endDate: '2023-01' });
  });

  it('fails loudly on a date it cannot read instead of guessing', () => {
    expect(() => isoMonth('Spring 2024')).toThrow(/Unrecognised date/);
  });
});

describe('resume.json', () => {
  it('validates against the official JSON Resume schema', async () => {
    const errors = await new Promise((resolve) => validate(resumeJson, (err: unknown) => resolve(err)));
    expect(errors).toBeFalsy();
  });

  it('carries the current role, every certification and every project', () => {
    expect(resumeJson.work[0]).toMatchObject({ name: 'Sopra Steria', startDate: '2026-05' });
    expect(resumeJson.work[0]).not.toHaveProperty('endDate');
    expect(resumeJson.certificates.find((c) => /ISTQB/.test(c.name))?.url).toMatch(/^https:\/\/app\.diplomasafe\.com\//);
    expect(resumeJson.projects.every((p: { url: string }) => p.url.startsWith('https://emredursun.nl/projects/'))).toBe(true);
    expect(resumeJson.basics.profiles.map((p: { network: string }) => p.network)).toEqual(
      expect.arrayContaining(['LinkedIn', 'GitHub', 'X']),
    );
  });

  it('publishes no home address and no inline HTML', () => {
    const text = JSON.stringify(resumeJson);
    expect(resumeJson.basics.location).toEqual({ region: 'Noord-Holland', countryCode: 'NL' });
    expect(text).not.toMatch(/Hoogkarspel|postalCode|<strong>/);
  });
});

describe('llms.txt', () => {
  it('follows the llmstxt.org layout: H1, summary blockquote, then link lists', () => {
    const lines = llms.split('\n');
    expect(lines[0]).toBe('# Emre Dursun');
    expect(lines[2]).toMatch(/^> .{40,}/);
    expect(llms.match(/^## /gm)?.length).toBeGreaterThanOrEqual(4);
    expect(llms).toContain('## Optional');
  });

  it('links every service and project on the site, never the source repository', () => {
    expect(llms.match(/\(https:\/\/emredursun\.nl\/about\/[a-z-]+\)/g)).toHaveLength(8);
    expect(llms.match(/\(https:\/\/emredursun\.nl\/projects\/[a-z-]+\)/g)).toHaveLength(12);
    expect(llms).not.toContain('github.com/emredursun/professional-portfolio');
    expect(llms).not.toMatch(/<[a-z]+>/);
  });
});
