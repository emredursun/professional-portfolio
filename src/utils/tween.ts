/**
 * The two animation helpers the site needs, on browser APIs alone. They
 * replace GSAP, which shipped ~44 KB gzip on the critical path for a
 * counter, an intro and two parallax layers.
 */

/** Quadratic ease-out (GSAP's power1.out). */
export const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);

interface TweenOptions {
  from: number;
  to: number;
  /** Milliseconds. */
  duration: number;
  ease?: (t: number) => number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Animate a number on requestAnimationFrame. With reduced motion it jumps to
 * the end value at once. Returns a function that cancels it.
 */
export function tween({
  from,
  to,
  duration,
  ease = easeOutQuad,
  onUpdate,
  onComplete,
}: TweenOptions): () => void {
  if (duration <= 0 || prefersReducedMotion()) {
    onUpdate(to);
    onComplete?.();
    return () => {};
  }
  let frame = 0;
  let start: number | null = null;
  const step = (now: number) => {
    start ??= now;
    const progress = Math.min((now - start) / duration, 1);
    onUpdate(from + (to - from) * ease(progress));
    if (progress < 1) frame = requestAnimationFrame(step);
    else onComplete?.();
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/**
 * Run a Web Animations API animation and resolve when it ends, keeping its
 * final frame. Resolves at once without an element or the API (jsdom).
 */
export function play(
  element: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Promise<void> {
  if (!element || typeof element.animate !== 'function') return Promise.resolve();
  return element.animate(keyframes, { ...options, fill: 'forwards' }).finished.then(
    () => undefined,
    // Cancelled (the element unmounted): nothing left to wait for.
    () => undefined,
  );
}
