
import React from 'react';

interface ScrollToTopButtonProps {
  onClick: () => void;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      // Layout Logic:
      // 'bottom-32' (128px) is used for mobile/tablet (< 1024px) to clear the floating Navbar (bottom-6 + height).
      // 'lg:bottom-12' (48px) is used for desktop (>= 1024px) where there is no bottom Navbar.
      className="fixed right-4 bottom-32 lg:bottom-12 lg:right-12 xl:right-[calc((100vw-80rem)/2+3rem)] z-40 w-12 h-12 lg:w-14 lg:h-14 bg-yellow-400/80 backdrop-blur-xl text-gray-900 rounded-full flex items-center justify-center text-xl shadow-[0_8px_32px_rgba(250,204,21,0.3)] border border-white/40 hover:bg-yellow-400 transition-all duration-500 cubic-bezier(0.68,-0.55,0.27,1.55) hover:scale-110 hover:-translate-y-2 animate-icon-pop-in ring-1 ring-yellow-400/20"
      aria-label="Scroll to top"
    >
      <i className="fas fa-arrow-up text-lg lg:text-xl relative z-10"></i>
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </button>
  );
};

export default ScrollToTopButton;
