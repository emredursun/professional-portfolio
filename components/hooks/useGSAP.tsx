import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGSAP = (
  effect: (context: gsap.Context) => void | (() => void),
  deps: React.DependencyList = [],
) => {
  // The caller's dependency list, as with useEffect itself: the effect runs
  // again when they change, not on every new effect function.
  useEffect(() => {
    const ctx = gsap.context(effect);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are supplied by the caller
  }, deps);
};
