// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it } from 'vitest';
import { bindThemeToggle, currentTheme, nextTheme } from '../../blog/client/theme-toggle.ts';

const themeInit = readFileSync(resolve(process.cwd(), 'blog/client/theme-init.js'), 'utf8');

/**
 * Runs blog/client/theme-init.js the way the browser does, before any CSS,
 * with the given storage, and returns the classes it put on <html>.
 */
function runInit(stored: Record<string, string> | 'blocked') {
  const classes = new Set<string>();
  const localStorage =
    stored === 'blocked'
      ? {
          getItem() {
            throw new Error('SecurityError');
          },
        }
      : { getItem: (key: string) => stored[key] ?? null };
  const document = { documentElement: { classList: { add: (c: string) => classes.add(c) } } };
  runInNewContext(themeInit, { document, localStorage });
  return [...classes].sort();
}

describe('theme-init.js (mirrors App.tsx)', () => {
  it('marks that JavaScript runs, so the toggle can show', () => {
    expect(runInit({})).toEqual(['js']);
  });

  it('follows the system setting when the visitor never chose a theme', () => {
    // App.tsx always writes "theme", even when it only copied the system
    // setting; without the toggle flag it must not pin the blog.
    expect(runInit({ theme: 'dark' })).toEqual(['js']);
  });

  it('pins the theme the visitor chose on the portfolio', () => {
    expect(runInit({ theme: 'dark', userToggledTheme: 'true' })).toEqual(['dark', 'js']);
    expect(runInit({ theme: 'light', userToggledTheme: 'true' })).toEqual(['js', 'light']);
  });

  it('ignores a stored value it does not know', () => {
    expect(runInit({ theme: 'sepia', userToggledTheme: 'true' })).toEqual(['js']);
  });

  it('keeps working when storage is blocked', () => {
    expect(runInit('blocked')).toEqual(['js']);
  });
});

describe('theme-toggle', () => {
  afterEach(() => {
    document.documentElement.className = '';
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('reads a pinned theme from <html>, otherwise the system setting', () => {
    const root = document.documentElement;
    expect(currentTheme(root, true)).toBe('dark');
    expect(currentTheme(root, false)).toBe('light');
    root.classList.add('light');
    expect(currentTheme(root, true)).toBe('light');
  });

  it('flips between the two themes', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });

  it('switches on click and stores the choice where the portfolio reads it', () => {
    document.body.innerHTML =
      '<button type="button" data-theme-toggle aria-pressed="false">Dark theme</button>';
    bindThemeToggle(document, () => false);
    const button = document.querySelector('button')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('userToggledTheme')).toBe('true');

    button.click();
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('still switches the page when storage is unavailable', () => {
    document.body.innerHTML = '<button type="button" data-theme-toggle>Dark theme</button>';
    const blocked = {
      setItem() {
        throw new Error('QuotaExceeded');
      },
    } as unknown as Storage;
    bindThemeToggle(document, () => false, blocked);
    document.querySelector('button')!.click();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
