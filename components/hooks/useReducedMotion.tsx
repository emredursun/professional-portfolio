import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

/**
 * Custom hook to detect user's motion preferences
 * Respects prefers-reduced-motion media query for accessibility
 * @returns boolean - true if user prefers reduced motion
 *
 * Reads the media query through useSyncExternalStore: correct on the first
 * render (no flash of motion before an effect corrects it) and updated when
 * the visitor changes the setting.
 */
export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
