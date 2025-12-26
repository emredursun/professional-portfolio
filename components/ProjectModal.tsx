import React, { useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Project } from "../types.ts";
import ProjectModalHeader from "./ProjectModalHeader.tsx";
import ProjectGallery from "./ProjectGallery.tsx";
import ProjectSectionNav from "./ProjectSectionNav.tsx";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onNavigate,
}) => {
  const { t } = useTranslation('projects');
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Update document title and meta tags for SEO when project modal opens
  useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    const originalOgTitle = document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content");
    const originalOgDescription = document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content");
    const originalOgImage = document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content");

    // Update title
    document.title = `${project.title} - Emre Dursun Portfolio`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        project.detailedDescription || project.description
      );
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle)
      ogTitle.setAttribute(
        "content",
        `${project.title} - Project by Emre Dursun`
      );

    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (ogDescription)
      ogDescription.setAttribute("content", project.description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && project.image)
      ogImage.setAttribute("content", `https://emredursun.nl${project.image}`);

    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle)
      twitterTitle.setAttribute(
        "content",
        `${project.title} - Project by Emre Dursun`
      );

    const twitterDescription = document.querySelector(
      'meta[name="twitter:description"]'
    );
    if (twitterDescription)
      twitterDescription.setAttribute("content", project.description);

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && project.image)
      twitterImage.setAttribute(
        "content",
        `https://emredursun.nl${project.image}`
      );

    // Restore original meta tags when modal closes
    return () => {
      document.title = originalTitle;
      if (metaDescription && originalDescription)
        metaDescription.setAttribute("content", originalDescription);
      if (ogTitle && originalOgTitle)
        ogTitle.setAttribute("content", originalOgTitle);
      if (ogDescription && originalOgDescription)
        ogDescription.setAttribute("content", originalOgDescription);
      if (ogImage && originalOgImage)
        ogImage.setAttribute("content", originalOgImage);
      if (twitterTitle && originalOgTitle)
        twitterTitle.setAttribute("content", originalOgTitle);
      if (twitterDescription && originalOgDescription)
        twitterDescription.setAttribute("content", originalOgDescription);
      if (twitterImage && originalOgImage)
        twitterImage.setAttribute("content", originalOgImage);
    };
  }, [project]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft" && onNavigate) {
        onNavigate("prev");
      }
      if (event.key === "ArrowRight" && onNavigate) {
        onNavigate("next");
      }
    };

    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose, onNavigate]);

  // Define sections for navigation
  const sections = [
    { id: "overview", label: t('sections.overview'), icon: "fas fa-info-circle" },
    ...(project.challenge
      ? [{ id: "challenge", label: t('sections.challenge'), icon: "fas fa-lightbulb" }]
      : []),
    ...(project.features && project.features.length > 0
      ? [{ id: "features", label: t('sections.features'), icon: "fas fa-star" }]
      : []),
    ...(project.gallery && project.gallery.length > 0
      ? [{ id: "gallery", label: t('sections.gallery'), icon: "fas fa-images" }]
      : []),
    { id: "technologies", label: t('sections.technologies'), icon: "fas fa-code" },
    ...(project.results && project.results.length > 0
      ? [{ id: "results", label: t('sections.results'), icon: "fas fa-chart-line" }]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="project-title"
    >
      <div
        className="relative bg-white dark:bg-[#2a2a2a] w-full h-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Content */}
        <div
          ref={modalContentRef}
          className="flex-1 overflow-y-auto relative"
          data-modal-content
          data-lenis-prevent
        >
          {/* Hero Header */}
          <ProjectModalHeader project={project} onClose={onClose} onNavigate={onNavigate} />

          {/* Section Navigation */}
          {sections.length > 1 && <ProjectSectionNav sections={sections} />}

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 md:pb-12">
            {/* Overview Section */}
            <section id="overview" className="mb-16 scroll-mt-24">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                    {t('projectDetails.overview')}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                    {project.detailedDescription || project.description}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {project.metrics?.map((metric, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/30"
                    >
                      <div className="flex items-start gap-2">
                        <i className="fas fa-check-circle text-yellow-500 dark:text-yellow-400 mt-1"></i>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {metric}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Challenge & Solution Section */}
            {project.challenge && project.solution && (
              <section id="challenge" className="mb-16 scroll-mt-24">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                  {t('projectDetails.challengeAndSolution')}
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Challenge */}
                  <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-white"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('projectDetails.theChallenge')}
                      </h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {project.challenge}
                    </p>
                  </div>

                  {/* Solution */}
                  <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-200 dark:border-green-800/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-lightbulb text-white"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('projectDetails.theSolution')}
                      </h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {project.solution}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Features Section */}
            {project.features && project.features.length > 0 && (
              <section id="features" className="mb-16 scroll-mt-24">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                  {t('projectDetails.keyFeatures')}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {project.features.map((feature, index) => (
                    <div
                      key={index}
                      className="group bg-white dark:bg-black/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-neon-cyan transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {project.gallery && project.gallery.length > 0 && (
              <section id="gallery" className="mb-16 scroll-mt-24">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                  {t('projectDetails.gallery')}
                </h2>
                <ProjectGallery
                  images={project.gallery}
                  projectTitle={project.title}
                />
              </section>
            )}

            {/* Technologies Section */}
            <section id="technologies" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                {t('projectDetails.technologiesUsed')}
              </h2>
              <div className="flex flex-wrap gap-3">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-neon-cyan hover:scale-105 transition-all duration-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                    {t('projectDetails.tags')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Results Section */}
            {project.results && project.results.length > 0 && (
              <section id="results" className="mb-16 scroll-mt-24">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                  {t('projectDetails.resultsAndImpact')}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {project.results.map((result, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800/30 text-center"
                    >
                      <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 mb-2">
                        {result.value}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {result.metric}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {result.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonial Section */}
            {project.testimonial && (
              <section className="mb-16">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-8 rounded-2xl border border-yellow-200 dark:border-yellow-800/30">
                  <div className="flex items-center gap-4 mb-4">
                    {project.testimonial.avatar && (
                      <img
                        src={project.testimonial.avatar}
                        alt={project.testimonial.author}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {project.testimonial.author}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {project.testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-lg italic text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{project.testimonial.text}"
                  </p>
                </div>
              </section>
            )}

            {/* Action Buttons */}
            <section className="mb-20 md:mb-16">
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
                {project.url && project.url !== "#" && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center gap-3 bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl hover:bg-yellow-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl justify-center"
                  >
                    <i className="fas fa-external-link-alt text-lg"></i>
                    <span>{t('projectDetails.viewLiveDemo')}</span>
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 px-8 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl justify-center"
                  >
                    <i className="fab fa-github text-lg"></i>
                    <span>{t('projectDetails.viewOnGitHub')}</span>
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
