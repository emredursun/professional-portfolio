// @vitest-environment node
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';
import { LANGUAGES, loadLocales, routeMeta } from '../scripts/lib/route-meta.js';
import { arialWidth } from './serp-width';

/**
 * How the profile pages read as Google search results: the title link and
 * the snippet. Google truncates both by width, rewrites titles that are
 * vague or half-empty, and prefers a meta description that summarises the
 * page in readable sentences over a keyword list (Search Central: "Influencing
 * title links" and "Meta descriptions and snippets").
 */
const ROOT = path.resolve(__dirname, '..');

let constants: Awaited<ReturnType<typeof loadConstants>>;
let locales: ReturnType<typeof loadLocales>;
beforeAll(async () => {
  constants = await loadConstants();
  locales = loadLocales(ROOT);
});

const meta = (route: string, lang = 'en') => routeMeta({ route, lang, constants, locales });

/** The pages someone searching for Emre lands on. */
const PROFILE_ROUTES = ['', '/about', '/resume', '/projects', '/contact'];
/** Desktop title links are about 600px of 20px Arial; leave a margin. */
const MAX_TITLE_PX = 580;
const HOME_TITLE = 'Emre Dursun – QA Consultant: Pega, Tricentis Tosca, Playwright';

describe('title links', () => {
  it('front-loads name, role and specialities on the landing page, in every language', () => {
    for (const lang of LANGUAGES) {
      expect(meta('', lang).title, lang).toBe(HOME_TITLE);
      expect(meta('/about', lang).title, lang).toBe(HOME_TITLE);
    }
  });

  it('fits every profile title in the width Google shows', () => {
    for (const route of PROFILE_ROUTES) {
      for (const lang of LANGUAGES) {
        const { title } = meta(route, lang);
        expect(arialWidth(title), `${lang} ${route || '/'}: ${title}`).toBeLessThanOrEqual(
          MAX_TITLE_PX,
        );
      }
    }
  });

  // The headings are split in two for styling ("Bana" + "Ulaşın"); using the
  // first half as the title made the Turkish contact page "Bana | Emre Dursun".
  it('names each page in full, never with half a heading', () => {
    expect(meta('/contact', 'tr').title).toBe('İletişim | Emre Dursun');
    expect(meta('/resume', 'tr').title).toBe(
      'Özgeçmiş: QA Consultant, Pega, Tricentis Tosca | Emre Dursun',
    );
    expect(meta('/resume').title).toBe(
      'Resume: QA Consultant, Pega, Tricentis Tosca | Emre Dursun',
    );
    expect(meta('/projects', 'nl').title).toBe('Testautomatiseringsprojecten | Emre Dursun');
  });

  it('gives each profile page its own title within a language', () => {
    for (const lang of LANGUAGES) {
      const titles = PROFILE_ROUTES.filter((route) => route !== '').map(
        (route) => meta(route, lang).title,
      );
      expect(new Set(titles).size, lang).toBe(titles.length);
    }
  });
});

describe('snippets', () => {
  it('keeps every profile description to a full sentence of 140-160 characters', () => {
    for (const route of PROFILE_ROUTES) {
      for (const lang of LANGUAGES) {
        const { description } = meta(route, lang);
        const length = [...description].length;
        expect(length, `${lang} ${route || '/'}: ${description}`).toBeGreaterThanOrEqual(140);
        expect(length, `${lang} ${route || '/'}: ${description}`).toBeLessThanOrEqual(160);
        expect(description, `${lang} ${route || '/'}`).toMatch(/\.$/);
      }
    }
  });

  // "/" renders the About page once JavaScript runs, and the result Google
  // shows for the domain uses the rendered description. One text for both.
  it('describes the home page exactly as the About page it renders', () => {
    for (const lang of LANGUAGES) {
      expect(meta('', lang).description, lang).toBe(meta('/about', lang).description);
    }
  });

  it('carries the specialities and certifications in the landing description', () => {
    for (const lang of LANGUAGES) {
      const { description } = meta('/about', lang);
      for (const term of [
        'Sopra Steria Pega Practice',
        'Pega',
        'Tricentis Tosca',
        'Playwright',
        'Testim',
        'Pega CSA & CBA',
        'ISTQB CTFL',
      ]) {
        expect(description, `${lang}: ${term}`).toContain(term);
      }
    }
  });

  it('gives each profile page its own description within a language', () => {
    for (const lang of LANGUAGES) {
      const descriptions = PROFILE_ROUTES.filter((route) => route !== '').map(
        (route) => meta(route, lang).description,
      );
      expect(new Set(descriptions).size, lang).toBe(descriptions.length);
    }
  });
});
