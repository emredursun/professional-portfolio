#!/usr/bin/env node

/**
 * Starts a new Field Notes post as drafts in three languages:
 *
 *   npm run blog:new -- <slug> [--kind essay|note] [--topic testing|ai|life]
 *
 * See scripts/blog/scaffold.js; the writing checklist is in docs/RUNBOOK.md.
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { parseArgs } from 'util';
import { scaffoldPost } from './blog/scaffold.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function main(argv = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { kind: { type: 'string' }, topic: { type: 'string' } },
  });
  if (positionals.length !== 1) {
    throw new Error(
      'usage: npm run blog:new -- <slug> [--kind essay|note] [--topic testing|ai|life]',
    );
  }
  const files = scaffoldPost({
    contentDir: path.join(ROOT, 'blog', 'content'),
    slug: positionals[0],
    kind: values.kind,
    topic: values.topic,
    // The only clock read in the blog's tooling: the day writing starts, in
    // local time (toISOString is UTC, a day behind in the Dutch early hours).
    today: new Date().toLocaleDateString('sv-SE'),
  });
  process.stdout.write(
    `blog:new wrote\n${files.map((file) => `  ${file}`).join('\n')}\n` +
      'Next: write each version, then remove its "placeholder" and "draft" lines; run `npm run blog:og`.\n',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
