
import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const cursorSize = isHovering ? 60 : 20;

  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0)
  };

  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouse.x, smoothOptions),
    y: useSpring(mouse.y, smoothOptions)
  };

  const manageMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    mouse.x.set(clientX - cursorSize / 2);
    mouse.y.set(clientY - cursorSize / 2);
  };

  const handleMouseOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isClickable = 
      target.tagName === 'BUTTON' || 
      target.tagName === 'A' || 
      target.closest('button') || 
      target.closest('a') ||
      target.getAttribute('role') === 'button' ||
      target.classList.contains('cursor-pointer');
    
    setIsHovering(!!isClickable);
  };

  useEffect(() => {
    window.addEventListener('mousemove', manageMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', manageMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isHovering, cursorSize]); // Re-bind listener when cursor size changes to update offset correctly

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden lg:block">
      <motion.div
        style={{
          left: smoothMouse.x,
          top: smoothMouse.y,
        }}
        animate={{
          width: cursorSize,
          height: cursorSize,
        }}
        className={`fixed rounded-full border border-yellow-400 mix-blend-difference transition-colors duration-200 ${
          isHovering ? 'bg-yellow-400/20 border-transparent backdrop-blur-[1px]' : ''
        }`}
      >
        {/* Center Dot */}
        {!isHovering && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
        )}
      </motion.div>
    </div>
  );
};

export default CustomCursor;
