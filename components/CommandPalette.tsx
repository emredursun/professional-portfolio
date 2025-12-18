import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandPaletteProps, Command } from '../types';
import { useCommandPalette } from './hooks/useCommandPalette.tsx';

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  activePage,
  onNavigate,
  theme,
  toggleTheme,
  isMobileView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { commands, recentCommands, searchCommands, executeCommand } = useCommandPalette({
    activePage,
    onNavigate,
    theme,
    toggleTheme,
    onClose,
  });

  // Get filtered commands based on search
  const filteredCommands = searchQuery.trim() 
    ? searchCommands(searchQuery)
    : commands;

  // Category grouping
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.querySelector(
        `[data-command-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, executeCommand, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Navigation':
        return 'text-blue-500 dark:text-blue-400';
      case 'Theme':
        return 'text-yellow-500 dark:text-cyan-400';
      case 'Projects':
        return 'text-purple-500 dark:text-purple-400';
      case 'Actions':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-500';
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-current">{part}</mark>
        : part
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[10vh] px-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Command Palette Container */}
          <div className="relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="relative border-b border-gray-200 dark:border-gray-700">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <i className="fas fa-search text-lg" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="w-full bg-transparent pl-12 pr-4 py-4 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            {/* Commands List */}
            <div
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto overscroll-contain"
              style={{ scrollbarWidth: 'thin' }}
            >
              {/* Recent Commands Section */}
              {!searchQuery && recentCommands.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <i className="far fa-clock" />
                    Recent
                  </div>
                  {recentCommands.map((cmd, index) => (
                    <CommandItem
                      key={`recent-${cmd.id}`}
                      command={cmd}
                      isSelected={selectedIndex === index}
                      index={index}
                      searchQuery={searchQuery}
                      getCategoryColor={getCategoryColor}
                      highlightMatch={highlightMatch}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    />
                  ))}
                </div>
              )}

              {/* Grouped Commands */}
              {filteredCommands.length > 0 ? (
                Object.entries(groupedCommands).map(([category, categoryCommands], catIndex) => (
                  <div key={category} className={catIndex > 0 || (!searchQuery && recentCommands.length > 0) ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {category}
                    </div>
                    {categoryCommands.map((cmd) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      return (
                        <CommandItem
                          key={cmd.id}
                          command={cmd}
                          isSelected={selectedIndex === globalIndex}
                          index={globalIndex}
                          searchQuery={searchQuery}
                          getCategoryColor={getCategoryColor}
                          highlightMatch={highlightMatch}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-search text-3xl mb-3 opacity-50" />
                  <p className="text-sm">No commands found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">esc</kbd>
                  Close
                </span>
              </div>
              <span className="hidden sm:block">
                {filteredCommands.length} {filteredCommands.length === 1 ? 'command' : 'commands'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Command Item Component
interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  index: number;
  searchQuery: string;
  getCategoryColor: (category: string) => string;
  highlightMatch: (text: string, query: string) => React.ReactNode;
  onClick: () => void;
  onMouseEnter: () => void;
}

const CommandItem: React.FC<CommandItemProps> = React.memo(({
  command,
  isSelected,
  index,
  searchQuery,
  getCategoryColor,
  highlightMatch,
  onClick,
  onMouseEnter,
}) => {
  return (
    <motion.div
      data-command-index={index}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
      className={`
        flex items-center gap-4 px-4 py-3 cursor-pointer transition-all duration-150
        ${isSelected 
          ? 'bg-yellow-50 dark:bg-cyan-500/10 border-l-2 border-yellow-500 dark:border-cyan-400' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent'
        }
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${
        isSelected 
          ? 'bg-yellow-100 dark:bg-cyan-500/20' 
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <span className={getCategoryColor(command.category)}>
          {command.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white text-sm">
          {highlightMatch(command.label, searchQuery)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {command.description}
        </div>
      </div>

      {/* Shortcut */}
      {command.shortcut && (
        <div className="flex-shrink-0">
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 font-mono">
            {command.shortcut}
          </kbd>
        </div>
      )}
    </motion.div>
  );
});

CommandItem.displayName = 'CommandItem';

export default CommandPalette;
