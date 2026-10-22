import { describe, expect, it } from 'vitest';
import { shouldRenderDecor } from '../src/utils/decor.ts';

const media = (matching: string[]) => (q: string) => ({ matches: matching.includes(q) });
const desktop = { matchMedia: media([]), innerWidth: 1440, saveData: false };

describe('shouldRenderDecor', () => {
  it('renders on a mouse-driven desktop', () => {
    expect(shouldRenderDecor(desktop)).toBe(true);
  });

  it('skips when the visitor prefers reduced motion', () => {
    expect(shouldRenderDecor({ ...desktop, matchMedia: media(['(prefers-reduced-motion: reduce)']) })).toBe(false);
  });

  it('skips on touch-first devices', () => {
    expect(shouldRenderDecor({ ...desktop, matchMedia: media(['(pointer: coarse)']) })).toBe(false);
  });

  it('skips below the desktop breakpoint', () => {
    expect(shouldRenderDecor({ ...desktop, innerWidth: 1023 })).toBe(false);
  });

  it('skips when data saver is on', () => {
    expect(shouldRenderDecor({ ...desktop, saveData: true })).toBe(false);
  });

  it('treats a missing matchMedia as "no preference"', () => {
    expect(shouldRenderDecor({ innerWidth: 1440 })).toBe(true);
  });

  it('reads the real environment by default', () => {
    expect(typeof shouldRenderDecor()).toBe('boolean');
  });
});
