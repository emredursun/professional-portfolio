import React from 'react';

export type Page = 'About' | 'Resume' | 'Projects' | 'Contact';

export interface Service {
  // Fix for: Cannot find namespace 'JSX'.
  icon: React.ReactNode;
  title: string;
  description: string;
  tags?: string[];
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

export interface Project {
  title: string;
  category: string;
  image: string;
  url?: string;
  github?: string;
  description: string;
  technologies: string[];
  slug: string;
  detailedDescription?: string;
  metrics?: string[];
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
