import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../constants.tsx';
import ThemeSwitcher from './ThemeSwitcher.tsx';
import Magnetic from './Magnetic.tsx';
import Tilt3D from './Tilt3D.tsx';
import Particles from './Particles.tsx';
import WordByWordAnimation from './WordByWordAnimation.tsx';
import AnimatedName from './AnimatedName.tsx';
import { Page } from '../types.ts';

interface SidebarProps {
  theme: string;
  toggleTheme: () => void;
  activePage: Page;
  onNavigate: (page: Page) => void;
  isMobileView: boolean;
}

const pages: { label: Page; icon: React.ReactNode }[] = [
    { label: 'About', icon: <i className="far fa-user"></i> },
    { label: 'Resume', icon: <i className="far fa-file-alt"></i> },
    { label: 'Projects', icon: <i className="far fa-folder-open"></i> },
    { label: 'Contact', icon: <i className="far fa-envelope"></i> },
];

const NavButton: React.FC<{
  page: { label: Page; icon: React.ReactNode };
  isActive: boolean;
  onNavigate: (page: Page) => void;
}> = React.memo(({ page, isActive, onNavigate }) => (
    <li>
        <Magnetic>
            <button
                onClick={() => onNavigate(page.label)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 font-semibold group relative overflow-hidden
                    ${isActive
                        ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] dark:hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-transparent hover:border-yellow-400/50 dark:hover:border-neon-cyan/50'
                    }`
                }
            >
                <span className={`text-xl w-6 flex justify-center transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {page.icon}
                </span>
                <span className="relative z-10 tracking-wide text-sm">{page.label}</span>
            </button>
        </Magnetic>
    </li>
));

// Dynamic greeting based on time of day
const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

const Sidebar: React.FC<SidebarProps> = ({ theme, toggleTheme, activePage, onNavigate, isMobileView }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [greeting, setGreeting] = useState(getGreeting());
    const sidebarRef = useRef<HTMLElement>(null);

    // Update greeting every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleDownloadResume = (e: React.MouseEvent) => {
        if (!PERSONAL_INFO.resumeUrl || PERSONAL_INFO.resumeUrl === '#') {
            e.preventDefault();
            window.print();
        }
    };

    const isDirectDownload = PERSONAL_INFO.resumeUrl && PERSONAL_INFO.resumeUrl !== '#';

    return (
        <aside 
            ref={sidebarRef}
            onMouseMove={handleMouseMove}
            className={`relative bg-white/70 dark:bg-[#121212]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-2xl dark:shadow-[0_0_40px_-5px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden group/sidebar
            ${isMobileView ? 'w-full' : 'w-[360px] shrink-0 h-full max-h-[calc(100vh-4rem)] sticky top-8'}`}
        >
             {/* Animated Background Particles */}
             <Particles count={25} />

             {/* Interactive Spotlight Effect */}
             <div 
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/sidebar:opacity-100 z-50 rounded-[2.5rem]"
                style={{
                    background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.05), transparent 40%)`,
                }}
            />

            <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />

            {/* Profile Header */}
            <motion.div 
                className="pt-10 px-8 pb-6 flex flex-col items-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                
                {/* Avatar Container with Status */}
                <Tilt3D tiltMaxAngle={10} scale={1.05}>
                    <motion.div 
                        className="relative mb-6 group cursor-pointer"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: 'easeInOut' 
                        }}
                    >
                        {/* Premium Glow Effect - Extended outward for better separation */}
                        <div className="absolute -inset-6 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 dark:from-cyan-400 dark:via-blue-500 dark:to-purple-500 rounded-[3rem] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse-slow -z-20"></div>
                        <div className="absolute -inset-4 bg-gradient-to-br from-yellow-400 to-orange-600 dark:from-neon-cyan dark:to-purple-600 rounded-[2.8rem] blur-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 -z-20"></div>
                        
                        {/* Outer frame with premium styling */}
                        <div className="relative p-2 bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#18181b] rounded-[2.2rem] shadow-2xl border-[1.5px] border-gray-200/50 dark:border-white/10 group-hover:border-yellow-400/70 dark:group-hover:border-neon-cyan/70 transition-all duration-500 z-10 isolate">
                            {/* Inner border for premium effect */}
                            <div className="p-[3px] bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-yellow-400/20 dark:from-cyan-400/20 dark:via-purple-400/10 dark:to-cyan-400/20 rounded-[2rem] group-hover:from-yellow-400/40 group-hover:to-orange-400/40 dark:group-hover:from-cyan-400/40 dark:group-hover:to-purple-400/40 transition-all duration-500">
                                <div className="relative overflow-hidden rounded-[1.9rem] w-40 h-40 bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5">
                                    <img
                                        src={PERSONAL_INFO.avatar}
                                        alt={PERSONAL_INFO.name}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 select-none"
                                        style={{ 
                                            imageRendering: 'auto',
                                            WebkitFontSmoothing: 'antialiased',
                                            backfaceVisibility: 'hidden',
                                            transform: 'translateZ(0)',
                                            willChange: 'transform'
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Ultra-Sharp Status Badge with solid background */}
                        <motion.div 
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1f1f1f] py-2 px-5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-[1.5px] border-gray-200 dark:border-gray-700 flex items-center gap-2.5 z-40 whitespace-nowrap isolate"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.4, type: 'spring' }}
                            style={{ 
                                WebkitFontSmoothing: 'antialiased',
                                backfaceVisibility: 'hidden',
                                transform: 'translateZ(0)'
                            }}
                        >
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)] ring-2 ring-green-400/30"></span>
                            </span>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200" style={{ letterSpacing: '0.08em' }}>Available</span>
                        </motion.div>
                    </motion.div>
                </Tilt3D>

                {/* Dynamic Greeting - Word by Word Drop Animation */}
                <div className="text-center mb-2 mt-2 overflow-visible py-2">
                    <p className="text-lg font-semibold flex flex-wrap items-center justify-center gap-x-2">
                        <WordByWordAnimation
                            text={`${greeting},`}
                            className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-bold"
                            staggerDelay={0.35}
                            initialDelay={0.5}
                            dropDistance={35}
                            animationDuration={0.8}
                            repeat={true}
                            repeatDelay={3.5}
                        />
                        <WordByWordAnimation
                            text="I'm"
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent font-bold"
                            staggerDelay={0.35}
                            initialDelay={1.85}
                            dropDistance={35}
                            animationDuration={0.8}
                            repeat={true}
                            repeatDelay={3.5}
                        />
                    </p>
                </div>

                {/* Identity with Animated Name */}
                <motion.div 
                    className="text-center mb-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="mb-3"
                    >
                        <AnimatedName 
                            name={PERSONAL_INFO.name} 
                            variant="hacker"
                        />
                    </motion.div>
                    <motion.div 
                        className="inline-block px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                            delay: 1.2,
                            duration: 0.5,
                            ease: [0.34, 1.56, 0.64, 1] // Bouncy easing
                        }}
                        whileHover={{ scale: 1.05, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                    >
                        {PERSONAL_INFO.title}
                    </motion.div>
                </motion.div>
            </motion.div>

            <div className="flex-1 px-8 pb-8 overflow-y-auto no-scrollbar flex flex-col" data-lenis-prevent>
                 
                 <div className="w-full border-t border-gray-200 dark:border-white/5 mb-6"></div>

                {/* Contact Details */}
                <motion.div 
                    className="space-y-5 mb-8"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.4,
                            },
                        },
                    }}
                >
                    <InfoRow icon="fa-envelope" value={PERSONAL_INFO.email} label="Email" isLink href={`mailto:${PERSONAL_INFO.email}`} />
                    <InfoRow icon="fa-phone" value={PERSONAL_INFO.phone} label="Phone" isLink href={`tel:${PERSONAL_INFO.phone}`} />
                    <InfoRow icon="fa-map-marker-alt" value={PERSONAL_INFO.location} label="Location" />
                </motion.div>

                {/* Socials with Enhanced Animations */}
                <motion.div 
                    className="flex gap-3 justify-center mb-8"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.08,
                                delayChildren: 0.6,
                            },
                        },
                    }}
                >
                    {SOCIAL_LINKS.map(link => (
                        <motion.a 
                            key={link.name} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 relative overflow-hidden group cursor-pointer"
                            aria-label={link.name}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{ 
                                scale: 1.15,
                                rotate: 8,
                                backgroundColor: 'rgb(250, 204, 21)',
                                borderColor: 'rgb(250, 204, 21)',
                                boxShadow: '0 8px 25px -5px rgba(250, 204, 21, 0.5)',
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15
                                }
                            }}
                            whileTap={{ 
                                scale: 0.9,
                                rotate: -8,
                                transition: {
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 10
                                }
                            }}
                        >
                            {/* Glow effect */}
                            <span className="absolute inset-0 rounded-xl bg-yellow-400 opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-200"></span>
                            {/* Icon */}
                            <span className="relative z-10 group-hover:text-black transition-colors duration-200">
                                {link.icon}
                            </span>
                        </motion.a>
                    ))}
                </motion.div>

                {/* Navigation (Desktop) */}
                {!isMobileView && (
                  <nav className="flex-1 mb-8">
                      <ul className="space-y-2">
                          {pages.map((page) => (
                              <NavButton
                                  key={page.label}
                                  page={page}
                                  isActive={activePage === page.label}
                                  onNavigate={onNavigate}
                              />
                          ))}
                      </ul>
                  </nav>
                )}

                <div className="mt-auto">
                   <Magnetic>
                       <a 
                            href={PERSONAL_INFO.resumeUrl}
                            onClick={handleDownloadResume}
                            download={isDirectDownload}
                            className="group w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40 hover:-translate-y-0.5 overflow-hidden relative ring-1 ring-white/20"
                        >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"></div>
                            <span className="text-sm uppercase tracking-wider font-extrabold z-20">Download CV</span>
                            <i className="fas fa-download z-20"></i>
                        </a>
                   </Magnetic>
                </div>
            </div>
        </aside>
    );
};


const InfoRow: React.FC<{ icon: string; value: string; label: string; isLink?: boolean; href?: string }> = ({ icon, value, label, isLink, href }) => {
    const content = (
        <div className="flex items-center gap-4 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-sm shrink-0 group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-300">
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{value}</p>
            </div>
        </div>
    );

    if (isLink) {
        return (
            <motion.a 
                href={href} 
                className="block hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-2 rounded-xl transition-colors"
                variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                }}
            >
                {content}
            </motion.a>
        )
    }
    return (
        <motion.div 
            className="-mx-2 px-2 py-2"
            variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 },
            }}
        >
            {content}
        </motion.div>
    );
}

export default Sidebar;

