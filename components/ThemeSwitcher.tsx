import React, { useState, useEffect } from 'react';

interface ThemeSwitcherProps {
  theme: string;
  toggleTheme: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = React.memo(({ theme, toggleTheme }) => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleToggle = () => {
    setIsSpinning(true);
    toggleTheme();
  };

  // Reset animation state after the duration matches the CSS transition
  useEffect(() => {
    if (isSpinning) {
      const timer = setTimeout(() => setIsSpinning(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isSpinning]);

  return (
    <button
      onClick={handleToggle}
      className={`absolute top-6 right-6 z-50 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border transition-all duration-[700ms] ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]
        ${theme === 'light' 
          ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' 
          : 'bg-[#1e1e1e] text-yellow-400 border-gray-700 hover:bg-gray-800'}
        ${isSpinning ? 'rotate-[360deg] scale-90 shadow-inner' : 'hover:scale-110 hover:rotate-12 hover:shadow-xl'}
      `}
      aria-label="Toggle theme"
    >
      <div className={`transition-all duration-500 transform ${isSpinning ? 'scale-50 opacity-50 blur-[1px]' : 'scale-100 opacity-100 blur-0'}`}>
        {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
      </div>
    </button>
  );
});

export default ThemeSwitcher;