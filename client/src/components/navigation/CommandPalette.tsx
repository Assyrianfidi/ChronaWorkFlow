
declare global {
  interface Window {
    [key: string]: any;
  }
}

/**
 * Command Palette
 * Advanced command palette for quick navigation, actions, and search
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-ignore
import { useAdvancedFeedback } from '../../hooks/useInteractiveFeedback.js.js';

// Types
export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  category: "navigation" | "action" | "search" | "settings" | "help";
  keywords?: string[];
  action?: () => void | Promise<void>;
  href?: string;
  shortcut?: string[];
  priority?: number;
  recent?: boolean;
  favorite?: boolean;
}

export interface CommandPaletteConfig {
  placeholder?: string;
  maxResults?: number;
  showShortcuts?: boolean;
  showRecent?: boolean;
  showFavorites?: boolean;
  categories?: string[];
  enableGlobalShortcuts?: boolean;
  animationDuration?: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
  config?: CommandPaletteConfig;
  className?: string;
}

// Command search and filtering
class CommandSearchEngine {
  private items: CommandItem[] = [];
  private searchIndex: Map<string, CommandItem[]> = new Map();
  private recentItems: CommandItem[] = [];
  private favoriteItems: Set<string> = new Set();

  public setItems(items: CommandItem[]): void {
    this.items = items;
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    this.searchIndex.clear();

    const addToIndex = (term: string, item: CommandItem) => {
      const normalizedTerm = term.toLowerCase();
      if (!this.searchIndex.has(normalizedTerm)) {
        this.searchIndex.set(normalizedTerm, []);
      }
      this.searchIndex.get(normalizedTerm)!.push(item);
    };

    this.items.forEach((item) => {
      // Add title
      addToIndex(item.title, item);

      // Add description
      if (item.description) {
        addToIndex(item.description, item);
      }

      // Add keywords
      if (item.keywords) {
        item.keywords.forEach((keyword) => addToIndex(keyword, item));
      }

      // Add category
      addToIndex(item.category, item);
    });
  }

  public search(query: string): CommandItem[] {
    if (!query.trim()) {
      return this.items;
    }

    const normalizedQuery = query.toLowerCase();
    const results: CommandItem[] = [];
    const scores = new Map<string, number>();

    // Calculate relevance scores
    this.searchIndex.forEach((items, term) => {
      if (term.includes(normalizedQuery)) {
        items.forEach((item) => {
          const currentScore = scores.get(item.id) || 0;
          const relevanceScore = this.calculateRelevanceScore(
            term,
            normalizedQuery,
          );
          scores.set(item.id, currentScore + relevanceScore);

          if (!results.find((r) => r.id === item.id)) {
            results.push(item);
          }
        });
      }
    });

    // Sort by score and priority
    return results.sort((a, b) => {
      const scoreA = scores.get(a.id) || 0;
      const scoreB = scores.get(b.id) || 0;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return (b.priority || 0) - (a.priority || 0);
    });
  }

  private calculateRelevanceScore(term: string, query: string): number {
    if (term === query) return 100;
    if (term.startsWith(query)) return 80;
    if (term.includes(query)) return 60;
    if (this.fuzzyMatch(term, query)) return 40;
    return 10;
  }

  private fuzzyMatch(str: string, query: string): boolean {
    let strIndex = 0;
    let queryIndex = 0;

    while (strIndex < str.length && queryIndex < query.length) {
      if (str[strIndex] === query[queryIndex]) {
        queryIndex++;
      }
      strIndex++;
    }

    return queryIndex === query.length;
  }

  public setRecentItems(items: CommandItem[]): void {
    this.recentItems = items;
  }

  public getRecentItems(): CommandItem[] {
    return this.recentItems;
  }

  public addRecentItem(item: CommandItem): void {
    this.recentItems = this.recentItems.filter((i) => i.id !== item.id);
    this.recentItems.unshift(item);
    this.recentItems = this.recentItems.slice(0, 10);
  }

  public toggleFavorite(itemId: string): void {
    if (this.favoriteItems.has(itemId)) {
      this.favoriteItems.delete(itemId);
    } else {
      this.favoriteItems.add(itemId);
    }
  }

  public isFavorite(itemId: string): boolean {
    return this.favoriteItems.has(itemId);
  }

  public getFavoriteItems(): CommandItem[] {
    return this.items.filter((item) => this.favoriteItems.has(item.id));
  }
}

// Keyboard shortcuts manager
class CommandShortcutManager {
  private shortcuts: Map<string, () => void> = new Map();
  private enabled: boolean = true;

  public registerShortcut(keys: string, callback: () => void): void {
    this.shortcuts.set(keys.toLowerCase(), callback);
  }

  public unregisterShortcut(keys: string): void {
    this.shortcuts.delete(keys.toLowerCase());
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;

    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push("ctrl");
    if (e.altKey) keys.push("alt");
    if (e.shiftKey) keys.push("shift");
    if (e.key.length === 1) keys.push(e.key.toLowerCase());
    else keys.push(e.key.toLowerCase());

    const combo = keys.join("+");
    const callback = this.shortcuts.get(combo);

    if (callback) {
      e.preventDefault();
      callback();
    }
  };
}

// Main Component
// @ts-ignore
const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  config = {},
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isExecuting, setIsExecuting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { elementRef, triggerClick } = useAdvancedFeedback({
    visualFeedback: true,
    hapticFeedback: true,
    soundFeedback: false,
    glow: true,
  });

  const defaultConfig: Required<CommandPaletteConfig> = {
    placeholder: "Type a command or search...",
    maxResults: 50,
    showShortcuts: true,
    showRecent: true,
    showFavorites: true,
    categories: ["navigation", "action", "search", "settings", "help"],
    enableGlobalShortcuts: true,
    animationDuration: 200,
    ...config,
  };

  // Managers
  const [searchEngine] = useState(() => new CommandSearchEngine());
  const [shortcutManager] = useState(() => new CommandShortcutManager());

  // Initialize
  useEffect(() => {
    searchEngine.setItems(items);

    if (defaultConfig.enableGlobalShortcuts) {
      shortcutManager.registerShortcut("ctrl+k", () => {
        if (!isOpen) {
          // This would be handled by parent component
        }
      });

      shortcutManager.registerShortcut("escape", () => {
        if (isOpen) {
          onClose();
        }
      });
    }

    document.addEventListener("keydown", shortcutManager.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", shortcutManager.handleKeyDown);
    };
  }, [items, isOpen, onClose, defaultConfig.enableGlobalShortcuts]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    let results = searchEngine.search(searchQuery);

    // Filter by category
    if (selectedCategory !== "all") {
      results = results.filter((item) => item.category === selectedCategory);
    }

    // Limit results
    return results.slice(0, defaultConfig.maxResults);
  }, [searchQuery, selectedCategory, searchEngine, defaultConfig.maxResults]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};

    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [filteredItems]);

  // Categories for filtering
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => cats.add(item.category));
    return Array.from(cats);
  }, [items]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = filteredItems.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case "Enter":
          e.preventDefault();
          executeSelectedItem();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredItems.length, onClose],
  );

  // Execute selected item
  const executeSelectedItem = useCallback(async () => {
    const selectedItem = filteredItems[selectedIndex];
    if (!selectedItem || isExecuting) return;

    setIsExecuting(true);

    try {
      // Add to recent
      searchEngine.addRecentItem(selectedItem);

      // Execute action or navigate
      if (selectedItem.action) {
        await selectedItem.action();
      } else if (selectedItem.href) {
        window.location.href = selectedItem.href;
      }

      triggerClick();
      onClose();
    } catch (error) {
      console.error("Error executing command:", error);
    } finally {
      setIsExecuting(false);
    }
  }, [
    filteredItems,
    selectedIndex,
    isExecuting,
    searchEngine,
    triggerClick,
    onClose,
  ]);

  // Handle item click
  const handleItemClick = useCallback(
    async (item: CommandItem, index: number) => {
      setSelectedIndex(index);
      executeSelectedItem();
    },
    [executeSelectedItem],
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      searchEngine.toggleFavorite(itemId);
    },
    [searchEngine],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[
        selectedIndex
// @ts-ignore
      ] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <motion.div
      className={`command-palette-overlay ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: defaultConfig.animationDuration / 1000 }}
      onClick={onClose}
    >
      <motion.div
        ref={elementRef}
        className="command-palette"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: defaultConfig.animationDuration / 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="command-palette-search">
          <div className="search-icon">🔍</div>
          <input
            ref={inputRef}
            type="text"
            placeholder={defaultConfig.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          <div className="search-shortcuts">
            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
            <kbd>Enter</kbd> to select
            <kbd>Esc</kbd> to close
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="command-palette-categories">
            <button
              className={`category-button ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-button ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Recent Items */}
        {defaultConfig.showRecent &&
          searchEngine.getRecentItems().length > 0 &&
          !searchQuery && (
            <div className="command-palette-section">
              <div className="section-header">
                <h3>Recent</h3>
              </div>
              <div className="command-list">
                {searchEngine
                  .getRecentItems()
                  .slice(0, 5)
                  .map((item, index) => (
                    <CommandItemComponent
                      key={`recent-${item.id}`}
                      item={item}
                      index={index}
                      isSelected={selectedIndex === index}
                      onClick={() => handleItemClick(item, index)}
                      onToggleFavorite={toggleFavorite}
                      showShortcuts={defaultConfig.showShortcuts}
                      searchEngine={searchEngine}
                    />
                  ))}
              </div>
            </div>
          )}

        {/* Favorite Items */}
        {defaultConfig.showFavorites &&
          searchEngine.getFavoriteItems().length > 0 &&
          !searchQuery && (
            <div className="command-palette-section">
              <div className="section-header">
                <h3>Favorites</h3>
              </div>
              <div className="command-list">
                {searchEngine
                  .getFavoriteItems()
                  .slice(0, 5)
                  .map((item, index) => (
                    <CommandItemComponent
                      key={`favorite-${item.id}`}
                      item={item}
                      index={index}
                      isSelected={selectedIndex === index}
                      onClick={() => handleItemClick(item, index)}
                      onToggleFavorite={toggleFavorite}
                      showShortcuts={defaultConfig.showShortcuts}
                      searchEngine={searchEngine}
                    />
                  ))}
              </div>
            </div>
          )}

        {/* Search Results */}
        <div className="command-palette-results" ref={listRef}>
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="command-palette-section">
              {searchQuery && (
                <div className="section-header">
                  <h3>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <span className="section-count">{categoryItems.length}</span>
                </div>
              )}
              <div className="command-list">
                {categoryItems.map((item, index) => {
                  const globalIndex = filteredItems.indexOf(item);
                  return (
                    <CommandItemComponent
                      key={item.id}
                      item={item}
                      index={globalIndex}
                      isSelected={selectedIndex === globalIndex}
                      onClick={() => handleItemClick(item, globalIndex)}
                      onToggleFavorite={toggleFavorite}
                      showShortcuts={defaultConfig.showShortcuts}
                      searchEngine={searchEngine}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-text">
                No results found for "{searchQuery}"
              </div>
              <div className="no-results-hint">
                Try different keywords or check spelling
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isExecuting && (
          <div className="command-palette-loading">
            <div className="loading-spinner"></div>
            <span>Executing...</span>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        .command-palette-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 20vh;
          z-index: 1000;
        }

        .command-palette {
          width: 90%;
          max-width: 600px;
          max-height: 70vh;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .command-palette-search {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          gap: 0.75rem;
        }

        .search-icon {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.25rem;
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          outline: none;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .search-shortcuts {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .search-shortcuts kbd {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .command-palette-categories {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .category-button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .category-button.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          color: white;
        }

        .command-palette-section {
          margin-bottom: 1rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
        }

        .section-header h3 {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .command-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .command-palette-results {
          flex: 1;
          overflow-y: auto;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .no-results-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-results-text {
          color: white;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .no-results-hint {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .command-palette-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }

        .loading-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </motion.div>
  );
};

// Command Item Component
interface CommandItemComponentProps {
  item: CommandItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent, itemId: string) => void;
  showShortcuts: boolean;
  searchEngine: CommandSearchEngine;
}

// @ts-ignore
const CommandItemComponent: React.FC<CommandItemComponentProps> = ({
  item,
  index,
  isSelected,
  onClick,
  onToggleFavorite,
  showShortcuts,
  searchEngine,
}) => {
  const isFavorite = searchEngine.isFavorite(item.id);

  return (
    <motion.div
      className={`command-item ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <div className="command-item-content">
        <div className="command-item-icon">
          {item.icon || <div className="default-icon">📄</div>}
        </div>

        <div className="command-item-text">
          <div className="command-item-title">
            {item.title}
            {item.recent && <span className="recent-badge">Recent</span>}
          </div>
          {item.description && (
            <div className="command-item-description">{item.description}</div>
          )}
        </div>

        <div className="command-item-meta">
          {showShortcuts && item.shortcut && (
            <div className="command-shortcuts">
              {item.shortcut.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </div>
          )}

          <button
            className={`favorite-button ${isFavorite ? "active" : ""}`}
            onClick={(e) => onToggleFavorite(e, item.id)}
          >
            {isFavorite ? "⭐" : "☆"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .command-item {
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .command-item:hover,
        .command-item.selected {
          background: rgba(255, 255, 255, 0.05);
        }

        .command-item.selected {
          background: rgba(59, 130, 246, 0.1);
          border-left-color: #3b82f6;
        }

        .command-item-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .command-item-icon {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
        }

        .default-icon {
          font-size: 1rem;
        }

        .command-item-text {
          flex: 1;
          min-width: 0;
        }

        .command-item-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .recent-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-weight: 600;
        }

        .command-item-description {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
        }

        .command-item-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .command-shortcuts {
          display: flex;
          gap: 0.25rem;
        }

        .command-shortcuts kbd {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .favorite-button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .favorite-button:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .favorite-button.active {
          color: #fbbf24;
        }
      `}</style>
    </motion.div>
  );
};

export default CommandPalette;
