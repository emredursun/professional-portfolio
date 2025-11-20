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
  description: string;
  technologies: string[];
}

export interface Technology {
  name: string;
  icon: React.ReactNode;
}

export interface TechCategory {
  title: string;
  technologies: Technology[];
}