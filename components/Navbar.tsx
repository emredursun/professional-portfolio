
import React from 'react';
import Magnetic from './Magnetic.tsx';
import { Page } from '../types.ts';

interface NavbarProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
    onOpenCommandPalette?: () => void;
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
    <li className="flex-1 flex justify-center">
        <Magnetic>
            <button
                onClick={() => onNavigate(page.label)}
                className={`relative flex flex-col items-center justify-center w-full min-w-[60px] py-1.5 rounded-xl transition-all duration-300 group touch-manipulation ${
                    isActive 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
            >
                {/* Premium Active Indicator with iOS-style Pill */}
                {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-b from-yellow-400/15 to-yellow-500/10 dark:from-yellow-400/10 dark:to-yellow-500/5 rounded-xl transition-all duration-500 shadow-[0_2px_12px_rgba(250,204,21,0.2)] dark:shadow-[0_2px_16px_rgba(250,204,21,0.15)] animate-in fade-in zoom-in-95"></span>
                )}

                {/* Icon with smooth animations */}
                <span className={`text-[18px] mb-0.5 z-10 transition-all duration-300 ease-out ${
                    isActive 
                        ? 'scale-110 -translate-y-0.5' 
                        : 'group-hover:scale-105 group-active:scale-95'
                }`}>
                    {page.icon}
                </span>
                
                {/* Label with improved typography */}
                <span className={`text-[9px] font-semibold uppercase tracking-wide z-10 transition-all duration-300 whitespace-nowrap ${
                    isActive 
                        ? 'opacity-100 font-bold' 
                        : 'opacity-60 group-hover:opacity-80'
                }`}>
                    {page.label}
                </span>
            </button>
        </Magnetic>
    </li>
));

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate, onOpenCommandPalette }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
            {/* Single unified navbar container - flush with device navigation */}
            <div className="pointer-events-auto w-full bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-white/[0.08] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_16px_rgba(0,0,0,0.4)]">
                <div className="max-w-[520px] mx-auto px-4 py-1.5">
                    <ul className="flex justify-between items-center gap-0.5">
                        {/* Navigation buttons */}
                        {pages.map((page) => (
                            <NavButton
                                key={page.label}
                                page={page}
                                isActive={activePage === page.label}
                                onNavigate={onNavigate}
                            />
                        ))}
                        
                        {/* Command Palette Button integrated as nav item */}
                        {onOpenCommandPalette && (
                            <li className="flex-1 flex justify-center">
                                <button
                                    onClick={onOpenCommandPalette}
                                    className="relative flex flex-col items-center justify-center w-full min-w-[60px] py-1.5 rounded-xl transition-all duration-300 group touch-manipulation text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    aria-label="Open command palette"
                                    title="Search (⌘K)"
                                >
                                    <span className="text-[18px] mb-0.5 z-10 transition-all duration-300 ease-out group-hover:scale-105 group-active:scale-95">
                                        <i className="fas fa-search" />
                                    </span>
                                    <span className="text-[9px] font-semibold uppercase tracking-wide z-10 transition-all duration-300 whitespace-nowrap opacity-60 group-hover:opacity-80">
                                        Search
                                    </span>
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
