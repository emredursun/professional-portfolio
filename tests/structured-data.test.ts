// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';

/**
 * The site-wide JSON-LD in index.html is one linked graph: everything that
 * refers to Emre points at a single Person by @id. These checks keep it that
 * way when the file is edited by hand.
 */
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

type Node = Record<string, unknown>;
const graph: Node[] = blocks.flatMap((block) => block['@graph'] ?? [block]);
const byId = new Map(graph.filter((node) => node['@id']).map((node) => [node['@id'] as string, node]));

/** Every {"@id": ...} reference anywhere in the graph. */
function references(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(references);
  if (value && typeof value === 'object') {
    const node = value as Node;
    const own = Object.keys(node).length === 1 && typeof node['@id'] === 'string' ? [node['@id'] as string] : [];
    return [...own, ...Object.values(node).flatMap(references)];
  }
  return [];
}

describe('site-wide structured data', () => {
  it('is a single graph with one Person', () => {
    expect(blocks).toHaveLength(1);
    expect(graph.filter((node) => node['@type'] === 'Person')).toHaveLength(1);
    expect(byId.get('https://emredursun.nl/#person')).toMatchObject({ '@type': 'Person', name: 'Emre Dursun' });
  });

  it('resolves every @id reference to a node in the graph', () => {
    const missing = references(graph).filter((id) => !byId.has(id));
    expect(missing).toEqual([]);
  });

  it('never describes Emre inline: other nodes reference the Person by @id', () => {
    const inlinePeople = JSON.stringify(graph.filter((node) => node['@type'] !== 'Person')).match(/"@type":"Person"/g);
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
    expect(person.address).toEqual({ '@type': 'PostalAddress', addressRegion: 'Noord-Holland', addressCountry: 'NL' });
    expect(JSON.stringify(person.workLocation)).toContain('Nieuwegein');
  });
});
