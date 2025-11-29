
import React from 'react';
import { Service, TimelineItem, Skill, Project, TechCategory, Language } from './types.ts';

export const PERSONAL_INFO = {
    name: 'Emre Dursun',
    title: 'ISTQB® Certified Automation Engineer',
    email: 'info.emredursun@gmail.com',
    phone: '+31 6 2878 8948',
    location: 'Amsterdam, Netherlands',
    avatar: '/images/profile.png',
    resumeUrl: '#',
};

export const SOCIAL_LINKS = [
    { name: 'github', icon: <i className="fab fa-github"></i>, url: 'https://github.com/emredursun' },
    { name: 'linkedin', icon: <i className="fab fa-linkedin-in"></i>, url: 'https://www.linkedin.com/in/emre-dursun-nl/' },
    { name: 'whatsapp', icon: <i className="fab fa-whatsapp"></i>, url: 'https://wa.me/31628788948' },
    { name: 'X', icon: <i className="fab fa-x-twitter"></i>, url: 'https://x.com/info_emredursun' },
    { name: 'instagram', icon: <i className="fab fa-instagram"></i>, url: 'https://www.instagram.com/trueheartfeltjourney' },
];

export const SERVICES: Service[] = [
    {
        icon: <i className="fas fa-robot"></i>,
        title: 'Test Automation Architecture',
        description: 'Building robust, scalable end-to-end automation frameworks to ensure software quality and reliability.',
        tags: ['Java', 'Selenium', 'Playwright', 'Cypress', 'Cucumber']
    },
    {
        icon: <i className="fas fa-sync-alt"></i>,
        title: 'CI/CD & DevOps Integration',
        description: 'Designing and maintaining continuous integration pipelines to accelerate deployment and reduce risk.',
        tags: ['Jenkins', 'Azure DevOps', 'Docker', 'Git', 'Maven']
    },
    {
        icon: <i className="fas fa-server"></i>,
        title: 'API & Backend Validation',
        description: 'Implementing comprehensive API testing strategies and database validations for backend integrity.',
        tags: ['Rest Assured', 'Postman', 'SQL', 'JUnit', 'TestNG']
    },
    {
        icon: <i className="fas fa-laptop-code"></i>,
        title: 'Full-Stack Web Development',
        description: 'Developing responsive, high-performance web applications with modern frontend and backend technologies.',
        tags: ['React', 'TypeScript', 'HTML/CSS', 'Node.js', 'Tailwind']
    },
];

export const ABOUT_INTRO = "Driven by precision, powered by curiosity. I transform manual testing corridors into automated, repeatable systems so teams have clear feedback and confidence to ship.";

export const ABOUT_STORY = "I’ve worked across banking and e-commerce domains building API & UI automation, resilient test pipelines, and observability to help teams scale testing without slowing delivery. I enjoy breaking complex flows into simple, testable parts and collaborating cross-functionally to reduce risk.";

export const ABOUT_TEXT = "ISTQB® Certified Full-Stack Automation Engineer with experience in UI, API, and database testing using Java, Selenium, Cucumber, Postman, and Rest Assured. Skilled in designing scalable automation frameworks and integrating them with CI/CD pipelines. Proven track record of contributing to high-quality releases in Agile teams across banking, healthcare, and e-commerce domains. Fluent in Dutch, English, and Turkish (native).";

export const EDUCATION: TimelineItem[] = [
    {
        date: 'June 2022 - June 2023',
        title: 'Bachelor of Engineering - Full-Stack Automation Engineering',
        company: 'TechPro Education - Online/Remote',
        description: 'Key Skills Developed: Test Automation (Selenium WebDriver, Cypress, Postman API, REST APIs, RESTful WebServices), CI/CD (Jenkins), Frameworks (Hybrid Framework, Cucumber/BDD), Languages/Tools (Java, Gherkin, SQL, Maven, TestNG, JUnit), Methodologies (Agile, Scrum, SDLC, QA Engineering, Test Planning), and more.',
    },
    {
        date: 'September 2019 - April 2020',
        title: 'Software Developer',
        company: 'ROC van Twente - Enschede, Netherlands',
        description: 'Key Skills Developed: Core Programming (C#, JavaScript), Database Management (SQL, T-SQL, MongoDB), Version Control (Git, GitHub), Web Fundamentals (HTML, CSS), and Object-Oriented Programming (OOP).',
    },
    {
        date: 'October 2017 - March 2018',
        title: 'Full-Stack Web Development',
        company: 'HackYourFuture - Amsterdam, Netherlands',
        description: 'Key Skills Developed: Web Technologies (HTML, CSS, JavaScript), API Testing, Version Control (Git, GitHub), C#, SQL, and Object-Oriented Programming (OOP).',
    },
    {
        date: 'September 2007 - July 2013',
        title: 'Bachelor of Applied Science - Mathematics',
        company: 'Istanbul University - Istanbul, Turkey',
        description: 'Relevant Coursework and Skills: Differential Equations, Complex Analysis, Probability & Statistics, Advanced Calculus, General Physics, and skills in Abstract Reasoning, Systematic Problem Solving, and Data Analysis.',
    },
];

export const EXPERIENCE: TimelineItem[] = [
    {
        date: 'Jun 2023 - Sep 2025',
        title: 'Automation Engineer (PSS/True International Payments/Ch Dovetail)',
        company: 'ING Bank - Amsterdam, North Holland, Netherlands · Hybrid',
        description: "As an Automation Test Engineer at ING's TIP Test Center (TTC), I designed and maintained automated end-to-end tests for real-time payment processing within the Dovetail system, a Fiserv payment platform, ensuring transaction accuracy across international branches. My responsibilities included designing test validations for various payment flows, managing and optimizing test data to accelerate deployment, and collaborating closely with development teams and stakeholders to ensure seamless integration with the automation framework.",
    },
    {
        date: 'Jun 2022 - Jun 2023',
        title: 'Full-Stack Automation Engineer (SDET)',
        company: 'TechPro Education EU - Netherlands · Remote',
        description: 'Developed and managed a comprehensive Automation Framework based on acceptance criteria using Selenium WebDriver, Java, JUnit, and Cucumber. Executed UI, backend, and database tests for a hospital portal, covering functionalities like patient management and appointment scheduling. Performed API testing with Postman and Rest Assured, managed dependencies via Maven, and integrated CI/CD pipelines with Jenkins in an Agile environment.',
    },
    {
        date: 'May 2021 - Jan 2023',
        title: 'Manual Tester & e-Commerce Specialist',
        company: 'BSG Auto Parts & Nerex Motors - Amsterdam, Netherlands · On-site',
        description: "Played a pivotal role at Nerex Motors enhancing e-commerce strategies and product quality. Conducted manual testing on ERP systems to maintain high functionality standards, improved product search visibility on Amazon and eBay, and implemented strategic ad campaigns driving online sales. Successfully managed the Online Channel (AutoDoc) sales process for BSG Auto Parts, fostering B2B growth by developing tailored sales strategies, cultivating strong relationships with key accounts, and negotiating competitive commercial terms.",
    },
    {
        date: 'Mar 2019 - Sep 2020',
        title: 'Student Affairs Coordinator',
        company: 'LiveCoding | Online Web Development Bootcamp - Netherlands · Remote',
        description: 'Played a key role in enhancing the student experience at LiveCoding through comprehensive support and engagement initiatives. Delivered tailored counseling to online students, helping them overcome various challenges. Organized and executed virtual activities to strengthen community ties among students. Maintained accurate student records, ensuring compliance with program policies and tracking progress effectively.',
    },
    {
        date: 'Jul 2017 - Sep 2020',
        title: 'FerriStar - Evergreen Niches',
        company: 'eBay - Netherlands · Self-employed',
        description: "Successfully contributed to FerriStar's mission of providing curated best sellers and evergreen essentials. Developed strong relationships with suppliers to ensure a consistent supply of high-quality products. Focused on enhancing customer experience through thoughtful product selection in various categories. Gained expertise in e-commerce and product curation, reinforcing FerriStar's reputation in the market.",
    },
    {
        date: 'Sep 2016 - Mar 2017',
        title: 'Mathematics Instructor',
        company: 'Mohammed Al Fatih Schools - El Jadida, Morocco · On-site',
        description: 'Contributed significantly to mathematics instruction focusing on holistic student development. Employed interdisciplinary connections to enhance lesson relevance and student engagement. Collaborated with colleagues to support extracurricular activities and pastoral care initiatives.'
    },
    {
        date: 'Sep 2014 - Sep 2016',
        title: 'Mathematics Instructor',
        company: 'LUMINA Educational Institutions - Bucharest, Romania · On-site',
        description: "I had the privilege of teaching advanced mathematics at LUMINA Educational Institutions, where I focused on fostering student success in a diverse learning environment. Designed and graded internal assessments, providing detailed reports on student progress and predicted grades. Differentiated instruction to support students from various educational backgrounds, maintaining high international standards. Mentored students on their academic pathways, guiding them toward STEM-related university goals."
    },
    {
        date: 'Mar 2012 - Sep 2014',
        title: 'Volunteer Assistant',
        company: 'Fiader - Istanbul, Turkey · Part-time',
        description: "Played a key role in supporting Fiader's mission through effective volunteer coordination and administrative tasks. Managed volunteer records and scheduled shifts to optimize resource allocation. Assisted in organizing events and training sessions, ensuring all logistics were in place. Acted as a primary point of contact, enhancing communication and volunteer engagement.",
    }
];

export const SKILLS: Skill[] = [
    { name: 'Test Automation', level: 95 },
    { name: 'Java & Ecosystem', level: 90 },
    { name: 'Selenium & Cucumber', level: 90 },
    { name: 'Playwright & Cypress (TS)', level: 85 },
    { name: 'API Testing (Rest Assured)', level: 85 },
    { name: 'CI/CD (Jenkins & Azure)', level: 80 },
    { name: 'Docker & Containerization', level: 75 },
    { name: 'SQL & Databases', level: 75 },
];

export const LANGUAGES: Language[] = [
    { name: 'Turkish', level: 'Native', code: 'TR', percentage: 100, greeting: 'Merhaba' },
    { name: 'English', level: 'Professional (C1)', code: 'EN', percentage: 90, greeting: 'Hello' },
    { name: 'Dutch', level: 'Intermediate (B2)', code: 'NL', percentage: 70, greeting: 'Hallo' },
    { name: 'Ukrainian', level: 'Beginner (A1)', code: 'UA', percentage: 20, greeting: 'Привіт' },
];

export const TECH_STACK: TechCategory[] = [
    {
        title: 'Languages & Core Tech',
        technologies: [
            { name: 'Java', icon: <i className="fab fa-java text-3xl text-red-500"></i> },
            { name: 'TypeScript', icon: <i className="fab fa-js text-3xl text-blue-500"></i> },
            { name: 'SQL', icon: <i className="fas fa-database text-3xl text-blue-400"></i> },
            { name: 'HTML', icon: <i className="fab fa-html5 text-3xl text-orange-600"></i> },
            { name: 'CSS', icon: <i className="fab fa-css3-alt text-3xl text-blue-600"></i> },
        ]
    },
    {
        title: 'Test Automation & Frameworks',
        technologies: [
            { name: 'Playwright', icon: <i className="fas fa-masks-theater text-3xl text-green-500"></i> },
            { name: 'Cypress', icon: <i className="fas fa-eye text-3xl text-gray-500"></i> },
            { name: 'JUnit', icon: <i className="fas fa-vial text-3xl text-red-500"></i> },
            { name: 'TestNG', icon: <i className="fas fa-vials text-3xl text-blue-500"></i> },
            { name: 'Selenium', icon: <i className="fas fa-check-circle text-3xl text-green-500"></i> },
            { name: 'REST Assured', icon: <i className="fas fa-globe text-3xl text-green-600"></i> },
            { name: 'Cucumber', icon: <i className="fas fa-leaf text-3xl text-green-500"></i> },
            { name: 'Postman', icon: <i className="fas fa-rocket text-3xl text-orange-500"></i> },
        ]
    },
    {
        title: 'CI/CD & DevOps Tools',
        technologies: [
            { name: 'Azure DevOps', icon: <i className="fab fa-microsoft text-3xl text-blue-600"></i> },
            { name: 'Jenkins', icon: <i className="fab fa-jenkins text-3xl text-gray-700 dark:text-white"></i> },
            { name: 'Docker', icon: <i className="fab fa-docker text-3xl text-blue-500"></i> },
            { name: 'Git', icon: <i className="fab fa-git-alt text-3xl text-orange-600"></i> },
            { name: 'Maven', icon: <i className="fas fa-feather-alt text-3xl text-red-600"></i> },
        ]
    }
];

export const PROJECTS: Project[] = [
    {
        title: 'Banking Payment Automation',
        category: 'Automation',
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Designed and maintained automated end-to-end tests for real-time payment processing within the Dovetail system.',
        technologies: ['Java', 'Selenium', 'Jenkins', 'SQL'],
        url: '#'
    },
    {
        title: 'Hospital Portal Testing',
        category: 'QA Testing',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Executed UI, backend, and database tests for a hospital portal, covering patient management and appointments.',
        technologies: ['Selenium', 'Cucumber', 'Rest Assured', 'Maven'],
        url: '#'
    },
    {
        title: 'E-commerce Sales Optimization',
        category: 'E-commerce',
        image: 'https://www.servcorp.co.uk/media/34561/e-commerce-img.jpeg?format=webp&quality=70&width=688',
        description: 'Improved product search visibility on Amazon/eBay and managed Online Channel sales processes.',
        technologies: ['E-commerce', 'SEO', 'Analytics', 'Management'],
        url: '#'
    }
];
