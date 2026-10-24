import { useMemo, useCallback, useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next';
import { Command, Page } from '../../types';
import { PROJECTS } from '../../constants.tsx';
import { cvFileName } from '../../src/utils/cv.ts';

interface UseCommandPaletteProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  theme: string;
  toggleTheme: () => void;
  onClose: () => void;
}

interface UseCommandPaletteReturn {
  commands: Command[];
  recentCommands: Command[];
  searchCommands: (query: string) => Command[];
  executeCommand: (command: Command) => void;
}

/** Command id -> its key under palette.commands in common.json. */
const COMMAND_KEYS: Record<string, string> = {
  'nav-about': 'navAbout',
  'nav-resume': 'navResume',
  'nav-projects': 'navProjects',
  'nav-contact': 'navContact',
  'action-download-resume': 'downloadResume',
  'theme-toggle': 'toggleTheme',
  'theme-light': 'lightTheme',
  'theme-dark': 'darkTheme',
  'action-scroll-top': 'scrollTop',
  'action-copy-email': 'copyEmail',
  'action-copy-linkedin': 'copyLinkedIn',
};

const RECENT_COMMANDS_KEY = 'commandPaletteRecent';
const MAX_RECENT = 5;

export const useCommandPalette = ({
  activePage,
  onNavigate,
  theme,
  toggleTheme,
  onClose,
}: UseCommandPaletteProps): UseCommandPaletteReturn => {
  // Labels and descriptions follow the page language and are what Fuse
  // searches first; the English keywords below still match in every language.
  const { t } = useTranslation('common');
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Scroll to top utility
  const scrollToTop = useCallback(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const contentEl = document.querySelector('.main-content') as HTMLElement;
      if (contentEl) {
        contentEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  // Copy to clipboard utility
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Build all available commands
  const commands = useMemo<Command[]>(() => {
    const allCommands: Command[] = [
      // Navigation Commands
      {
        id: 'nav-about',
        label: t('palette.commands.navAbout.label'),
        description: t('palette.commands.navAbout.description'),
        icon: <i aria-hidden="true" className="far fa-user" />,
        category: 'Navigation',
        keywords: ['about', 'profile', 'home', 'services'],
        shortcut: '⌘1',
        action: () => {
          onNavigate('About');
          onClose();
        },
      },
      {
        id: 'nav-resume',
        label: t('palette.commands.navResume.label'),
        description: t('palette.commands.navResume.description'),
        icon: <i aria-hidden="true" className="far fa-file-alt" />,
        category: 'Navigation',
        keywords: ['resume', 'cv', 'experience', 'work', 'education'],
        shortcut: '⌘2',
        action: () => {
          onNavigate('Resume');
          onClose();
        },
      },
      {
        id: 'nav-projects',
        label: t('palette.commands.navProjects.label'),
        description: t('palette.commands.navProjects.description'),
        icon: <i aria-hidden="true" className="far fa-folder-open" />,
        category: 'Navigation',
        keywords: ['projects', 'portfolio', 'work', 'showcase'],
        shortcut: '⌘3',
        action: () => {
          onNavigate('Projects');
          onClose();
        },
      },
      {
        id: 'nav-contact',
        label: t('palette.commands.navContact.label'),
        description: t('palette.commands.navContact.description'),
        icon: <i aria-hidden="true" className="far fa-envelope" />,
        category: 'Navigation',
        keywords: ['contact', 'email', 'message', 'reach'],
        shortcut: '⌘4',
        action: () => {
          onNavigate('Contact');
          onClose();
        },
      },
      {
        id: 'action-download-resume',
        label: t('palette.commands.downloadResume.label'),
        description: t('palette.commands.downloadResume.description'),
        icon: <i aria-hidden="true" className="fas fa-download" />,
        category: 'Actions',
        keywords: ['download', 'resume', 'cv', 'pdf'],
        action: () => {
          // Same as the sidebar button: production ships a PDF per language
          // (scripts/generate-cv.js); the dev server falls back to printing.
          if (import.meta.env.PROD) {
            // App.tsx keeps <html lang> in step with the i18n language.
            const file = cvFileName(document.documentElement.lang);
            const link = document.createElement('a');
            link.href = `/cv/${file}`;
            link.download = file;
            link.click();
          } else {
            window.print();
          }
          onClose();
        },
      },

      // Theme Commands
      {
        id: 'theme-toggle',
        label: t('palette.commands.toggleTheme.label'),
        description: t('palette.commands.toggleTheme.description'),
        icon: theme === 'light' 
          ? <i aria-hidden="true" className="fas fa-moon" /> 
          : <i aria-hidden="true" className="fas fa-sun" />,
        category: 'Theme',
        keywords: ['theme', 'dark', 'light', 'mode', 'toggle'],
        shortcut: '⌘T',
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: 'theme-light',
        label: t('palette.commands.lightTheme.label'),
        description: t('palette.commands.lightTheme.description'),
        icon: <i aria-hidden="true" className="fas fa-sun" />,
        category: 'Theme',
        keywords: ['light', 'theme', 'bright', 'day'],
        action: () => {
          if (theme !== 'light') toggleTheme();
          onClose();
        },
      },
      {
        id: 'theme-dark',
        label: t('palette.commands.darkTheme.label'),
        description: t('palette.commands.darkTheme.description'),
        icon: <i aria-hidden="true" className="fas fa-moon" />,
        category: 'Theme',
        keywords: ['dark', 'theme', 'night', 'black'],
        action: () => {
          if (theme !== 'dark') toggleTheme();
          onClose();
        },
      },

      // Action Commands
      {
        id: 'action-scroll-top',
        label: t('palette.commands.scrollTop.label'),
        description: t('palette.commands.scrollTop.description'),
        icon: <i aria-hidden="true" className="fas fa-arrow-up" />,
        category: 'Actions',
        keywords: ['scroll', 'top', 'up', 'home'],
        shortcut: '↑',
        action: () => {
          scrollToTop();
          onClose();
        },
      },
      {
        id: 'action-copy-email',
        label: t('palette.commands.copyEmail.label'),
        description: 'info.emredursun@gmail.com',
        icon: <i aria-hidden="true" className="fas fa-copy" />,
        category: 'Actions',
        keywords: ['copy', 'email', 'contact', 'clipboard'],
        action: () => {
          copyToClipboard('info.emredursun@gmail.com');
          onClose();
        },
      },
      {
        id: 'action-copy-linkedin',
        label: t('palette.commands.copyLinkedIn.label'),
        description: t('palette.commands.copyLinkedIn.description'),
        icon: <i aria-hidden="true" className="fab fa-linkedin" />,
        category: 'Actions',
        keywords: ['copy', 'linkedin', 'profile', 'social'],
        action: () => {
          copyToClipboard('https://www.linkedin.com/in/emre-dursun-nl');
          onClose();
        },
      },
    ];

    // Add project-specific commands
    const projectCommands: Command[] = PROJECTS.map((project) => ({
      id: `project-${project.slug}`,
      label: t('palette.commands.viewProject', { title: project.title }),
      description: project.description.substring(0, 60) + '...',
      icon: <i aria-hidden="true" className="fas fa-folder" />,
      category: 'Projects' as const,
      keywords: [
        project.title.toLowerCase(),
        project.category.toLowerCase(),
        ...project.technologies.map(t => t.toLowerCase()),
        'project',
      ],
      action: () => {
        onNavigate('Projects');
        setTimeout(() => {
          window.location.hash = `project-${project.slug}`;
        }, 100);
        onClose();
      },
    }));

    // Add category filter commands
    const categories = Array.from(new Set(PROJECTS.map(p => p.category)));
    const categoryCommands: Command[] = categories.map((category) => ({
      id: `filter-${category.toLowerCase().replace(/\s+/g, '-')}`,
      label: t('palette.commands.filterLabel', { category }),
      description: t('palette.commands.filterDescription', { category }),
      icon: <i aria-hidden="true" className="fas fa-filter" />,
      category: 'Projects' as const,
      keywords: ['filter', category.toLowerCase(), 'category', 'projects'],
      action: () => {
        onNavigate('Projects');
        // Note: This would require exposing filter state management
        // For now, navigates to projects page
        onClose();
      },
    }));

    // The English label is a keyword too, so a phrase such as "download
    // resume" still finds its command on the Dutch and Turkish pages (English
    // is the fallback language, so it is always loaded).
    const searchableInEnglish = allCommands.map((cmd) => {
      const key = COMMAND_KEYS[cmd.id];
      if (!key) return cmd;
      const english = t(`palette.commands.${key}.label`, { lng: 'en' });
      return { ...cmd, keywords: [...(cmd.keywords ?? []), english] };
    });

    return [...searchableInEnglish, ...projectCommands, ...categoryCommands];
  }, [t, onNavigate, theme, toggleTheme, onClose, scrollToTop, copyToClipboard]);

  // Get recent commands based on stored IDs
  const recentCommands = useMemo(() => {
    return recentCommandIds
      .map(id => commands.find(cmd => cmd.id === id))
      .filter((cmd): cmd is Command => cmd !== undefined)
      .slice(0, MAX_RECENT);
  }, [recentCommandIds, commands]);

  // Fuzzy search setup
  const fuse = useMemo(() => {
    return new Fuse(commands, {
      keys: [
        { name: 'label', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'keywords', weight: 1.5 },
      ],
      threshold: 0.3,
      includeScore: true,
    });
  }, [commands]);

  // Search function
  const searchCommands = useCallback((query: string): Command[] => {
    if (!query.trim()) {
      return commands;
    }

    const results = fuse.search(query);
    return results.map(result => result.item);
  }, [fuse, commands]);

  // Execute command and track in recent
  const executeCommand = useCallback((command: Command) => {
    command.action();

    // Update recent commands
    setRecentCommandIds(prev => {
      const filtered = prev.filter(id => id !== command.id);
      const updated = [command.id, ...filtered].slice(0, MAX_RECENT);
      
      try {
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent commands:', error);
      }
      
      return updated;
    });
  }, []);

  return {
    commands,
    recentCommands,
    searchCommands,
    executeCommand,
  };
};
