import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const cursorSize = isHovering ? 60 : 20;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouseX, smoothOptions),
    y: useSpring(mouseY, smoothOptions),
  };

  useEffect(() => {
    // The pointer position alone; the circle centres itself on it with
    // translate(-50%, -50%). The handler used to subtract half the size it
    // closed over at mount (20 px) forever, so the enlarged 60 px hover
    // circle sat 20 px off the pointer.
    const manageMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button" ||
        target.classList.contains("cursor-pointer");

      setIsHovering(!!isClickable);
    };

    window.addEventListener("mousemove", manageMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", manageMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden lg:block">
      <motion.div
        style={{
          left: smoothMouse.x,
          top: smoothMouse.y,
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          width: cursorSize,
          height: cursorSize,
        }}
        className={`fixed rounded-full border border-yellow-400 mix-blend-difference transition-colors duration-200 ${
          isHovering
            ? "bg-yellow-400/20 border-transparent backdrop-blur-[1px]"
            : ""
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
