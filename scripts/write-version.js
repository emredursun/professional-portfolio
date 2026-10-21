#!/usr/bin/env node

/**
 * Build Stamp
 *
 * Writes dist/version.json after every build, so "what is live right now?"
 * has a one-line answer:
 *
 *   curl -s https://emredursun.nl/version.json
 *
 * The uptime workflow and the rollback runbook (docs/RUNBOOK.md) both rely on
 * it. In CI the commit comes from GITHUB_SHA; locally from git.
 *
 * Usage:
 *   node scripts/write-version.js
 *   or automatically via npm: postbuild
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'dist/version.json');

/** Resolve the commit being built, preferring CI's value over git. */
export function resolveCommit(env = process.env, runGit = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' })) {
    if (env.GITHUB_SHA) return env.GITHUB_SHA;
    try {
        return runGit().trim();
    } catch {
        return 'unknown';
    }
}

/** Assemble the stamp. Kept pure so it can be tested. */
export function buildStamp({ commit, builtAt, ref }) {
    return {
        commit,
        shortCommit: commit === 'unknown' ? commit : commit.slice(0, 7),
        ref: ref || null,
        builtAt,
    };
}

function writeVersion() {
    try {
        if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
            throw new Error('dist/ does not exist - run the build first');
        }
        const stamp = buildStamp({
            commit: resolveCommit(),
            builtAt: new Date().toISOString(),
            ref: process.env.GITHUB_REF_NAME,
        });
        fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(stamp, null, 2)}\n`, 'utf8');
        console.log(`🏷️  version.json: ${stamp.shortCommit} built ${stamp.builtAt}`);
    } catch (error) {
        console.error('❌ Error writing version.json:', error.message);
        process.exit(1);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    writeVersion();
}
