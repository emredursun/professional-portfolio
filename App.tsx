
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import LanguageMeta from './components/LanguageMeta.tsx';
import { Page } from './types.ts';
import { faviconController } from './src/utils/faviconController';

import Preloader from './components/Preloader.tsx';

// Scroll Handler Component to preserve exact scroll behaviors
const ScrollHandler: React.FC<{
  isMobileView: boolean;
  contentRef: React.RefObject<HTMLDivElement>;
  setIsScrollButtonVisible: (visible: boolean) => void;
  setReadingProgress: (progress: number) => void;
}> = ({ isMobileView, contentRef, setIsScrollButtonVisible, setReadingProgress }) => {
  const location = useLocation();

  // Handle Scroll behaviors based on route
  const scrollToTop = useCallback(() => {
     // Check if modal is open first
     const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
     if (modalContent) {
       modalContent.scrollTo({ top: 0, behavior: 'smooth' });
       return;
     }

    const isAboutMobile = isMobileView && (location.pathname === '/about' || location.pathname === '/' || location.pathname.endsWith('/about'));
    
    if (isAboutMobile) {
      // Scroll window
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
       // Scroll content container
       if (contentRef.current) {
        if (isMobileView) {
             // Mobile Content Scroll (Resume, Projects, Contact)
             const rect = contentRef.current.getBoundingClientRect();
             const scrollTop = window.scrollY || document.documentElement.scrollTop;
             const topOffset = rect.top + scrollTop - 20; 
             window.scrollTo({ top: topOffset, behavior: 'smooth' });
        } else {
             // Desktop Content Scroll
             contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
       }
    }
  }, [isMobileView, location.pathname, contentRef]);

  // Listen to location changes to trigger "Navigate" scroll logic if needed?
  // Actually, standard router behavior doesn't auto-scroll div containers, so we force it here.
  useEffect(() => {
     scrollToTop();
  }, [location.pathname, scrollToTop]);

  // Re-attach scroll listeners to the new view context
  useEffect(() => {
      const handleScroll = () => {
        let scrollTop = 0;
        let scrollHeight = 0;
        let clientHeight = 0;
  
        // Check if a modal is open
        const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
        
        if (modalContent) {
          scrollTop = modalContent.scrollTop;
          scrollHeight = modalContent.scrollHeight;
          clientHeight = modalContent.clientHeight;
        } else if (isMobileView) {
          scrollTop = window.scrollY;
          scrollHeight = document.documentElement.scrollHeight;
          clientHeight = window.innerHeight;
        } else if (contentRef.current) {
          scrollTop = contentRef.current.scrollTop;
          scrollHeight = contentRef.current.scrollHeight;
          clientHeight = contentRef.current.clientHeight;
        }
  
        // Calculate Progress
        const height = scrollHeight - clientHeight;
        const scrolled = (scrollTop / height) * 100;
        setReadingProgress(isNaN(scrolled) ? 0 : scrolled);
        
        // Scroll Button Logic
        let shouldShowButton = false;
        const isAbout = location.pathname === '/about' || location.pathname === '/' || location.pathname.endsWith('/about');
  
        if (modalContent) {
          shouldShowButton = scrolled > 10;
        } else if (isMobileView) {
          if (isAbout) {
            shouldShowButton = scrollTop > 850;
          } else {
            shouldShowButton = true;
          }
        } else {
          shouldShowButton = scrollTop > 300;
        }
  
        setIsScrollButtonVisible(shouldShowButton);
      };
  
      const scrollableElement = isMobileView ? window : contentRef.current;
      if (scrollableElement) {
        scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
      }
      
      const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
      if (modalContent) {
        modalContent.addEventListener('scroll', handleScroll, { passive: true });
      }
      
      const observer = new MutationObserver(() => {
        const modal = document.querySelector('[data-modal-content]') as HTMLElement;
        if (modal) {
          modal.addEventListener('scroll', handleScroll, { passive: true });
          handleScroll();
        } else {
          handleScroll();
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Initial check
      handleScroll();

      return () => {
        if (scrollableElement) {
          scrollableElement.removeEventListener('scroll', handleScroll);
        }
        if (modalContent) {
          modalContent.removeEventListener('scroll', handleScroll);
        }
        observer.disconnect();
      };
    }, [isMobileView, location.pathname, contentRef, setIsScrollButtonVisible, setReadingProgress]);

    return null; // Logic only component
};

const AppContent: React.FC = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  
  // Derived active page from location for backward compatibility with props
  const getActivePage = (pathname: string): Page => {
    if (pathname.includes('resume')) return 'Resume';
    if (pathname.includes('projects')) return 'Projects';
    if (pathname.includes('contact')) return 'Contact';
    return 'About';
  };
  const activePage = getActivePage(location.pathname);

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
    document.documentElement.lang = i18n.language;
  }, [i18n]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isLoading]);

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
    if (userHasManuallyToggledTheme) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [userHasManuallyToggledTheme]);

  useEffect(() => {
    faviconController.setPageContext(activePage as 'About' | 'Resume' | 'Projects' | 'Contact');
  }, [activePage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).faviconController = faviconController;
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // GSAP Parallax Effects
  const bgOrbsRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const scroller = isMobileView ? window : contentRef.current;
    
    if (bgOrbsRef.current) {
        gsap.to(bgOrbsRef.current, {
            y: 100, 
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
            y: -150,
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
    ScrollTrigger.refresh();
  }, [isMobileView]);

  const scrollToTopAction = useCallback(() => {
     // Re-implement the exact logic but manually callable for the button
     const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
     if (modalContent) {
       modalContent.scrollTo({ top: 0, behavior: 'smooth' });
       return;
     }

     const isAboutMobile = isMobileView && (location.pathname === '/about' || location.pathname === '/' || location.pathname.endsWith('/about'));
     if (isAboutMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
     } else {
        if (contentRef.current) {
            if (isMobileView) {
                const rect = contentRef.current.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const topOffset = rect.top + scrollTop - 20; 
                window.scrollTo({ top: topOffset, behavior: 'smooth' });
            } else {
                contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
     }
  }, [isMobileView, location.pathname]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    setUserHasManuallyToggledTheme(true);
    localStorage.setItem('userToggledTheme', 'true');
  }, []);

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
      <ScrollHandler 
        isMobileView={isMobileView} 
        contentRef={contentRef} 
        setIsScrollButtonVisible={setIsScrollButtonVisible}
        setReadingProgress={setReadingProgress}
      />

      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      {!isLoading && (
        <ErrorBoundary>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            activePage={activePage}
            onNavigate={(page) => { /* Navigation handled by Router Link, but kept for interface */ }} 
            theme={theme}
            toggleTheme={toggleTheme}
            isMobileView={isMobileView}
          />
          <SmoothScroll contentRef={contentRef} isMobileView={isMobileView}>
            <PrintableResume />
    
            <main className={`print:hidden relative bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans transition-colors duration-500 ${isMobileView ? 'min-h-screen p-4' : 'h-screen overflow-hidden p-6 lg:p-8'}`}>
          
          <div className="bg-noise"></div>
          <ParticleBackground particleCount={150} connectionDistance={120} mouseInfluence={80} />

          <div ref={floatingRef} className="absolute inset-0 pointer-events-none z-[1]">
              <FloatingElements />
          </div>

          <CustomCursor />

          <div ref={bgOrbsRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-yellow-400/10 dark:bg-yellow-600/5 blur-[130px] animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 dark:bg-blue-900/5 blur-[130px] animate-blob animation-delay-4000"></div>
          </div>

          <div 
            className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 z-[100] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(234,179,8,0.6)]"
            style={{ width: `${readingProgress}%` }}
          ></div>

          <div className={`relative z-10 max-w-[1500px] mx-auto flex gap-6 lg:gap-8 ${isMobileView ? 'flex-col' : 'flex-row h-full'}`}>
            
            <Sidebar
              theme={theme}
              toggleTheme={toggleTheme}
              activePage={activePage}
              onNavigate={() => {}} // Navigation handled by Links in Sidebar
              isMobileView={isMobileView}
            />

            <div className={`relative flex-1 ${!isMobileView ? 'rounded-[2.5rem] bg-white/40 dark:bg-[#121212]/60 border border-white/60 dark:border-white/5 backdrop-blur-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)]' : ''}`}>
              <div 
                ref={contentRef} 
                className={`w-full h-full scroll-smooth transition-all duration-500 ${!isMobileView ? 'overflow-y-auto no-scrollbar rounded-[2.5rem]' : ''}`}
              >
                <MainContent activePage={activePage} isMobileView={isMobileView} onNavigate={() => {}} />
              </div>

              {isScrollButtonVisible && (
                <ScrollToTopButton 
                  onClick={() => {
                      // Check if modal is open first
                      const modalContent = document.querySelector('[data-modal-content]') as HTMLElement;
                      if (modalContent) {
                        modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }

                      // Scroll to absolute top (Profile)
                      if (isMobileView) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else if (contentRef.current) {
                          contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                  }} 
                  progress={readingProgress}
                  isMobileView={isMobileView}
                />
              )}
            </div>
          </div>

          {isMobileView && (
            <Navbar 
              activePage={activePage}
              onNavigate={() => {}} // Handled by Links
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onScrollToContent={scrollToTopAction}
            />
          )}
        </main>
      </SmoothScroll>
    </ErrorBoundary>
      )}
    </>
  );
}

const App: React.FC = () => {
    return (
        <HelmetProvider>
            <Router>
                <LanguageMeta />
                <AppContent />
            </Router>
        </HelmetProvider>
    );
};

export default App;
