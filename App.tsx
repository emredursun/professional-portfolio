
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import Navbar from './components/Navbar.tsx';
import ScrollToTopButton from './components/ScrollToTopButton.tsx';
import CustomCursor from './components/CustomCursor.tsx';
import PrintableResume from './components/PrintableResume.tsx';
import SmoothScroll from './components/SmoothScroll.tsx';
import ParticleBackground from './components/ParticleBackground.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { Page } from './types.ts';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('About');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isScrollButtonVisible, setIsScrollButtonVisible] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Reading Progress Logic & Scroll Button Visibility
  useEffect(() => {
    const handleScroll = () => {
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (isMobileView) {
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else if (contentRef.current) {
        scrollTop = contentRef.current.scrollTop;
        scrollHeight = contentRef.current.scrollHeight;
        clientHeight = contentRef.current.clientHeight;
      }

      // Calculate Progress
      const winScroll = scrollTop;
      const height = scrollHeight - clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(isNaN(scrolled) ? 0 : scrolled);
      
      // Scroll Button Logic
      let showThreshold = 300; 

      if (isMobileView && contentRef.current) {
          const contentStart = contentRef.current.offsetTop;
          showThreshold = contentStart + 300;
      }

      if (scrollTop > showThreshold) {
        setIsScrollButtonVisible(true);
      } else {
        setIsScrollButtonVisible(false);
      }
    };

    const scrollableElement = isMobileView ? window : contentRef.current;
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isMobileView]);

  const scrollToContentTop = useCallback(() => {
    if (contentRef.current) {
      if (isMobileView) {
        const topOffset = contentRef.current.offsetTop;
        window.scrollTo({
          top: topOffset - 20,
          behavior: 'smooth',
        });
      } else {
        contentRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
  }, [isMobileView]);
  
  const scrollToWindowTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigation = (page: Page) => {
    setActivePage(page);

    if (isMobileView) {
      if (page === 'About') {
        scrollToWindowTop();
      } else {
        scrollToContentTop();
      }
    } else {
      scrollToContentTop();
    }
  };

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ErrorBoundary>
      <SmoothScroll contentRef={contentRef} isMobileView={isMobileView}>
        <PrintableResume />

        <main className={`print:hidden relative bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans transition-colors duration-500 ${isMobileView ? 'min-h-screen p-4' : 'h-screen overflow-hidden p-6 lg:p-8'}`}>
          
          {/* Global Noise Texture */}
          <div className="bg-noise"></div>

          {/* Particle Background System */}
          <ParticleBackground particleCount={150} connectionDistance={120} mouseInfluence={80} />

          <CustomCursor />

          {/* Ambient Light Orbs (Softer, more spread out for less distraction) */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Top Left Warmth */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-yellow-400/10 dark:bg-yellow-600/5 blur-[130px] animate-blob"></div>
            {/* Bottom Right Coolness */}
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 dark:bg-blue-900/5 blur-[130px] animate-blob animation-delay-4000"></div>
          </div>

          {/* Top Progress Line */}
          <div 
            className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 z-[100] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(234,179,8,0.6)]"
            style={{ width: `${readingProgress}%` }}
          ></div>

          {/* Main Layout Container */}
          <div className={`relative z-10 max-w-[1500px] mx-auto flex gap-6 lg:gap-8 ${isMobileView ? 'flex-col' : 'flex-row h-full'}`}>
            
            <Sidebar
              theme={theme}
              toggleTheme={toggleTheme}
              activePage={activePage}
              onNavigate={handleNavigation}
              isMobileView={isMobileView}
            />

            {/* Main Content Area - Glassmorphism Container Wrapper */}
            <div className="flex-1 relative h-full">
              <div 
                ref={contentRef} 
                className={`h-full w-full rounded-[2.5rem] transition-all duration-500
                  ${!isMobileView 
                    ? 'overflow-hidden bg-white/40 dark:bg-[#121212]/60 border border-white/60 dark:border-white/5 backdrop-blur-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)]' 
                    : ''}`}
              >
                <MainContent activePage={activePage} isMobileView={isMobileView} />
              </div>

              {/* Scroll To Top Button - Positioned absolute relative to this wrapper for Desktop */}
              {isScrollButtonVisible && (
                <ScrollToTopButton 
                  onClick={isMobileView ? scrollToWindowTop : scrollToContentTop} 
                  progress={readingProgress}
                  isMobileView={isMobileView}
                />
              )}
            </div>
          </div>

          {isMobileView && (
            <Navbar 
              activePage={activePage}
              onNavigate={handleNavigation}
            />
          )}
        </main>
      </SmoothScroll>
    </ErrorBoundary>
  );
};

export default App;
