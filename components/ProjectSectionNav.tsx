import React, { useState, useEffect, useRef } from 'react';

interface Section {
  id: string;
  label: string;
  icon: string;
}

interface ProjectSectionNavProps {
  sections: Section[];
}

const ProjectSectionNav: React.FC<ProjectSectionNavProps> = ({ sections }) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [isSticky, setIsSticky] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Intersection Observer for section detection
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66% 0px',
      }
    );

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Check if nav should be sticky
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsSticky(target.scrollTop > 400);
    };

    const modalContent = document.querySelector('[data-modal-content]');
    modalContent?.addEventListener('scroll', handleScroll);

    return () => {
      observerRef.current?.disconnect();
      modalContent?.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className={`sticky top-[57px] md:top-[65px] z-40 bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isSticky ? 'shadow-lg' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide py-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap text-sm md:text-base ${
                activeSection === section.id
                  ? 'bg-yellow-400 dark:bg-neon-cyan text-black shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <i className={`${section.icon} ${activeSection === section.id ? 'scale-110' : ''}`}></i>
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-neon-cyan to-neon-purple transition-all duration-300"
          style={{
            width: `${
              ((sections.findIndex((s) => s.id === activeSection) + 1) /
                sections.length) *
              100
            }%`,
          }}
        />
      </div>
    </nav>
  );
};

export default ProjectSectionNav;
