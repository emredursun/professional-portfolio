import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Page } from '../types.ts';

/** Locales that get a URL prefix. Keep in sync with i18n and SEO.tsx. */
const LOCALES = ['nl', 'tr'] as const;

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

          {/* Default (English, unprefixed) routes */}
          <Route path="/about/:serviceSlug?" element={<About />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />

          {/*
            Localised routes are enumerated per language instead of using a
            ":lang" param. A bare ":lang" matches ANY segment, so /anything/about
            rendered the real About page and emitted a self-referencing canonical
            for it — an unbounded set of crawlable, duplicate URLs. Listing the
            supported languages keeps that surface closed; anything else falls
            through to the catch-all below.
          */}
          {LOCALES.map((locale) => (
            <React.Fragment key={locale}>
              <Route path={`/${locale}`} element={<Navigate to={`/${locale}/about`} replace />} />
              <Route path={`/${locale}/about/:serviceSlug?`} element={<About />} />
              <Route path={`/${locale}/resume`} element={<Resume />} />
              <Route path={`/${locale}/projects`} element={<Projects />} />
              <Route path={`/${locale}/projects/:slug`} element={<Projects />} />
              <Route path={`/${locale}/contact`} element={<Contact />} />
            </React.Fragment>
          ))}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/about" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default MainContent;
