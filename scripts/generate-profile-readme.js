#!/usr/bin/env node

/**
 * GitHub Profile README Generator
 *
 * Renders the README.md that lives on the GitHub profile repository
 * (github.com/emredursun/emredursun) from this portfolio's own data, so the
 * two can never drift apart:
 *
 *   - current role, company and location  -> public/locales/en/resume.json
 *   - certifications and their dates      -> SERVICES in constants.tsx
 *   - featured projects and their stacks  -> PROJECTS in constants.tsx
 *   - tech stack badges                   -> TECH_STACK in constants.tsx
 *   - bio quote and availability          -> public/locales/en/about.json
 *
 * Anything that is presentation-only (badge colours, which projects to
 * feature, the animated header lines) lives in the CONFIG block below and is
 * marked as README-specific.
 *
 * The generator fails loudly when the portfolio grows something the README
 * does not know how to render yet - a new technology without a badge, or a
 * featured project whose slug disappeared. That failure is the point: it is
 * what stops the profile from going stale.
 *
 * Run this script whenever you update your portfolio content.
 *
 * Usage:
 *   node scripts/generate-profile-readme.js
 *   or via npm: npm run generate:profile-readme
 *
 * To push the result to the profile repository:
 *   npm run publish:profile-readme
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'profile/README.md');

// ---------------------------------------------------------------------------
// CONFIG - README-specific presentation. Facts live in the portfolio data.
// ---------------------------------------------------------------------------

const GITHUB_USER = 'emredursun';

/** Animated header lines. Rendered through readme-typing-svg. */
const HEADER_LINES = [
  'QA Consultant | Pega & Tricentis Tosca',
  'Model-based test automation @ Sopra Steria',
  'Ex-ING — real-time international payments',
  'Reliability > a green build today',
];

/**
 * README-specific bullets. Kept here rather than derived from about.json
 * because the portfolio prose is written for a page with headings, not for a
 * scannable profile card. Volatile facts inside them (role, company, employer)
 * are interpolated from the portfolio data, not retyped.
 */
const ABOUT_BULLETS = [
  '🧪 I do **QA and test automation for Pega applications** in the Sopra Steria **Pega Practice (RulesMatter)** — coverage design, test data, and automation architecture with **Tricentis Tosca\'s model-based approach**.',
  '🏦 Most of my background is **financial services**. Two years at **ING** on **Dovetail** (the Fiserv real-time international payments platform), maintaining the shared **Selenium / Cucumber / Java** framework behind the daily regression suites across **four countries**.',
  '🧩 Certified **Pega Business Architect (CPBA)** and **Pega System Architect (CPSA)** — because automation on Pega stays fragile until you understand the case model from the inside. The goal is **testability designed into the case model**, not bolted on afterwards.',
  '📐 Applied Mathematics at **Istanbul University**. It still shows in how I approach coverage decisions, edge cases, and breaking scenarios into independent variables.',
  '🤖 I use **AI-assisted coding tools** daily (Claude Code, Cursor, Copilot) and build governance infrastructure around them — see **[Devran AI Kit](https://github.com/devran-ai/kit)**.',
];

/**
 * Certifications to surface, in display order. Dates are read from the
 * matching SERVICES entry so they cannot go stale; only the credential name
 * and issuer are declared here.
 *
 * Deliberately excluded: the ING internal trainings (not public credentials)
 * and the self-issued BeSync Trust-Grade certificate - a self-issued ID next
 * to ISTQB and Pegasystems credentials reads as padding.
 */
const CERTIFICATIONS = [
  { name: 'Tosca Product Consultant — Advanced proficiency', note: 'exam 93.3%', issuer: 'Tricentis', service: 'tricentis-tosca-automation' },
  { name: 'Certified Pega Business Architect (CPBA)', issuer: 'Pegasystems', service: 'pega-platform-architecture' },
  { name: 'Certified Pega System Architect (CPSA)', issuer: 'Pegasystems', service: 'pega-platform-architecture' },
  { name: 'ISTQB® Certified Tester — Foundation Level (CTFL)', issuer: 'ISTQB®', service: 'test-automation-architecture' },
  { name: 'Docker Foundations Professional Certificate', issuer: 'Docker', service: 'cicd-devops-integration' },
];

/**
 * Projects to feature, in display order.
 *
 * PUBLIC REPOSITORIES ONLY. Slugs whose GitHub repository is private are
 * deliberately absent (besync, deelmarkt-marketplace) - linking a recruiter
 * to a 404 is worse than not linking at all. Verify visibility with
 * `gh repo view <owner>/<repo>` before adding a slug here.
 */
const FEATURED_SLUGS = [
  'aegisqa',
  'devran-ai-kit',
  'quilyn-exam-prep',
  'qa-smart-test-lab',
  'playwright-testing-project',
  'pathforge-career-intelligence',
];

/** Shields.io badge definitions, keyed by the technology name in TECH_STACK. */
const BADGES = {
  // Languages & Core Tech
  'Java': { color: 'ED8B00', logo: 'openjdk' },
  'TypeScript': { color: '3178C6', logo: 'typescript' },
  'JavaScript': { color: 'F7DF1E', logo: 'javascript', logoColor: 'black' },
  'Python': { color: '3776AB', logo: 'python' },
  'Spring Boot': { color: '6DB33F', logo: 'springboot' },
  'SQL': { color: '4479A1', logo: 'postgresql' },
  'HTML': { color: 'E34F26', logo: 'html5' },
  'CSS': { color: '1572B6', logo: 'css3' },
  // Test Automation & Frameworks
  'Tricentis Tosca': { color: '00A99D' },
  'Pega Platform': { color: '1F4E79' },
  'Playwright': { color: '2EAD33', logo: 'playwright' },
  'Cypress': { color: '17202C', logo: 'cypress' },
  'JUnit': { color: '25A162', logo: 'junit5' },
  'TestNG': { color: 'C71A36' },
  'Selenium': { color: '43B02A', logo: 'selenium' },
  'REST Assured': { color: '6DB33F' },
  'Cucumber': { color: '23D96C', logo: 'cucumber' },
  'Postman': { color: 'FF6C37', logo: 'postman' },
  'Swagger': { color: '85EA2D', logo: 'swagger', logoColor: 'black' },
  'Appium': { color: '662D91', logo: 'appium' },
  // CI/CD & DevOps Tools
  'Azure DevOps': { color: '0078D7', logo: 'azuredevops' },
  'Jenkins': { color: 'D24939', logo: 'jenkins' },
  'Docker': { color: '2496ED', logo: 'docker' },
  'Git': { color: 'F05032', logo: 'git' },
  'Maven': { color: 'C71A36', logo: 'apachemaven' },
};

/**
 * README-only badge row. These tools are not in the portfolio's TECH_STACK
 * section yet; promote them into constants.tsx if they should also show on the
 * site, and this block can then be deleted.
 */
const EXTRA_STACK_GROUPS = [
  {
    title: 'Web & AI',
    badges: [
      { name: 'React', color: '61DAFB', logo: 'react', logoColor: 'black' },
      { name: 'Next.js', color: '000000', logo: 'nextdotjs' },
      { name: 'Tailwind', color: '06B6D4', logo: 'tailwindcss' },
      { name: 'Firebase', color: 'FFCA28', logo: 'firebase', logoColor: 'black' },
      { name: 'Claude Code', color: 'D97757', logo: 'claude' },
      { name: 'Gemini', color: '8E75B2', logo: 'googlegemini' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Portfolio data loading
// ---------------------------------------------------------------------------

/**
 * Evaluate constants.tsx and return its exports.
 *
 * The file is TSX, so it is transpiled with esbuild (already present as a Vite
 * dependency) with a stubbed JSX factory - the icon elements are irrelevant
 * here and collapse to null. This is deliberately not regex parsing: the
 * README should break when the data shape changes, not silently render
 * garbage.
 */
async function loadConstants() {
  const esbuild = (await import('esbuild')).default;
  const source = fs
    .readFileSync(path.join(ROOT, 'constants.tsx'), 'utf8')
    .replace(/^\s*import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, '');

  const { code } = esbuild.transformSync(source, {
    loader: 'tsx',
    jsx: 'transform',
    jsxFactory: '__jsx',
    jsxFragment: '__frag',
    format: 'esm',
  });

  const stub = 'const __jsx = () => null; const __frag = null;\n';
  const encoded = Buffer.from(stub + code, 'utf8').toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

/** Read one of the English locale files. */
function loadLocale(name) {
  const file = path.join(ROOT, 'public/locales/en', `${name}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Convert the locale files' inline HTML into Markdown emphasis. */
function htmlToMarkdown(text) {
  return text
    .replace(/<\/?strong>/g, '**')
    .replace(/<\/?em>/g, '*')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape a shields.io path segment (dashes, underscores and spaces are syntax). */
function encodeBadgeSegment(text) {
  return text
    .replace(/_/g, '__')
    .replace(/-/g, '--')
    .replace(/ /g, '_')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F');
}

/** Build a single-segment shields.io badge image. */
function badgeUrl({ name, color, logo, logoColor = 'white', style = 'flat-square' }) {
  const base = `https://img.shields.io/badge/${encodeBadgeSegment(name)}-${color}?style=${style}`;
  return logo ? `${base}&logo=${logo}&logoColor=${logoColor}` : base;
}

/** Build a two-segment label/value shields.io badge, wrapped in a link. */
function linkBadge({ label, value, color, logo, logoColor = 'white', href }) {
  const segment = `${encodeBadgeSegment(label)}-${encodeBadgeSegment(value)}-${color}`;
  const base = `https://img.shields.io/badge/${segment}?style=for-the-badge`;
  const url = logo ? `${base}&logo=${logo}&logoColor=${logoColor}` : base;
  return `[![${label}](${url})](${href})`;
}

/** Render one row of technology badges. */
function stackRow(title, badges) {
  const images = badges
    .map((badge) => `![${badge.name}](${badgeUrl(badge)})`)
    .join('\n');
  return `**${title}**\n\n${images}\n`;
}

/** "May 2026 - Present" -> "May 2026" */
function startOfRange(range) {
  return range.split(/\s+-\s+/)[0].trim();
}

/** "Professional (C1)" -> "C1"; "Native" -> "Native" */
function shortLevel(level) {
  const parenthesised = level.match(/\(([^)]+)\)/);
  return parenthesised ? parenthesised[1] : level.trim();
}

/**
 * First sentence only, so the featured-work table stays scannable.
 * Falls back to the full text when the split would leave a stub.
 */
function firstSentence(text) {
  const match = text.match(/^.*?[.!?](?=\s+[A-Z“"])/s);
  const candidate = match ? match[0].trim() : text.trim();
  return candidate.length < 40 ? text.trim() : candidate;
}

/** "Sopra Steria - Nieuwegein, Utrecht, Netherlands · Hybrid" -> both halves. */
function splitCompany(company) {
  const [employer, rest = ''] = company.split(/\s+-\s+/);
  const city = rest.split(',')[0].split('·')[0].trim();
  return { employer: employer.trim(), city };
}

// ---------------------------------------------------------------------------
// Validation - the anti-drift guard
// ---------------------------------------------------------------------------

/**
 * Verify every piece of config still lines up with the portfolio data.
 * Throws on structural drift; warns on facts that merely disagree.
 */
function validate({ constants, resume }) {
  const errors = [];
  const warnings = [];

  const serviceSlugs = new Set(constants.SERVICES.map((service) => service.slug));
  CERTIFICATIONS.forEach((cert) => {
    if (!serviceSlugs.has(cert.service)) {
      errors.push(`Certification "${cert.name}" points at service "${cert.service}", which no longer exists in constants.tsx`);
      return;
    }
    const service = constants.SERVICES.find((item) => item.slug === cert.service);
    if (!service.certificationDate) {
      errors.push(`Service "${cert.service}" has no certificationDate, needed by "${cert.name}"`);
    }
  });

  const projectsBySlug = new Map(constants.PROJECTS.map((project) => [project.slug, project]));
  FEATURED_SLUGS.forEach((slug) => {
    const project = projectsBySlug.get(slug);
    if (!project) {
      errors.push(`Featured project "${slug}" no longer exists in constants.tsx`);
      return;
    }
    if (!project.github) {
      errors.push(`Featured project "${slug}" has no github URL - it cannot be linked`);
    }
    if (!project.technologies?.length) {
      errors.push(`Featured project "${slug}" has no technologies to show in the stack column`);
    }
  });

  constants.TECH_STACK.forEach((category) => {
    category.technologies.forEach((tech) => {
      if (!BADGES[tech.name]) {
        errors.push(`Technology "${tech.name}" (${category.title}) has no badge in BADGES - add a colour and logo for it`);
      }
    });
  });

  if (!resume.experience?.length) {
    errors.push('resume.json has no experience entries - the current role cannot be resolved');
  } else {
    const { city } = splitCompany(resume.experience[0].company);
    if (city && constants.PERSONAL_INFO.location && !constants.PERSONAL_INFO.location.includes(city)) {
      warnings.push(`PERSONAL_INFO.location is "${constants.PERSONAL_INFO.location}" but the current role in resume.json is based in "${city}" - the profile README follows resume.json`);
    }
  }

  warnings.forEach((warning) => console.warn(`⚠️  ${warning}`));

  if (errors.length) {
    throw new Error(`Portfolio data drifted away from the profile README config:\n  - ${errors.join('\n  - ')}`);
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderHeader({ constants, role }) {
  const linkedin = constants.SOCIAL_LINKS.find((link) => link.name === 'linkedin').url;
  const site = 'https://emredursun.nl/';

  const typingUrl =
    'https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&duration=3200&pause=900' +
    '&color=00B4D8&center=true&vCenter=true&width=780&lines=' +
    HEADER_LINES.map((line) => encodeURIComponent(line).replace(/%20/g, '+')).join(';');

  const badges = [
    linkBadge({ label: 'Portfolio', value: 'emredursun.nl', color: '111827', logo: 'googlechrome', href: site }),
    linkBadge({ label: 'LinkedIn', value: 'emre-dursun-nl', color: '0A66C2', logo: 'linkedin', href: linkedin }),
    linkBadge({ label: 'Pega', value: 'CPBA & CPSA', color: '1F4E79', href: site }),
    linkBadge({ label: 'Tricentis Tosca', value: 'Advanced', color: '00A99D', href: site }),
    linkBadge({ label: 'ISTQB', value: 'CTFL', color: '6E4C9F', href: site }),
  ].join('\n');

  return `<div id="top"></div>

<div align="center">

<a href="${site}">
  <img src="${typingUrl}" alt="${constants.PERSONAL_INFO.name} — QA Consultant (Pega and Tricentis Tosca)" />
</a>

### Hi, I'm Emre 👋

**${role.title} · ${role.employer} · ${role.city}, Netherlands** 🇳🇱

${badges}

</div>`;
}

function renderAbout({ constants, about }) {
  const languages = constants.LANGUAGES
    .map((language) => `${language.name} (${shortLevel(language.level)})`)
    .join(' · ');

  const bullets = [
    ...ABOUT_BULLETS,
    `🗣️ ${languages}`,
    "🎾 Off-screen: tennis, better Dutch, and places I haven't been yet.",
  ]
    .map((bullet) => `- ${bullet}`)
    .join('\n');

  return `## :man_technologist: About me

${bullets}

> ${htmlToMarkdown(about.introQuote)}`;
}

function renderNow({ constants, role, about }) {
  const kit = constants.PROJECTS.find((project) => project.slug === 'devran-ai-kit');
  const linkedin = constants.SOCIAL_LINKS.find((link) => link.name === 'linkedin').url;

  const rows = [
    ['🏢 **Role**', `${role.title} @ **${role.employer}**, since ${role.since}`],
    ['🔭 **Focus**', 'Model-based automation for Pega — web UI, API chains, desktop/UIA, mobile, and stateful test data (TDS)'],
    ['🌱 **Building**', `[${kit.title.split('—')[0].trim()}](${kit.github}) — governance, quality gates, and session-persistent context for AI-assisted development`],
    ['💬 **Happy to talk about**', 'Testing real-time payment systems, model-based automation, scaling QA inside a Pega programme'],
    ['📫 **Reach me**', `[emredursun.nl](https://emredursun.nl/) · [LinkedIn](${linkedin})`],
  ]
    .map(([label, value]) => `| ${label} | ${value} |`)
    .join('\n');

  return `## 🎯 What I'm doing now

| | |
|---|---|
${rows}`;
}

function renderCertifications({ constants }) {
  const byslug = new Map(constants.SERVICES.map((service) => [service.slug, service]));

  const rows = CERTIFICATIONS.map((cert) => {
    const service = byslug.get(cert.service);
    const name = cert.note ? `**${cert.name}** (${cert.note})` : `**${cert.name}**`;
    return `| ${name} | ${cert.issuer} | ${service.certificationDate} |`;
  }).join('\n');

  const tosca = byslug.get('tricentis-tosca-automation');
  const covered = tosca.certificateBadges.map((badge) => badge.label).join(' · ');

  return `## 🏅 Certifications

| Certification | Issuer | Date |
|---|---|---|
${rows}

<sub><b>Tosca learning path:</b> ${covered}.</sub>`;
}

function renderStack({ constants }) {
  const fromPortfolio = constants.TECH_STACK.map((category) =>
    stackRow(
      category.title,
      category.technologies.map((tech) => ({ name: tech.name, ...BADGES[tech.name] }))
    )
  );

  const extras = EXTRA_STACK_GROUPS.map((group) => stackRow(group.title, group.badges));

  return `## 🛠️ Tech stack\n\n${[...fromPortfolio, ...extras].join('\n').trim()}`;
}

function renderFeatured({ constants }) {
  const projectsBySlug = new Map(constants.PROJECTS.map((project) => [project.slug, project]));

  const rows = FEATURED_SLUGS.map((slug) => {
    const project = projectsBySlug.get(slug);
    const name = project.title.split('—')[0].trim();
    const stack = project.technologies.slice(0, 4).join(' · ');
    return `| **[${name}](${project.github})** | ${firstSentence(project.description)} | ${stack} |`;
  });

  const portfolioRepo = `https://github.com/${GITHUB_USER}/professional-portfolio`;
  rows.push(`| **[Portfolio](${portfolioRepo})** | The source behind [emredursun.nl](https://emredursun.nl/) — trilingual, SEO-optimised, print-ready résumé. | React · TypeScript · Vite · Tailwind |`);

  return `## 📌 Featured work

| Project | What it is | Stack |
|---|---|---|
${rows.join('\n')}`;
}

function renderFooter({ constants, about }) {
  const linkedin = constants.SOCIAL_LINKS.find((link) => link.name === 'linkedin').url;
  const cta = linkBadge({ label: "Let's talk", value: 'LinkedIn', color: '0A66C2', logo: 'linkedin', href: linkedin });

  return `<div align="center">

${htmlToMarkdown(about.storyPart3)}

${cta}

<sub><a href="#top">↑ back to top</a></sub>

</div>

<!--
  Generated by scripts/generate-profile-readme.js in emredursun/professional-portfolio.
  Do not edit this file on the profile repository - regenerate it there instead,
  otherwise the next portfolio update silently overwrites your changes.
-->`;
}

function renderReadme({ constants, about, resume }) {
  const first = resume.experience[0];
  const { employer, city } = splitCompany(first.company);
  const role = { title: first.title, employer, city, since: startOfRange(first.date) };

  return [
    renderHeader({ constants, role }),
    '---',
    renderAbout({ constants, about }),
    '---',
    renderNow({ constants, role, about }),
    '---',
    renderCertifications({ constants }),
    '---',
    renderStack({ constants }),
    '---',
    renderFeatured({ constants }),
    '---',
    renderFooter({ constants, about }),
  ].join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function writeProfileReadme() {
  try {
    const constants = await loadConstants();
    const about = loadLocale('about');
    const resume = loadLocale('resume');

    validate({ constants, resume });

    const markdown = renderReadme({ constants, about, resume });

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');

    console.log('✅ Profile README generated successfully!');
    console.log(`📍 Location: ${OUTPUT_PATH}`);
    console.log(`🎯 Target: github.com/${GITHUB_USER}/${GITHUB_USER}`);
    console.log(`🏅 Certifications: ${CERTIFICATIONS.length}`);
    console.log(`📌 Featured projects: ${FEATURED_SLUGS.length + 1}`);
    console.log(`🛠️  Badges: ${Object.keys(BADGES).length} from TECH_STACK + ${EXTRA_STACK_GROUPS.reduce((total, group) => total + group.badges.length, 0)} README-only`);
    console.log(`📄 Size: ${markdown.length} characters`);
    console.log('🚀 Publish with: npm run publish:profile-readme');
  } catch (error) {
    console.error('❌ Error generating profile README:', error.message);
    process.exit(1);
  }
}

writeProfileReadme();
