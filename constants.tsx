import React from 'react';
import { Service, Skill, Project, TechCategory, Language } from './types.ts';

export const PERSONAL_INFO = {
  name: 'Emre Dursun',
  // NOTE: non-breaking space (U+00A0) between "Tricentis" and "Tosca" keeps the
  // product name from wrapping mid-name in the narrow sidebar badge.
  title: 'QA Consultant — Pega & Tricentis Tosca',
  email: 'info.emredursun@gmail.com',
  phone: '+31 6 2878 8948',
  location: 'Nieuwegein, Netherlands',
  avatar: '/images/emre-dursun-qa-consultant-400.webp',
  // Full-resolution portrait for search engines: the JSON-LD ImageObject and
  // the image sitemap point here. A descriptive filename is one of Google's
  // image signals; keep it in sync with index.html's JSON-LD.
  portrait: '/images/emre-dursun-qa-consultant.jpg',
};

/**
 * Locale keys for each service and project, by slug. Shared by the pages
 * (About.tsx, useTranslatedProject) and the build-time route metadata
 * (scripts/lib/route-meta.js), so a crawler sees the same title and
 * description the page renders. Projects without an entry are shown
 * untranslated, from the data below.
 */
export const SERVICE_TRANSLATION_KEYS: Record<string, string> = {
  'pega-platform-architecture': 'pegaPlatform',
  'tricentis-tosca-automation': 'toscaAutomation',
  'test-automation-architecture': 'testAutomation',
  'cicd-devops-integration': 'cicd',
  'api-backend-validation': 'apiBackend',
  'ai-powered-web-development': 'webDev',
  'ecommerce-sales-optimization': 'ecommerce',
  'ai-governance-architecture': 'aiGovernance',
};

export const PROJECT_TRANSLATION_KEYS: Record<string, string> = {
  'qa-smart-test-lab': 'qa-smart-test-lab',
  'playwright-testing-project': 'playwright-testing-project',
  'social-share-image-generator': 'social-share-image-generator',
  'banking-payment-automation': 'banking-payment-automation',
  'hospital-portal-testing': 'hospital-portal-testing',
  'ecommerce-sales-optimization': 'ecommerce-sales-optimization',
  'quilyn-exam-prep': 'quilyn-exam-prep',
  'pathforge-career-intelligence': 'pathforge-career-intelligence',
  'devran-ai-kit': 'devran-ai-kit',
  'deelmarkt-marketplace': 'deelmarkt-marketplace',
  'besync-trust-grade-ai': 'besync-trust-grade-ai',
  aegisqa: 'aegisqa',
};

// Status Badge Configuration
type StatusBadgeType = 'openToWork' | 'available' | 'freelance' | 'hiring' | 'busy' | 'none';

export const STATUS_BADGE = {
  enabled: true, // Set to false to hide the badge completely
  type: 'available' as StatusBadgeType, // Change this to switch badge type
  // Badge styles for each type (colors are Tailwind classes)
  styles: {
    openToWork: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      text: 'text-white',
      glow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
      icon: 'ring',
      pulse: true,
    },
    available: {
      bg: 'bg-white dark:bg-[#1f1f1f]',
      text: 'text-gray-700 dark:text-gray-200',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
      icon: 'dot',
      pulse: true,
    },
    freelance: {
      bg: 'bg-gradient-to-r from-purple-500 to-indigo-600',
      text: 'text-white',
      glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]',
      icon: 'briefcase',
      pulse: true,
    },
    hiring: {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      text: 'text-white',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      icon: 'users',
      pulse: true,
    },
    busy: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-500 dark:text-gray-400',
      glow: 'shadow-md',
      icon: 'clock',
      pulse: false,
    },
  },
} as const;

export const SOCIAL_LINKS = [
  {
    name: 'github',
    icon: <i aria-hidden="true" className="fab fa-github"></i>,
    url: 'https://github.com/emredursun',
  },
  {
    name: 'linkedin',
    icon: <i aria-hidden="true" className="fab fa-linkedin-in"></i>,
    url: 'https://www.linkedin.com/in/emre-dursun-nl/',
  },
  {
    name: 'whatsapp',
    icon: <i aria-hidden="true" className="fab fa-whatsapp"></i>,
    url: 'https://wa.me/31628788948',
  },
  {
    name: 'X',
    icon: <i aria-hidden="true" className="fab fa-x-twitter"></i>,
    url: 'https://x.com/info_emredursun',
  },
  {
    name: 'instagram',
    icon: <i aria-hidden="true" className="fab fa-instagram"></i>,
    url: 'https://www.instagram.com/trueheartfeltjourney',
  },
];

export const SERVICES: Service[] = [
  {
    icon: <i aria-hidden="true" className="fas fa-diagram-project"></i>,
    title: 'Pega Platform Architecture',
    slug: 'pega-platform-architecture',
    description:
      'Designing testable Pega applications from the case model up, certified as both Business Architect and System Architect.',
    tags: ['Pega Platform', 'CPBA', 'CPSA', 'Case Design', 'Low-Code'],
    featured: true,
    badge: 'Certified',
    expertiseLabel: 'Platform Certified',
    fullDescription:
      'Test automation on Pega stays fragile without understanding the platform from the inside, so the Certified Pega Business Architect and Certified Pega System Architect certifications came before the tooling. I work within the Sopra Steria Pega Practice (RulesMatter) on case design, data models, and the platform decisions that determine whether an application can be tested at all. Getting testability into the case design from the start is far cheaper than bolting it on after the fact.',
    keyBenefits: [
      'Case design and data modelling reviewed for testability from day one',
      'Certified Pega Business Architect (CPBA): business rules and case lifecycle',
      'Certified Pega System Architect (CPSA): data models, integrations, security',
      'Bridges business analysts and QA with a shared platform vocabulary',
      'Foundation for model-based automation in Tricentis Tosca',
    ],
    relatedProjects: ['quilyn-exam-prep'],
    certificationDate: 'June 2026',
    certificateImage: '/images/pega-certified-system-architect-cpsa.webp',
    certificateUrl:
      'https://accounts.pega.com/profile/emre.dursun/share/BPEGACPSA25V1-PEGACPSA25V1',
    certificateBadges: [
      {
        image: '/images/pega-certified-business-architect-cpba.webp',
        label: 'Certified Pega Business Architect (CPBA): June 2026',
      },
    ],
  },
  {
    icon: <i aria-hidden="true" className="fas fa-vials"></i>,
    title: 'Tricentis Tosca Test Automation',
    slug: 'tricentis-tosca-automation',
    description:
      'Model-based test automation across web, API, desktop and mobile, plus AI-driven web testing with Testim. Certified Product Consultant in both, at Advanced proficiency.',
    tags: [
      'Tricentis Tosca',
      'Model-Based Testing',
      'Test Data Service',
      'Mobile Automation',
      'API Testing',
    ],
    featured: true,
    badge: 'Certified',
    expertiseLabel: 'Advanced Proficiency',
    fullDescription:
      "I design test coverage, test data, and automation architecture using Tosca's model-based approach, scanning applications into reusable modules rather than writing brittle scripts. The Product Consultant certification came out of the full 13-course Tricentis Academy learning plan, roughly 63 hours of training, with the exam passed at 93.3%. The path covers web UI (AS1/AS2), API chains, automation beyond the browser through the Excel, PDF, Mail, UIA and WinX engines, requirements-driven TestCase design with risk weighting, stateful test data through the Test Data Service, and mobile automation on the Tricentis Mobile Agent. Combined with Pega platform knowledge, this lets testability be designed in rather than retrofitted.",
    keyBenefits: [
      'Model-based automation across web, desktop, API and mobile in one toolchain',
      'Reusable TestStepBlocks, recovery scenarios and multi-browser execution',
      'Stateful test data management across distributed test runs (TDS)',
      'Risk-weighted, requirements-driven TestCase design',
      'Mobile automation on the Tricentis Mobile Agent, including image-based cases',
      'Product Consultant certification exam passed at 93.3%',
      'Tricentis Testim Product Consultant (Advanced, September 2026): AI-driven web testing with smart locators and visual validation',
    ],
    relatedProjects: ['quilyn-exam-prep'],
    certificateId: 'C26494',
    certificationDate: 'August 2026',
    certificateImage: '/images/tricentis-tosca-product-consultant-certificate.webp',
    additionalCertificates: [
      {
        name: 'Tricentis Testim Product Consultant (Advanced)',
        certificateId: 'C26857',
        date: 'September 2026',
        validUntil: 'September 2028',
        image: '/images/tricentis-testim-product-consultant-certificate.webp',
      },
    ],
    certificateBadges: [
      {
        image: '/images/tricentis-as1-badge.webp',
        label: 'AS1 — Automating Web Application Testing',
      },
      {
        image: '/images/tricentis-as2-badge.webp',
        label: 'AS2 — Optimizing Test Automation with Centralized Test Data',
      },
      { image: '/images/tricentis-api-badge.webp', label: 'Deep Dive — Automating API Test Cases' },
      {
        image: '/images/tricentis-tds1-badge.webp',
        label: 'TDS1 — Structuring Test Cases and Test Data',
      },
      { image: '/images/tricentis-tds2-badge.webp', label: 'TDS2 — Managing Stateful Test Data' },
      {
        image: '/images/tricentis-ae1-badge.webp',
        label: 'AE1 — Automating Beyond Web Applications',
      },
      {
        image: '/images/tricentis-kpi-badge.webp',
        label: 'Continuous Testing with Efficient KPI Management',
      },
    ],
  },
  {
    icon: <i aria-hidden="true" className="fas fa-robot"></i>,
    title: 'Test Automation Architecture',
    slug: 'test-automation-architecture',
    description:
      'Building robust, scalable end-to-end automation frameworks to ensure software quality and reliability.',
    tags: ['Java', 'Selenium', 'Playwright', 'Cypress', 'Cucumber'],
    featured: true,
    badge: 'Certified',
    expertiseLabel: 'Core Expertise',
    fullDescription:
      'I specialize in designing and implementing enterprise-grade test automation frameworks that scale with your business. From UI testing with Selenium and Playwright to API validation with REST Assured, I build comprehensive solutions that catch bugs before they reach production. My frameworks follow clean architecture principles with Page Object Model, making them maintainable and easy for teams to adopt.',
    keyBenefits: [
      'Reduce regression testing time by 60%+ with parallel execution',
      'Catch critical bugs early with automated smoke and sanity tests',
      'Scale QA coverage without proportionally scaling team size',
      'Integrate seamlessly with CI/CD pipelines for continuous feedback',
      'Maintainable frameworks following industry best practices',
    ],
    relatedProjects: ['aegisqa', 'qa-smart-test-lab', 'playwright-testing-project'],
    yearsOfExperience: 5,
    certificateId: 'ISTQB-CTFL-CERTIFIED',
    certificationDate: 'June 2023',
    certificateImage: '/images/istqb-foundation-level-certificate.webp',
    certificateUrl:
      'https://app.diplomasafe.com/en-US/diploma/d6c0c305f021fcae6f7dd0cae43d65eff636e76fe',
    certificateBadges: [
      {
        image: '/images/ing-java-certificate.webp',
        label: 'Java @ ING — internal training, May 2024',
      },
    ],
  },
  {
    icon: <i aria-hidden="true" className="fas fa-sync-alt"></i>,
    title: 'CI/CD & DevOps Integration',
    slug: 'cicd-devops-integration',
    description:
      'Designing and maintaining continuous integration pipelines to accelerate deployment and reduce risk.',
    tags: ['Jenkins', 'Azure DevOps', 'Docker', 'Git', 'Maven'],
    featured: false,
    badge: 'Certified',
    expertiseLabel: 'Core Expertise',
    fullDescription:
      'I build and optimize CI/CD pipelines that transform slow, manual deployment processes into fast, reliable automated workflows. From Jenkins to Azure DevOps, I configure pipelines that run automated tests on every commit, provide instant feedback to developers, and deploy to production with confidence. My approach includes containerization with Docker, automated test execution, and comprehensive reporting.',
    keyBenefits: [
      'Accelerate deployment cycles from weeks to hours',
      'Automated testing on every code commit for instant feedback',
      'Reduce deployment failures with comprehensive validation',
      'Docker containerization for consistent environments',
      'Detailed reports and notifications for team visibility',
    ],
    relatedProjects: ['banking-payment-automation', 'qa-smart-test-lab'],
    yearsOfExperience: 4,
    certificateId: 'DOCKER-FND-CERTIFIED',
    certificationDate: '2024',
    certificateImage: '/images/docker-foundations-professional-certificate.webp',
  },
  {
    icon: <i aria-hidden="true" className="fas fa-server"></i>,
    title: 'API & Backend Validation',
    slug: 'api-backend-validation',
    description:
      'Implementing comprehensive API testing strategies and database validations for backend integrity.',
    tags: ['Rest Assured', 'Postman', 'SQL', 'JUnit', 'TestNG'],
    featured: false,
    badge: 'Core Expertise',
    fullDescription:
      'Backend quality is critical to application stability. I design comprehensive API testing strategies using REST Assured and Postman, validating requests, responses, authentication, error handling, and data integrity. My approach includes database validation with SQL to ensure data consistency, performance testing to identify bottlenecks, and security testing to protect sensitive information.',
    keyBenefits: [
      'Comprehensive API test coverage (CRUD, auth, error handling)',
      'Database validation ensuring data integrity across layers',
      'Performance and load testing to identify bottlenecks',
      'Security testing for authentication and authorization',
      'Automated contract testing between services',
    ],
    relatedProjects: ['aegisqa', 'hospital-portal-testing', 'banking-payment-automation'],
    yearsOfExperience: 5,
    certificationDate: 'April 2024',
    certificateImage: '/images/ing-api-design-certificate.webp',
  },
  {
    icon: <i aria-hidden="true" className="fas fa-laptop-code"></i>,
    title: 'AI-Powered Web Development',
    slug: 'ai-powered-web-development',
    description:
      'Leveraging advanced AI coding agents and modern architectural patterns to build professional, high-performance web applications with speed and precision.',
    tags: ['React', 'TypeScript', 'AI Engineering', 'Rapid Prototyping', 'Tailwind'],
    featured: true,
    badge: 'Innovation',
    fullDescription:
      'Modern web development requires speed without sacrificing quality. I combine AI-powered development tools with proven architectural patterns to deliver professional web applications rapidly. Using React, TypeScript, and modern tooling, I build responsive, performant applications that provide exceptional user experiences. My approach emphasizes clean code, accessibility, and SEO optimization from day one.',
    keyBenefits: [
      'Rapid prototyping and MVP development in days, not weeks',
      'Modern tech stack (React, TypeScript, Tailwind CSS)',
      'SEO-optimized and accessibility-compliant from the start',
      'Responsive design for all devices and screen sizes',
      'Production-ready code with best practices',
    ],
    relatedProjects: ['social-share-image-generator'],
    yearsOfExperience: 2,
  },
  {
    icon: <i aria-hidden="true" className="fas fa-chart-line"></i>,
    title: 'E-commerce Sales Optimization',
    slug: 'ecommerce-sales-optimization',
    description:
      'Implementing data-driven sales strategies and SEO techniques to maximize product visibility and revenue across major e-commerce platforms like Amazon and eBay.',
    tags: ['E-commerce', 'SEO', 'Analytics', 'Strategy', 'Management'],
    featured: false,
    badge: 'Strategic Growth',
    fullDescription:
      'E-commerce success requires more than just listing products—it demands strategic optimization and continuous improvement. I leverage advanced SEO techniques, competitive analysis, and data-driven strategies to maximize product visibility and conversion rates on major platforms like Amazon, eBay, and AutoDoc. My approach includes keyword optimization, sponsored advertising campaigns, inventory management, and pricing strategies that drive revenue growth.',
    keyBenefits: [
      'Increase organic visibility through strategic SEO optimization',
      'Data-driven pricing and inventory strategies',
      'High-ROI sponsored advertising campaigns',
      'Multi-platform management (Amazon, eBay, AutoDoc)',
      'Analytics and reporting for informed decision-making',
    ],
    relatedProjects: ['ecommerce-sales-optimization'],
    yearsOfExperience: 4,
  },
  {
    icon: <i aria-hidden="true" className="fas fa-brain"></i>,
    title: 'AI Governance Architecture',
    slug: 'ai-governance-architecture',
    description:
      'Architecting Trust-Grade AI platforms with multi-agent orchestration, cognitive intelligence layers, and Anti-Dopamine Engineering. Currently developing BeSync — a Social Synchronization Protocol.',
    tags: [
      'AI GOVERNANCE',
      'Python',
      'Antigravity-IDE',
      'SOTA Agent Architecture',
      'Core Intelligence System',
      'Cognitive Intelligence',
      'Trust-Grade AI Architecture',
      'Multi-Agent Orchestration',
    ],
    featured: true,
    badge: 'Certified',
    expertiseLabel: 'Trust-Grade AI',
    fullDescription:
      'I design Trust-Grade AI platforms with multi-agent orchestration, cognitive intelligence layers, and regulatory compliance frameworks (EU AI Act, IEEE EAD, ISO 42001). My approach prioritizes user trust and safety over optimization metrics. My flagship project BeSync is a Social Synchronization Protocol featuring The Focus Pulse (bioluminescent attention visualization), Anti-Dopamine Engineering, and Privacy-First design. The platform is powered by 5 specialized agents (Persona, Matchmaking, Safety, UX, Growth + Alignment Engine), 3 cognitive layers (Intelligence, Audit, Emotion), and full compliance with EU AI Act, GDPR, OECD, IEEE EAD, and ISO/IEC 42001.',
    keyBenefits: [
      '5 Specialized Agents (Persona, Matchmaking, Safety, UX, Growth + Alignment Engine)',
      '3 Cognitive Layers (Intelligence, Audit, Emotion)',
      '5 Regulatory Standards (EU AI Act, GDPR, OECD, IEEE EAD, ISO/IEC 42001)',
      'Operating Constraints: Trust > Optimization, Safety > Growth, Explainability > Performance',
      '9 Failure Modes + 5 Recovery Procedures',
      'L1-L5 Ethics Escalation Path',
      '✓ Certificate ID: BESYNC-TGAI-20260112-001',
    ],
    relatedProjects: ['besync-trust-grade-ai'],
    yearsOfExperience: 1,
    certificateId: 'BESYNC-TGAI-20260112-001',
    certificationDate: 'January 2026',
    certificateImage: '/images/trust-grade-certificate.webp',
  },
];

// Ordered by current career priority (Pega/Tosca focus first), not by level.
export const SKILLS: Skill[] = [
  { name: 'Tricentis Tosca (Model-Based)', level: 85 },
  { name: 'Pega Platform (CPBA & CPSA)', level: 85 },
  { name: 'Test Automation', level: 95 },
  { name: 'Java & Ecosystem', level: 90 },
  { name: 'Selenium & Cucumber', level: 90 },
  { name: 'API Testing (Rest Assured)', level: 85 },
  { name: 'Playwright & Cypress (TS)', level: 85 },
  { name: 'AI Governance', level: 90 },
  { name: 'CI/CD (Jenkins & Azure)', level: 80 },
  { name: 'SQL & Databases', level: 75 },
  { name: 'Docker & Containerization', level: 75 },
];

export const LANGUAGES: Language[] = [
  {
    name: 'Turkish',
    level: 'Native',
    code: 'TR',
    percentage: 100,
    greeting: 'Merhaba',
  },
  {
    name: 'English',
    level: 'Professional (C1)',
    code: 'EN',
    percentage: 90,
    greeting: 'Hello',
  },
  {
    name: 'Dutch',
    level: 'Intermediate (B2)',
    code: 'NL',
    percentage: 70,
    greeting: 'Hallo',
  },
  {
    name: 'Ukrainian',
    level: 'Beginner (A1)',
    code: 'UA',
    percentage: 20,
    greeting: 'Привіт',
  },
];

export const TECH_STACK: TechCategory[] = [
  {
    title: 'Languages & Core Tech',
    technologies: [
      {
        name: 'Java',
        icon: <i aria-hidden="true" className="fab fa-java text-3xl text-red-500"></i>,
      },
      {
        name: 'TypeScript',
        icon: <i aria-hidden="true" className="fab fa-js text-3xl text-blue-500"></i>,
      },
      {
        name: 'JavaScript',
        icon: <i aria-hidden="true" className="fab fa-square-js text-3xl text-yellow-400"></i>,
      },
      {
        name: 'Python',
        icon: <i aria-hidden="true" className="fab fa-python text-3xl text-blue-400"></i>,
      },
      {
        name: 'Spring Boot',
        icon: <i aria-hidden="true" className="fas fa-leaf text-3xl text-green-500"></i>,
      },
      {
        name: 'SQL',
        icon: <i aria-hidden="true" className="fas fa-database text-3xl text-blue-400"></i>,
      },
      {
        name: 'HTML',
        icon: <i aria-hidden="true" className="fab fa-html5 text-3xl text-orange-600"></i>,
      },
      {
        name: 'CSS',
        icon: <i aria-hidden="true" className="fab fa-css3-alt text-3xl text-blue-600"></i>,
      },
    ],
  },
  {
    title: 'Test Automation & Frameworks',
    technologies: [
      {
        name: 'Tricentis Tosca',
        icon: <i aria-hidden="true" className="fas fa-cubes text-3xl text-blue-600"></i>,
      },
      {
        name: 'Tricentis Testim',
        icon: (
          <i aria-hidden="true" className="fas fa-wand-magic-sparkles text-3xl text-teal-500"></i>
        ),
      },
      {
        name: 'Pega Platform',
        icon: (
          <i aria-hidden="true" className="fas fa-diagram-project text-3xl text-indigo-500"></i>
        ),
      },
      {
        name: 'Playwright',
        icon: <i aria-hidden="true" className="fas fa-masks-theater text-3xl text-green-500"></i>,
      },
      {
        name: 'Cypress',
        icon: <i aria-hidden="true" className="fas fa-eye text-3xl text-gray-500"></i>,
      },
      {
        name: 'JUnit',
        icon: <i aria-hidden="true" className="fas fa-vial text-3xl text-red-500"></i>,
      },
      {
        name: 'TestNG',
        icon: <i aria-hidden="true" className="fas fa-vials text-3xl text-blue-500"></i>,
      },
      {
        name: 'Selenium',
        icon: <i aria-hidden="true" className="fas fa-check-circle text-3xl text-green-500"></i>,
      },
      {
        name: 'REST Assured',
        icon: <i aria-hidden="true" className="fas fa-globe text-3xl text-green-600"></i>,
      },
      {
        name: 'Cucumber',
        icon: <i aria-hidden="true" className="fas fa-leaf text-3xl text-green-500"></i>,
      },
      {
        name: 'Postman',
        icon: <i aria-hidden="true" className="fas fa-rocket text-3xl text-orange-500"></i>,
      },
      {
        name: 'Swagger',
        icon: <i aria-hidden="true" className="fas fa-file-code text-3xl text-green-600"></i>,
      },
      {
        name: 'Appium',
        icon: <i aria-hidden="true" className="fas fa-mobile-screen text-3xl text-purple-500"></i>,
      },
    ],
  },
  {
    title: 'CI/CD & DevOps Tools',
    technologies: [
      {
        name: 'Azure DevOps',
        icon: <i aria-hidden="true" className="fab fa-microsoft text-3xl text-blue-600"></i>,
      },
      {
        name: 'Jenkins',
        icon: (
          <i
            aria-hidden="true"
            className="fab fa-jenkins text-3xl text-gray-700 dark:text-white"
          ></i>
        ),
      },
      {
        name: 'Docker',
        icon: <i aria-hidden="true" className="fab fa-docker text-3xl text-blue-500"></i>,
      },
      {
        name: 'Git',
        icon: <i aria-hidden="true" className="fab fa-git-alt text-3xl text-orange-600"></i>,
      },
      {
        name: 'Maven',
        icon: <i aria-hidden="true" className="fas fa-feather-alt text-3xl text-red-600"></i>,
      },
    ],
  },
];

export const PROJECTS: Project[] = [
  {
    title: 'Quilyn — Certification Exam Prep',
    slug: 'quilyn-exam-prep',
    category: 'Open Source',
    image: '/images/quilyn-thumbnail.webp',
    description:
      'A free, offline-capable study app for IT certification exams — Pega (PCBA, PCSA) and Tricentis Tosca (AS1, AS2, API). Structured study guides, practice quizzes, timed mock exams, and spaced-repetition review. Built with zero dependencies and installable as a PWA.',
    detailedDescription:
      'Quilyn is a dependency-free study platform I built to prepare for Pega and Tricentis Tosca certifications, then open-sourced so other learners revising the same exams can benefit. It spans 5 learning tracks and 100+ modules, each with concept cards, worked examples, exam-pitfall warnings, and a practice quiz. The app is written in vanilla JavaScript with a reactive ES6 Proxy state store, a hash-based SPA router, and content authored entirely as JSON — new modules render automatically with no code changes. It ships as an installable PWA with a service worker for full offline use, a Leitner 5-box spaced-repetition (SRS) engine for flashcard review, full timed mock exams with per-domain breakdowns, global search across every module, keyboard-driven quizzes, a study-activity heatmap, and JSON progress backup/restore across devices. No account, no tracking — all progress stays in the browser.',
    technologies: [
      'Vanilla JavaScript',
      'ES6 Proxy State',
      'PWA / Service Worker',
      'HTML5',
      'CSS3',
      'JSON Content Model',
      'No External Dependencies',
    ],
    url: 'https://emredursun.github.io/quilyn/',
    github: 'https://github.com/emredursun/quilyn',
    hackernoon_link: 'https://github.com/emredursun/quilyn',
    year: 2026,
    role: 'Creator & Sole Developer',
    team: 'Solo Project',
    metrics: [
      '5 Tracks · 100+ Modules',
      'Spaced-Repetition (Leitner 5-Box) Review',
      'Timed Mock Exams with Domain Breakdown',
      'Offline-First PWA · Zero Dependencies',
    ],
    challenge:
      'Certification candidates juggle scattered PDFs, videos, and quizzes with no unified, offline way to study, self-test, and track retention — and most exam-prep tools sit behind paywalls or accounts.',
    solution:
      'Designed a single offline-first app that unifies structured study guides, practice quizzes, full mock exams, and spaced-repetition review behind one clean interface. Content lives in plain JSON so the material scales without touching code, and a service worker makes the entire app usable offline after the first visit — free, account-free, and privacy-preserving.',
    features: [
      {
        title: 'Study Guides & Practice Quizzes',
        description:
          'Concept cards, analogies, worked examples, and exam-pitfall warnings per module, plus single/multi-select quizzes with instant feedback, hints, rationales, and keyboard shortcuts.',
        icon: <i aria-hidden="true" className="fas fa-book-open text-blue-400"></i>,
      },
      {
        title: 'Timed Mock Exams',
        description:
          'Full 90-minute exams at the real 65% pass mark with a live timer and per-domain score breakdown to pinpoint weak areas.',
        icon: <i aria-hidden="true" className="fas fa-stopwatch text-purple-400"></i>,
      },
      {
        title: 'Spaced-Repetition Review',
        description:
          "A Leitner 5-box SRS engine with confidence calibration surfaces the cards you're most likely to forget, so revision time compounds.",
        icon: <i aria-hidden="true" className="fas fa-brain text-pink-400"></i>,
      },
      {
        title: 'Offline-First PWA',
        description:
          'Installable app with a service worker for full offline use, global Ctrl/⌘K search, dark/light themes, a study heatmap, and JSON progress backup/restore across devices.',
        icon: <i aria-hidden="true" className="fas fa-wifi text-green-400"></i>,
      },
    ],
    tags: ['Open Source', 'PWA', 'EdTech', 'Vanilla JS', 'Live'],
  },
  {
    title: 'PathForge — Career Intelligence Platform',
    slug: 'pathforge-career-intelligence',
    category: 'AI Architecture',
    image: '/images/pathforge-thumbnail.webp',
    description:
      "An AI-powered career intelligence platform that decodes a professional's “Career DNA” — matching skills, trajectory, and ambitions to real opportunities. Built with Next.js 15, FastAPI, and a pgvector semantic engine powered by Claude and Voyage AI.",
    detailedDescription:
      "PathForge democratizes enterprise-grade career intelligence — Skills Graphs, Market Signals, and Predictive Analytics — for every professional, not just those inside large corporations. It is a full-stack, AI-native product: a Next.js 15 + TailwindCSS v4 web experience backed by a FastAPI (Python 3.12) service that orchestrates LLM pipelines over Claude Sonnet 4 and Gemini Flash, with Voyage AI v3 embeddings stored in PostgreSQL 16 + pgvector for semantic matching. Redis handles JWT blacklisting and an ARQ task queue, authentication is stateless via access/refresh JWTs, and the whole system ships through GitHub Actions quality gates to Vercel (web) and Railway (API). The result is a career platform where opportunities are built around the person — 'not just another job board.'",
    technologies: [
      'Next.js 15',
      'FastAPI (Python 3.12)',
      'PostgreSQL + pgvector',
      'Claude Sonnet 4',
      'Voyage AI Embeddings',
      'Redis',
      'TailwindCSS v4',
      'Docker',
    ],
    url: 'https://pathforge.eu',
    github: 'https://github.com/pathforge-labs/PathForge',
    hackernoon_link: 'https://pathforge.eu',
    year: 2026,
    role: 'Founder & Full-Stack AI Engineer',
    team: 'Solo Project',
    metrics: [
      'Semantic Matching (pgvector + Voyage AI)',
      'LLM Pipelines (Claude Sonnet 4 · Gemini Flash)',
      'Next.js 15 + FastAPI Full-Stack',
      'CI/CD to Vercel + Railway',
    ],
    challenge:
      'Enterprise career intelligence — skills graphs, market signals, predictive analytics — has always been locked inside large organizations, while everyone else is left with keyword-matching job boards that ignore trajectory and ambition.',
    solution:
      "Built an AI-native platform that models each professional's 'Career DNA' and matches it against live market signals using vector search. A FastAPI backend orchestrates multi-model LLM pipelines and Voyage AI embeddings over pgvector, while a Next.js 15 frontend delivers the experience — all deployed through automated CI/CD quality gates.",
    features: [
      {
        title: 'Career DNA™ Engine',
        description:
          'Models skills, trajectory, and ambitions as a semantic profile, then matches it to opportunities via pgvector similarity search.',
        icon: <i aria-hidden="true" className="fas fa-dna text-cyan-400"></i>,
      },
      {
        title: 'Multi-Model AI Pipelines',
        description:
          'FastAPI orchestrates Claude Sonnet 4 and Gemini Flash with Voyage AI v3 embeddings for analysis, matching, and personalized strategy.',
        icon: <i aria-hidden="true" className="fas fa-brain text-purple-400"></i>,
      },
      {
        title: 'Production Architecture',
        description:
          'Next.js 15 + TailwindCSS v4 frontend, PostgreSQL 16 + pgvector, Redis queue/cache, and stateless JWT auth.',
        icon: <i aria-hidden="true" className="fas fa-server text-blue-400"></i>,
      },
      {
        title: 'Automated Delivery',
        description:
          'GitHub Actions quality gates ship the web app to Vercel and the API to Railway on every merge.',
        icon: <i aria-hidden="true" className="fas fa-rocket text-green-400"></i>,
      },
    ],
    tags: ['AI', 'Full-Stack', 'Vector Search', 'SaaS', 'Live'],
  },
  {
    title: 'Devran AI Kit — Trust-Grade AI Framework',
    slug: 'devran-ai-kit',
    category: 'Open Source',
    image: '/images/devran-kit-thumbnail.webp',
    description:
      'An open-source, zero-dependency Trust-Grade AI development framework that turns any AI-powered IDE into a virtual engineering team — 26 agents, 44 skills, 25 workflows, and 15 governance rules behind one command.',
    detailedDescription:
      'Devran AI Kit is a zero-dependency runtime engine (not a prompt collection) that brings trust-grade governance to AI-assisted software development. Its 43-module core includes a workflow state machine, circuit breaker, error budget, and self-healing CI, and it enforces a 7-phase SDLC through Scope Filters, Ethics Gates, Rigor Profiles (strict/standard/minimal), and Failure Templates. The intelligent agent system routes work across 26 specialized agents with reputation scoring, domain-aware routing, and an Instinct System (confidence-scored pattern memory) loaded on demand via keyword matching. Greenfield and brownfield onboarding workflows generate master documentation, market research, and architecture diagrams. Released under MIT with 1,037 passing tests and zero external dependencies, it installs into VS Code, Cursor, and other AI IDEs with a single command.',
    technologies: [
      'JavaScript',
      'Python',
      'Node.js',
      'Zero Dependencies',
      'MIT License',
      'Claude Code',
      'Cursor',
      'GitHub Copilot',
    ],
    url: 'https://devran-ai.github.io/kit/',
    github: 'https://github.com/devran-ai/kit',
    hackernoon_link: 'https://github.com/devran-ai/kit',
    year: 2026,
    role: 'Creator & Maintainer',
    team: 'Solo Project',
    metrics: [
      '26 Agents · 44 Skills · 25 Workflows',
      '1,037 Tests Passing',
      'Zero External Dependencies',
      '7-Phase Governed SDLC',
    ],
    challenge:
      "AI coding assistants are powerful but ungoverned — inconsistent quality, no accountability, and 'prompt collections' that break the moment a project grows beyond a toy example.",
    solution:
      'Engineered a zero-dependency runtime with a real workflow state machine, circuit breakers, and error budgets, wrapped in a 7-phase governed SDLC. Specialized agents with reputation scoring and confidence-scored instinct memory route work intelligently, while strict/standard/minimal rigor profiles keep output trust-grade at any project scale.',
    features: [
      {
        title: 'Zero-Dependency Runtime',
        description:
          'A 43-module engine with a workflow state machine, circuit breaker, error budget, and self-healing CI — no external packages.',
        icon: <i aria-hidden="true" className="fas fa-microchip text-purple-500"></i>,
      },
      {
        title: 'Trust-Grade Governance',
        description:
          '15 governance rules enforced through a 7-phase SDLC with Scope Filters, Ethics Gates, and strict/standard/minimal Rigor Profiles.',
        icon: <i aria-hidden="true" className="fas fa-shield-halved text-indigo-500"></i>,
      },
      {
        title: 'Intelligent Agent System',
        description:
          '26 specialized agents with reputation scoring, domain-aware routing, and a confidence-scored Instinct System for pattern memory.',
        icon: <i aria-hidden="true" className="fas fa-people-group text-violet-500"></i>,
      },
      {
        title: 'One-Command Onboarding',
        description:
          'Greenfield/brownfield workflows scaffold master docs, market research, and architecture diagrams; installs into any AI IDE instantly.',
        icon: <i aria-hidden="true" className="fas fa-terminal text-blue-500"></i>,
      },
    ],
    tags: ['Open Source', 'AI Agents', 'Developer Tools', 'Zero Dependencies', 'Live'],
  },
  {
    title: 'DeelMarkt — Trust-First P2P Marketplace',
    slug: 'deelmarkt-marketplace',
    category: 'E-commerce',
    image: '/images/deelmarkt-thumbnail.webp',
    description:
      'A trust-first Dutch peer-to-peer marketplace — a modern alternative to Marktplaats — with escrow payments, verified users, and secure shipping. Built with Flutter, Supabase, and Mollie, with GDPR/DSA/PSD2 compliance by design.',
    detailedDescription:
      "DeelMarkt ('Deel wat je hebt' — share what you have) is a trust-first peer-to-peer marketplace for the Netherlands, positioned as a modern, safer alternative to Marktplaats. The product is built around trust primitives: Mollie-powered escrow payments, verified user identities, and secure shipping, so buyers and sellers can transact with confidence. It is a cross-platform Flutter application backed by Supabase (PostgreSQL) with a TypeScript services layer, engineered from the ground up for European regulatory compliance — GDPR, the Digital Services Act (DSA), and PSD2 — alongside a dedicated design system and an 8-epic delivery roadmap. Currently in active development ahead of public launch.",
    technologies: ['Flutter', 'Dart', 'Supabase', 'PostgreSQL', 'Mollie Payments', 'TypeScript'],
    url: 'https://deelmarkt.com',
    hackernoon_link: 'https://deelmarkt.com',
    year: 2026,
    role: 'Founder & Lead Developer',
    team: 'Startup Project',
    metrics: [
      'Escrow Payments (Mollie)',
      'Verified Users & Secure Shipping',
      'GDPR · DSA · PSD2 Compliant by Design',
      'Cross-Platform Flutter App',
    ],
    challenge:
      'Established classifieds platforms leave buyers and sellers exposed — no escrow, weak verification, and scams that erode trust in peer-to-peer trade.',
    solution:
      'Designed a trust-first marketplace where escrow payments, identity verification, and secure shipping are built in, not bolted on. A cross-platform Flutter app on a Supabase backend delivers a fast, consistent experience, and the architecture bakes in GDPR, DSA, and PSD2 compliance from day one.',
    features: [
      {
        title: 'Escrow-Protected Payments',
        description:
          'Mollie-powered escrow holds funds until delivery is confirmed, removing the biggest risk in peer-to-peer transactions.',
        icon: <i aria-hidden="true" className="fas fa-lock text-orange-500"></i>,
      },
      {
        title: 'Verified, Trusted Users',
        description:
          'Identity verification and trust signals keep the marketplace safe and reduce fraud on both sides of a trade.',
        icon: <i aria-hidden="true" className="fas fa-user-check text-green-500"></i>,
      },
      {
        title: 'Compliance by Design',
        description:
          'Architected for European regulation — GDPR, Digital Services Act (DSA), and PSD2 — from the first line of code.',
        icon: <i aria-hidden="true" className="fas fa-scale-balanced text-blue-500"></i>,
      },
      {
        title: 'Cross-Platform Flutter App',
        description:
          'A single Flutter codebase on a Supabase (PostgreSQL) backend delivers a consistent, fast experience across devices.',
        icon: <i aria-hidden="true" className="fas fa-mobile-screen text-purple-500"></i>,
      },
    ],
    tags: ['Marketplace', 'Flutter', 'FinTech', 'Startup', 'In Development'],
  },
  {
    title: 'QASmartTestLab',
    slug: 'qa-smart-test-lab',
    category: 'Test Automation',
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    // Every claim below can be checked in the linked repository.
    description:
      'A Java 17 test automation framework on Selenium 4 and Cucumber 7: thread-safe parallel scenarios, local or remote Grid runs, and HTML, JSON and JUnit reports from every run.',
    detailedDescription:
      'QASmartTestLab is a Cucumber (JVM) framework built on Selenium 4 and JUnit 5. Cucumber runs scenarios in parallel with a dynamic strategy, and each thread gets its own WebDriver through a ThreadLocal factory, so scenarios never share a browser. The same suite runs on a local Chrome (drivers managed by WebDriverManager) or on a remote Selenium Grid or Selenoid, chosen at runtime with a system property or environment variable. Page objects, step definitions, runners and support classes are kept apart; tags select what runs, and every run writes HTML, JSON and JUnit XML reports plus a console summary. Feature suites cover UI login and incoming and outgoing payment messages with XML validation fixtures.',
    technologies: [
      'Java 17',
      'Selenium 4',
      'Cucumber 7',
      'JUnit 5',
      'Maven',
      'WebDriverManager',
      'Selenium Grid',
    ],
    url: '#',
    github: 'https://github.com/emredursun/QASmartTestLab',
    metrics: [
      'Parallel Scenarios · Thread-Safe WebDriver',
      'Local or Remote Grid/Selenoid Runs',
      '4 Report Formats per Run',
      'Page Object Model · Tag-Based Runs',
    ],
    // Enhanced immersive view data
    gallery: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    ],
    duration: '4 months',
    role: 'Lead Automation Engineer',
    team: 'Solo Project',
    year: 2024,
    challenge:
      'Test automation teams often struggle with framework complexity, poor maintainability, and lack of standardization across projects. Many frameworks become technical debt, difficult to understand for new team members, and hard to scale as the application grows.',
    solution:
      'Built QASmartTestLab around a small set of clear rules: page objects for the UI, step definitions that only orchestrate, one WebDriver per thread, and configuration at runtime instead of in code. The suite switches between a local browser and a remote Grid with a single property, runs scenarios in parallel safely, and selects what to run with tags.',
    features: [
      {
        title: 'Payment Flow Features',
        description:
          'Cucumber suites for UI login and for incoming and outgoing payment messages, with XML validation fixtures per scenario.',
        icon: <i aria-hidden="true" className="fas fa-layer-group text-yellow-400"></i>,
      },
      {
        title: 'Runtime Configuration',
        description:
          'Local Chrome or a remote Selenium Grid/Selenoid, chosen with a system property or environment variable; WebDriverManager handles the drivers.',
        icon: <i aria-hidden="true" className="fas fa-cogs text-blue-400"></i>,
      },
      {
        title: 'Clean Architecture',
        description:
          'Page objects, step definitions, runners and support classes kept apart, each with a single responsibility.',
        icon: <i aria-hidden="true" className="fas fa-sitemap text-green-400"></i>,
      },
      {
        title: 'Parallel Execution',
        description:
          'Cucumber runs scenarios in parallel (dynamic strategy) with a ThreadLocal WebDriver per thread, so scenarios never share a browser.',
        icon: <i aria-hidden="true" className="fas fa-bolt text-purple-400"></i>,
      },
    ],
    results: [
      {
        metric: 'Report formats',
        value: '4',
        description: 'HTML, JSON, JUnit XML and a console summary from every run',
      },
      {
        metric: 'Execution targets',
        value: '2',
        description:
          'Local Chrome or a remote Selenium Grid/Selenoid, switched without code changes',
      },
      {
        metric: 'Parallelism',
        value: 'Per scenario',
        description: 'A thread-safe WebDriver lets Cucumber run scenarios concurrently',
      },
    ],
    tags: ['Framework', 'Best Practices', 'Open Source', 'Java', 'Selenium'],
  },
  {
    title: 'Playwright Testing Suite',
    slug: 'playwright-testing-project',
    category: 'Test Automation',
    image:
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    description:
      'Comprehensive Playwright test automation suite demonstrating UI, API, and visual testing capabilities with Page Object Model, cross-browser testing, and advanced debugging.',
    detailedDescription:
      "A comprehensive Playwright test automation suite developed to master modern testing practices. It features 3-layer test coverage including End-to-End UI testing, RESTful API validation, and Visual Regression testing. Built with TypeScript, the framework implements the Page Object Model (POM) pattern for maintainability and includes advanced capabilities like cookie-based authentication handling, dynamic configuration via environment variables, and parallel test execution. It leverages Playwright's distinct features such as the Trace Viewer for debugging, multi-browser support (Chromium, Firefox, WebKit), and multiple reporting options.",
    technologies: [
      'Playwright',
      'TypeScript',
      'Node.js',
      'REST APIs',
      'Visual Testing',
      'GitHub Actions',
    ],
    url: '#',
    github: 'https://github.com/emredursun/playwright-testing-project',
    hackernoon_link: 'https://github.com/emredursun/playwright-testing-project',
    metrics: [
      '3-Layer Coverage (UI, API, Visual)',
      'Cross-Browser (Chromium, Firefox, WebKit)',
      'Parallel Execution Support',
      'Advanced Debugging (Trace Viewer)',
    ],
    features: [
      {
        title: 'Comprehensive Coverage',
        description:
          'Implements UI End-to-End tests, RESTful API integration, and Pixel-perfect Visual Regression testing.',
        icon: <i aria-hidden="true" className="fas fa-layer-group text-blue-500"></i>,
      },
      {
        title: 'Modern Framework Design',
        description:
          'Built on the Page Object Model (POM) pattern with flexible environment configuration and locator strategies.',
        icon: <i aria-hidden="true" className="fas fa-cubes text-purple-500"></i>,
      },
      {
        title: 'Advanced Capabilities',
        description:
          'Features cookie-based authentication, screenshot/video recording, and global parallel test execution.',
        icon: <i aria-hidden="true" className="fas fa-cogs text-green-500"></i>,
      },
      {
        title: 'Cross-Browser & Debugging',
        description:
          'Validates across Chromium, Firefox, and WebKit with integrated Trace Viewer for deep failure analysis.',
        icon: <i aria-hidden="true" className="fas fa-bug text-red-500"></i>,
      },
    ],
  },
  {
    title: 'Social Share Image Generator',
    slug: 'social-share-image-generator',
    category: 'Open Source',
    image: '/images/social-generator-thumbnail.webp',
    description:
      'Professional social media image generator with intelligent adaptive layouts. Features 5 premium templates, 6 visual effects, and instant presets for LinkedIn, Twitter, Instagram, YouTube & Stories.',
    detailedDescription:
      "A professional social media image generator featuring an Intelligent Adaptive Layout System that automatically adjusts designs to any dimension (Portrait, Landscape, Square). The core 'LayoutCalculator' engine dynamically positions elements, scales typography, and optimizes spacing based on canvas size. It offers 6 professional layout styles (Auto, Centered, Split, Minimal, Bold, Elegant) and 6 visual background effects. Built entirely with Vanilla JavaScript and the HTML5 Canvas API, it requires no external frameworks or dependencies, ensuring high performance and instant client-side rendering. Users can export high-quality PNGs or copy directly to the clipboard for immediate use on platforms like LinkedIn, Twitter, Instagram, and YouTube.",
    technologies: ['Canvas API', 'Vanilla JavaScript', 'HTML5', 'CSS3', 'No External Dependencies'],
    url: 'https://emredursun.github.io/social-share-image-generator/',
    github: 'https://github.com/emredursun/social-share-image-generator',
    hackernoon_link: 'https://github.com/emredursun/social-share-image-generator',
    metrics: [
      '6 Adaptive Layouts',
      '6 Visual Background Effects',
      'Smart Text Scaling Logic',
      'Zero Dependencies (Vanilla JS)',
    ],
    features: [
      {
        title: 'Intelligent Layout Engine',
        description:
          'Auto-adjusts content layout based on dimensions (Landscape, Portrait, Square) with smart element positioning.',
        icon: <i aria-hidden="true" className="fas fa-magic text-purple-500"></i>,
      },
      {
        title: 'Multi-Platform Presets',
        description:
          'One-click presets for LinkedIn, Twitter/X, Instagram, YouTube, and Stories, plus custom dimensions (100px-5000px).',
        icon: <i aria-hidden="true" className="fas fa-expand text-blue-500"></i>,
      },
      {
        title: 'Visual Customization',
        description:
          '6 professional templates and 6 dynamic background effects (Pattern, Circles, Grid, Waves, Dots) with custom color control.',
        icon: <i aria-hidden="true" className="fas fa-palette text-pink-500"></i>,
      },
      {
        title: 'High-Performance Export',
        description:
          'Instant client-side generation using Canvas API with options for High/Ultra quality PNG export and clipboard copy.',
        icon: <i aria-hidden="true" className="fas fa-download text-green-500"></i>,
      },
    ],
  },
  {
    title: 'TIP Test Center (Dovetail - ING)',
    slug: 'banking-payment-automation',
    category: 'Test Automation',
    image:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    description:
      'TTC is a specialized framework that automates transactional testing in the Dovetail system, a Fiserv payment platform that handles real-time payment processing.',
    detailedDescription:
      'TTC is a specialized framework that automates transactional testing in the Dovetail system, a Fiserv payment platform that handles real-time payment processing. The framework manages end-to-end transactional test automation for Dovetail payments and integrates with the ING Test Center (ITC) execution engine—a web application with a GUI for visualizing, executing, and managing test cases. It functions as a library using Selenium/Cucumber with regression test scenarios that run daily in the DEV5 test environment, verifying transaction accuracy across both incoming and outgoing processes. As an Automation Test Engineer, I designed and maintained these automated end-to-end regression tests, ensuring transaction accuracy across international branches.',
    hackernoon_link:
      'https://www.fintechfutures.com/saas-paas/fiserv-buys-payments-software-vendor-dovetail',
    technologies: [
      'Java',
      'Selenium',
      'Cucumber',
      'Azure DevOps',
      'SQL',
      'Maven',
      'ITC',
      'JUnit',
      'XML Validation',
    ],
    url: '#',
    metrics: [
      '850 Automated Payment Scenarios',
      'Full Run + Report: Days → 3–5 Hours',
      'Multi-Country: BE, IT, HU, SK',
      'Integrated with ING Test Center (ITC)',
      'Daily Regression in DEV5 Env',
    ],
    challenge:
      "ING's TIP Test Center ran around 400 end-to-end payment scenarios for the Dovetail platform on a legacy setup. A complete regression run, with its reporting, took several days, which slowed down every Dovetail release and every country rollout.",
    solution:
      'Onboarded the 400 legacy scenarios onto the new TTC framework (Selenium, Cucumber and Java on the ING Test Center execution engine) and added 450 new ones, including FFV validations for EPP and non-EPP payment flows per country. Optimized the framework and its test data so the full suite runs daily in DEV5.',
    results: [
      {
        metric: 'Automated scenarios',
        value: '850',
        description:
          '400 legacy scenarios migrated to the new framework, plus 450 new ones onboarded',
      },
      {
        metric: 'Full run and reporting',
        value: '3–5 h',
        description: 'Down from several days for a complete regression run and its report',
      },
      {
        metric: 'Country rollouts',
        value: '4',
        description: 'Belgium, Italy, Hungary and Slovakia covered by country-specific validations',
      },
    ],
    features: [
      {
        title: 'Test Validation Development',
        description:
          'Implementing and maintaining FFV test validations for EPP and non-EPP payment flows, including country-specific implementations.',
        icon: <i aria-hidden="true" className="fas fa-code-branch text-blue-400"></i>,
      },
      {
        title: 'Test Case Management',
        description:
          'Onboarding new test cases and adapting test coverage for implementations in different countries (BE, IT, HU, SK).',
        icon: <i aria-hidden="true" className="fas fa-tasks text-green-400"></i>,
      },
      {
        title: 'Regression Testing',
        description:
          'Executing and verifying daily end-to-end test streams and supporting test execution for new Dovetail releases.',
        icon: <i aria-hidden="true" className="fas fa-robot text-purple-400"></i>,
      },
      {
        title: 'Stakeholder Support',
        description:
          'Providing technical guidance to development teams, feature squads, and other stakeholders during the onboarding process.',
        icon: <i aria-hidden="true" className="fas fa-users text-orange-400"></i>,
      },
    ],
  },
  {
    title: 'Hospital Portal Testing - Medunna',
    slug: 'hospital-portal-testing',
    category: 'Test Automation',
    image:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    description:
      'Led the quality assurance strategy for a comprehensive hospital management portal, ensuring data privacy and system reliability across UI, API, and DB layers.',
    detailedDescription:
      'This project was the final capstone of a 1-year Full Stack Automation Engineering course, completed over 6 months with a team of 5 developers and 3 testers. We developed a comprehensive hospital portal handling 30+ user stories and 103+ test cases covering login, authorization, registration, appointments, and patient/staff management. My role involved developing automated scripts (Selenium/Java/Cucumber), executing test cases, reporting defects, and collaborating with developers in an Agile environment. We ensured full functional and regression testing for every sprint, validating APIs with Postman/Rest Assured and managing data with Apache POI.',
    technologies: [
      'Selenium',
      'Java',
      'Cucumber',
      'JUnit',
      'Postman',
      'Rest Assured',
      'Maven',
      'Jenkins',
      'Apache POI',
      'SQL',
    ],
    url: '#',
    metrics: [
      'Duration: 6 Months',
      'Team: 5 Devs, 3 Testers',
      '30 Stories, 100+ Test Cases',
      'Full Agile Lifecycle',
      'UI, API & DB Validation',
    ],
    features: [
      {
        title: 'Test Automation',
        description:
          'Implemented a hybrid framework using Selenium WebDriver, Java, JUnit, and Cucumber BDD for readable and reusable test scenarios.',
        icon: <i aria-hidden="true" className="fas fa-robot text-blue-400"></i>,
      },
      {
        title: 'API Testing',
        description:
          'Performed comprehensive API validation using Postman and Rest Assured Library to ensure backend reliability.',
        icon: <i aria-hidden="true" className="fas fa-network-wired text-green-400"></i>,
      },
      {
        title: 'Data Management',
        description:
          'Utilized Apache POI and Scenario Outlines to handle multiple test data sets efficiently.',
        icon: <i aria-hidden="true" className="fas fa-database text-yellow-400"></i>,
      },
      {
        title: 'CI/CD Integration',
        description:
          'Integrated the automation framework with Jenkins and Maven for continuous integration and deployment.',
        icon: <i aria-hidden="true" className="fas fa-sync text-purple-400"></i>,
      },
    ],
  },
  {
    title: 'E-commerce Sales Optimization',
    slug: 'ecommerce-sales-optimization',
    category: 'E-commerce',
    image:
      'https://www.servcorp.co.uk/media/34561/e-commerce-img.jpeg?format=webp&quality=70&width=688',
    description:
      'Spearheaded B2C marketing and operational excellence on European marketplaces, optimizing 10k+ SKUs for visibility and revenue growth.',
    detailedDescription:
      "In my role as an E-commerce Specialist for a global automotive parts distributor serving customers in 94 countries, I drove B2B and B2C marketing to expand market share on European platforms (Amazon, eBay, AutoDoc SE). I spearheaded data-driven sales strategies and utilized advanced SEO techniques to improve product ranking and visibility, specifically optimizing 'Generic Search Keywords' and 'OEM Numbers' to ensure the product catalog outperformed competitors. My responsibilities spanned the entire online sales lifecycle, from inventory listing and real-time synchronization to order fulfillment. I also analyzed sales data to optimize pricing and managed high-ROI sponsored ad campaigns to accelerate sales growth across key markets.",
    technologies: [
      'E-commerce',
      'SEO',
      'Amazon Seller Central',
      'eBay',
      'AutoDoc SE',
      'PPC Ads',
      'Analytics',
    ],
    url: '#',
    metrics: [
      'Global Reach: 94 Countries',
      'Optimized 10k+ SKUs',
      'Boosted EU Market Reach',
      'High-ROI Ad Campaigns',
    ],
    features: [
      {
        title: 'B2C Marketing Strategy',
        description:
          'Created and executed targeted marketing strategies to drive revenue growth on major European e-commerce marketplaces.',
        icon: <i aria-hidden="true" className="fas fa-bullhorn text-red-500"></i>,
      },
      {
        title: 'Advanced SEO Optimization',
        description:
          "Enriched product search terms including 'Generic Search Keywords' and 'OEM Numbers' to maximize organic visibility against competitors.",
        icon: <i aria-hidden="true" className="fas fa-search text-blue-500"></i>,
      },
      {
        title: 'SKU & Inventory Operations',
        description:
          'Managed seamless synchronization of inventory, pricing, and content for thousands of SKUs across retail and digital channels.',
        icon: <i aria-hidden="true" className="fas fa-boxes text-yellow-500"></i>,
      },
      {
        title: 'PPC & Sponsored Ads',
        description:
          'Leveraged sponsored advertising campaigns on Amazon and eBay to increase product exposure and accelerate sales velocity.',
        icon: <i aria-hidden="true" className="fas fa-ad text-green-500"></i>,
      },
    ],
  },
  {
    title: 'BeSync — Social Synchronization Protocol',
    slug: 'besync-trust-grade-ai',
    category: 'AI Architecture',
    image: '/images/trust-grade-certificate.webp',
    description:
      'A Social Synchronization Protocol creating meaningful connections through The Focus Pulse, Anti-Dopamine Engineering, and Privacy-First design. Powered by a Trust-Grade AI Platform with multi-agent cognitive architecture.',
    detailedDescription:
      'BeSync is a Social Synchronization Protocol that creates meaningful connections through innovative features: The Focus Pulse (bioluminescent attention visualization), Anti-Dopamine Engineering (no infinite scroll, no addiction loops), and Privacy is Luxury (GDPR+ compliance, Zero-Knowledge Proofs on roadmap). Core Promises include Opt-In Auto-Renewal (default OFF), No Ads Ever, and Flex Premium (pause anytime). The platform is powered by a Trust-Grade AI system I architected, featuring 5 specialized agents (Persona, Matchmaking, Safety, UX, Growth + Alignment Engine), 3 cognitive layers (Intelligence, Audit, Emotion), and full compliance with EU AI Act, GDPR, OECD AI Principles, IEEE EAD, and ISO/IEC 42001.',
    technologies: [
      'React 19',
      'TypeScript',
      'NestJS',
      'PostgreSQL',
      'Python',
      'FastAPI',
      'TensorFlow',
      'Google Cloud',
      'Docker',
    ],
    url: '#',
    // No repository links: emredursun/besync is private, so they returned 404s.
    metrics: [
      'The Focus Pulse — Killer Feature',
      '5 Specialized AI Agents',
      '3 Cognitive Intelligence Layers',
      '5 Regulatory Standards Compliance',
    ],
    features: [
      {
        title: 'The Focus Pulse',
        description:
          'Bioluminescent attention visualization — our killer feature that shows genuine engagement without compromising privacy.',
        icon: <i aria-hidden="true" className="fas fa-heart-pulse text-pink-500"></i>,
      },
      {
        title: 'Anti-Dopamine Engineering',
        description:
          "No infinite scroll, no addiction loops. Designed to respect users' time and mental health.",
        icon: <i aria-hidden="true" className="fas fa-brain text-purple-500"></i>,
      },
      {
        title: 'Privacy is Luxury',
        description:
          'GDPR+ compliance, Zero-Knowledge Proofs on roadmap. No ads ever, no data selling.',
        icon: <i aria-hidden="true" className="fas fa-lock text-cyan-500"></i>,
      },
      {
        title: 'Trust-Grade AI Architecture',
        description:
          '5 specialized agents, 3 cognitive layers, L1-L5 ethics escalation. Trust > Optimization, Safety > Growth.',
        icon: <i aria-hidden="true" className="fas fa-shield-alt text-green-500"></i>,
      },
    ],
    results: [
      {
        metric: 'Core Promises',
        value: '3 Immutable',
        description: 'Opt-In Auto-Renewal (OFF by default), No Ads Ever, Flex Premium',
      },
      {
        metric: 'AI Agents',
        value: '5 Specialized',
        description: 'Persona, Matchmaking, Safety, UX, Growth + Alignment Engine',
      },
      {
        metric: 'Compliance',
        value: '5 Standards',
        description: 'EU AI Act, GDPR, OECD, IEEE EAD, ISO/IEC 42001',
      },
      {
        metric: 'Trust-Grade Certification',
        value: 'Self-Assessed',
        description: 'Certificate ID: BESYNC-TGAI-20260112-001',
      },
    ],
    tags: ['Social Protocol', 'Trust-Grade AI', 'Anti-Dopamine', 'Privacy-First', 'Focus Pulse'],
    year: 2026,
  },
  {
    title: 'AegisQA — AI-Driven Full Stack Test Automation',
    slug: 'aegisqa',
    category: 'Test Automation',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    // Describes what the repository holds today; the roadmap items are
    // labelled as planned, because the project card links to the code.
    description:
      'A full-stack test automation platform in progress: Playwright UI tests and REST Assured API tests against a banking demo app in Docker, in one monorepo. Database validation, AI-assisted test generation and CI/CD are next on the roadmap.',
    detailedDescription:
      'AegisQA is a work-in-progress test automation platform built as a monorepo. The UI module uses Playwright with TypeScript, page objects and fixtures; the API module uses REST Assured with Java and TestNG, typed API clients and central configuration. Both run against a local ParaBank banking application in Docker. The roadmap adds database validation on PostgreSQL, AI-assisted test generation with Google Gemini, and CI/CD with reporting.',
    technologies: [
      'Playwright',
      'TypeScript',
      'REST Assured',
      'Java',
      'TestNG',
      'Docker',
      'PostgreSQL',
    ],
    url: '#',
    github: 'https://github.com/emredursun/aegisqa',
    metrics: [
      '23 Automated Tests (11 UI · 12 API)',
      'Page Object Model & Shared Config',
      'Runs Against ParaBank in Docker',
      'Roadmap: DB, AI Generation, CI/CD',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    ],
    duration: 'Ongoing',
    role: 'Lead Automation Architect',
    team: 'Solo Project',
    year: 2025,
    challenge:
      'UI, API and database checks usually live in separate tools and repositories, so one business flow (log in, open an account, transfer money) is verified in pieces, with duplicated configuration and test data.',
    solution:
      'Built the foundation as one monorepo with shared configuration and types: a Playwright + TypeScript UI module with page objects and fixtures, and a REST Assured + TestNG API module with typed clients, both against a local ParaBank instance in Docker. Fixed base-URL resolution and the wait strategy so the UI suite runs reliably, then planned the next sprints: database validation, AI-assisted test generation and CI/CD.',
    features: [
      {
        title: 'UI and API in One Repository',
        description:
          'Playwright (TypeScript) and REST Assured (Java) suites share configuration and types, and exercise the same banking flows.',
        icon: <i aria-hidden="true" className="fas fa-layer-group text-blue-400"></i>,
      },
      {
        title: 'Clean Architecture',
        description:
          'Page objects and fixtures for the UI, typed API clients and a central config manager for the API, a shared module for both.',
        icon: <i aria-hidden="true" className="fas fa-sitemap text-green-400"></i>,
      },
      {
        title: 'Reproducible Environment',
        description:
          'ParaBank and PostgreSQL run in Docker Compose, so every test run starts from the same, local system under test.',
        icon: <i aria-hidden="true" className="fab fa-docker text-cyan-400"></i>,
      },
      {
        title: 'Planned: AI and CI/CD',
        description:
          'Next sprints: database validation, AI-assisted test generation with Google Gemini, and GitHub Actions with Allure reporting.',
        icon: <i aria-hidden="true" className="fas fa-road text-purple-400"></i>,
      },
    ],
    results: [
      {
        metric: 'Automated tests',
        value: '23',
        description: '11 Playwright UI tests and 12 REST Assured API tests',
      },
      {
        metric: 'UI suite runtime',
        value: '13 s',
        description: 'All active UI tests passing against the local Docker environment',
      },
      {
        metric: 'Roadmap',
        value: '4 sprints',
        description:
          'Database validation, AI-assisted generation, CI/CD with reporting, documentation',
      },
    ],
    tags: [
      'Full Stack Testing',
      'Playwright',
      'REST Assured',
      'Clean Architecture',
      'Work in Progress',
    ],
  },
];
