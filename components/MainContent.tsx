import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

/** Locales that get a URL prefix. Keep in sync with i18n and SEO.tsx. */
const LOCALES = ['nl', 'tr'] as const;

const loaders = {
  about: () => import('./About.tsx'),
  resume: () => import('./Resume.tsx'),
  projects: () => import('./Projects.tsx'),
  contact: () => import('./Contact.tsx'),
  quality: () => import('./Quality.tsx'),
};

/**
 * Start fetching the chunk for the page the visitor actually landed on as soon
 * as this module evaluates. Left to React.lazy, the request would only begin
 * when <MainContent> first renders - after the preloader - adding a full
 * network round trip to LCP. import() caches the promise, so the lazy()
 * call below reuses this request instead of issuing a second one.
 */
const landingPage = (Object.keys(loaders) as Array<keyof typeof loaders>)
  .find((page) => page !== 'about' && window.location.pathname.includes(page)) ?? 'about';
void loaders[landingPage]();

const About = lazy(loaders.about);
const Resume = lazy(loaders.resume);
const Projects = lazy(loaders.projects);
const Contact = lazy(loaders.contact);
const Quality = lazy(loaders.quality);
const NotFound = lazy(() => import('./NotFound.tsx'));

interface MainContentProps {
  isMobileView: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full min-h-[400px]">
    <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent border-solid rounded-full animate-spin"></div>
  </div>
);

const MainContent: React.FC<MainContentProps> = ({ isMobileView }) => {
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
          <Route path="/quality" element={<Quality />} />

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
              <Route path={`/${locale}/quality`} element={<Quality />} />
            </React.Fragment>
          ))}

          {/* Fallback: a real "not found" view (noindex), not a silent redirect */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default MainContent;
