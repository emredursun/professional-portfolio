import React, { useEffect } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
  children: React.ReactNode;
  contentRef: React.RefObject<HTMLElement>;
  isMobileView: boolean;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children, contentRef, isMobileView }) => {
  useEffect(() => {
    // If mobile, we might want to stick to native scrolling or window scrolling
    // But for desktop with the specific layout, we need to target the contentRef
    const target = isMobileView ? window : contentRef.current;

    if (!target) return;

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

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [contentRef, isMobileView]);

  return <>{children}</>;
};

export default SmoothScroll;
