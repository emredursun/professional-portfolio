/**
 * The blog's theme toggle. It writes the same two localStorage keys the
 * portfolio reads (App.tsx), so a choice made on either side holds on both.
 * The button is a toggle button: aria-pressed is true while the dark theme
 * is on.
 */

type Theme = 'light' | 'dark';

const THEMES: readonly Theme[] = ['light', 'dark'];

/** The theme on screen: a pinned class on <html>, otherwise the system setting. */
export function currentTheme(root: HTMLElement, prefersDark: boolean): Theme {
  if (root.classList.contains('dark')) return 'dark';
  if (root.classList.contains('light')) return 'light';
  return prefersDark ? 'dark' : 'light';
}

export function nextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

function remember(storage: Storage, theme: Theme): void {
  try {
    storage.setItem('theme', theme);
    storage.setItem('userToggledTheme', 'true');
  } catch {
    // Storage blocked: the page still switches, it just won't be remembered.
  }
}

export function bindThemeToggle(
  doc: Document,
  prefersDark: () => boolean,
  storage: Storage = doc.defaultView!.localStorage,
): void {
  const root = doc.documentElement;
  const buttons = [...doc.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')];
  const sync = () => {
    const pressed = String(currentTheme(root, prefersDark()) === 'dark');
    buttons.forEach((button) => button.setAttribute('aria-pressed', pressed));
  };

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      const theme = nextTheme(currentTheme(root, prefersDark()));
      root.classList.remove(...THEMES);
      root.classList.add(theme);
      remember(storage, theme);
      sync();
    }),
  );
  sync();
}
