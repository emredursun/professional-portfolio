import React, { useState, useEffect } from 'react';
import { Project } from '../types.ts';

interface ProjectModalHeaderProps {
  project: Project;
  onClose: () => void;
  onShare?: () => void;
}

const ProjectModalHeader: React.FC<ProjectModalHeaderProps> = ({ 
  project, 
  onClose,
  onShare 
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrolled(target.scrollTop > 100);
    };

    const modalContent = document.querySelector('[data-modal-content]');
    modalContent?.addEventListener('scroll', handleScroll);
    
    return () => modalContent?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: project.description,
        url: window.location.href,
      }).catch(() => {
        // Silently fail if user cancels
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      if (onShare) onShare();
    }
  };

  return (
    <>
      {/* Hero Section with Parallax */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden flex-shrink-0">
        {/* Parallax Image */}
        <div 
          className="absolute inset-0 transform scale-110"
          style={{
            backgroundImage: `url(${project.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block bg-yellow-400 dark:bg-neon-cyan text-black font-bold px-4 py-2 rounded-full text-xs md:text-sm uppercase tracking-wider shadow-lg">
              {project.category}
              {project.year && <span className="ml-2">• {project.year}</span>}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            {project.title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-gray-200 text-sm md:text-base">
            {project.role && (
              <div className="flex items-center gap-2">
                <i className="fas fa-user-tie text-yellow-400"></i>
                <span>{project.role}</span>
              </div>
            )}
            {project.duration && (
              <div className="flex items-center gap-2">
                <i className="fas fa-clock text-yellow-400"></i>
                <span>{project.duration}</span>
              </div>
            )}
            {project.team && (
              <div className="flex items-center gap-2">
                <i className="fas fa-users text-yellow-400"></i>
                <span>{project.team}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {/* Share Button */}
          <button
            onClick={handleShareClick}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
            aria-label="Share project"
          >
            <i className="fas fa-share-alt"></i>
          </button>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 bg-yellow-400 rounded-full text-black hover:bg-yellow-500 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl hover:rotate-90"
            aria-label="Close project details"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Sticky Navigation Bar (appears on scroll) */}
      <div 
        className={`sticky top-0 z-50 bg-white dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          scrolled ? 'opacity-100 translate-y-0 shadow-lg' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
            {project.title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default ProjectModalHeader;
