import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { useIdleReady } from './hooks/useIdleReady.tsx';

interface SmoothScrollProps {
  children: React.ReactNode;
  contentRef: React.RefObject<HTMLElement | null>;
  isMobileView: boolean;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children, contentRef, isMobileView }) => {
  // Lenis measures its wrapper and content as it starts (and again from a
  // ResizeObserver). Started during the first render, those reads forced
  // ~30 ms layouts; at the first idle moment the layout is already clean.
  const idleReady = useIdleReady();

  useEffect(() => {
    // If mobile, we might want to stick to native scrolling or window scrolling
    // But for desktop with the specific layout, we need to target the contentRef
    const target = isMobileView ? window : contentRef.current;

    if (!idleReady || !target) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      // Important: For Lenis to work on a specific element, we must provide that element as the wrapper
      // AND usually the content (or let it find the first child).
      // However, Lenis is often designed for window scrolling. 
      // When targeting a specific element, we need to pass that element as the wrapper.
      wrapper: isMobileView ? window : (contentRef.current as HTMLElement),
      content: isMobileView ? document.body : (contentRef.current?.firstElementChild as HTMLElement),
    });

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }

    frame = requestAnimationFrame(raf);

    return () => {
      // The loop used to outlive destroy(), one more per remount.
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [contentRef, isMobileView, idleReady]);

  return <>{children}</>;
};

export default SmoothScroll;
