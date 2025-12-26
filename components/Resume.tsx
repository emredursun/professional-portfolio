
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TimelineItem, Skill, Language } from '../types.ts';
import { SKILLS, TECH_STACK, LANGUAGES } from '../constants.tsx';


const TimelineCard: React.FC<{ item: TimelineItem; isFirst?: boolean; isLast?: boolean }> = ({ item, isFirst, isLast }) => {
    return (
        <li className="relative pl-8 sm:pl-12 group">
            {/* Continuous Line */}
            {!isLast && (
                <div className="absolute left-[9px] top-3 bottom-[-2rem] w-[2px] bg-gradient-to-b from-gray-300 via-gray-200 to-gray-100 dark:from-dark-border-strong dark:via-dark-border-DEFAULT dark:to-dark-border-subtle transition-colors duration-500"></div>
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute left-0 top-3 w-5 h-5 rounded-full border-[3px] transition-all duration-500 z-10
                ${isFirst 
                    ? 'border-yellow-500 bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)] dark:shadow-[0_0_15px_rgba(234,179,8,0.6)]' 
                    : 'border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-black hover:border-yellow-500 hover:scale-125 hover:shadow-[0_0_10px_rgba(234,179,8,0.5)]'}
            `}></div>
            
            <div className="relative flex flex-col gap-3 pb-12 pl-6 pr-6 pt-6 rounded-2xl bg-transparent hover:bg-white dark:hover:bg-white/5 transition-all duration-500 hover:-translate-y-1 border border-transparent hover:border-yellow-600 dark:hover:border-neon-cyan hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)]">
                {/* Header Section: Date as Title, Job Title as Badge */}
                <div className="flex flex-col gap-2">
                   {/* Date (Main Header) */}
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                        {item.date}
                   </h3>

                   {/* Job Title (Badge) */}
                   <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold tracking-wide w-fit">
                        {item.title}
                   </span>
                </div>
                
                {/* Company Info */}
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                    <i className="fas fa-building text-yellow-500"></i>
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
    <div>
        <div className="flex justify-between mb-3">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{skill.name}</span>
            <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">{skill.level}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-neon-cyan dark:to-neon-purple h-full rounded-full relative transition-all duration-1000 ease-out w-0 animate-[progressFill_1.2s_ease-out_forwards] shadow-[0_0_10px_rgba(234,179,8,0.4)] dark:shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
                style={{ width: `${skill.level}%` }}
            ></div>
        </div>
    </div>
);

const Resume: React.FC = () => {
    const { t } = useTranslation('resume');
    
    // Get translated education and experience data
    const education = useMemo(() => {
        const eduData = t('education', { returnObjects: true });
        return Array.isArray(eduData) ? eduData as TimelineItem[] : [];
    }, [t]);
    
    const experience = useMemo(() => {
        const expData = t('experience', { returnObjects: true });
        return Array.isArray(expData) ? expData as TimelineItem[] : [];
    }, [t]);

    // Get translated language levels for display
    const getTranslatedLanguages = useMemo(() => {
        const languageLevels = t('languageLevels', { returnObjects: true }) as Record<string, string>;
        return LANGUAGES.map(lang => ({
            ...lang,
            level: lang.level === 'Native' ? languageLevels.native :
                   lang.level.includes('C1') ? languageLevels.professional :
                   lang.level.includes('B2') ? languageLevels.intermediate :
                   languageLevels.beginner
        }));
    }, [t]);

    return (
        <section className="animate-fade-in">
            <header className="mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">{t('titleHighlight')} </span>
                    <span className="relative inline-block">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]">
                            {t('title')}
                        </span>
                        <span className="absolute inset-0 blur-lg bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark opacity-50 animate-pulse-slow"></span>
                        {/* Animated Underline */}
                        <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]"></span>
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
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">{t('sections.experience')}</h3>
                        </div>
                        <ul className="ml-2">
                            {experience.map((item, index) => (
                                <TimelineCard key={index} item={item} isFirst={index === 0} isLast={index === experience.length - 1} />
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                         <div className="flex items-center gap-4 mb-8">
                             <div className="w-14 h-14 rounded-2xl bg-dark-card dark:bg-dark-card flex items-center justify-center text-accent-yellow dark:text-accent-yellow text-xl shadow-neu-md dark:shadow-neu-md">
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">{t('sections.education')}</h3>
                        </div>
                        <ul className="ml-2">
                            {education.map((item, index) => (
                                <TimelineCard key={index} item={item} isLast={index === education.length - 1} />
                            ))}
                        </ul>
                    </div>
                </div>

                {/*Right Column: Skills & Languages (4 spans) - Sticky */}
                <div className="xl:col-span-4">
                    <div className="sticky top-8 space-y-8">
                        {/* Tech Stack Cloud */}
                        <div className="p-8 rounded-[2rem] bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border shadow-xl dark:shadow-none transition-all duration-500 hover:-translate-y-1 hover:border-yellow-600 hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:border-neon-cyan dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)]">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10">{t('sections.techStack')}</h3>
                            <div className="flex flex-wrap gap-3">
                                {TECH_STACK.flatMap(c => c.technologies).map(tech => (
                                    <div key={tech.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-yellow-600 dark:hover:border-neon-cyan hover:bg-yellow-50 dark:hover:bg-neon-cyan/10 transition-all duration-300 cursor-default group/tech">
                                        <span className="text-lg opacity-70 group-hover/tech:opacity-100 transition-all group-hover/tech:scale-110">{tech.icon}</span>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover/tech:text-gray-900 dark:group-hover/tech:text-white">{tech.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Skills Bars */}
                        <div className="p-8 rounded-[2rem] bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border shadow-xl dark:shadow-none transition-all duration-500 hover:-translate-y-1 hover:border-yellow-600 hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:border-neon-cyan dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)]">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10">{t('sections.skills')}</h3>
                            <div className="space-y-6">
                                {SKILLS.map((skill, index) => (
                                    <SkillBar key={index} skill={skill} />
                                ))}
                            </div>
                        </div>

                         {/* Languages */}
                         <div className="p-8 rounded-[2rem] bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border shadow-xl dark:shadow-none transition-all duration-500 hover:-translate-y-1 hover:border-yellow-600 hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.8)] dark:hover:border-neon-cyan dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)]">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10">{t('sections.languages')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {getTranslatedLanguages.map((lang, index) => (
                                    <div key={index} className="p-4 rounded-xl text-center transition-all duration-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-yellow-600 dark:hover:border-neon-cyan hover:bg-yellow-50 dark:hover:bg-neon-cyan/10 hover:-translate-y-1">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{lang.name}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{lang.level}</div>
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
