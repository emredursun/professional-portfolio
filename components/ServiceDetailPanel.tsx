import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Service, Page } from "../types.ts";
import { PROJECTS } from "../constants.tsx";

interface ServiceDetailPanelProps {
  service: Service | null;
  onClose: () => void;
  onNavigate?: (page: Page) => void;
}

const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({ service, onClose, onNavigate }) => {
  const { t } = useTranslation('about');
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (service) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [service]);

  if (!service) return null;

  // Get related projects
  const relatedProjects = service.relatedProjects
    ? PROJECTS.filter((p) => service.relatedProjects?.includes(p.slug))
    : [];

  return (
    <AnimatePresence>
      {service && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white dark:bg-black border-l-2 border-gray-200 dark:border-neon-border shadow-2xl z-[101] overflow-y-auto"
            data-lenis-prevent
            data-modal-content="true"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-neon-border px-8 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black border-2 border-gray-200 dark:border-neon-cyan flex items-center justify-center text-3xl text-accent-yellow dark:text-neon-cyan shadow-lg">
                    {service.icon}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {service.title}
                    </h2>
                    {service.badge && (
                      <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-neon-cyan dark:to-neon-purple text-white rounded-full">
                        {service.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 group"
                  aria-label="Close panel"
                >
                  <i className="fas fa-times text-lg group-hover:rotate-90 transition-transform duration-300"></i>
                </button>
              </div>
            </div>

            {/* Content - With safe area padding for mobile navbar */}
            <div className="px-6 md:px-8 py-6 md:py-8 pb-32 md:pb-8 space-y-6 md:space-y-8" style={{ paddingBottom: 'max(8rem, calc(2rem + env(safe-area-inset-bottom)))' }}>
              {/* Full Description */}
              {service.fullDescription && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <i className="fas fa-info-circle text-accent-yellow dark:text-neon-cyan"></i>
                    {t('services.details.overview')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                    {service.fullDescription}
                  </p>
                </div>
              )}

              {/* Key Benefits */}
              {service.keyBenefits && service.keyBenefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-check-circle text-accent-yellow dark:text-neon-cyan"></i>
                    {t('services.details.keyBenefits')}
                  </h3>
                  <div className="space-y-3">
                    {service.keyBenefits.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-yellow-400 dark:hover:border-neon-cyan transition-all duration-300"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-neon-cyan dark:to-neon-purple flex items-center justify-center">
                          <i className="fas fa-check text-xs text-white"></i>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                          {benefit}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technologies */}
              {service.tags && service.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-layer-group text-accent-yellow dark:text-neon-cyan"></i>
                    {t('services.details.technologies')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-white dark:bg-black border-2 border-gray-200 dark:border-neon-border rounded-xl hover:border-yellow-400 dark:hover:border-neon-cyan hover:text-gray-900 dark:hover:text-neon-cyan transition-all duration-300 cursor-default"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Badge */}
              {service.yearsOfExperience && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-2 border-yellow-200 dark:border-yellow-800/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xl font-black">
                      {service.yearsOfExperience}+
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {t('services.details.yearsOfExperience')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {t('services.details.provenExpertise')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Projects */}
              {relatedProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-folder-open text-accent-yellow dark:text-neon-cyan"></i>
                    {t('services.details.relatedProjects')}
                  </h3>
                  <div className="space-y-3">
                    {relatedProjects.map((project) => (
                      <motion.div
                        key={project.slug}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="p-4 rounded-xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-neon-border hover:border-yellow-400 dark:hover:border-neon-cyan transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                          onClose();
                          if (onNavigate) {
                            onNavigate('Projects');
                            // Small timeout to allow page transition
                            setTimeout(() => {
                              window.location.hash = `project-${project.slug}`;
                            }, 100);
                          } else {
                            setTimeout(() => {
                              window.location.hash = `project-${project.slug}`;
                            }, 300);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                            <img
                              src={project.image}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-neon-cyan transition-colors">
                              {project.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {project.category}
                            </p>
                          </div>
                          <i className="fas fa-arrow-right text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-neon-cyan group-hover:translate-x-1 transition-all duration-300"></i>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    if (onNavigate) {
                      onNavigate('Contact');
                    } else {
                      setTimeout(() => {
                        const contactSection = document.querySelector('[data-page="Contact"]');
                        contactSection?.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }
                  }}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-neon-cyan dark:to-neon-purple text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <span>{t('services.details.getInTouch')}</span>
                  <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform duration-300"></i>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ServiceDetailPanel;
