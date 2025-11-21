import { useEffect, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export const useMousePosition = (debounceMs: number = 10): MousePosition => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let animationFrameId: number;

    const updateMousePosition = (e: MouseEvent) => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        animationFrameId = requestAnimationFrame(() => {
          setMousePosition({ x: e.clientX, y: e.clientY });
        });
      }, debounceMs);
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [debounceMs]);

  return mousePosition;
};
