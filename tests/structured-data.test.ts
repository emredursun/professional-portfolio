// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';
import { CERTIFICATIONS } from '../scripts/generate-profile-readme.js';
import {
  LANGUAGES,
  PERSON_ID,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
  loadLocales,
  pageNode,
  routeMeta,
} from '../scripts/lib/route-meta.js';

/**
 * The site-wide JSON-LD in index.html is one linked graph: everything that
 * refers to Emre points at a single Person by @id. These checks keep it that
 * way when the file is edited by hand.
 */
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
  (m) => JSON.parse(m[1]),
);

type Node = Record<string, unknown>;
const graph: Node[] = blocks.flatMap((block) => block['@graph'] ?? [block]);
const byId = new Map(
  graph.filter((node) => node['@id']).map((node) => [node['@id'] as string, node]),
);

/** Every {"@id": ...} reference anywhere in the graph. */
function references(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(references);
  if (value && typeof value === 'object') {
    const node = value as Node;
    const own =
      Object.keys(node).length === 1 && typeof node['@id'] === 'string'
        ? [node['@id'] as string]
        : [];
    return [...own, ...Object.values(node).flatMap(references)];
  }
  return [];
}

describe('site-wide structured data', () => {
  it('is a single graph with one Person', () => {
    expect(blocks).toHaveLength(1);
    expect(graph.filter((node) => node['@type'] === 'Person')).toHaveLength(1);
    expect(byId.get('https://emredursun.nl/#person')).toMatchObject({
      '@type': 'Person',
      name: 'Emre Dursun',
    });
  });

  it('leaves projects to their own pages instead of a hand-kept list', () => {
    expect(graph.filter((node) => node['@type'] === 'CreativeWork')).toEqual([]);
  });

  it('resolves every @id reference to a node in the graph', () => {
    const missing = references(graph).filter((id) => !byId.has(id));
    expect(missing).toEqual([]);
  });

  it('never describes Emre inline: other nodes reference the Person by @id', () => {
    const inlinePeople = JSON.stringify(graph.filter((node) => node['@type'] !== 'Person')).match(
      /"@type":"Person"/g,
    );
    expect(inlinePeople).toBeNull();
  });

  it('points the portrait at the published, descriptively named file', async () => {
    const { PERSONAL_INFO } = await loadConstants();
    const portrait = byId.get('https://emredursun.nl/#portrait');
    expect(portrait).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: `https://emredursun.nl${PERSONAL_INFO.portrait}`,
      creditText: 'Emre Dursun',
    });
    expect(fs.existsSync(path.join(ROOT, 'public', PERSONAL_INFO.portrait))).toBe(true);
  });

  it('publishes no street address or postcode, and keeps home and work apart', () => {
    expect(JSON.stringify(graph)).not.toMatch(/postalCode|streetAddress/);
    const person = byId.get('https://emredursun.nl/#person') as Node;
    // Home: province only. Nieuwegein is the employer's office.
    expect(person.address).toEqual({
      '@type': 'PostalAddress',
      addressRegion: 'Noord-Holland',
      addressCountry: 'NL',
    });
    expect(JSON.stringify(person.workLocation)).toContain('Nieuwegein');
  });
});

/** "https://x/y/" and "https://x/y" are the same profile. */
const sameUrl = (url: string) => url.replace(/\/$/, '');
const asArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

describe('the Person behind the profile', () => {
  const person = byId.get(PERSON_ID) as Node;

  it('states the role and employer as on the CV and LinkedIn', () => {
    expect(person.jobTitle).toBe('QA Consultant');
    expect(person.worksFor).toMatchObject({
      '@type': 'Organization',
      name: 'Sopra Steria',
      department: { name: 'Pega Practice (RulesMatter)' },
    });
  });

  it('names the specialities people search for', () => {
    expect(person.knowsAbout).toEqual(
      expect.arrayContaining([
        'Pega Platform',
        'Pega testing',
        'Tricentis Tosca',
        'Model-Based Test Automation',
        'Tricentis Testim',
        'Playwright',
        'ISTQB',
        'Test Automation',
        'AI-Driven Development',
      ]),
    );
    for (const term of ['Pega', 'Tricentis Tosca', 'Playwright', 'Testim', 'ISTQB']) {
      expect(person.description, term).toContain(term);
    }
  });

  it('links the same profiles the site does, LinkedIn and GitHub included', async () => {
    const { SOCIAL_LINKS } = await loadConstants();
    const sameAs = (person.sameAs as string[]).map(sameUrl);
    for (const name of ['linkedin', 'github']) {
      const link = SOCIAL_LINKS.find((item: { name: string }) => item.name === name);
      expect(sameAs, name).toContain(sameUrl(link.url));
    }
  });

  // The CV's certification list (scripts/generate-profile-readme.js) is the
  // source of truth; every entry must appear as a credential, by its CV name.
  it('lists every certification on the CV as a credential', () => {
    const credentials = asArray(person.hasCredential as Node[]);
    for (const cert of CERTIFICATIONS) {
      const match = credentials.find((credential) =>
        [credential.name, ...asArray(credential.alternateName as string[])].includes(cert.name),
      );
      expect(match, cert.name).toBeDefined();
    }
  });

  it('marks up each credential the way schema.org defines one', () => {
    for (const credential of asArray(person.hasCredential as Node[])) {
      expect(credential, String(credential.name)).toMatchObject({
        '@type': 'EducationalOccupationalCredential',
        // Free text in schema.org: "professional certificate" as Google's
        // JobPosting docs word it, and "badge" for the AE1 course.
        credentialCategory: expect.stringMatching(/^(professional certificate|badge)$/),
        recognizedBy: { '@type': 'Organization', name: expect.any(String) },
      });
      if (credential.dateCreated) {
        expect(credential.dateCreated).toMatch(/^\d{4}(-\d{2}(-\d{2})?)?$/);
      }
    }
  });

  it('uses the names on the LinkedIn headline as alternate credential names', () => {
    const names = asArray(person.hasCredential as Node[]).flatMap((credential) => [
      credential.name,
      ...asArray(credential.alternateName as string[]),
    ]);
    expect(names).toEqual(expect.arrayContaining(['Pega CSA', 'Pega CBA', 'ISTQB CTFL']));
  });
});

describe('the WebSite and the pages', () => {
  it('declares a short site name, with the domain as the fallback', () => {
    expect(byId.get(WEBSITE_ID)).toMatchObject({
      '@type': 'WebSite',
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: expect.arrayContaining(['emredursun.nl']),
    });
  });

  it('leaves out the keywords meta tag, which Google ignores', () => {
    expect(html).not.toMatch(/<meta\s+name="keywords"/);
  });

  it('links every prerendered page node into the site graph', async () => {
    const constants = await loadConstants();
    const locales = loadLocales(ROOT);
    for (const route of ['', '/about', '/resume', '/projects', '/contact']) {
      for (const lang of LANGUAGES) {
        const node = pageNode(routeMeta({ route, lang, constants, locales }));
        const missing = references(node).filter((id) => !byId.has(id));
        expect(missing, `${lang} ${route || '/'}`).toEqual([]);
      }
    }
  });
});
