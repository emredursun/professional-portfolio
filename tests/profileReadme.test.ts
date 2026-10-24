// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  badgeUrl,
  encodeBadgeSegment,
  firstSentence,
  htmlToMarkdown,
  linkBadge,
  loadConstants,
  renderReadme,
  shortLevel,
  splitCompany,
  startOfRange,
  validate,
  writeProfileReadme,
} from '../scripts/generate-profile-readme.js';
import os from 'os';

const locale = (name: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, `../public/locales/en/${name}.json`), 'utf8'));

describe('formatting helpers', () => {
  it('converts the locale files\' inline HTML into Markdown emphasis', () => {
    expect(htmlToMarkdown('I care about <strong>reliability</strong> and <em>craft</em>\n  here')).toBe(
      'I care about **reliability** and *craft* here',
    );
  });

  it('escapes shields.io path syntax', () => {
    expect(encodeBadgeSegment('emre-dursun_nl')).toBe('emre--dursun__nl');
    expect(encodeBadgeSegment('CPBA & CPSA')).toBe('CPBA_%26_CPSA');
    expect(encodeBadgeSegment('Jira + Xray #1?')).toBe('Jira_%2B_Xray_%231%3F');
  });

  it('builds badges with and without logos', () => {
    expect(badgeUrl({ name: 'Pega Platform', color: '1F4E79' })).toBe(
      'https://img.shields.io/badge/Pega_Platform-1F4E79?style=flat-square',
    );
    expect(badgeUrl({ name: 'Java', color: 'ED8B00', logo: 'openjdk' })).toContain('&logo=openjdk&logoColor=white');
    expect(linkBadge({ label: 'ISTQB', value: 'CTFL', color: '6E4C9F', href: 'https://x' })).toBe(
      '[![ISTQB](https://img.shields.io/badge/ISTQB-CTFL-6E4C9F?style=for-the-badge)](https://x)',
    );
  });

  it('parses resume dates, levels and company strings', () => {
    expect(startOfRange('May 2026 - Present')).toBe('May 2026');
    expect(shortLevel('Professional (C1)')).toBe('C1');
    expect(shortLevel('Native')).toBe('Native');
    expect(splitCompany('Sopra Steria - Nieuwegein, Utrecht, Netherlands · Hybrid')).toEqual({
      employer: 'Sopra Steria',
      city: 'Nieuwegein',
    });
  });

  it('keeps only the first sentence, unless that would leave a stub', () => {
    expect(firstSentence('A long enough opening sentence for a table cell. Second one.')).toBe(
      'A long enough opening sentence for a table cell.',
    );
    expect(firstSentence('Too short. But the rest carries the meaning.')).toBe(
      'Too short. But the rest carries the meaning.',
    );
  });
});

describe('against the real portfolio data', () => {
  // The real constants module, loaded at run time and read by path.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let constants: Record<string, any>;
  const about = locale('about');
  const resume = locale('resume');

  beforeAll(async () => {
    constants = await loadConstants();
  });

  it('evaluates constants.tsx into its exports', () => {
    expect(constants.PERSONAL_INFO.name).toBe('Emre Dursun');
    expect(constants.PROJECTS.length).toBeGreaterThan(5);
  });

  it('validates the current data without errors or warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => validate({ constants, resume })).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders the role, certifications and featured repos with no gaps', () => {
    const readme = renderReadme({ constants, about, resume });
    expect(readme).toContain('Sopra Steria · Nieuwegein, Netherlands');
    expect(readme).toContain('Certified Pega System Architect (CPSA)');
    expect(readme).toContain('https://github.com/devran-ai/kit');
    expect(readme).not.toMatch(/undefined|\[object Object\]/);
  });

  it('matches the committed profile/README.md byte for byte', () => {
    const committed = fs.readFileSync(path.resolve(__dirname, '../profile/README.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(renderReadme({ constants, about, resume })).toBe(committed);
  });

  it('writes the README once and leaves an identical file untouched', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-readme-'));
    try {
      const outputPath = path.join(dir, 'README.md');
      const first = await writeProfileReadme({ outputPath });
      expect(first.written).toBe(true);
      expect(fs.readFileSync(outputPath, 'utf8')).toBe(first.markdown);
      const second = await writeProfileReadme({ outputPath });
      expect(second.written).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('drift guard', () => {
    const clone = () => structuredClone({ ...constants, SERVICES: constants.SERVICES, PROJECTS: constants.PROJECTS, TECH_STACK: constants.TECH_STACK, PERSONAL_INFO: constants.PERSONAL_INFO });

    it('fails on a technology with no badge mapping', () => {
      const data = clone();
      data.TECH_STACK[0].technologies.push({ name: 'Kubernetes', icon: null });
      expect(() => validate({ constants: data, resume })).toThrow(/Technology "Kubernetes".*no badge/);
    });

    it('fails when a featured project slug disappears', () => {
      const data = clone();
      data.PROJECTS = data.PROJECTS.filter((p: { slug: string }) => p.slug !== 'aegisqa');
      expect(() => validate({ constants: data, resume })).toThrow(/Featured project "aegisqa" no longer exists/);
    });

    it('fails when a featured project loses its GitHub link', () => {
      const data = clone();
      data.PROJECTS.find((p: { slug: string }) => p.slug === 'aegisqa').github = undefined;
      expect(() => validate({ constants: data, resume })).toThrow(/has no github URL/);
    });

    it('fails when a certification points at a removed service', () => {
      const data = clone();
      data.SERVICES = data.SERVICES.filter((s: { slug: string }) => s.slug !== 'tricentis-tosca-automation');
      expect(() => validate({ constants: data, resume })).toThrow(/no longer exists in constants.tsx/);
    });

    it('fails when resume.json has no experience', () => {
      expect(() => validate({ constants: clone(), resume: { experience: [] } })).toThrow(/no experience entries/);
    });

    it('warns, without failing, when the sidebar city disagrees with resume.json', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const data = clone();
      data.PERSONAL_INFO.location = 'Amsterdam, Netherlands';
      expect(() => validate({ constants: data, resume })).not.toThrow();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Nieuwegein'));
    });
  });
});
