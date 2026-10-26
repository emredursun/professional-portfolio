import { afterEach, describe, expect, it, vi } from 'vitest';
import { easeOutQuad, play, tween } from '../src/utils/tween.ts';

const reducedMotion = (matches: boolean) =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((query: string) => ({ matches, media: query }) as MediaQueryList);

describe('tween', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('eases from one value to another and then completes', () => {
    vi.useFakeTimers();
    reducedMotion(false);
    const values: number[] = [];
    const onComplete = vi.fn();
    tween({ from: 0, to: 5, duration: 1000, onUpdate: (v) => values.push(v), onComplete });

    vi.advanceTimersByTime(500);
    expect(onComplete).not.toHaveBeenCalled();
    // Ease-out: past the halfway value at half time.
    expect(values.at(-1)).toBeGreaterThan(2.5);

    vi.advanceTimersByTime(600);
    expect(values.at(-1)).toBe(5);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stops when cancelled', () => {
    vi.useFakeTimers();
    reducedMotion(false);
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const cancel = tween({ from: 0, to: 1, duration: 1000, onUpdate, onComplete });
    vi.advanceTimersByTime(100);
    cancel();
    const calls = onUpdate.mock.calls.length;
    vi.advanceTimersByTime(2000);
    expect(onUpdate.mock.calls.length).toBe(calls);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('jumps straight to the end for reduced motion', () => {
    reducedMotion(true);
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    tween({ from: 0, to: 5, duration: 2000, onUpdate, onComplete });
    expect(onUpdate).toHaveBeenCalledWith(5);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('eases out', () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(0.5)).toBe(0.75);
    expect(easeOutQuad(1)).toBe(1);
  });
});

describe('play', () => {
  it('resolves at once where the Web Animations API is missing (or no element)', async () => {
    await expect(play(null, [], { duration: 100 })).resolves.toBeUndefined();
    const el = document.createElement('div');
    Object.defineProperty(el, 'animate', { value: undefined });
    await expect(play(el, [], { duration: 100 })).resolves.toBeUndefined();
  });

  it('waits for the animation and keeps its end state', async () => {
    const finished = Promise.resolve();
    const animate = vi.fn(() => ({ finished }) as unknown as Animation);
    const el = document.createElement('div');
    Object.defineProperty(el, 'animate', { value: animate });
    await play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    expect(animate).toHaveBeenCalledWith([{ opacity: 1 }, { opacity: 0 }], {
      duration: 300,
      fill: 'forwards',
    });
  });
});
