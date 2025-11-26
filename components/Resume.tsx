
import React from 'react';
import { TimelineItem, Skill, Language } from '../types.ts';
import { EDUCATION, EXPERIENCE, SKILLS, TECH_STACK, LANGUAGES } from '../constants.tsx';
import Tilt3D from './Tilt3D.tsx';

const TimelineCard: React.FC<{ item: TimelineItem; isFirst?: boolean; isLast?: boolean }> = ({ item, isFirst, isLast }) => {
    return (
        <li className="relative pl-8 sm:pl-12 group">
            {/* Continuous Line */}
            {!isLast && (
                <div className="absolute left-[9px] top-3 bottom-[-2rem] w-[2px] bg-gradient-to-b from-dark-border-strong via-dark-border-DEFAULT to-dark-border-subtle dark:from-dark-border-strong dark:via-dark-border-DEFAULT dark:to-dark-border-subtle transition-colors duration-500"></div>
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute left-0 top-3 w-5 h-5 rounded-full border-[3px] transition-all duration-500 z-10
                ${isFirst 
                    ? 'border-accent-yellow bg-accent-yellow shadow-neu-accent dark:shadow-neu-accent' 
                    : 'border-dark-border-strong dark:border-dark-border-strong bg-dark-surface dark:bg-dark-surface hover:border-accent-yellow hover:scale-110'}
            `}></div>
            
            <div className="relative flex flex-col gap-3 pb-12 hover:translate-x-2 transition-transform duration-300">
                {/* Header Section: Date as Title, Job Title as Badge */}
                <div className="flex flex-col gap-2">
                   {/* Date (Main Header) */}
                   <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary transition-colors">
                        {item.date}
                   </h3>

                   {/* Job Title (Badge) */}
                   <span className="inline-flex items-center px-4 py-2 rounded-xl bg-dark-card dark:bg-dark-card shadow-neu-inset-sm dark:shadow-neu-inset-sm text-dark-text-secondary dark:text-dark-text-secondary text-xs font-medium tracking-wide w-fit">
                        {item.title}
                   </span>
                </div>
                
                {/* Company Info */}
                <div className="flex items-center gap-2 text-sm font-medium text-dark-text-tertiary dark:text-dark-text-tertiary">
                    <i className="fas fa-building text-accent-yellow dark:text-accent-yellow"></i>
                    {item.company}
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed max-w-3xl">
                    {item.description}
                </p>
            </div>
        </li>
    );
};

const SkillBar: React.FC<{ skill: Skill }> = ({ skill }) => (
    <div>
        <div className="flex justify-between mb-3">
            <span className="text-sm font-medium text-dark-text-primary dark:text-dark-text-primary">{skill.name}</span>
            <span className="text-xs font-mono font-semibold text-dark-text-tertiary dark:text-dark-text-tertiary">{skill.level}%</span>
        </div>
        <div className="w-full bg-dark-card dark:bg-dark-card rounded-full h-2.5 overflow-hidden shadow-neu-inset-sm dark:shadow-neu-inset-sm">
            <div 
                className="bg-accent-yellow dark:bg-accent-yellow h-full rounded-full relative transition-all duration-1000 ease-out w-0 animate-[progressFill_1.2s_ease-out_forwards]" 
                style={{ width: `${skill.level}%` }}
            ></div>
        </div>
    </div>
);

const Resume: React.FC = () => {
    return (
        <section className="animate-fade-in">
            <header className="mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                    <span className="text-gray-900 dark:text-dark-text-primary">My </span>
                    <span className="relative inline-block">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 animate-gradient bg-[length:200%_auto]">
                            Resume
                        </span>
                        <span className="absolute inset-0 blur-lg bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 opacity-30 animate-pulse-slow"></span>
                        {/* Animated Underline */}
                        <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full animate-gradient bg-[length:200%_auto]"></span>
                    </span>
                </h2>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                
                {/* Left Column: Experience & Education (8 spans) */}
                <div className="xl:col-span-8 space-y-16">
                    <div>
                     <div className="flex items-center gap-4 mb-8">
                             <div className="w-14 h-14 rounded-2xl bg-dark-card dark:bg-dark-card flex items-center justify-center text-accent-yellow dark:text-accent-yellow text-xl shadow-neu-md dark:shadow-neu-md">
                                <i className="fas fa-briefcase"></i>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">Experience</h3>
                        </div>
                        <ul className="ml-2">
                            {EXPERIENCE.map((item, index) => (
                                <TimelineCard key={index} item={item} isFirst={index === 0} isLast={index === EXPERIENCE.length - 1} />
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                         <div className="flex items-center gap-4 mb-8">
                             <div className="w-14 h-14 rounded-2xl bg-dark-card dark:bg-dark-card flex items-center justify-center text-accent-yellow dark:text-accent-yellow text-xl shadow-neu-md dark:shadow-neu-md">
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">Education</h3>
                        </div>
                        <ul className="ml-2">
                            {EDUCATION.map((item, index) => (
                                <TimelineCard key={index} item={item} isLast={index === EDUCATION.length - 1} />
                            ))}
                        </ul>
                    </div>
                </div>

                {/*Right Column: Skills & Languages (4 spans) - Sticky */}
                <div className="xl:col-span-4">
                    <div className="sticky top-8 space-y-8">
                        {/* Tech Stack Cloud */}
                        <div className="p-10 rounded-[2rem] transition-all duration-300 bg-white dark:bg-dark-surface shadow-neu-md dark:shadow-neu-md hover:shadow-neu-lg dark:hover:shadow-neu-lg">
                            <h3 className="text-xl font-semibold mb-8 text-gray-900 dark:text-dark-text-primary pb-4">Tech Stack</h3>
                            <div className="flex flex-wrap gap-3">
                                {TECH_STACK.flatMap(c => c.technologies).map(tech => (
                                    <div key={tech.name} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card dark:bg-dark-card shadow-neu-sm dark:shadow-neu-sm hover:shadow-neu-md dark:hover:shadow-neu-md hover:scale-105 transition-all duration-300 cursor-default">
                                        <span className="text-lg opacity-60 hover:opacity-100 transition-all">{tech.icon}</span>
                                        <span className="text-xs font-medium text-dark-text-secondary dark:text-dark-text-secondary">{tech.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Skills Bars */}
                        <div className="p-10 rounded-[2rem] transition-all duration-300 bg-white dark:bg-dark-surface shadow-neu-md dark:shadow-neu-md hover:shadow-neu-lg dark:hover:shadow-neu-lg">
                            <h3 className="text-xl font-semibold mb-8 text-gray-900 dark:text-dark-text-primary pb-4">Professional Skills</h3>
                            <div className="space-y-6">
                                {SKILLS.map((skill, index) => (
                                    <SkillBar key={index} skill={skill} />
                                ))}
                            </div>
                        </div>

                         {/* Languages */}
                         <div className="p-10 rounded-[2rem] transition-all duration-300 bg-white dark:bg-dark-surface shadow-neu-md dark:shadow-neu-md hover:shadow-neu-lg dark:hover:shadow-neu-lg">
                            <h3 className="text-xl font-semibold mb-8 text-gray-900 dark:text-dark-text-primary pb-4">Languages</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {LANGUAGES.map((lang, index) => (
                                    <div key={index} className="p-5 rounded-2xl text-center transition-all duration-300 bg-dark-card dark:bg-dark-card shadow-neu-sm dark:shadow-neu-sm hover:shadow-neu-md dark:hover:shadow-neu-md">
                                        <div className="text-sm font-semibold text-dark-text-primary dark:text-dark-text-primary mb-1">{lang.name}</div>
                                        <div className="text-xs text-dark-text-tertiary dark:text-dark-text-tertiary font-medium">{lang.level}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Resume;
