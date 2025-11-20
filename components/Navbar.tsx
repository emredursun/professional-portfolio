
import React from 'react';
import { Page } from '../types.ts';

interface NavbarProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
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
        <button
            onClick={() => onNavigate(page.label)}
            className={`relative flex flex-col items-center justify-center w-full max-w-[70px] py-2.5 rounded-2xl transition-all duration-300 group ${isActive ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {/* Active Indicator: Subtle Glow Background */}
            <span className={`absolute inset-0 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-2xl transition-all duration-500 ${isActive ? 'opacity-100 scale-100 shadow-[0_0_20px_rgba(250,204,21,0.15)]' : 'opacity-0 scale-75'}`}></span>

            <span className={`text-xl mb-1 z-10 transition-transform duration-300 ease-out ${isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-110'}`}>
                {page.icon}
            </span>
            
            {/* Label */}
            <span className={`text-[10px] font-bold uppercase tracking-wider z-10 transition-all duration-300 whitespace-nowrap ${isActive ? 'opacity-100 translate-y-0 font-extrabold' : 'opacity-70'}`}>
                {page.label}
            </span>
        </button>
    </li>
));

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
            {/* Premium Glass Dock */}
            <div className="pointer-events-auto w-full max-w-[380px] bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] border border-white/50 dark:border-white/10 rounded-[2rem] p-1.5 animate-fade-in-up ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300 hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.25)]">
                <ul className="flex justify-between items-center px-1">
                    {pages.map((page) => (
                        <NavButton
                            key={page.label}
                            page={page}
                            isActive={activePage === page.label}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
