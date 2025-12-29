
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageFromUrl } from './i18n.ts';
import { useGSAP } from "./components/hooks/useGSAP.tsx";
import gsap from "gsap"; 
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import Navbar from './components/Navbar.tsx';
import ScrollToTopButton from './components/ScrollToTopButton.tsx';
import CustomCursor from './components/CustomCursor.tsx';
import PrintableResume from './components/PrintableResume.tsx';
import SmoothScroll from './components/SmoothScroll.tsx';
import ParticleBackground from './components/ParticleBackground.tsx';
import FloatingElements from './components/FloatingElements.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import CommandPalette from './components/CommandPalette.tsx';
import { Page } from './types.ts';
import { faviconController } from './src/utils/faviconController';

import Preloader from './components/Preloader.tsx';

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState<Page>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#project-')) {
        return 'Projects';
      }
    }
    return 'About';
  });
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
  const [userHasManuallyToggledTheme, setUserHasManuallyToggledTheme] = useState(() => {
    return localStorage.getItem('userToggledTheme') === 'true';
  });
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isScrollButtonVisible, setIsScrollButtonVisible] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect and set language from URL on mount
  useEffect(() => {
    const urlLanguage = getLanguageFromUrl();
    if (urlLanguage !== i18n.language) {
      i18n.changeLanguage(urlLanguage);
    }
    // Update document language attribute
    document.documentElement.lang = i18n.language;
  }, [i18n]);

  // Listen for language changes and update document lang
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Lock scroll while loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isLoading]);

  // Handle Loading Complete
  const handlePreloaderComplete = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system dark mode preference changes
  useEffect(() => {
    // Only auto-switch if user hasn't manually toggled theme
    if (userHasManuallyToggledTheme) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [userHasManuallyToggledTheme]);

  // Track page changes with favicon controller
  useEffect(() => {
    faviconController.setPageContext(activePage as 'About' | 'Resume' | 'Projects' | 'Contact');
  }, [activePage]);

  // Initialize animated favicon controller
  useEffect(() => {
    // Expose to window for debugging (optional, can be removed in production)
    if (typeof window !== 'undefined') {
      (window as any).faviconController = faviconController;
    }
    
    // The controller is automatically initialized on import and starts working
    // It will automatically switch favicons when tab visibility changes
    
    // Optional: Uncomment to test notification faviconafter 5 seconds
    // setTimeout(() => {
    //   faviconController.showNotification('Check this out!');
    // }, 5000);
  }, []);

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

      // Check if a modal is open (ProjectModal has data-modal-content attribute)
      const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
      
      if (modalContent) {
        // Modal is open - track modal scroll
        scrollTop = modalContent.scrollTop;
        scrollHeight = modalContent.scrollHeight;
        clientHeight = modalContent.clientHeight;
      } else if (isMobileView) {
        // Normal page scroll on mobile
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else if (contentRef.current) {
        // Normal page scroll on desktop
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
      let shouldShowButton = false;

      if (modalContent) {
        // Modal is open - show button after scrolling 10% down
        shouldShowButton = scrolled > 10;
      } else if (isMobileView) {
        if (activePage === 'About') {
          // On About page, show button when user has scrolled down into content
          // This happens when they've scrolled past the profile section (~850px)
          shouldShowButton = scrollTop > 850;
        } else {
          // For Resume/Projects/Contact on mobile, keep it visible
          shouldShowButton = true;
        }
      } else {
        // Desktop: show after scrolling 300px in the content container
        shouldShowButton = scrollTop > 300;
      }

      setIsScrollButtonVisible(shouldShowButton);
    };

    const scrollableElement = isMobileView ? window : contentRef.current;
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Also listen to modal scroll if it exists
    const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
    if (modalContent) {
      modalContent.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Set up a MutationObserver to detect when modal is added/removed from DOM
    const observer = new MutationObserver(() => {
      const modal = document.querySelector('[data-modal-content]') as HTMLElement;
      if (modal) {
        modal.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Trigger initial check
      } else {
        handleScroll(); // Trigger check when modal closes
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', handleScroll);
      }
      if (modalContent) {
        modalContent.removeEventListener('scroll', handleScroll);
      }
      observer.disconnect();
    };
  }, [isMobileView, activePage]);


  // GSAP Parallax Effects
  const bgOrbsRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Only apply parallax if we have refs and (optional) if not mobile to save battery?
    // User requested "Multi-layer depth on scroll", so we apply it.
    
    const scroller = isMobileView ? window : contentRef.current;
    
    if (bgOrbsRef.current) {
        gsap.to(bgOrbsRef.current, {
            y: 100, // Move down slightly as we scroll down (distant background)
            ease: "none",
            scrollTrigger: {
                trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                scroller: scroller
            }
        });
    }

    if (floatingRef.current) {
        gsap.to(floatingRef.current, {
            y: -150, // Move up (closer foreground feel or inverse movement)
            ease: "none",
            scrollTrigger: {
                 trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
                scroller: scroller
            }
        });
    }

    // Refresh ScrollTrigger when view changes
    ScrollTrigger.refresh();

  }, [isMobileView]); // Dependency array


  // Show scroll button immediately on content pages (Resume, Projects, Contact)
  // since profile is above and users should have quick access to it
  useEffect(() => {
    if (isMobileView && activePage !== 'About') {
      setIsScrollButtonVisible(true);
    }
  }, [isMobileView, activePage]);


  const scrollToContentTop = useCallback(() => {
    // Check if modal is open first
    const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
    if (modalContent) {
      // Scroll modal to top
      modalContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    
    // Otherwise scroll main content
    if (contentRef.current) {
      if (isMobileView) {
        // On mobile, we need to scroll the window to the top of the content container
        // Since contentRef is now inside a relative wrapper, offsetTop might be 0 relative to wrapper
        // So we use getBoundingClientRect to get the absolute position
        const element = contentRef.current;
        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const topOffset = rect.top + scrollTop - 20; // -20 for some padding/margin

        window.scrollTo({
          top: topOffset,
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
    // Check if modal is open first
    const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
    if (modalContent) {
      // Scroll modal to top
      modalContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    
    // Otherwise scroll window to top
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
    // Mark that user has manually toggled theme (disable auto-switching)
    setUserHasManuallyToggledTheme(true);
    localStorage.setItem('userToggledTheme', 'true');
  }, []);

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      {!isLoading && (
        <ErrorBoundary>
          {/* Command Palette */}
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            activePage={activePage}
            onNavigate={handleNavigation}
            theme={theme}
            toggleTheme={toggleTheme}
            isMobileView={isMobileView}
          />
          <SmoothScroll contentRef={contentRef} isMobileView={isMobileView}>
            <PrintableResume />
    
            <main className={`print:hidden relative bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans transition-colors duration-500 ${isMobileView ? 'min-h-screen p-4' : 'h-screen overflow-hidden p-6 lg:p-8'}`}>
          
          {/* Global Noise Texture */}
          <div className="bg-noise"></div>

          {/* Particle Background System */}
          <ParticleBackground particleCount={150} connectionDistance={120} mouseInfluence={80} />

          {/* Floating Ambient Elements - Parallax Layer */}
          <div ref={floatingRef} className="absolute inset-0 pointer-events-none z-[1]">
              <FloatingElements />
          </div>

          <CustomCursor />

          {/* Ambient Light Orbs (Softer, more spread out for less distraction) */}
          <div ref={bgOrbsRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
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

            <div className={`relative flex-1 ${!isMobileView ? 'rounded-[2.5rem] bg-white/40 dark:bg-[#121212]/60 border border-white/60 dark:border-white/5 backdrop-blur-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)]' : ''}`}>
              <div 
                ref={contentRef} 
                className={`w-full h-full scroll-smooth transition-all duration-500 ${!isMobileView ? 'overflow-y-auto no-scrollbar rounded-[2.5rem]' : ''}`}
              >
                <MainContent activePage={activePage} isMobileView={isMobileView} onNavigate={handleNavigation} />
              </div>

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
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
          )}
        </main>
      </SmoothScroll>
    </ErrorBoundary>
      )}
    </>
  );
};

export default App;
