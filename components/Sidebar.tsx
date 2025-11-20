
import React, { useState, useEffect, useRef } from 'react';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../constants.tsx';
import ThemeSwitcher from './ThemeSwitcher.tsx';
import Magnetic from './Magnetic.tsx';
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
                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
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

const Sidebar: React.FC<SidebarProps> = ({QD, theme, toggleTheme, activePage, onNavigate, isMobileView }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const sidebarRef = useRef<HTMLElement>(null);

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
             {/* Interactive Spotlight Effect */}
             <div 
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/sidebar:opacity-100 z-50 rounded-[2.5rem]"
                style={{
                    background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.05), transparent 40%)`,
                }}
            />

            <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />

            {/* Profile Header */}
            <div className="pt-10 px-8 pb-6 flex flex-col items-center relative z-10">
                
                {/* Avatar Container with Status */}
                <div className="relative mb-6 group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="relative p-1.5 bg-white dark:bg-[#18181b] rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5"> 
                        <div className="relative overflow-hidden rounded-[1.7rem] w-36 h-36 bg-gray-100 dark:bg-gray-800">
                            <img
                                src={PERSONAL_INFO.avatar}
                                alt={PERSONAL_INFO.name}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                        </div>
                    </div>
                    
                    {/* Status Badge */}
                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#222] backdrop-blur-md py-1.5 px-4 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2 z-20 whitespace-nowrap">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Available</span>
                    </div>
                </div>

                {/* Identity */}
                <div className="text-center mb-2">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                        {PERSONAL_INFO.name}
                    </h1>
                    <div className="inline-block px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                        {PERSONAL_INFO.title}
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 pb-8 overflow-y-auto no-scrollbar flex flex-col">
                 
                 <div className="w-full border-t border-gray-200 dark:border-white/5 mb-6"></div>

                {/* Contact Details */}
                <div className="space-y-5 mb-8">
                    <InfoRow icon="fa-envelope" value={PERSONAL_INFO.email} label="Email" isLink href={`mailto:${PERSONAL_INFO.email}`} />
                    <InfoRow icon="fa-phone" value={PERSONAL_INFO.phone} label="Phone" isLink href={`tel:${PERSONAL_INFO.phone}`} />
                    <InfoRow icon="fa-map-marker-alt" value={PERSONAL_INFO.location} label="Location" />
                </div>

                {/* Socials */}
                <div className="flex gap-3 justify-center mb-8">
                    {SOCIAL_LINKS.map(link => (
                        <a 
                            key={link.name} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-400/20"
                            aria-label={link.name}
                        >
                            {link.icon}
                        </a>
                    ))}
                </div>

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
    const Content = () => (
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
            <a href={href} className="block hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-2 rounded-xl transition-colors">
                <Content />
            </a>
        )
    }
    return <div className="-mx-2 px-2 py-2"><Content /></div>;
}

export default Sidebar;
