import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useLanguageNavigate } from './hooks/useLanguageNavigate.tsx';
import gsap from "gsap";
import { useGSAP } from "./hooks/useGSAP.tsx";
import { Service, Page } from "../types.ts";
import { SERVICES } from "../constants.tsx";
import Tilt3D from "./Tilt3D.tsx";
import { useScrollReveal } from "./hooks/useScrollReveal.tsx";
import ServiceDetailPanel from "./ServiceDetailPanel.tsx";

const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  noDefaultBg?: boolean;
}> = ({ children, className = "", title, onClick, noDefaultBg = false }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };
  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };
  const handleMouseEnter = () => {
    setOpacity(1);
  };
  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const baseClasses = noDefaultBg
    ? `relative overflow-hidden rounded-2xl transition-all duration-500`
    : `relative overflow-hidden rounded-2xl bg-white dark:bg-neon-bg border border-gray-100 dark:border-neon-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-yellow-600 dark:hover:border-neon-cyan hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:-translate-y-1 transition-all duration-500`;

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${baseClasses} ${className}`}
    >
      {/* Premium Spotlight Effect (Gold in Light, White in Dark) */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(251, 191, 36, 0.15), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px opacity-0 dark:opacity-0 transition duration-500 z-10 dark:block hidden"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.1), transparent 40%)`,
        }}
      />

      {/* Light Mode Subtle Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:hidden" />

      <div className="relative h-full p-8 z-20 flex flex-col">
        {title && (
          <h3 className="text-lg font-bold text-gray-900 dark:text-neon-text-primary mb-4 uppercase tracking-wider">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
};

const ServiceItem: React.FC<{ service: Service; onClick: () => void }> = ({ service, onClick }) => {
  return (
    <div onClick={onClick} className="flex flex-col h-full cursor-pointer">
      {/* Enhanced Icon Container with Badge */}
      <div className="mb-5 relative">
        {/* Featured Star Badge */}
        {service.featured && (
          <motion.div
            className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-400 dark:to-orange-600 rounded-full flex items-center justify-center shadow-lg z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <i className="fas fa-star text-xs text-white"></i>
          </motion.div>
        )}
        
        {/* Premium Icon - Yellow in Light, Cyan in Dark */}
        <div className="w-[72px] h-[72px] rounded-3xl bg-accent-yellow/10 dark:bg-black border-2 border-accent-yellow dark:border-neon-cyan flex items-center justify-center text-3xl text-accent-yellow dark:text-neon-cyan shadow-[0_8px_20px_rgba(251,191,36,0.15)] dark:shadow-neon-cyan group-hover:bg-accent-yellow dark:group-hover:bg-neon-cyan group-hover:border-accent-yellow dark:group-hover:border-neon-cyan group-hover:text-white dark:group-hover:text-black group-hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] dark:group-hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden">
          <span className="relative z-10">{service.icon}</span>
        </div>
      </div>

      {/* Title - Fixed Height: Exactly 2 Lines */}
      <h4 className="min-h-[3.5rem] text-xl font-bold tracking-tight text-gray-900 dark:text-neon-text-primary mb-3 line-clamp-2 leading-7 group-hover:text-accent-yellow dark:group-hover:text-neon-cyan transition-all duration-300">
        {service.title}
      </h4>
      
      {/* Expertise Badge */}
      {service.badge && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400/10 to-orange-500/10 dark:from-neon-cyan/10 dark:to-neon-purple/10 text-yellow-700 dark:text-neon-cyan border border-yellow-500 dark:border-neon-cyan rounded-full">
            {service.badge}
          </span>
        </div>
      )}
      
      {/* Description - Fixed Height: 3 Lines */}
      <div className="min-h-[4.5rem] mb-7">
        <p className="text-gray-600 dark:text-neon-text-secondary text-sm leading-relaxed line-clamp-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
          {service.description}
        </p>
      </div>

      {/* Tags - Limited to 2 Lines (max 3 tags visible) */}
      <div className="flex flex-wrap gap-2 mb-5 max-h-[72px] overflow-hidden">
        {service.tags?.slice(0, 3).map((tag, idx) => (
          <motion.span
            key={idx}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-neon-text-primary bg-gray-50 dark:bg-black border border-gray-200 dark:border-neon-border rounded-lg dark:rounded-none hover:border-accent-yellow dark:hover:border-neon-cyan hover:text-gray-900 dark:hover:text-neon-cyan hover:bg-white dark:hover:bg-black transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {tag}
          </motion.span>
        ))}
        {service.tags && service.tags.length > 3 && (
          <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5">
            +{service.tags.length - 3}
          </span>
        )}
      </div>
      
      {/* Learn More Button - Enhanced hover animation */}
      <div className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-neon-border bg-white dark:bg-black text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:border-yellow-400 dark:group-hover:border-neon-cyan group-hover:bg-gradient-to-r group-hover:from-accent-yellow group-hover:to-orange-500 dark:group-hover:from-neon-cyan dark:group-hover:to-blue-500 group-hover:text-black dark:group-hover:text-black group-hover:shadow-lg dark:group-hover:shadow-neon-cyan/20 transition-all duration-300">
        <span>Learn More</span>
        <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform duration-300"></i>
      </div>
    </div>
  );
};

const About: React.FC<{ onNavigate?: (page: Page) => void }> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation('about');
  const { serviceSlug } = useParams<{ serviceSlug?: string }>();
  const navigate = useLanguageNavigate();
  const headerRef = useRef<HTMLElement>(null);
  const isHeaderVisible = useScrollReveal(headerRef, { threshold: 0.2 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [statsCount, setStatsCount] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const currentLanguage = i18n.language;


  // Get translated services
  const translatedServices = useMemo(() => {
    const serviceKeys = ['testAutomation', 'cicd', 'apiBackend', 'webDev', 'ecommerce'] as const;
    return SERVICES.map((service, index) => ({
      ...service,
      title: t(`services.${serviceKeys[index]}.title`),
      description: t(`services.${serviceKeys[index]}.description`),
      badge: t(`services.${serviceKeys[index]}.badge`),
      fullDescription: t(`services.${serviceKeys[index]}.fullDescription`),
      keyBenefits: t(`services.${serviceKeys[index]}.keyBenefits`, { returnObjects: true }) as string[],
    }));
  }, [t]);

  useEffect(() => {
    if (serviceSlug && translatedServices.length > 0) {
      const service = translatedServices.find(s => s.slug === serviceSlug);
      setSelectedService(service || null);
    } else if (!serviceSlug) {
      setSelectedService(null);
    }
  }, [serviceSlug, translatedServices]);

  useGSAP((context) => {
    // 1. Service Cards Stagger - animate immediately without scroll trigger
    if (servicesRef.current) {
        gsap.fromTo(servicesRef.current.children, 
            { y: 20, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                delay: 0.2
            }
        );
    }

    // 2. Number Counter Animation (0 to 5)
    // We animate a proxy object and update state
    if (counterRef.current) {
        const proxy = { val: 0 };
        gsap.to(proxy, {
            val: 5,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: counterRef.current,
                start: "top 85%",
                once: true, // Only count up once
            },
            onUpdate: () => {
                setStatsCount(Math.ceil(proxy.val));
            }
        });
    }

  }, []); // Empty dependency array - run once on mount


  return (
    <section ref={containerRef} className="animate-fade-in">
      <motion.header
        ref={headerRef}
        className="mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            {t('title')}{" "}
          </span>
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]">
              {t('titleHighlight')}
            </span>
            {/* Glow effect */}
            <span className="absolute inset-0 blur-lg bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark opacity-50 animate-pulse-slow"></span>
            {/* Animated Underline */}
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]"></span>
          </span>
        </h2>
      </motion.header>

      {/* Bento Grid Layout */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.3,
            },
          },
        }}
      >
        {/* Intro Card - Large */}
        <motion.div
          className="md:col-span-8"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <BentoCard className="bg-white dark:bg-neon-bg border-gray-100 dark:border-neon-border">
            <i className="fas fa-quote-left text-5xl text-gray-100 dark:text-neon-border absolute top-6 right-8 transition-colors duration-500 group-hover:text-accent-yellow/10"></i>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-neon-text-primary leading-tight mb-8 relative z-10">
              "{t('introQuote')}"
            </p>
            <div className="mt-auto relative z-10">
              <p className="text-gray-600 dark:text-neon-text-secondary leading-relaxed text-base font-medium">
                {t('introText')}
              </p>
            </div>
          </BentoCard>
        </motion.div>

        {/* Stats / Quick Info - Small Vertical */}
        <motion.div
          className="md:col-span-4"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Tilt3D tiltMaxAngle={12} scale={1.02}>
            <BentoCard className="flex flex-col justify-center items-center text-center bg-white dark:bg-black border-yellow-600 dark:border-neon-cyan relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-neon-cyan group">
              {/* Decorative circles */}
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-accent-yellow/10 dark:bg-neon-cyan/20 rounded-full blur-2xl transition-all duration-500 group-hover:bg-accent-yellow/20"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-accent-yellow/10 dark:bg-neon-purple/20 rounded-full blur-xl transition-all duration-500 group-hover:bg-accent-yellow/20"></div>

              <div className="w-full h-full flex flex-col justify-center items-center relative z-10 py-6">
                <motion.div
                  ref={counterRef}
                  className="text-7xl font-black mb-2 text-gray-900 dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  {statsCount}
                  <span className="text-4xl align-top text-accent-yellow dark:text-neon-cyan">
                    +
                  </span>
                </motion.div>
                <div className="text-sm font-extrabold uppercase tracking-widest text-gray-500 dark:text-neon-text-secondary mb-8">
                  {t('yearsExperience')}
                </div>

                <motion.div
                  className="w-full space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.7,
                      },
                    },
                  }}
                >
                  {[
                    { icon: "fa-certificate", text: t('badges.istqbCertified') },
                    { icon: "fa-sync", text: t('badges.agileScrum') },
                    { icon: "fa-layer-group", text: t('badges.fullStackQA') },
                  ].map((badge, idx) => (
                    <motion.div
                      key={idx}
                      className="group/badge relative bg-gradient-to-br from-yellow-400 to-amber-500 dark:from-cyan-400 dark:to-blue-500 border border-yellow-500 dark:border-cyan-400 rounded-xl dark:rounded-none px-4 py-2.5 text-sm font-bold text-black dark:text-black flex items-center gap-3 shadow-[0_4px_16px_rgba(251,191,36,0.3)] dark:shadow-[0_4px_16px_rgba(6,182,212,0.4)] transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-yellow-400 hover:to-amber-500 dark:hover:bg-gray-900 hover:border-yellow-500 dark:hover:border-cyan-300 hover:text-white dark:hover:text-white hover:shadow-[0_12px_32px_rgba(251,191,36,0.8)] dark:hover:shadow-[0_8px_24px_rgba(6,182,212,0.6)] hover:scale-110 hover:-translate-y-2"
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      <i className={`fas ${badge.icon} text-lg transition-all duration-500 group-hover/badge:scale-110 group-hover/badge:rotate-12`}></i>{" "}
                      {badge.text}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </BentoCard>
          </Tilt3D>
        </motion.div>

        {/* Story Section - Wide */}
        <motion.div
          className="md:col-span-12"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <BentoCard>
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-neon-text-primary mb-4 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-accent-yellow dark:bg-neon-cyan rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] dark:shadow-neon-cyan animate-pulse"></span>
                  {t('myJourney')}
                </h3>
                <p className="text-gray-600 dark:text-neon-text-secondary leading-relaxed text-lg font-medium">
                  {t('story')}
                </p>
              </div>
              <div className="hidden lg:block w-px h-32 bg-gradient-to-b from-transparent via-gray-200 dark:via-white/10 to-transparent"></div>
              <div className="w-full lg:w-1/3 flex flex-col sm:flex-row lg:flex-col gap-4">
                <motion.div
                  className="flex-1 p-5 rounded-2xl bg-white dark:bg-black border border-gray-100 dark:border-neon-cyan/30 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  whileHover={{
                    scale: 1.02,
                    borderColor: "#3b82f6",
                    boxShadow: "0 10px 30px rgba(59, 130, 246, 0.15)",
                  }}
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-neon-cyan/10 border border-blue-100 dark:border-neon-cyan flex items-center justify-center text-blue-600 dark:text-neon-cyan text-xl">
                    <i className="fas fa-map-pin"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 dark:text-neon-text-tertiary uppercase tracking-wider">
                      {t('basedIn')}
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {t('netherlands')}
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="flex-1 p-5 rounded-2xl bg-white dark:bg-black border border-gray-100 dark:border-neon-purple/30 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  whileHover={{
                    scale: 1.02,
                    borderColor: "#22c55e",
                    boxShadow: "0 10px 30px rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <div className="w-14 h-14 rounded-xl bg-green-50 dark:bg-neon-purple/10 border border-green-100 dark:border-neon-purple flex items-center justify-center text-green-600 dark:text-neon-purple text-xl">
                    <i className="fas fa-globe"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 dark:text-neon-text-tertiary uppercase tracking-wider">
                      {t('languages')}
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">
                      {t('languageList')}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

        {/* Services - Grid */}
        <div className="md:col-span-12 mt-8">
          <motion.h3
            className="text-2xl font-bold text-gray-900 dark:text-neon-text-primary mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            {t('whatIDo')}
          </motion.h3>
          <div
            ref={servicesRef}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {translatedServices.map((service, index) => (
              <div
                key={index}
              >
                <BentoCard
                  noDefaultBg={true}
                  className="h-[500px] bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-gray-200/50 dark:border-neon-border hover:border-yellow-600 dark:hover:border-neon-cyan group hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)] transition-all duration-500 hover:-translate-y-1"
                >
                  <ServiceItem
                    service={service}
                    onClick={() => {
                      setSelectedService(service);
                      navigate(`/about/${service.slug}`);
                    }}
                  />
                </BentoCard>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Service Detail Panel */}
      <ServiceDetailPanel
        service={selectedService}
        onClose={() => {
          setSelectedService(null);
          navigate('/about');
        }}
        onNavigate={(direction) => {
          if (!selectedService) return;
          const currentIndex = translatedServices.findIndex(s => s.slug === selectedService.slug);
          if (currentIndex === -1) return;
          
          let nextIndex;
          if (direction === 'next') {
            nextIndex = (currentIndex + 1) % translatedServices.length;
          } else {
            nextIndex = (currentIndex - 1 + translatedServices.length) % translatedServices.length;
          }
          
          // Use the index to find the service in the translatedServices array since we need the translated content
          const nextService = translatedServices[nextIndex];
          setSelectedService(nextService);
          navigate(`/about/${nextService.slug}`);
        }}
      />
    </section>
  );
};

export default About;
