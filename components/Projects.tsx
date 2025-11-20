
import React, { useState, useMemo, useRef } from 'react';
import { Project } from '../types.ts';
import { PROJECTS } from '../constants.tsx';
import ProjectModal from './ProjectModal.tsx';

const ProjectCard: React.FC<{ project: Project; onOpen: () => void; }> = ({ project, onOpen }) => {
    return (
        <div 
            className="group relative rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] h-full flex flex-col"
            onClick={onOpen}
        >
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/10 dark:bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-10"></div>
                <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                />
                <div className="absolute top-5 right-5 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-gray-900 dark:text-white border border-white/20 shadow-lg">
                    {project.category}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                     <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xl shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <i className="fas fa-arrow-right -rotate-45 group-hover:rotate-0 transition-transform duration-500"></i>
                     </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 flex-1 flex flex-col border-t border-gray-100 dark:border-white/5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-yellow-500 transition-colors">
                    {project.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                    {project.description}
                </p>
                
                <div className="mt-auto flex flex-wrap gap-2">
                    {project.technologies.slice(0, 3).map(tech => (
                        <span key={tech} className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                            {tech}
                        </span>
                    ))}
                     {project.technologies.length > 3 && (
                         <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-2 py-1.5">
                            +{project.technologies.length - 3}
                        </span>
                     )}
                </div>
            </div>
        </div>
    );
}

const Projects: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const categories = useMemo(() => ['All', ...new Set(PROJECTS.map(p => p.category))].sort(), []);
    
    const filteredProjects = useMemo(() => {
        if (activeCategory === 'All') return PROJECTS;
        return PROJECTS.filter(project => project.category === activeCategory);
    }, [activeCategory]);

    return (
        <section className="animate-fade-in h-full flex flex-col">
            <header className="mb-10">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Projects</span>
                </h2>
                
                {/* Pill Tabs Filter */}
                <div className="flex overflow-x-auto pb-4 no-scrollbar gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 border
                                ${activeCategory === cat 
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-xl scale-105' 
                                    : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {filteredProjects.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProjects.map((project, index) => (
                        <div key={`${project.title}-${index}`} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <ProjectCard 
                                project={project} 
                                onOpen={() => setSelectedProject(project)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-300 dark:border-white/10">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <i className="fas fa-folder-open text-4xl text-gray-300 dark:text-gray-600"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Projects Found</h3>
                    <p className="text-gray-500 dark:text-gray-400">There are no projects in this category yet.</p>
                </div>
            )}

            {selectedProject && (
                <ProjectModal 
                    project={selectedProject} 
                    onClose={() => setSelectedProject(null)} 
                />
            )}
        </section>
    );
};

export default Projects;
