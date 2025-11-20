
import React, { useRef, useState } from 'react';
import { Service } from '../types.ts';
import { ABOUT_TEXT, SERVICES, ABOUT_INTRO, ABOUT_STORY } from '../constants.tsx';

const BentoCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; onClick?: () => void; noDefaultBg?: boolean }> = ({ children, className = "", title, onClick, noDefaultBg = false }) => {
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

    const handleFocus = () => { setIsFocused(true); setOpacity(1); };
    const handleBlur = () => { setIsFocused(false); setOpacity(0); };
    const handleMouseEnter = () => { setOpacity(1); };
    const handleMouseLeave = () => { setOpacity(0); };

    const baseClasses = noDefaultBg 
        ? `relative overflow-hidden rounded-3xl transition-all duration-300`
        : `relative overflow-hidden rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300`;

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
            {/* Spotlight Border Effect - Higher contrast in dark mode */}
            <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
                style={{ 
                    opacity, 
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.15), transparent 40%)` 
                }}
            />
            
            <div className="relative h-full p-8 z-20 flex flex-col">
                {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>}
                {children}
            </div>
        </div>
    );
};

const ServiceItem: React.FC<{ service: Service }> = ({ service }) => (
    <div className="flex flex-col h-full justify-between">
        <div>
            <div className="w-12 h-12 rounded-lg bg-[#1c1c1e] border border-white/5 flex items-center justify-center text-2xl mb-6 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] transition-all duration-300">
                {service.icon}
            </div>
            <h4 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-500 transition-colors">{service.title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {service.description}
            </p>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto">
            {service.tags?.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-[#1c1c1e] border border-white/5 rounded-md group-hover:border-yellow-500/20 group-hover:text-gray-300 transition-colors">
                    {tag}
                </span>
            ))}
        </div>
    </div>
);

const About: React.FC = () => {
    return (
        <section className="animate-fade-in">
            <header className="mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                    About <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Me</span>
                </h2>
            </header>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Intro Card - Large */}
                <BentoCard className="md:col-span-8 bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e20] dark:to-[#18181b]">
                    <i className="fas fa-quote-left text-5xl text-gray-200 dark:text-white/5 absolute top-6 right-8"></i>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 leading-tight mb-8 relative z-10">
                        "{ABOUT_INTRO}"
                    </p>
                    <div className="mt-auto relative z-10">
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base font-medium">
                            {ABOUT_TEXT}
                         </p>
                    </div>
                </BentoCard>

                {/* Stats / Quick Info - Small Vertical - High Contrast for Legibility */}
                <BentoCard className="md:col-span-4 flex flex-col justify-center items-center text-center bg-yellow-400 border-yellow-500 relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-white/20 rounded-full blur-xl"></div>

                    <div className="w-full h-full flex flex-col justify-center items-center relative z-10 py-6">
                        <div className="text-7xl font-black mb-2 text-gray-900 tracking-tighter">5<span className="text-4xl align-top">+</span></div>
                        <div className="text-sm font-extrabold uppercase tracking-widest text-gray-800 opacity-80 mb-8">Years Experience</div>
                        
                        <div className="w-full space-y-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold text-gray-900 flex items-center gap-3">
                                <i className="fas fa-certificate text-lg"></i> ISTQB® Certified
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold text-gray-900 flex items-center gap-3">
                                <i className="fas fa-sync text-lg"></i> Agile & Scrum
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold text-gray-900 flex items-center gap-3">
                                <i className="fas fa-layer-group text-lg"></i> Full-Stack QA
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* Story Section - Wide */}
                <BentoCard className="md:col-span-12">
                     <div className="flex flex-col lg:flex-row gap-10 items-center">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                                My Journey
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg font-medium">
                                {ABOUT_STORY}
                            </p>
                        </div>
                        <div className="hidden lg:block w-px h-32 bg-gradient-to-b from-transparent via-gray-200 dark:via-white/10 to-transparent"></div>
                        <div className="w-full lg:w-1/3 flex flex-col sm:flex-row lg:flex-col gap-4">
                             <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xl"><i className="fas fa-map-pin"></i></div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Based in</div>
                                    <div className="font-bold text-gray-900 dark:text-white text-lg">Netherlands</div>
                                </div>
                             </div>
                             <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-300 text-xl"><i className="fas fa-globe"></i></div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Languages</div>
                                    <div className="font-bold text-gray-900 dark:text-white text-sm">English, Dutch, Turkish</div>
                                </div>
                             </div>
                        </div>
                     </div>
                </BentoCard>
                
                {/* Services - Grid */}
                <div className="md:col-span-12 mt-8">
                     <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What I Do</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {SERVICES.map((service, i) => (
                            <BentoCard key={i} noDefaultBg={true} className="min-h-[320px] bg-[#0f0f11] dark:bg-[#0f0f11] border border-white/5 hover:border-yellow-500/50 group">
                                <ServiceItem service={service} />
                            </BentoCard>
                        ))}
                     </div>
                </div>

            </div>
        </section>
    );
};

export default About;
