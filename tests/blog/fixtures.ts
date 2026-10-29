import fs from 'fs';
import path from 'path';
import { BLOG_ENTRY } from '../../scripts/blog/manifest.js';

/** Valid frontmatter; `extra` lines go in before aiAssistance. */
const FRONTMATTER = `---
title: A green test
description: What a passing run tells you.
publishedAt: 2026-12-09
topic: testing
kind: essay
status: verified
evidence:
  confidence: High
  basedOn:
    - My own work
  recheckedAt: 2026-12-09
aiAssistance:
  mine:
    - Everything
  assisted: []
---
`;

/** The note every Turkish or Dutch file needs. */
export const TRANSLATION = 'translation:\n  from: 2026-12-09\n  assistedByAi: true\n';

export function writePost(contentDir: string, slug: string, body: string, extra = '', lang = 'en') {
  const dir = path.join(contentDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const source = FRONTMATTER.replace('aiAssistance:', `${extra}aiAssistance:`) + body;
  fs.writeFileSync(path.join(dir, `${lang}.md`), source);
}

/** A dist folder with the Vite manifest the blog build reads. */
export function makeDist(root: string, name: string) {
  const dist = path.join(root, name);
  fs.mkdirSync(path.join(dist, '.vite'), { recursive: true });
  fs.writeFileSync(
    path.join(dist, '.vite', 'manifest.json'),
    JSON.stringify({
      [BLOG_ENTRY]: {
        file: 'assets/article-abc.js',
        isEntry: true,
        css: ['assets/article-def.css'],
        assets: [
          'assets/newsreader-latin-400-normal-x1.woff2',
          'assets/newsreader-latin-ext-400-normal-x3.woff2',
          'assets/bricolage-grotesque-latin-wght-normal-y2.woff2',
          'assets/bricolage-grotesque-latin-ext-wght-normal-y4.woff2',
        ],
      },
    }),
  );
  return dist;
}

/** A post in English, Turkish and Dutch; `extraEn` goes into the English frontmatter. */
export function writeInAllLanguages(contentDir: string, slug: string, extraEn = '') {
  writePost(contentDir, slug, 'Body\n', extraEn, 'en');
  writePost(contentDir, slug, 'Gövde\n', TRANSLATION, 'tr');
  writePost(contentDir, slug, 'Tekst\n', TRANSLATION, 'nl');
}
