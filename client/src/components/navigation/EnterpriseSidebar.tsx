/**
 * Enterprise Sidebar v2.0
 * Advanced navigation with search, keyboard shortcuts, collapsible sections, and motion optimization
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdaptiveUI } from "@/../../state/ui/UserExperienceMode";
import { useAdvancedFeedback } from "@/../../hooks/useInteractiveFeedback";

// Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: string | number;
  children?: NavigationItem[];
  description?: string;
  shortcuts?: string[];
  category?: "main" | "secondary" | "tools" | "settings";
  permissions?: string[];
  featured?: boolean;
  new?: boolean;
}

export interface NavigationConfig {
  collapsible: boolean;
  searchable: boolean;
  keyboardShortcuts: boolean;
  showBadges: boolean;
  showDescriptions: boolean;
  showShortcuts: boolean;
  animationDuration: number;
  compactMode: boolean;
  multiLevel: boolean;
  recentItems: boolean;
  favorites: boolean;
}

interface EnterpriseSidebarProps {
  items: NavigationItem[];
  config: NavigationConfig;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  onNavigation?: (item: NavigationItem) => void;
  className?: string;
}

// Keyboard shortcut manager
class KeyboardShortcutManager {
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

// Search functionality
class NavigationSearch {
  private items: NavigationItem[] = [];
  private searchIndex: Map<string, NavigationItem[]> = new Map();

  public setItems(items: NavigationItem[]): void {
    this.items = items;
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    this.searchIndex.clear();

    const addToIndex = (term: string, item: NavigationItem) => {
      const normalizedTerm = term.toLowerCase();
      if (!this.searchIndex.has(normalizedTerm)) {
        this.searchIndex.set(normalizedTerm, []);
      }
      this.searchIndex.get(normalizedTerm)!.push(item);
    };

    this.items.forEach((item) => {
      // Add label and description
      addToIndex(item.label, item);
      if (item.description) {
        addToIndex(item.description, item);
      }

      // Add category
      if (item.category) {
        addToIndex(item.category, item);
      }

      // Add children
      if (item.children) {
        item.children.forEach((child) => {
          addToIndex(child.label, child);
          if (child.description) {
            addToIndex(child.description, child);
          }
        });
      }
    });
  }

  public search(query: string): NavigationItem[] {
    if (!query.trim()) return this.items;

    const normalizedQuery = query.toLowerCase();
    const results: NavigationItem[] = [];
    const seen = new Set<string>();

    // Exact matches first
    this.searchIndex.forEach((items, term) => {
      if (term.includes(normalizedQuery)) {
        items.forEach((item) => {
          if (!seen.has(item.id)) {
            results.push(item);
            seen.add(item.id);
          }
        });
      }
    });

    return results;
  }
}

// Recent items manager
class RecentItemsManager {
  private recentItems: NavigationItem[] = [];
  private maxItems: number = 10;

  public addItem(item: NavigationItem): void {
    // Remove if already exists
    this.recentItems = this.recentItems.filter((i) => i.id !== item.id);

    // Add to beginning
    this.recentItems.unshift(item);

    // Limit to max items
    this.recentItems = this.recentItems.slice(0, this.maxItems);

    this.saveToStorage();
  }

  public getRecentItems(): NavigationItem[] {
    return this.recentItems;
  }

  public clearRecentItems(): void {
    this.recentItems = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        "recent-nav-items",
        JSON.stringify(this.recentItems),
      );
    } catch (error) {
      console.warn("Failed to save recent items to storage");
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("recent-nav-items");
      if (stored) {
        this.recentItems = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load recent items from storage");
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

// Favorites manager
class FavoritesManager {
  private favorites: Set<string> = new Set();

  public toggleFavorite(itemId: string): void {
    if (this.favorites.has(itemId)) {
      this.favorites.delete(itemId);
    } else {
      this.favorites.add(itemId);
    }
    this.saveToStorage();
  }

  public isFavorite(itemId: string): boolean {
    return this.favorites.has(itemId);
  }

  public getFavoriteItems(allItems: NavigationItem[]): NavigationItem[] {
    return allItems.filter((item) => this.favorites.has(item.id));
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        "favorite-nav-items",
        JSON.stringify(Array.from(this.favorites)),
      );
    } catch (error) {
      console.warn("Failed to save favorites to storage");
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("favorite-nav-items");
      if (stored) {
        this.favorites = new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load favorites from storage");
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

// Main Component
const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  items,
  config,
  collapsed = false,
  onCollapseChange,
  onNavigation,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<string>("");
  const [hoveredItem, setHoveredItem] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { config: uiConfig } = useAdaptiveUI({
    userId: "user-123",
    role: "professional",
    experienceLevel: "intermediate",
    preferredTaskTypes: ["reporting"],
    usagePatterns: {
      averageSessionDuration: 1800,
      mostUsedFeatures: ["dashboard", "reports"],
      keyboardShortcutUsage: 0.6,
      mouseClickFrequency: 0.4,
      errorRate: 0.02,
    },
    accessibilityPreferences: {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
    },
    uiPreferences: {
      density: "comfortable",
      theme: "dark",
      sidebarCollapsed: false,
      showTooltips: true,
      showKeyboardShortcuts: true,
    },
  });

  const { elementRef, triggerClick, setInteractionEnabled } =
    useAdvancedFeedback({
      visualFeedback: true,
      hapticFeedback: uiConfig.features.keyboardShortcuts,
      soundFeedback: false,
      glow: true,
      parallax: true,
    });

  // Managers
  const [keyboardManager] = useState(() => new KeyboardShortcutManager());
  const [searchManager] = useState(() => new NavigationSearch());
  const [recentManager] = useState(() => new RecentItemsManager());
  const [favoritesManager] = useState(() => new FavoritesManager());

  // Initialize
  useEffect(() => {
    searchManager.setItems(items);

    // Register keyboard shortcuts
    if (config.keyboardShortcuts) {
      keyboardManager.registerShortcut("ctrl+k", () => {
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      });

      keyboardManager.registerShortcut("escape", () => {
        setShowSearch(false);
        setSearchQuery("");
      });

      keyboardManager.registerShortcut("ctrl+b", () => {
        onCollapseChange?.(!collapsed);
      });
    }

    // Add keyboard event listener
    document.addEventListener("keydown", keyboardManager.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", keyboardManager.handleKeyDown);
    };
  }, [items, config.keyboardShortcuts, collapsed, onCollapseChange]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return searchManager.search(searchQuery);
  }, [items, searchQuery, searchManager]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, NavigationItem[]> = {
      main: [],
      secondary: [],
      tools: [],
      settings: [],
    };

    filteredItems.forEach((item) => {
      const category = item.category || "main";
      groups[category].push(item);
    });

    return groups;
  }, [filteredItems]);

  // Navigation handlers
  const handleItemClick = useCallback(
    (item: NavigationItem) => {
      setActiveItem(item.id);
      onNavigation?.(item);
      recentManager.addItem(item);
      triggerClick();

      if (item.children && item.children.length > 0) {
        setExpandedItems((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
            newSet.delete(item.id);
          } else {
            newSet.add(item.id);
          }
          return newSet;
        });
      }
    },
    [onNavigation, recentManager, triggerClick],
  );

  const toggleFavorite = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      favoritesManager.toggleFavorite(itemId);
    },
    [favoritesManager],
  );

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = activeItem === item.id;
    const isHovered = hoveredItem === item.id;
    const isExpanded = expandedItems.has(item.id);
    const isFavorite = favoritesManager.isFavorite(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const paddingLeft = level * (config.compactMode ? 12 : 20);

    return (
      <motion.div
        key={item.id}
        className="navigation-item-wrapper"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: level * 0.05 }}
      >
        <motion.div
          className={`navigation-item ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem("")}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="navigation-item-content">
            <div className="navigation-item-icon">{item.icon}</div>

            {!collapsed && (
              <>
                <div className="navigation-item-text">
                  <div className="navigation-item-label">
                    {item.label}
                    {item.new && <span className="new-badge">NEW</span>}
                    {item.featured && (
                      <span className="featured-badge">⭐</span>
                    )}
                  </div>

                  {config.showDescriptions && item.description && (
                    <div className="navigation-item-description">
                      {item.description}
                    </div>
                  )}
                </div>

                <div className="navigation-item-meta">
                  {config.showBadges && item.badge && (
                    <span className="navigation-badge">
                      {typeof item.badge === "number" && item.badge > 99
                        ? "99+"
                        : item.badge}
                    </span>
                  )}

                  {config.favorites && (
                    <button
                      className={`favorite-button ${isFavorite ? "active" : ""}`}
                      onClick={(e) => toggleFavorite(e, item.id)}
                    >
                      {isFavorite ? "⭐" : "☆"}
                    </button>
                  )}

                  {hasChildren && (
                    <button
                      className={`expand-button ${isExpanded ? "expanded" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  )}

                  {config.showShortcuts && item.shortcuts && (
                    <div className="shortcut-hint">{item.shortcuts[0]}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {hasChildren && isExpanded && !collapsed && (
            <motion.div
              className="navigation-children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {item.children!.map((child) =>
                renderNavigationItem(child, level + 1),
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      ref={elementRef}
      className={`enterprise-sidebar ${collapsed ? "collapsed" : ""} ${className}`}
      layout
      transition={{
        duration: config.animationDuration / 1000,
        ease: "easeInOut",
      }}
    >
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <motion.div
            className="sidebar-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            AccuBooks
          </motion.div>
        )}

        {config.collapsible && (
          <button
            className="collapse-toggle"
            onClick={() => onCollapseChange?.(!collapsed)}
          >
            {collapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Search */}
      {config.searchable && !collapsed && (
        <motion.div
          className="sidebar-search"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => {
                if (!searchQuery) setShowSearch(false);
              }}
              className="search-input"
            />
            {showSearch && (
              <div className="search-shortcut">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Navigation Items */}
      <div className="sidebar-navigation">
        {Object.entries(groupedItems).map(
          ([category, categoryItems]) =>
            categoryItems.length > 0 && (
              <div key={category} className="navigation-category">
                {!collapsed && (
                  <div className="category-header">
                    <h4 className="category-title">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h4>
                  </div>
                )}

                <div className="category-items">
                  {categoryItems.map((item) => renderNavigationItem(item))}
                </div>
              </div>
            ),
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <motion.div
          className="sidebar-footer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {config.recentItems && recentManager.getRecentItems().length > 0 && (
            <div className="recent-items">
              <h4 className="footer-title">Recent</h4>
              <div className="recent-items-list">
                {recentManager
                  .getRecentItems()
                  .slice(0, 3)
                  .map((item) => (
                    <button
                      key={item.id}
                      className="recent-item"
                      onClick={() => handleItemClick(item)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <style jsx>{`
        .enterprise-sidebar {
          width: ${collapsed ? "60px" : "280px"};
          height: 100vh;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          transition: width ${config.animationDuration}ms ease;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .collapse-toggle {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background 0.2s;
        }

        .collapse-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-search {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-container {
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-shortcut {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 0.25rem;
        }

        .search-shortcut kbd {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          color: white;
        }

        .sidebar-navigation {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .navigation-category {
          margin-bottom: 1rem;
        }

        .category-header {
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
        }

        .category-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .navigation-item {
          position: relative;
          margin-bottom: 0.25rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .navigation-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .navigation-item.active {
          background: rgba(59, 130, 246, 0.2);
          border-left: 3px solid #3b82f6;
        }

        .navigation-item-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .navigation-item-icon {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
        }

        .navigation-item-text {
          flex: 1;
          min-width: 0;
        }

        .navigation-item-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .new-badge {
          background: #10b981;
          color: white;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-weight: 600;
        }

        .featured-badge {
          font-size: 0.75rem;
        }

        .navigation-item-description {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
        }

        .navigation-item-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .navigation-badge {
          background: #ef4444;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 1rem;
          font-weight: 600;
          min-width: 1.5rem;
          text-align: center;
        }

        .favorite-button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .favorite-button:hover {
          color: white;
        }

        .favorite-button.active {
          color: #fbbf24;
        }

        .expand-button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 0.25rem;
          transition: transform 0.2s;
        }

        .expand-button.expanded {
          transform: rotate(180deg);
        }

        .shortcut-hint {
          font-size: 0.625rem;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .navigation-children {
          overflow: hidden;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .recent-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .recent-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 0.375rem;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s;
        }

        .recent-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .recent-item span {
          font-size: 0.875rem;
        }
      `}</style>
    </motion.div>
  );
};

export default EnterpriseSidebar;
