// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { buildStamp, resolveCommit, writeVersion } from '../scripts/write-version.js';

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

describe('writeVersion', () => {
  it('writes the stamp into an existing build directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-'));
    try {
      const outputPath = path.join(dir, 'version.json');
      const stamp = writeVersion({
        outputPath,
        env: { GITHUB_SHA: 'cafebabe1234', GITHUB_REF_NAME: 'main' },
        now: '2026-10-21T00:00:00.000Z',
      });
      expect(stamp.shortCommit).toBe('cafebab');
      expect(JSON.parse(fs.readFileSync(outputPath, 'utf8'))).toEqual(stamp);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to run before a build exists', () => {
    expect(() => writeVersion({ outputPath: path.join(os.tmpdir(), 'no-such-dir-xyz', 'version.json') })).toThrow(
      /run the build first/,
    );
  });

  it('uses git when no CI commit is set', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-'));
    try {
      const stamp = writeVersion({ outputPath: path.join(dir, 'v.json'), env: {}, runGit: () => 'feedface99\n' });
      expect(stamp).toMatchObject({ commit: 'feedface99', ref: null });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
