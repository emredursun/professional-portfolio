#!/usr/bin/env node

/**
 * Machine-readable profile: dist/resume.json and dist/llms.txt.
 *
 * - resume.json follows the JSON Resume schema (jsonresume.org, v1.x), the
 *   open format résumé tools and ATS integrations import.
 * - llms.txt follows llmstxt.org: a short Markdown index an AI assistant can
 *   read to answer questions about the site, pointing at the pages that hold
 *   the detail.
 *
 * Both are generated after the build from the same data as the pages
 * (constants.tsx, the English locale files and the profile README's
 * certification list), so they cannot drift from what the site says.
 * Contact details are the ones the site already publishes; the home address
 * never appears (see index.html's JSON-LD for the same rule).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadConstants } from './lib/load-constants.js';
import { CERTIFICATIONS, splitCompany } from './generate-profile-readme.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = 'https://emredursun.nl';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Sep 2023" / "September 2019" -> "2023-09"; "2024" -> "2024"; "Present" -> undefined. */
export function isoMonth(text) {
  const value = text.trim();
  if (/^present$/i.test(value)) return undefined;
  if (/^\d{4}$/.test(value)) return value;
  const match = value.match(/^([A-Za-z]+)\s+(\d{4})$/);
  const month = match && MONTHS.indexOf(match[1].slice(0, 3).toLowerCase());
  if (!match || month < 0) throw new Error(`Unrecognised date: "${text}"`);
  return `${match[2]}-${String(month + 1).padStart(2, '0')}`;
}

/** "May 2026 - Present" -> { startDate: "2026-05" } */
export function dateRange(range) {
  const [start, end = 'Present'] = range.split(/\s+-\s+/);
  const startDate = isoMonth(start);
  const endDate = isoMonth(end);
  return endDate ? { startDate, endDate } : { startDate };
}

/** The locale files carry a little inline HTML (<strong>); plain text here. */
const plain = (text) =>
  text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** "Sopra Steria - Nieuwegein, Utrecht, Netherlands · Hybrid" -> "Nieuwegein, Utrecht, Netherlands · Hybrid" */
const placeOf = (company) =>
  company
    .split(/\s+-\s+/)
    .slice(1)
    .join(' - ')
    .trim() || undefined;

function skillLevel(percent) {
  if (percent >= 90) return 'Expert';
  if (percent >= 80) return 'Advanced';
  return 'Intermediate';
}

const PROFILE_NETWORKS = { github: 'GitHub', linkedin: 'LinkedIn', x: 'X', instagram: 'Instagram' };

/**
 * JSON Resume document. Pure, so it can be validated in a test.
 *
 * @param {{ constants: any, resume: any, about: any, builtAt?: string }} input
 */
export function buildResume({ constants, resume, about, builtAt }) {
  const { PERSONAL_INFO, SOCIAL_LINKS, SERVICES, PROJECTS, SKILLS, LANGUAGES, TECH_STACK } =
    constants;
  const services = new Map(SERVICES.map((service) => [service.slug, service]));

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: PERSONAL_INFO.name,
      label: PERSONAL_INFO.title,
      image: `${SITE_URL}${PERSONAL_INFO.portrait}`,
      email: PERSONAL_INFO.email,
      phone: PERSONAL_INFO.phone,
      url: SITE_URL,
      summary: plain(about.introText),
      location: { region: 'Noord-Holland', countryCode: 'NL' },
      profiles: SOCIAL_LINKS.filter((link) => PROFILE_NETWORKS[link.name.toLowerCase()]).map(
        (link) => ({
          network: PROFILE_NETWORKS[link.name.toLowerCase()],
          username: new URL(link.url).pathname.split('/').filter(Boolean).pop(),
          url: link.url,
        }),
      ),
    },
    work: resume.experience.map((job) => ({
      name: splitCompany(job.company).employer,
      position: job.title,
      location: placeOf(job.company),
      ...dateRange(job.date),
      summary: plain(job.description),
    })),
    volunteer: resume.volunteering.map((role) => ({
      organization: splitCompany(role.company).employer,
      position: role.title,
      ...dateRange(role.date),
      summary: plain(role.description),
    })),
    education: resume.education.map((course) => {
      const [studyType, area] = course.title.includes(' - ')
        ? course.title.split(/\s+-\s+/)
        : [undefined, course.title];
      return {
        institution: splitCompany(course.company).employer,
        ...(studyType ? { studyType } : {}),
        area,
        ...dateRange(course.date),
      };
    }),
    certificates: CERTIFICATIONS.map((cert) => {
      const service = cert.service ? services.get(cert.service) : undefined;
      const url = cert.verify ?? service?.certificateUrl;
      return {
        name: cert.name,
        issuer: cert.issuer,
        date: isoMonth(cert.issued ?? service.certificationDate),
        ...(url ? { url } : {}),
      };
    }),
    skills: [
      ...SKILLS.map((skill) => ({ name: skill.name, level: skillLevel(skill.level) })),
      ...TECH_STACK.map((group) => ({
        name: group.title,
        keywords: group.technologies.map((tech) => tech.name),
      })),
    ],
    languages: LANGUAGES.map((language) => ({ language: language.name, fluency: language.level })),
    projects: PROJECTS.map((project) => ({
      name: project.title,
      description: plain(project.description),
      url: `${SITE_URL}/projects/${project.slug}`,
      keywords: project.technologies,
    })),
    meta: {
      canonical: `${SITE_URL}/resume.json`,
      version: 'v1.0.0',
      ...(builtAt ? { lastModified: builtAt.slice(0, 19) } : {}),
    },
  };
}

/**
 * llms.txt: H1, summary blockquote, a few facts, then link lists.
 *
 * @param {{ constants: any, about: any, resumeJson: ReturnType<typeof buildResume> }} input
 */
export function buildLlmsTxt({ constants, about, resumeJson }) {
  const { PERSONAL_INFO, SERVICES, PROJECTS } = constants;
  const serviceKeys = constants.SERVICE_TRANSLATION_KEYS;
  const linkedin = resumeJson.basics.profiles.find((profile) => profile.network === 'LinkedIn');
  const certificates = resumeJson.certificates
    .map(
      (cert) =>
        `- ${cert.url ? `[${cert.name}](${cert.url})` : cert.name}: ${cert.issuer}, ${cert.date}`,
    )
    .join('\n');

  return `# ${PERSONAL_INFO.name}

> ${about.meta.description}

${plain(about.introText)}

- Current role: ${resumeJson.work[0].position} at ${resumeJson.work[0].name} (${resumeJson.work[0].location}), since ${resumeJson.work[0].startDate}.
- Languages: ${resumeJson.languages.map((language) => `${language.language}: ${language.fluency}`).join('; ')}.
- The site is available in English, Dutch (${SITE_URL}/nl) and Turkish (${SITE_URL}/tr).

## Profile

- [About](${SITE_URL}/about): profile, current work and services
- [Resume](${SITE_URL}/resume): experience, education, skills and volunteering
- [CV (PDF)](${SITE_URL}/cv/Emre-Dursun-CV-en.pdf): the same CV as a printable PDF
- [JSON Resume](${SITE_URL}/resume.json): the CV in the open JSON Resume format
- [Contact](${SITE_URL}/contact): contact form, email ${PERSONAL_INFO.email}${linkedin ? `, [LinkedIn](${linkedin.url})` : ''}

## Services

${SERVICES.map((service) => `- [${about.services[serviceKeys[service.slug]].title}](${SITE_URL}/about/${service.slug}): ${about.services[serviceKeys[service.slug]].description}`).join('\n')}

## Certifications

${certificates}

## Projects

${PROJECTS.map((project) => `- [${project.title}](${SITE_URL}/projects/${project.slug}): ${plain(project.description)}`).join('\n')}

## Optional

- [Quality report](${SITE_URL}/quality): test, accessibility, performance and security results for the live build
`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

/** Write both files into a build directory. */
export async function writeAgentProfile({ distDir = DIST } = {}) {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/ has no build - run `vite build` first');
  }
  const constants = await loadConstants();
  const resume = readJson('public/locales/en/resume.json');
  const about = readJson('public/locales/en/about.json');
  const versionFile = path.join(distDir, 'version.json');
  const builtAt = fs.existsSync(versionFile)
    ? JSON.parse(fs.readFileSync(versionFile, 'utf8')).builtAt
    : undefined;

  const resumeJson = buildResume({ constants, resume, about, builtAt });
  fs.writeFileSync(
    path.join(distDir, 'resume.json'),
    `${JSON.stringify(resumeJson, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(distDir, 'llms.txt'),
    buildLlmsTxt({ constants, about, resumeJson }),
    'utf8',
  );
  return resumeJson;
}

async function main() {
  try {
    const resumeJson = await writeAgentProfile();
    console.log(
      `🤖 resume.json (${resumeJson.work.length} roles, ${resumeJson.projects.length} projects) and llms.txt written`,
    );
  } catch (error) {
    console.error('❌ Error writing the agent profile:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
