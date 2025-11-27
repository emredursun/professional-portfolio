import React, { useMemo } from 'react';
import { useReducedMotion } from './hooks/useReducedMotion.tsx';

/**
 * FloatingElements - Ambient floating geometric shapes for premium background effect
 * Creates subtle moving shapes that add depth and visual interest without impacting performance
 */
const FloatingElements: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  // Generate random floating elements
  const elements = useMemo(() => {
    const shapes = ['circle', 'square', 'triangle'];
    const count = 8; // Keep count low for performance
    
    return Array.from({ length: count }, (_, i) => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = Math.random() * 150 + 50; // 50-200px
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = Math.random() * 10 + 15; // 15-25s
      const delay = Math.random() * 5;
      const opacity = Math.random() * 0.03 + 0.01; // Very subtle: 0.01-0.04
      
      return {
        id: i,
        shape,
        size,
        top,
        left,
        duration,
        delay,
        opacity,
      };
    });
  }, []);

  // Don't render if user prefers reduced motion
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {elements.map((element) => {
        const shapeClasses = {
          circle: 'rounded-full',
          square: 'rounded-lg rotate-45',
          triangle: 'rounded-sm',
        };

        return (
          <div
            key={element.id}
            className={`absolute ${shapeClasses[element.shape as keyof typeof shapeClasses]} bg-gradient-to-br from-accent-yellow/20 to-accent-blue/20 dark:from-neon-cyan/20 dark:to-neon-purple/20 blur-2xl animate-float`}
            style={{
              width: `${element.size}px`,
              height: `${element.size}px`,
              top: `${element.top}%`,
              left: `${element.left}%`,
              opacity: element.opacity,
              animationDuration: `${element.duration}s`,
              animationDelay: `${element.delay}s`,
              willChange: 'transform',
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingElements;
