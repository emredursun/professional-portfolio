
import React, { useEffect } from 'react';
import { Project } from '../types.ts';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-start md:items-center justify-center pt-4 px-4 pb-28 md:pb-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-white dark:bg-[#2a2a2a] rounded-2xl w-[95%] sm:w-full max-w-4xl max-h-[calc(100dvh-8rem)] md:max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl animate-fade-in-up flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full text-gray-900 hover:bg-yellow-500 transition-all duration-300 flex items-center justify-center text-xl md:text-2xl z-10 hover:rotate-90"
          aria-label="Close project details"
        >
          &times;
        </button>
        <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-24 md:pb-8" data-lenis-prevent>
          <div className="flex flex-col lg:flex-row gap-5 md:gap-8">
            <div className="lg:w-1/2">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-auto max-h-[30dvh] lg:max-h-none object-cover rounded-lg shadow-md"
                loading="lazy"
              />
            </div>
            <div className="lg:w-1/2">
              <p className="text-xs md:text-sm text-yellow-400 font-bold uppercase mb-2">{project.category}</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">{project.title}</h2>

              <div className="text-gray-600 dark:text-gray-300 mb-6 text-sm md:text-base leading-relaxed">
                {project.detailedDescription || project.description}
              </div>

              {project.metrics && project.metrics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 text-gray-900 dark:text-white">Key Achievements</h3>
                  <ul className="space-y-2">
                    {project.metrics.map((metric, index) => (
                      <li key={index} className="flex items-start text-sm md:text-base text-gray-700 dark:text-gray-300">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-900 dark:text-white">Technologies Used</h3>
              <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                {project.technologies.map(tech => (
                  <span key={tech} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {project.url && project.url !== '#' && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold py-2 px-4 md:py-3 md:px-6 rounded-lg hover:bg-yellow-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-sm md:text-base"
                  >
                    <i className="fas fa-external-link-alt"></i>
                    Live Demo
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2 px-4 md:py-3 md:px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-sm md:text-base"
                  >
                    <i className="fab fa-github"></i>
                    View on GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;