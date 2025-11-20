
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
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-white dark:bg-[#2a2a2a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl animate-fade-in-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-gray-200 dark:bg-[#1e1e1e] rounded-full text-gray-600 dark:text-gray-300 hover:bg-yellow-400 hover:text-gray-900 transition-all duration-300 flex items-center justify-center text-2xl z-10 hover:rotate-90"
          aria-label="Close project details"
        >
          &times;
        </button>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
            <img
                src={project.image}
                alt={project.title}
                className="w-full h-auto object-cover rounded-lg shadow-md"
                loading="lazy"
            />
            </div>
            <div className="lg:w-1/2">
            <p className="text-sm text-yellow-400 font-bold uppercase mb-2">{project.category}</p>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{project.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{project.description}</p>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Technologies Used</h3>
            <div className="flex flex-wrap gap-2 mb-8">
                {project.technologies.map(tech => (
                <span key={tech} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md px-3 py-1 text-sm font-medium">
                    {tech}
                </span>
                ))}
            </div>
            {project.url && project.url !== '#' && (
                <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-all duration-300 hover:-translate-y-1"
                >
                <i className="fas fa-external-link-alt"></i>
                Visit Website
                </a>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;