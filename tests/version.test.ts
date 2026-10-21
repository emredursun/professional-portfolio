// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildStamp, resolveCommit } from '../scripts/write-version.js';

describe('resolveCommit', () => {
  it('prefers the CI commit', () => {
    expect(resolveCommit({ GITHUB_SHA: 'abc123' }, () => 'from-git\n')).toBe('abc123');
  });

  it('falls back to git, trimmed', () => {
    expect(resolveCommit({}, () => 'deadbeef\n')).toBe('deadbeef');
  });

  it('reports "unknown" when git is unavailable', () => {
    expect(
      resolveCommit({}, () => {
        throw new Error('not a git repository');
      }),
    ).toBe('unknown');
  });
});

describe('buildStamp', () => {
  it('records the commit, a short form, the ref and the build time', () => {
    expect(buildStamp({ commit: '5c89cce9872bffe8', builtAt: '2026-10-21T00:00:00.000Z', ref: 'main' })).toEqual({
      commit: '5c89cce9872bffe8',
      shortCommit: '5c89cce',
      ref: 'main',
      builtAt: '2026-10-21T00:00:00.000Z',
    });
  });

  it('keeps "unknown" intact and nulls a missing ref', () => {
    expect(buildStamp({ commit: 'unknown', builtAt: 't', ref: undefined })).toMatchObject({
      shortCommit: 'unknown',
      ref: null,
    });
  });
});
