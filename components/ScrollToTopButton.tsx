import React from 'react';

interface ScrollToTopButtonProps {
  onClick: () => void;
  progress: number;
  isMobileView: boolean;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ onClick, progress, isMobileView }) => {
  // Calculate circle properties for the progress ring
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className={`fixed z-50 transition-all duration-500 ease-out
        ${isMobileView 
          ? 'right-6 bottom-20' // Mobile: Fixed to viewport, closer to navbar (just above it)
          : 'right-8 bottom-8' // Desktop: Fixed to viewport, bottom-right corner
        }`}
    >
      <button
        onClick={onClick}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full 
          bg-white/10 dark:bg-black/40 backdrop-blur-md 
          border border-white/20 dark:border-white/10
          shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          hover:scale-110 hover:-translate-y-1 transition-all duration-300 ease-out"
        aria-label="Scroll to top"
      >
        {/* Progress Ring SVG */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none"
          viewBox="0 0 60 60"
        >
          {/* Background Circle */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-300/30 dark:text-gray-700/30"
          />
          {/* Progress Circle */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-yellow-500 transition-all duration-150 ease-out"
          />
        </svg>

        {/* Inner Button Content */}
        <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-yellow-400 text-gray-900 shadow-lg group-hover:bg-yellow-300 transition-colors duration-300">
          <i className="fas fa-arrow-up text-lg group-hover:animate-bounce-custom"></i>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
      </button>

      {/* Tooltip text (optional, appears on hover) */}
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 
        bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-medium text-gray-800 dark:text-gray-200 
        rounded-lg shadow-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 
        transition-all duration-300 pointer-events-none whitespace-nowrap hidden lg:block">
        Back to Top
      </span>
    </div>
  );
};

export default ScrollToTopButton;
