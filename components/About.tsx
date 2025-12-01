import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Service } from "../types.ts";
import {
  ABOUT_TEXT,
  SERVICES,
  ABOUT_INTRO,
  ABOUT_STORY,
} from "../constants.tsx";
import Tilt3D from "./Tilt3D.tsx";
import { useScrollReveal } from "./hooks/useScrollReveal.tsx";

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

const ServiceItem: React.FC<{ service: Service }> = ({ service }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Determine tooltip position based on available viewport space
  useEffect(() => {
    if (showFullDescription && descriptionRef.current) {
      const rect = descriptionRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 200px below and more space above, show tooltip on top
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setTooltipPosition('top');
      } else {
        setTooltipPosition('bottom');
      }
    }
  }, [showFullDescription]);

  const handleToggleDescription = () => {
    setShowFullDescription(prev => !prev);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Icon Container - Fixed */}
      <div className="mb-4">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black border border-gray-100 dark:border-neon-cyan flex items-center justify-center text-2xl text-accent-yellow dark:text-neon-cyan shadow-[0_8px_20px_rgba(251,191,36,0.15)] dark:shadow-neon-cyan group-hover:scale-110 group-hover:rotate-12 group-hover:bg-accent-yellow dark:group-hover:bg-neon-cyan group-hover:text-white dark:group-hover:text-black transition-all duration-500">
          {service.icon}
        </div>
      </div>

      {/* Title - Fixed Height: Exactly 2 Lines */}
      <h4 className="h-[3rem] text-xl font-bold tracking-tight text-gray-900 dark:text-neon-text-primary mb-3 line-clamp-2 leading-6 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-yellow group-hover:to-accent-yellow-dark dark:group-hover:from-neon-cyan dark:group-hover:to-neon-purple transition-all duration-300">
        {service.title}
      </h4>
      
      {/* Description - Fixed Height: Exactly 3 Lines */}
      <div className="h-[4.5rem] mb-4 relative" ref={descriptionRef}>
        <p 
          className="text-gray-600 dark:text-neon-text-secondary text-sm leading-6 line-clamp-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 cursor-pointer"
          onMouseEnter={() => setShowFullDescription(true)}
          onMouseLeave={() => setShowFullDescription(false)}
          onClick={handleToggleDescription}
        >
          {service.description}
        </p>
        
        {/* Tooltip with full description - smart positioning */}
        {showFullDescription && (
          <motion.div
            initial={{ opacity: 0, y: tooltipPosition === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: tooltipPosition === 'bottom' ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-[60] left-0 right-0 p-4 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-2 border-accent-yellow dark:border-neon-cyan rounded-xl shadow-2xl dark:shadow-[0_0_30px_rgba(6,182,212,0.3)] ${
              tooltipPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            }`}
            onMouseEnter={() => setShowFullDescription(true)}
            onMouseLeave={() => setShowFullDescription(false)}
          >
            <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
              {service.description}
            </p>
            
            {/* Close button for mobile */}
            <button
              onClick={handleToggleDescription}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors md:hidden"
              aria-label="Close description"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
            
            {/* Arrow indicator */}
            <div 
              className={`absolute left-6 w-4 h-4 bg-white/95 dark:bg-black/95 border-accent-yellow dark:border-neon-cyan transform rotate-45 ${
                tooltipPosition === 'bottom'
                  ? '-top-2 border-l-2 border-t-2'
                  : '-bottom-2 border-r-2 border-b-2'
              }`}
            ></div>
          </motion.div>
        )}
      </div>

      {/* Tags - Fixed Max Height with Scroll if Needed */}
      <div className="flex flex-wrap gap-2 mt-auto max-h-[120px] overflow-y-auto" data-lenis-prevent>
        {service.tags?.map((tag, idx) => (
          <motion.span
            key={idx}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-neon-text-primary bg-gray-50 dark:bg-black border border-gray-200 dark:border-neon-border rounded-lg dark:rounded-none hover:border-accent-yellow dark:hover:border-neon-cyan hover:text-gray-900 dark:hover:text-neon-cyan hover:bg-white dark:hover:bg-black transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

const About: React.FC = () => {
  const headerRef = useRef<HTMLElement>(null);
  const isHeaderVisible = useScrollReveal(headerRef, { threshold: 0.2 });

  return (
    <section className="animate-fade-in">
      <motion.header
        ref={headerRef}
        className="mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            About{" "}
          </span>
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]">
              Me
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
              "{ABOUT_INTRO}"
            </p>
            <div className="mt-auto relative z-10">
              <p className="text-gray-600 dark:text-neon-text-secondary leading-relaxed text-base font-medium">
                {ABOUT_TEXT}
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
            <BentoCard className="flex flex-col justify-center items-center text-center bg-white dark:bg-black border-gray-100 dark:border-neon-cyan relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-neon-cyan group">
              {/* Decorative circles */}
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-accent-yellow/10 dark:bg-neon-cyan/20 rounded-full blur-2xl transition-all duration-500 group-hover:bg-accent-yellow/20"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-accent-yellow/10 dark:bg-neon-purple/20 rounded-full blur-xl transition-all duration-500 group-hover:bg-accent-yellow/20"></div>

              <div className="w-full h-full flex flex-col justify-center items-center relative z-10 py-6">
                <motion.div
                  className="text-7xl font-black mb-2 text-gray-900 dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  5
                  <span className="text-4xl align-top text-accent-yellow dark:text-neon-cyan">
                    +
                  </span>
                </motion.div>
                <div className="text-sm font-extrabold uppercase tracking-widest text-gray-500 dark:text-neon-text-secondary mb-8">
                  Years Experience
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
                    { icon: "fa-certificate", text: "ISTQB® Certified" },
                    { icon: "fa-sync", text: "Agile & Scrum" },
                    { icon: "fa-layer-group", text: "Full-Stack QA" },
                  ].map((badge, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-white dark:bg-black border border-gray-200 dark:border-neon-cyan/50 rounded-xl dark:rounded-none px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-3 shadow-sm transition-all duration-300 hover:bg-yellow-50 dark:hover:bg-neon-cyan/10 hover:border-yellow-600 dark:hover:border-neon-cyan hover:text-gray-900 dark:hover:text-white hover:shadow-[0_0_20px_rgba(234,179,8,0.6)] dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <i className={`fas ${badge.icon} text-lg`}></i>{" "}
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
                  My Journey
                </h3>
                <p className="text-gray-600 dark:text-neon-text-secondary leading-relaxed text-lg font-medium">
                  {ABOUT_STORY}
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
                      Based in
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      Netherlands
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
                      Languages
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">
                      English, Dutch, Turkish
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
            What I Do
          </motion.h3>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.9,
                },
              },
            }}
          >
            {SERVICES.map((service, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <BentoCard
                  noDefaultBg={true}
                  className="h-[440px] bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-gray-200/50 dark:border-neon-border hover:border-yellow-600 dark:hover:border-neon-cyan group hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)] transition-all duration-500 hover:-translate-y-1"
                >
                  <ServiceItem service={service} />
                </BentoCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default About;
