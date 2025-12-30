import React from 'react';

export type Page = 'About' | 'Resume' | 'Projects' | 'Contact';

export interface Service {
  // Fix for: Cannot find namespace 'JSX'.
  icon: React.ReactNode;
  title: string;
  slug: string;                // URL-friendly identifier for deep linking
  description: string;
  tags?: string[];
  
  // Premium enhancement fields
  featured?: boolean;           // Highlight as featured service
  badge?: string;              // Badge text (e.g., "Core Expertise", "Certified")
  fullDescription?: string;    // Extended description for detail panel
  keyBenefits?: string[];      // List of key benefits/features
  relatedProjects?: string[];  // Related project slugs
  yearsOfExperience?: number;  // Years of experience in this area
}

export interface TimelineItem {
  date: string;
  title: string;
  company: string;
  description: string;
}

export interface Skill {
  name: string;
  level: number;
}

export interface Language {
  name: string;
  level: string;
  code: string;
  percentage: number;
  greeting: string;
}

export interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface Result {
  metric: string;
  value: string;
  description: string;
}

export interface Testimonial {
  text: string;
  author: string;
  role: string;
  avatar?: string;
}

export interface Project {
  title: string;
  category: string;
  image: string;
  url?: string;
  github?: string;
  hackernoon_link?: string;     // External article/reference link
  description: string;
  technologies: string[];
  slug: string;
  detailedDescription?: string;
  metrics?: string[];
  
  // Enhanced fields for immersive view
  gallery?: string[];       // Additional images for carousel
  duration?: string;        // Project timeline (e.g., "3 months")
  role?: string;            // Your role in the project
  team?: string;            // Team size (e.g., "5 developers")
  challenge?: string;       // Problem/challenge statement
  solution?: string;        // How you solved it
  features?: Feature[];     // Key features with descriptions
  results?: Result[];       // Measurable outcomes
  testimonial?: Testimonial; // Client/stakeholder feedback
  tags?: string[];          // Additional categorization
  year?: number;            // Project year
}

export interface Technology {
  name: string;
  icon: React.ReactNode;
}

export interface TechCategory {
  title: string;
  technologies: Technology[];
}

// Command Palette Types
export type CommandCategory = 'Navigation' | 'Theme' | 'Projects' | 'Actions';

export interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: CommandCategory;
  keywords: string[];
  shortcut?: string;
  action: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: Page;
  onNavigate: (page: Page) => void;
  theme: string;
  toggleTheme: () => void;
  isMobileView: boolean;
}
