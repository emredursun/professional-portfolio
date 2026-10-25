// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';

const ROOT = path.resolve(__dirname, '..');

type ProjectEntry = {
  title?: string;
  description?: string;
  detailedDescription?: string;
  metrics?: string[];
  features?: Record<string, unknown>;
  results?: Record<string, unknown>;
};

const projectsFor = (lang: string): Record<string, ProjectEntry> =>
  JSON.parse(fs.readFileSync(path.join(ROOT, `public/locales/${lang}/projects.json`), 'utf8'))
    .projects;

let constants: Awaited<ReturnType<typeof loadConstants>>;
beforeAll(async () => {
  constants = await loadConstants();
});

// Six projects were English on the Dutch and Turkish pages, and in their
// prerendered heads, because they had neither a key nor locale entries.
describe.each(['nl', 'tr'])('project translations (%s)', (lang) => {
  it('every project has a translation key and an entry', () => {
    const entries = projectsFor(lang);
    const missing = constants.PROJECTS.map((p: { slug: string }) => p.slug).filter(
      (slug: string) => !entries[constants.PROJECT_TRANSLATION_KEYS[slug]],
    );
    expect(missing).toEqual([]);
  });

  it('each entry translates the text a visitor reads, item for item', () => {
    const entries = projectsFor(lang);
    for (const project of constants.PROJECTS) {
      const entry = entries[constants.PROJECT_TRANSLATION_KEYS[project.slug]];
      if (!entry) continue;
      expect(entry.title, project.slug).toBeTruthy();
      expect(entry.description, project.slug).toBeTruthy();
      if (project.detailedDescription) expect(entry.detailedDescription, project.slug).toBeTruthy();
      // Features and results are matched by position, so the counts must agree.
      if (project.metrics) expect(entry.metrics?.length, project.slug).toBe(project.metrics.length);
      if (project.features) {
        expect(Object.keys(entry.features ?? {}).length, project.slug).toBe(
          project.features.length,
        );
      }
      if (project.results) {
        expect(Object.keys(entry.results ?? {}).length, project.slug).toBe(project.results.length);
      }
    }
  });
});
