
import React from 'react';
import { PERSONAL_INFO, ABOUT_TEXT, EXPERIENCE, EDUCATION, SKILLS, LANGUAGES, TECH_STACK } from '../constants.tsx';

const PrintableResume: React.FC = () => {
  return (
    <div className="hidden print:block font-sans text-gray-900 bg-white w-full h-full absolute top-0 left-0 z-[9999]">
      <style>{`
        @media print {
          @page {
            margin: 0; /* Hides browser default headers & footers (localhost, date, title) */
            size: A4;
          }
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide app root wrapper styling if any */
          #root {
            display: block;
            width: 100%;
          }
          /* Force all text to be black */
          * {
            color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Table Layout for Page Margins */
          .print-container {
            width: 100%;
            border-collapse: collapse;
          }
          
          /* The header repeats on every page top */
          .print-header-space {
            height: 15mm; /* Top Margin */
          }
          
          /* The footer repeats on every page bottom */
          .print-footer-space {
            height: 15mm; /* Bottom Margin */
          }
          
          /* The body content area */
          .print-content {
            padding: 0 15mm; /* Left/Right Margins */
          }
          
          /* Utility to prevent awkward breaks */
          .no-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* 
         Using a Table structure to simulate margins on every page 
         while suppressing browser headers/footers via @page { margin: 0 } 
      */}
      <table className="print-container w-full">
        <thead>
          <tr>
            <td>
              <div className="print-header-space"></div>
            </td>
          </tr>
        </thead>
        
        <tbody>
          <tr>
            <td className="print-content align-top">
              {/* --- RESUME CONTENT START --- */}
              
              {/* 1. HEADER */}
              <header className="border-b-2 border-black pb-6 mb-8 no-break">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h1 className="text-5xl font-bold uppercase tracking-tight leading-none mb-2">{PERSONAL_INFO.name}</h1>
                        <p className="text-xl font-medium text-gray-700 tracking-wide">{PERSONAL_INFO.title}</p>
                    </div>
                </div>
                
                {/* Contact Info Grid */}
                <div className="grid grid-cols-2 gap-y-2 text-sm font-medium text-gray-700 w-full">
                    <div className="flex items-center gap-3">
                        <span className="w-5 flex justify-center text-gray-900"><i className="fas fa-envelope"></i></span> 
                        {PERSONAL_INFO.email}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-5 flex justify-center text-gray-900"><i className="fas fa-phone"></i></span> 
                        {PERSONAL_INFO.phone}
                    </div>
                    <div className="flex items-center gap-3">
                         <span className="w-5 flex justify-center text-gray-900"><i className="fas fa-globe"></i></span> 
                         <span className="text-black">emredursun.nl</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-5 flex justify-center text-gray-900"><i className="fas fa-map-marker-alt"></i></span> 
                        {PERSONAL_INFO.location}
                    </div>
                </div>
              </header>

              {/* 2. SUMMARY */}
              <section className="mb-8 no-break">
                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1 text-black">Professional Profile</h3>
                <p className="text-sm leading-relaxed text-justify text-gray-800">{ABOUT_TEXT}</p>
              </section>

              {/* 3. SKILLS (3 Column Grid) */}
              <section className="mb-8 no-break">
                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-4 pb-1 text-black">Skills & Expertise</h3>
                <div className="grid grid-cols-3 gap-8">
                    {/* Technical Skills */}
                    <div className="col-span-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Technologies</h4>
                        <div className="flex flex-wrap gap-2">
                            {TECH_STACK.flatMap(cat => cat.technologies).map(tech => (
                                <span key={tech.name} className="text-[11px] font-medium border border-gray-300 rounded px-1.5 py-0.5 bg-gray-50 text-black">
                                    {tech.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* Languages */}
                    <div>
                         <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Languages</h4>
                         <ul className="text-xs space-y-1.5">
                            {LANGUAGES.map(lang => (
                                <li key={lang.name} className="flex justify-between border-b border-dotted border-gray-300 pb-0.5 last:border-0">
                                    <span className="font-semibold">{lang.name}</span>
                                    <span className="text-gray-600">{lang.level}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Key Competencies</h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                         {SKILLS.map(skill => (
                            <div key={skill.name} className="flex items-center gap-2 text-xs w-[45%]">
                                <div className="flex-1 font-medium">{skill.name}</div>
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-800" style={{ width: `${skill.level}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              </section>

              {/* 4. EXPERIENCE */}
              <section className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-5 pb-1 text-black">Professional Experience</h3>
                <div className="space-y-6">
                    {EXPERIENCE.map((job, index) => (
                        <div key={index} className="no-break relative pl-4 border-l-2 border-gray-200">
                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-400"></div>
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-base font-bold text-black">{job.title}</h4>
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap ml-4">{job.date}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-600 mb-2 italic">{job.company}</div>
                            <p className="text-sm leading-relaxed text-gray-800 text-justify whitespace-pre-line">{job.description}</p>
                        </div>
                    ))}
                </div>
              </section>

              {/* 5. EDUCATION */}
              <section className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-5 pb-1 text-black">Education</h3>
                <div className="space-y-5">
                    {EDUCATION.map((edu, index) => (
                        <div key={index} className="no-break">
                             <div className="flex justify-between items-baseline">
                                <h4 className="text-sm font-bold text-black">{edu.title}</h4>
                                <span className="text-xs font-medium text-gray-500">{edu.date}</span>
                            </div>
                            <div className="text-sm text-gray-600 italic mb-1">{edu.company}</div>
                            <p className="text-xs text-gray-600 leading-snug">{edu.description}</p>
                        </div>
                    ))}
                </div>
              </section>

              {/* --- RESUME CONTENT END --- */}
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td>
              <div className="print-footer-space flex items-end justify-center pb-4">
                 {/* Optional clean footer, often kept empty or minimal */}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PrintableResume;
