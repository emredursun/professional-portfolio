import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Page } from '../types.ts';

const About = lazy(() => import('./About.tsx'));
const Resume = lazy(() => import('./Resume.tsx'));
const Projects = lazy(() => import('./Projects.tsx'));
const Contact = lazy(() => import('./Contact.tsx'));

interface MainContentProps {
  activePage: Page;
  isMobileView: boolean;
  onNavigate: (page: Page) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full min-h-[400px]">
    <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent border-solid rounded-full animate-spin"></div>
  </div>
);

const MainContent: React.FC<MainContentProps> = ({ activePage, isMobileView, onNavigate }) => {
  return (
    <div className={`${isMobileView ? 'pb-32' : 'p-8 md:p-12'}`}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Root redirects */}
          <Route path="/" element={<Navigate to="/about" replace />} />
          <Route path="/:lang" element={<Navigate to="about" replace />} />
          
          {/* Language-aware routes */}
          <Route path="/about/:serviceSlug?" element={<About />} />
          <Route path="/:lang/about/:serviceSlug?" element={<About />} />
          
          <Route path="/resume" element={<Resume />} />
          <Route path="/:lang/resume" element={<Resume />} />
          
          <Route path="/projects" element={<Projects />} />
          <Route path="/:lang/projects" element={<Projects />} />
          
          <Route path="/projects/:slug" element={<Projects />} />
          <Route path="/:lang/projects/:slug" element={<Projects />} />
          
          <Route path="/contact" element={<Contact />} />
          <Route path="/:lang/contact" element={<Contact />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/about" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default MainContent;
