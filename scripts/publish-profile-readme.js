#!/usr/bin/env node

/**
 * Profile README Publisher
 *
 * Pushes the generated profile/README.md to the GitHub profile repository
 * (github.com/emredursun/emredursun), where it renders on the profile page.
 *
 * The profile repository is treated as a build output, not a source: it is
 * cloned into a temporary directory, overwritten, committed and pushed. Never
 * edit the README there by hand - the next publish would overwrite it.
 *
 * Requires the GitHub CLI to be installed and authenticated (`gh auth login`),
 * which is also what supplies git credentials for the push.
 *
 * Usage:
 *   node scripts/publish-profile-readme.js
 *   or via npm: npm run publish:profile-readme   (regenerates first)
 *
 * Add --dry-run to see the diff without pushing.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const SOURCE_PATH = path.join(ROOT, 'profile/README.md');

const PROFILE_REPO = 'emredursun/emredursun';
const DRY_RUN = process.argv.includes('--dry-run');

/** Run a command and return trimmed stdout. */
function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

/** Run a command for its side effect, letting output through. */
function runVerbose(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

/** Fail early with a readable message instead of a stack trace. */
function assertPreconditions() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error('profile/README.md does not exist - run `npm run generate:profile-readme` first');
  }

  try {
    run('gh', ['auth', 'status']);
  } catch {
    throw new Error('GitHub CLI is not authenticated - run `gh auth login` first');
  }
}

/** Short SHA of the portfolio commit this README was generated from. */
function sourceRevision() {
  try {
    const sha = run('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT });
    const dirty = run('git', ['status', '--porcelain'], { cwd: ROOT }).length > 0;
    return dirty ? `${sha}-dirty` : sha;
  } catch {
    return 'unknown';
  }
}

function publish() {
  assertPreconditions();

  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-readme-'));

  try {
    console.log(`📥 Cloning ${PROFILE_REPO}...`);
    run('gh', ['repo', 'clone', PROFILE_REPO, workdir, '--', '--depth', '1']);

    const target = path.join(workdir, 'README.md');
    fs.copyFileSync(SOURCE_PATH, target);

    // Stage first, then ask git whether anything actually changed. `git status`
    // is not a safe check here: on Windows core.autocrlf reports the freshly
    // copied LF file as modified even when the normalized content is identical,
    // which would send us on to commit an empty changeset.
    run('git', ['add', 'README.md'], { cwd: workdir });
    const staged = run('git', ['diff', '--cached', '--stat'], { cwd: workdir });

    if (!staged) {
      console.log('✅ Profile README is already up to date - nothing to publish.');
      return;
    }

    console.log('\n📝 Pending changes:\n');
    console.log(staged);

    if (DRY_RUN) {
      console.log('\n🔍 Dry run - nothing pushed. Full diff:\n');
      runVerbose('git', ['--no-pager', 'diff', '--cached'], { cwd: workdir });
      return;
    }

    const revision = sourceRevision();
    run('git', ['commit', '-m', `docs: sync profile README from portfolio@${revision}`], { cwd: workdir });
    runVerbose('git', ['push'], { cwd: workdir });

    console.log('\n✅ Profile README published!');
    console.log(`🎯 Repository: github.com/${PROFILE_REPO}`);
    console.log(`🔗 Live at: https://github.com/${PROFILE_REPO.split('/')[0]}`);
    console.log(`📌 Source revision: portfolio@${revision}`);
  } finally {
    fs.rmSync(workdir, { recursive: true, force: true });
  }
}

try {
  publish();
} catch (error) {
  console.error('❌ Error publishing profile README:', error.message);
  process.exit(1);
}
