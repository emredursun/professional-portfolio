
import React from 'react';
import { TimelineItem, Skill, Language } from '../types.ts';
import { EDUCATION, EXPERIENCE, SKILLS, TECH_STACK, LANGUAGES } from '../constants.tsx';

const TimelineCard: React.FC<{ item: TimelineItem; isFirst?: boolean; isLast?: boolean }> = ({ item, isFirst, isLast }) => {
    return (
        <li className="relative pl-8 sm:pl-12 group">
            {/* Continuous Line */}
            {!isLast && (
                <div className="absolute left-[9px] top-3 bottom-[-2rem] w-[2px] bg-gradient-to-b from-gray-200 via-gray-200 to-gray-100 dark:from-[#333] dark:via-[#333] dark:to-[#222] group-hover:from-yellow-400/50 group-hover:via-yellow-400/20 transition-colors duration-500"></div>
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute left-0 top-3 w-5 h-5 rounded-full border-[3px] transition-all duration-500 z-10
                ${isFirst 
                    ? 'border-yellow-400 bg-yellow-400 shadow-[0_0_0_4px_rgba(250,204,21,0.2)]' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#18181b] group-hover:border-yellow-400 group-hover:scale-110'}
            `}></div>
            
            <div className="relative flex flex-col gap-3 pb-12">
                {/* Header Section: Date as Title, Job Title as Badge */}
                <div className="flex flex-col gap-2">
                   {/* Date (Main Header) */}
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors">
                        {item.date}
                   </h3>

                   {/* Job Title (Badge) */}
                   <span className="inline-flex items-center px-3 py-1 rounded-lg bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-400/20 w-fit">
                        {item.title}
                   </span>
                </div>
                
                {/* Company Info */}
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                    <i className="fas fa-building text-yellow-400"></i>
                    {item.company}
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                    {item.description}
                </p>
            </div>
        </li>
    );
};

const SkillBar: React.FC<{ skill: Skill }> = ({ skill }) => (
    <div className="group">
        <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-yellow-500 transition-colors">{skill.name}</span>
            <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500">{skill.level}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden border border-gray-100 dark:border-white/5">
            <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-full rounded-full relative group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all duration-1000 ease-out w-0 animate-[progressFill_1.2s_ease-out_forwards]" 
                style={{ width: `${skill.level}%` }}
            ></div>
        </div>
    </div>
);

const Resume: React.FC = () => {
    return (
        <section className="animate-fade-in">
            <header className="mb-12">
                 <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Resume</span>
                </h2>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                
                {/* Left Column: Experience & Education (8 spans) */}
                <div className="xl:col-span-8 space-y-16">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                             <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-black text-xl shadow-lg shadow-yellow-400/20">
                                <i className="fas fa-briefcase"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Experience</h3>
                        </div>
                        <ul className="ml-2">
                            {EXPERIENCE.map((item, index) => (
                                <TimelineCard key={index} item={item} isFirst={index === 0} isLast={index === EXPERIENCE.length - 1} />
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                         <div className="flex items-center gap-4 mb-8">
                             <div className="w-12 h-12 rounded-2xl bg-gray-800 dark:bg-white/10 flex items-center justify-center text-white text-xl">
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Education</h3>
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
                        <div className="bg-white dark:bg-[#18181b] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {TECH_STACK.flatMap(c => c.technologies).map(tech => (
                                    <div key={tech.name} className="group flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all duration-300 cursor-default">
                                        <span className="text-lg grayscale group-hover:grayscale-0 transition-all scale-90 group-hover:scale-100">{tech.icon}</span>
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{tech.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Skills Bars */}
                        <div className="bg-white dark:bg-[#18181b] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">Professional Skills</h3>
                            <div className="space-y-6">
                                {SKILLS.map((skill, index) => (
                                    <SkillBar key={index} skill={skill} />
                                ))}
                            </div>
                        </div>

                         {/* Languages */}
                         <div className="bg-white dark:bg-[#18181b] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">Languages</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {LANGUAGES.map((lang, index) => (
                                    <div key={index} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{lang.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{lang.level}</div>
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
