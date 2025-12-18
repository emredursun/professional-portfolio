import { useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGSAP = (
  effect: (context: gsap.Context) => void | (() => void),
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const ctx = gsap.context(effect);
    return () => ctx.revert();
  }, deps);
};
