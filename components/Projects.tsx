import React, { useState, useMemo, useRef, useEffect } from "react";
import { Project } from "../types.ts";
import { PROJECTS } from "../constants.tsx";
import ProjectModal from "./ProjectModal.tsx";

const ProjectCard: React.FC<{ project: Project; onOpen: () => void }> = ({
  project,
  onOpen,
}) => {
  return (
    <div
      className="group relative rounded-3xl bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500 hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.6)] dark:hover:border-neon-cyan dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)] h-[540px] flex flex-col shadow-xl dark:shadow-none"
      onClick={onOpen}
    >
      {/* Image Section - Fixed Height */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-yellow-900/40 dark:group-hover:from-neon-purple/40 transition-colors duration-500 z-10"></div>
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute top-5 left-5 z-20 bg-yellow-400/90 dark:bg-neon-cyan/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-black border border-yellow-500/20 shadow-lg uppercase tracking-wide">
          {project.category}
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <div className="w-14 h-14 bg-yellow-400 dark:bg-neon-cyan rounded-full flex items-center justify-center text-black text-xl shadow-[0_0_20px_rgba(250,204,21,0.5)] dark:shadow-[0_0_20px_rgba(6,182,212,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <i className="fas fa-arrow-right -rotate-45 group-hover:rotate-0 transition-transform duration-500"></i>
          </div>
        </div>
      </div>

      {/* Content Section - Flex Layout */}
      <div className="p-8 flex-1 flex flex-col border-t border-gray-100/50 dark:border-white/5">
        {/* Title - Fixed Height with Line Clamp */}
        <h3 className="h-[3rem] text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-3 leading-tight line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-orange-500 dark:group-hover:from-yellow-400 dark:group-hover:to-orange-500 transition-all duration-300">
          {project.title}
        </h3>

        {/* Description - Fixed Height with Line Clamp */}
        <p className="h-[4.5rem] text-sm text-gray-700 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors duration-300">
          {project.description}
        </p>

        {/* Tags - Pushed to Bottom */}
        <div className="mt-auto flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-yellow-400 dark:hover:border-neon-cyan hover:bg-yellow-50 dark:hover:bg-neon-cyan/10 hover:text-gray-900 dark:hover:text-neon-cyan hover:scale-105 transition-all duration-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTechnologyOpen, setIsTechnologyOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categoryRef = useRef<HTMLDivElement>(null);
  const technologyRef = useRef<HTMLDivElement>(null);

  // Handle Hash Navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#project-')) {
        const slug = hash.replace('#project-', '');
        const project = PROJECTS.find(p => p.slug === slug);
        if (project) {
          setSelectedProject(project);
        }
      } else if (!hash) {
        setSelectedProject(null);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL on Project Selection
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    window.location.hash = `project-${project.slug}`;
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
    // Reset hash without scrolling to top (history.pushState or replaceState would be cleaner but hash is simple)
    // Using history.pushState to remove hash cleanly without jumping
    history.pushState("", document.title, window.location.pathname + window.location.search);
  };

  // Extract unique categories and technologies
  const categories = useMemo(
    () => [...new Set(PROJECTS.map((p) => p.category))].sort(),
    []
  );
  const allTechnologies = useMemo(() => {
    const techs = new Set<string>();
    PROJECTS.forEach((project) => {
      project.technologies.forEach((tech) => techs.add(tech));
    });
    return Array.from(techs).sort();
  }, []);

  // Filter projects based on categories and technologies
  const filteredProjects = useMemo(() => {
    return PROJECTS.filter((project) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(project.category);
      const techMatch =
        selectedTechnologies.length === 0 ||
        selectedTechnologies.every((tech) =>
          project.technologies.includes(tech)
        );
      return categoryMatch && techMatch;
    });
  }, [selectedCategories, selectedTechnologies]);

  // Handle category toggle
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Handle technology toggle
  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTechnologies([]);
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        technologyRef.current &&
        !technologyRef.current.contains(event.target as Node)
      ) {
        setIsTechnologyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="animate-fade-in h-full flex flex-col">
      <header className="mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Featured </span>
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]">
              Projects
            </span>
            <span className="absolute inset-0 blur-lg bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark opacity-50 animate-pulse-slow"></span>
            {/* Animated Underline */}
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]"></span>
          </span>
        </h2>

        {/* Dual Filter System */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Category Dropdown */}
          <div ref={categoryRef} className="relative flex-1">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Category
              {selectedCategories.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-yellow-400 text-black rounded-full">
                  {selectedCategories.length}
                </span>
              )}
            </label>
            <button
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsTechnologyOpen(false);
              }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 border-2
                                  ${isCategoryOpen
                  ? "bg-white dark:bg-black text-black dark:text-white border-yellow-400 dark:border-neon-cyan shadow-[0_0_20px_rgba(234,179,8,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  : "bg-white dark:bg-black/60 backdrop-blur-xl text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neon-border hover:border-yellow-400 dark:hover:border-neon-cyan shadow-lg dark:shadow-none"
                }`}
            >
              <span>
                {selectedCategories.length === 0
                  ? "All Categories"
                  : `${selectedCategories.length} selected`}
              </span>
              <i
                className={`fas fa-chevron-down transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""
                  }`}
              ></i>
            </button>

            {isCategoryOpen && (
              <div
                className="absolute z-50 w-full mt-2 bg-white dark:bg-black border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl max-h-80 overflow-y-auto animate-fade-in"
                data-lenis-prevent
              >
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center px-6 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Technology Dropdown */}
          <div ref={technologyRef} className="relative flex-1">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Technology
              {selectedTechnologies.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-yellow-400 text-black rounded-full">
                  {selectedTechnologies.length}
                </span>
              )}
            </label>
            <button
              onClick={() => {
                setIsTechnologyOpen(!isTechnologyOpen);
                setIsCategoryOpen(false);
              }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 border-2
                                ${isTechnologyOpen
                  ? "bg-white dark:bg-black text-black dark:text-white border-yellow-400 dark:border-neon-cyan shadow-[0_0_20px_rgba(234,179,8,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  : "bg-white dark:bg-black/60 backdrop-blur-xl text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neon-border hover:border-yellow-400 dark:hover:border-neon-cyan shadow-lg dark:shadow-none"
                }`}
            >
              <span>
                {selectedTechnologies.length === 0
                  ? "All Technologies"
                  : `${selectedTechnologies.length} selected`}
              </span>
              <i
                className={`fas fa-chevron-down transition-transform duration-300 ${isTechnologyOpen ? "rotate-180" : ""
                  }`}
              ></i>
            </button>

            {isTechnologyOpen && (
              <div
                className="absolute z-50 w-full mt-2 bg-white dark:bg-black border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl max-h-80 overflow-y-auto animate-fade-in"
                data-lenis-prevent
              >
                {allTechnologies.map((tech) => (
                  <label
                    key={tech}
                    className="flex items-center px-6 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTechnologies.includes(tech)}
                      onChange={() => toggleTechnology(tech)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">
                      {tech}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters & Clear Button */}
        {(selectedCategories.length > 0 ||
          selectedTechnologies.length > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Active filters:
              </span>
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-semibold text-yellow-600 dark:text-yellow-400"
                >
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="hover:text-yellow-700 dark:hover:text-yellow-300"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
              {selectedTechnologies.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-400/10 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400"
                >
                  {tech}
                  <button
                    onClick={() => toggleTechnology(tech)}
                    className="hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline hover:scale-110 transition-all duration-300"
              >
                Clear all
              </button>
            </div>
          )}
      </header>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {filteredProjects.map((project, index) => (
            <div
              key={`${project.title}-${index}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProjectCard
                project={project}
                onOpen={() => handleProjectClick(project)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-300 dark:border-white/10">
          <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-folder-open text-4xl text-gray-300 dark:text-gray-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Projects Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No projects match your current filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-500 hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
          >
            Clear Filters
          </button>
        </div>
      )}

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
};

export default Projects;
