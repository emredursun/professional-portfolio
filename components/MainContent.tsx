
import React, { Suspense, lazy } from 'react';
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
  const renderPage = () => {
    switch (activePage) {
      case 'About':
        return <About onNavigate={onNavigate} />;
      case 'Resume':
        return <Resume />;
      case 'Projects':
        return <Projects />;
      case 'Contact':
        return <Contact />;
      default:
        return <About onNavigate={onNavigate} />;
    }
  };

  return (
    <div className={`${isMobileView ? 'pb-32' : 'p-8 md:p-12'}`}>
      <Suspense fallback={<LoadingSpinner />}>
        {renderPage()}
      </Suspense>
    </div>
  );
};

export default MainContent;
