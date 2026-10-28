/**
 * Frontmatter for blog posts: a YAML block between two lines of `---`.
 *
 * Deliberately not gray-matter: it accepts `---js` blocks and evaluates them.
 * Here the opener must be exactly `---`, YAML uses the core schema (dates stay
 * strings, no custom tags), duplicate keys and aliases are errors, and any
 * YAML warning fails the build instead of being shrugged off.
 */

import { isAlias, parseDocument, visit } from 'yaml';

const FENCE = '---';
const BOM = String.fromCharCode(0xfeff);

/** @param {string} source */
function normalise(source) {
  const withoutBom = source.startsWith(BOM) ? source.slice(1) : source;
  return withoutBom.replace(/\r\n?/g, '\n');
}

/** @param {import('yaml').Document} doc */
function hasAlias(doc) {
  let found = false;
  visit(doc, {
    Alias() {
      found = true;
      return visit.BREAK;
    },
  });
  return found || isAlias(doc.contents);
}

/**
 * @param {string} source  The whole Markdown file.
 * @param {string} file    Path used in error messages.
 * @returns {{ data: Record<string, unknown>, body: string }}
 */
export function parseFrontmatter(source, file) {
  const lines = normalise(source).split('\n');
  if (lines[0] !== FENCE) {
    throw new Error(`${file}: frontmatter must start with a line containing only ---`);
  }
  // A closer with trailing spaces would otherwise be skipped, and a later ---
  // rule in the body would be taken as the end: say what is actually wrong.
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === FENCE);
  if (end === -1) throw new Error(`${file}: frontmatter has no closing ---`);
  if (lines[end] !== FENCE) {
    throw new Error(`${file}: the closing --- has trailing whitespace (line ${end + 1})`);
  }

  const doc = parseDocument(lines.slice(1, end).join('\n'), {
    schema: 'core',
    uniqueKeys: true,
    prettyErrors: false,
  });
  const problems = [...doc.errors, ...doc.warnings];
  if (problems.length > 0) {
    throw new Error(`${file}: invalid frontmatter: ${problems[0].message}`);
  }
  if (hasAlias(doc)) throw new Error(`${file}: frontmatter must not use aliases (*name)`);

  const data = doc.toJS();
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${file}: frontmatter must be a list of key: value pairs`);
  }
  return { data, body: lines.slice(end + 1).join('\n') };
}
