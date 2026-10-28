// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validatePost } from '../../scripts/blog/schema.js';

const FILE = 'blog/content/a-green-test/en.md';

function valid(overrides: Record<string, unknown> = {}) {
  return {
    title: 'What does a green test actually tell you?',
    description: 'A passing run and a trustworthy result are different things.',
    publishedAt: '2026-12-09',
    topic: 'testing',
    kind: 'essay',
    status: 'verified',
    evidence: {
      confidence: 'High for UI tests, untested for APIs',
      basedOn: ['My own Pega and Tosca work'],
      recheckedAt: '2026-12-09',
    },
    aiAssistance: {
      mine: ['The idea, the argument and every example'],
      assisted: ['Proofreading'],
    },
    ...overrides,
  };
}

describe('validatePost', () => {
  it('accepts a complete post and fills in defaults', () => {
    const post = validatePost(valid(), FILE);
    expect(post.corrections).toEqual([]);
    expect(post.draft).toBe(false);
    expect(post.updatedAt).toBeUndefined();
  });

  it('returns a new frozen object, never the input', () => {
    const input = valid();
    const post = validatePost(input, FILE);
    expect(post).not.toBe(input);
    expect(Object.isFrozen(post)).toBe(true);
  });

  it('rejects unknown keys, naming the file', () => {
    expect(() => validatePost(valid({ titel: 'typo' }), FILE)).toThrow(/a-green-test\/en\.md/);
  });

  it('names the field that failed', () => {
    expect(() => validatePost(valid({ status: 'done' }), FILE)).toThrow(/status/);
  });

  it.each(['hypothesis', 'testing', 'verified', 'revised'])('accepts the status %s', (status) => {
    expect(validatePost(valid({ status }), FILE).status).toBe(status);
  });

  it.each(['2026-1-9', '09-12-2026', '2026-12-09T10:00:00Z', '2026-13-01', '2026-02-30'])(
    'rejects the date %s',
    (publishedAt) => {
      expect(() => validatePost(valid({ publishedAt }), FILE)).toThrow(/publishedAt/);
    },
  );

  it('rejects an update older than the publication', () => {
    expect(() => validatePost(valid({ updatedAt: '2026-12-01' }), FILE)).toThrow(/updatedAt/);
  });

  it('accepts corrections in date order and rejects them out of order', () => {
    const ordered = [
      { date: '2026-12-10', text: 'Fixed a typo.' },
      { date: '2026-12-12', text: 'Clarified the second question.' },
    ];
    expect(validatePost(valid({ corrections: ordered }), FILE).corrections).toHaveLength(2);
    expect(() => validatePost(valid({ corrections: [...ordered].reverse() }), FILE)).toThrow(
      /corrections/,
    );
  });

  it('rejects a correction dated before the publication', () => {
    const corrections = [{ date: '2026-12-01', text: 'Too early.' }];
    expect(() => validatePost(valid({ corrections }), FILE)).toThrow(/corrections/);
  });

  it('requires at least one source of evidence', () => {
    const evidence = { ...valid().evidence, basedOn: [] };
    expect(() => validatePost(valid({ evidence }), FILE)).toThrow(/basedOn/);
  });

  it('only accepts an https link for the prompts', () => {
    const aiAssistance = { ...valid().aiAssistance, promptsUrl: 'http://example.com' };
    expect(() => validatePost(valid({ aiAssistance }), FILE)).toThrow(/promptsUrl/);
    const ok = { ...valid().aiAssistance, promptsUrl: 'https://github.com/x' };
    expect(validatePost(valid({ aiAssistance: ok }), FILE).aiAssistance.promptsUrl).toBe(
      'https://github.com/x',
    );
  });

  it('limits the description to what a search result shows', () => {
    expect(() => validatePost(valid({ description: 'x'.repeat(161) }), FILE)).toThrow(
      /description/,
    );
  });

  it('rejects empty strings', () => {
    expect(() => validatePost(valid({ title: '  ' }), FILE)).toThrow(/title/);
  });
});
