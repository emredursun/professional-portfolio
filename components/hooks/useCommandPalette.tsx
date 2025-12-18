import { useMemo, useCallback, useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { Command, Page } from '../../types';
import { PROJECTS } from '../../constants.tsx';

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

const RECENT_COMMANDS_KEY = 'commandPaletteRecent';
const MAX_RECENT = 5;

export const useCommandPalette = ({
  activePage,
  onNavigate,
  theme,
  toggleTheme,
  onClose,
}: UseCommandPaletteProps): UseCommandPaletteReturn => {
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
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
      console.log(`${label} copied to clipboard`);
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
        label: 'Go to About',
        description: 'View profile and services',
        icon: <i className="far fa-user" />,
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
        label: 'Go to Resume',
        description: 'View experience and education',
        icon: <i className="far fa-file-alt" />,
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
        label: 'Go to Projects',
        description: 'Browse portfolio projects',
        icon: <i className="far fa-folder-open" />,
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
        label: 'Go to Contact',
        description: 'Get in touch',
        icon: <i className="far fa-envelope" />,
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
        label: 'Download Resume',
        description: 'Download PDF version',
        icon: <i className="fas fa-download" />,
        category: 'Actions',
        keywords: ['download', 'resume', 'cv', 'pdf'],
        action: () => {
          const link = document.createElement('a');
          link.href = '/Emre_Dursun_Resume.pdf';
          link.download = 'Emre_Dursun_Resume.pdf';
          link.click();
          onClose();
        },
      },

      // Theme Commands
      {
        id: 'theme-toggle',
        label: 'Toggle Theme',
        description: 'Switch between light and dark',
        icon: theme === 'light' 
          ? <i className="fas fa-moon" /> 
          : <i className="fas fa-sun" />,
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
        label: 'Switch to Light Theme',
        description: 'Enable light mode',
        icon: <i className="fas fa-sun" />,
        category: 'Theme',
        keywords: ['light', 'theme', 'bright', 'day'],
        action: () => {
          if (theme !== 'light') toggleTheme();
          onClose();
        },
      },
      {
        id: 'theme-dark',
        label: 'Switch to Dark Theme',
        description: 'Enable dark mode',
        icon: <i className="fas fa-moon" />,
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
        label: 'Scroll to Top',
        description: 'Return to top of page',
        icon: <i className="fas fa-arrow-up" />,
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
        label: 'Copy Email Address',
        description: 'info.emredursun@gmail.com',
        icon: <i className="fas fa-copy" />,
        category: 'Actions',
        keywords: ['copy', 'email', 'contact', 'clipboard'],
        action: () => {
          copyToClipboard('info.emredursun@gmail.com', 'Email');
          onClose();
        },
      },
      {
        id: 'action-copy-linkedin',
        label: 'Copy LinkedIn URL',
        description: 'Get LinkedIn profile link',
        icon: <i className="fab fa-linkedin" />,
        category: 'Actions',
        keywords: ['copy', 'linkedin', 'profile', 'social'],
        action: () => {
          copyToClipboard('https://www.linkedin.com/in/emre-dursun-nl', 'LinkedIn URL');
          onClose();
        },
      },
    ];

    // Add project-specific commands
    const projectCommands: Command[] = PROJECTS.map((project) => ({
      id: `project-${project.slug}`,
      label: `View ${project.title}`,
      description: project.description.substring(0, 60) + '...',
      icon: <i className="fas fa-folder" />,
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
      label: `Filter: ${category}`,
      description: `Show only ${category} projects`,
      icon: <i className="fas fa-filter" />,
      category: 'Projects' as const,
      keywords: ['filter', category.toLowerCase(), 'category', 'projects'],
      action: () => {
        onNavigate('Projects');
        // Note: This would require exposing filter state management
        // For now, navigates to projects page
        onClose();
      },
    }));

    return [...allCommands, ...projectCommands, ...categoryCommands];
  }, [onNavigate, theme, toggleTheme, onClose, scrollToTop, copyToClipboard]);

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
