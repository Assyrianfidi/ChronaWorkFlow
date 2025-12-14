declare global {
  interface Window {
    [key: string]: any;
  }
}

/**
 * Advanced Accessibility Engine v2.0
 * WCAG AAA compliant accessibility system with smart focus management and enhanced features
 */

export interface AccessibilityConfig {
  focusManagement: {
    visibleFocus: boolean;
    focusTrap: boolean;
    skipLinks: boolean;
    restoreFocus: boolean;
  };
  screenReader: {
    announcements: boolean;
    landmarks: boolean;
    descriptions: boolean;
    liveRegions: boolean;
  };
  keyboard: {
    navigation: boolean;
    shortcuts: boolean;
    trapFocus: boolean;
    skipToContent: boolean;
  };
  visual: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    colorBlindness: {
      type: "none" | "protanopia" | "deuteranopia" | "tritanopia";
      enabled: boolean;
    };
  };
  cognitive: {
    simplifiedUI: boolean;
    readingLevel: "basic" | "intermediate" | "advanced";
    helpText: boolean;
    errorPrevention: boolean;
  };
  motor: {
    largerClickTargets: boolean;
    gestureAlternatives: boolean;
    voiceControl: boolean;
    switchNavigation: boolean;
  };
}

export interface FocusRegion {
  id: string;
  element: HTMLElement;
  restoreElement?: HTMLElement;
  isActive: boolean;
}

export interface ScreenReaderAnnouncement {
  message: string;
  priority: "polite" | "assertive";
  timeout?: number;
}

export interface AccessibilityLandmark {
  type:
    | "banner"
    | "navigation"
    | "main"
    | "complementary"
    | "contentinfo"
    | "search"
    | "form"
    | "region";
  label: string;
  element: HTMLElement;
}

export class AccessibilityEngine {
  private config: AccessibilityConfig;
  private focusRegions: Map<string, FocusRegion> = new Map();
  private screenReaderQueue: ScreenReaderAnnouncement[] = [];
  private landmarks: AccessibilityLandmark[] = [];
  private currentFocusElement: Element | null = null;
  private skipLinks: HTMLElement[] = [];
  private announcementElements: Map<string, HTMLElement> = new Map();
  private isInitialized: boolean = false;
  private observers: MutationObserver[] = [];
  private eventListeners: Map<string, EventListener> = new Map();

  constructor(config?: Partial<AccessibilityConfig>) {
    this.config = {
      focusManagement: {
        visibleFocus: true,
        focusTrap: true,
        skipLinks: true,
        restoreFocus: true,
      },
      screenReader: {
        announcements: true,
        landmarks: true,
        descriptions: true,
        liveRegions: true,
      },
      keyboard: {
        navigation: true,
        shortcuts: true,
        trapFocus: true,
        skipToContent: true,
      },
      visual: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        colorBlindness: {
          type: "none",
          enabled: false,
        },
      },
      cognitive: {
        simplifiedUI: false,
        readingLevel: "intermediate",
        helpText: true,
        errorPrevention: true,
      },
      motor: {
        largerClickTargets: false,
        gestureAlternatives: true,
        voiceControl: false,
        switchNavigation: false,
      },
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    this.setupGlobalStyles();
    this.setupEventListeners();
    this.setupSkipLinks();
    this.setupAnnouncementRegions();
    this.detectUserPreferences();
    this.setupLandmarks();
    this.setupFocusManagement();
    this.setupKeyboardNavigation();

    this.isInitialized = true;
  }

  private setupGlobalStyles(): void {
    const styleId = "a11y-global-styles";

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = this.generateAccessibilityCSS();
      document.head.appendChild(style);
    }
  }

  private generateAccessibilityCSS(): string {
    return `
      /* Enhanced Focus Management */
      .a11y-focus-visible {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
        border-radius: 4px;
        box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.3);
      }

      .a11y-focus-visible:focus {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
        border-radius: 4px;
        box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.3);
      }

      /* High Contrast Mode */
      .a11y-high-contrast {
        --bg-primary: #000000;
        --bg-secondary: #ffffff;
        --text-primary: #ffffff;
        --text-secondary: #000000;
        --border-color: #ffffff;
        --focus-color: #ffff00;
      }

      .a11y-high-contrast * {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        border-color: var(--border-color) !important;
      }

      .a11y-high-contrast .a11y-focus-visible {
        outline-color: var(--focus-color) !important;
        box-shadow: 0 0 0 2px var(--focus-color) !important;
      }

      /* Large Text Mode */
      .a11y-large-text {
        font-size: 120% !important;
        line-height: 1.5 !important;
      }

      .a11y-large-text button,
      .a11y-large-text input,
      .a11y-large-text select,
      .a11y-large-text textarea {
        font-size: 120% !important;
        padding: 0.75rem !important;
      }

      /* Reduced Motion */
      .a11y-reduced-motion *,
      .a11y-reduced-motion *::before,
      .a11y-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* Larger Click Targets */
      .a11y-large-targets button,
      .a11y-large-targets a,
      .a11y-large-targets input[type="checkbox"],
      .a11y-large-targets input[type="radio"] {
        min-width: 44px !important;
        min-height: 44px !important;
        padding: 8px !important;
      }

      /* Skip Links */
      .a11y-skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
      }

      .a11y-skip-link:focus {
        top: 6px;
      }

      /* Screen Reader Only Content */
      .a11y-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Live Regions */
      .a11y-live-polite {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }

      .a11y-live-assertive {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }

      /* Color Blindness Filters */
      .a11y-protanopia {
        filter: url(#protanopia-filter);
      }

      .a11y-deuteranopia {
        filter: url(#deuteranopia-filter);
      }

      .a11y-tritanopia {
        filter: url(#tritanopia-filter);
      }

      /* Simplified UI */
      .a11y-simplified {
        background: #fff !important;
        color: #000 !important;
        border: 1px solid #000 !important;
      }

      .a11y-simplified * {
        background: #fff !important;
        color: #000 !important;
        border: 1px solid #000 !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      /* Enhanced Error Messages */
      .a11y-error-message {
        color: #d32f2f;
        font-weight: bold;
        display: block;
        margin-top: 0.5rem;
      }

      /* Success Messages */
      .a11y-success-message {
        color: #388e3c;
        font-weight: bold;
        display: block;
        margin-top: 0.5rem;
      }

      /* Help Text */
      .a11y-help-text {
        font-size: 0.875rem;
        color: #666;
        margin-top: 0.25rem;
      }

      /* Loading Indicators */
      .a11y-loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #333;
        border-radius: 50%;
        animation: a11y-spin 1s linear infinite;
      }

      @keyframes a11y-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .a11y-reduced-motion .a11y-loading {
        animation: none;
        border-top-color: #333;
      }

      /* Progress Indicators */
      .a11y-progress {
        display: inline-block;
        width: 100%;
        height: 20px;
        background: #f0f0f0;
        border-radius: 10px;
        overflow: hidden;
      }

      .a11y-progress-bar {
        height: 100%;
        background: #4caf50;
        transition: width 0.3s ease;
      }

      .a11y-progress[aria-valuenow]::before {
        content: attr(aria-valuenow) "%";
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: #000;
        font-weight: bold;
      }
    `;
  }

  private setupEventListeners(): void {
    // Focus management
    const handleFocusIn = (e: FocusEvent) => {
      this.currentFocusElement = e.target as Element;
      if (this.config.focusManagement.visibleFocus) {
        (e.target as HTMLElement).classList.add("a11y-focus-visible");
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      (e.target as HTMLElement).classList.remove("a11y-focus-visible");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      this.handleKeyboardNavigation(e);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("keydown", handleKeyDown);

    this.eventListeners.set("focusin", handleFocusIn);
    this.eventListeners.set("focusout", handleFocusOut);
    this.eventListeners.set("keydown", handleKeyDown);
  }

  private handleKeyboardNavigation(e: KeyboardEvent): void {
    if (!this.config.keyboard.navigation) return;

    // Tab navigation enhancement
    if (e.key === "Tab") {
      this.enhanceTabNavigation(e);
    }

    // Escape key for focus trap
    if (e.key === "Escape") {
      this.handleEscapeKey(e);
    }

    // Alt + S for skip to content
    if (e.altKey && e.key === "s") {
      this.skipToContent(e);
    }

    // Keyboard shortcuts
    if (this.config.keyboard.shortcuts) {
      this.handleKeyboardShortcuts(e);
    }
  }

  private enhanceTabNavigation(e: KeyboardEvent): void {
    // Add custom tab navigation logic here
    // For example, skip hidden elements or reorder tab order
  }

  private handleEscapeKey(e: KeyboardEvent): void {
    // Find active focus trap and escape it
    this.focusRegions.forEach((region) => {
      if (region.isActive) {
        this.removeFocusRegion(region.id);
        if (region.restoreElement) {
          (region.restoreElement as HTMLElement).focus();
        }
        e.preventDefault();
      }
    });
  }

  private skipToContent(e: KeyboardEvent): void {
    e.preventDefault();
    const mainContent = document.querySelector(
      'main, [role="main"], .main-content',
    );
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      this.announceToScreenReader("Skipped to main content");
    }
  }

  private handleKeyboardShortcuts(e: KeyboardEvent): void {
    const shortcuts = [
      { keys: ["Alt", "h"], action: () => this.toggleHighContrast() },
      { keys: ["Alt", "l"], action: () => this.toggleLargeText() },
      { keys: ["Alt", "m"], action: () => this.toggleReducedMotion() },
      { keys: ["Alt", "s"], action: () => this.toggleSimplifiedUI() },
    ];

    shortcuts.forEach((shortcut) => {
      const isPressed = shortcut.keys.every((key) =>
        key === "Alt"
          ? e.altKey
          : key === "Ctrl"
            ? e.ctrlKey
            : key === "Shift"
              ? e.shiftKey
              : e.key.toLowerCase() === key.toLowerCase(),
      );

      if (isPressed) {
        e.preventDefault();
        shortcut.action();
      }
    });
  }

  private setupSkipLinks(): void {
    if (!this.config.focusManagement.skipLinks) return;

    const skipLinks = [
      { href: "#main-content", text: "Skip to main content" },
      { href: "#navigation", text: "Skip to navigation" },
      { href: "#search", text: "Skip to search" },
    ];

    skipLinks.forEach((link, index) => {
      const skipLink = document.createElement("a");
      skipLink.href = link.href;
      skipLink.textContent = link.text;
      skipLink.className = "a11y-skip-link";
      skipLink.id = `skip-link-${index}`;

      document.body.insertBefore(skipLink, document.body.firstChild);
      this.skipLinks.push(skipLink);
    });
  }

  private setupAnnouncementRegions(): void {
    if (!this.config.screenReader.announcements) return;

    const regions = [
      { id: "a11y-polite", type: "polite" },
      { id: "a11y-assertive", type: "assertive" },
    ];

    regions.forEach((region) => {
      const element = document.createElement("div");
      element.id = region.id;
      element.className = `a11y-live-${region.type}`;
      element.setAttribute("aria-live", region.type);
      element.setAttribute("aria-atomic", "true");
      document.body.appendChild(element);

      this.announcementElements.set(region.type, element);
    });
  }

  private setupLandmarks(): void {
    if (!this.config.screenReader.landmarks) return;

    // Add ARIA landmarks to common page elements
    const landmarkSelectors = [
      { selector: "header", type: "banner", label: "Page header" },
      { selector: "nav", type: "navigation", label: "Main navigation" },
      { selector: "main", type: "main", label: "Main content" },
      { selector: "aside", type: "complementary", label: "Sidebar" },
      { selector: "footer", type: "contentinfo", label: "Page footer" },
      { selector: "form", type: "form", label: "Form" },
      { selector: '[role="search"]', type: "search", label: "Search" },
    ];

    landmarkSelectors.forEach(({ selector, type, label }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        if (!element.getAttribute("role")) {
          element.setAttribute("role", type);
        }

        const landmarkLabel = index === 0 ? label : `${label} ${index + 1}`;
        if (
          !element.getAttribute("aria-label") &&
          !element.getAttribute("aria-labelledby")
        ) {
          element.setAttribute("aria-label", landmarkLabel);
        }

        this.landmarks.push({
          type: type as AccessibilityLandmark["type"],
          label: landmarkLabel,
          element: element as HTMLElement,
        });
      });
    });
  }

  private setupFocusManagement(): void {
    // Monitor DOM changes for new focusable elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.setupElementAccessibility(node as Element);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  private setupKeyboardNavigation(): void {
    // Enhanced keyboard navigation for custom components
    this.setupComponentKeyboardNavigation();
  }

  private setupComponentKeyboardNavigation(): void {
    // Setup keyboard navigation for tabs, menus, etc.
    this.setupTabKeyboardNavigation();
    this.setupMenuKeyboardNavigation();
    this.setupGridKeyboardNavigation();
  }

  private setupTabKeyboardNavigation(): void {
    const tabLists = document.querySelectorAll('[role="tablist"]');

    tabLists.forEach((tabList) => {
      const tabs = tabList.querySelectorAll('[role="tab"]');

      tabList.addEventListener("keydown", (e) => {
        const currentTab = e.target as HTMLElement;
        const currentIndex = Array.from(tabs).indexOf(currentTab);

        let newIndex: number;

        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            newIndex = (currentIndex + 1) % tabs.length;
            (tabs[newIndex] as HTMLElement).focus();
            (tabs[newIndex] as HTMLElement).click();
            break;

          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
            (tabs[newIndex] as HTMLElement).focus();
            (tabs[newIndex] as HTMLElement).click();
            break;

          case "Home":
            e.preventDefault();
            (tabs[0] as HTMLElement).focus();
            (tabs[0] as HTMLElement).click();
            break;

          case "End":
            e.preventDefault();
            (tabs[tabs.length - 1] as HTMLElement).focus();
            (tabs[tabs.length - 1] as HTMLElement).click();
            break;
        }
      });
    });
  }

  private setupMenuKeyboardNavigation(): void {
    const menus = document.querySelectorAll('[role="menu"]');

    menus.forEach((menu) => {
      const menuItems = menu.querySelectorAll('[role="menuitem"]');

      menu.addEventListener("keydown", (e) => {
        const currentItem = e.target as HTMLElement;
        const currentIndex = Array.from(menuItems).indexOf(currentItem);

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % menuItems.length;
            (menuItems[nextIndex] as HTMLElement).focus();
            break;

          case "ArrowUp":
            e.preventDefault();
            const prevIndex =
              currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
            (menuItems[prevIndex] as HTMLElement).focus();
            break;

          case "Home":
            e.preventDefault();
            (menuItems[0] as HTMLElement).focus();
            break;

          case "End":
            e.preventDefault();
            (menuItems[menuItems.length - 1] as HTMLElement).focus();
            break;

          case "Escape":
            e.preventDefault();
            menu.setAttribute("aria-hidden", "true");
            menu.classList.remove("open");
            break;
        }
      });
    });
  }

  private setupGridKeyboardNavigation(): void {
    const grids = document.querySelectorAll('[role="grid"]');

    grids.forEach((grid) => {
      const cells = grid.querySelectorAll('[role="gridcell"]');
      let currentCellIndex = 0;

      grid.addEventListener("keydown", (e) => {
        const currentCell = cells[currentCellIndex] as HTMLElement;
        const cols = grid.getAttribute("aria-colcount")
          ? parseInt(grid.getAttribute("aria-colcount")!)
          : Math.sqrt(cells.length);

        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            currentCellIndex = Math.min(currentCellIndex + 1, cells.length - 1);
            (cells[currentCellIndex] as HTMLElement).focus();
            break;

          case "ArrowLeft":
            e.preventDefault();
            currentCellIndex = Math.max(currentCellIndex - 1, 0);
            (cells[currentCellIndex] as HTMLElement).focus();
            break;

          case "ArrowDown":
            e.preventDefault();
            currentCellIndex = Math.min(
              currentCellIndex + cols,
              cells.length - 1,
            );
            (cells[currentCellIndex] as HTMLElement).focus();
            break;

          case "ArrowUp":
            e.preventDefault();
            currentCellIndex = Math.max(currentCellIndex - cols, 0);
            (cells[currentCellIndex] as HTMLElement).focus();
            break;
        }
      });
    });
  }

  private setupElementAccessibility(element: Element): void {
    // Add accessibility attributes to new elements
    if (element.tagName === "BUTTON" && !element.getAttribute("aria-label")) {
      const textContent = element.textContent?.trim();
      if (textContent) {
        element.setAttribute("aria-label", textContent);
      }
    }

    // Add focus management to interactive elements
    if (
      ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)
    ) {
      if (!element.getAttribute("tabindex")) {
        element.setAttribute(
          "tabindex",
          element.getAttribute("disabled") ? "-1" : "0",
        );
      }
    }
  }

  private detectUserPreferences(): void {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (prefersReducedMotion.matches) {
      this.config.visual.reducedMotion = true;
      document.body.classList.add("a11y-reduced-motion");
    }

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)");
    if (prefersHighContrast.matches) {
      this.config.visual.highContrast = true;
      document.body.classList.add("a11y-high-contrast");
    }

    // Detect large text preference
    const prefersLargeText = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (prefersLargeText.matches) {
      this.config.visual.largeText = true;
      document.body.classList.add("a11y-large-text");
    }

    // Listen for preference changes
    prefersReducedMotion.addEventListener("change", (e) => {
      this.config.visual.reducedMotion = e.matches;
      document.body.classList.toggle("a11y-reduced-motion", e.matches);
    });

    prefersHighContrast.addEventListener("change", (e) => {
      this.config.visual.highContrast = e.matches;
      document.body.classList.toggle("a11y-high-contrast", e.matches);
    });
  }

  // Public API Methods
  public announceToScreenReader(
    message: string,
    priority: "polite" | "assertive" = "polite",
  ): void {
    if (!this.config.screenReader.announcements) return;

    const element = this.announcementElements.get(priority);
    if (element) {
      element.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        element.textContent = "";
      }, 1000);
    }
  }

  public addFocusRegion(
    id: string,
    element: HTMLElement,
    restoreElement?: HTMLElement,
  ): void {
    if (!this.config.focusManagement.focusTrap) return;

    const region: FocusRegion = {
      id,
      element,
      restoreElement,
      isActive: true,
    };

    this.focusRegions.set(id, region);
    this.trapFocus(element);
  }

  public removeFocusRegion(id: string): void {
    const region = this.focusRegions.get(id);
    if (region) {
      region.isActive = false;
      this.focusRegions.delete(id);
    }
  }

  private trapFocus(element: HTMLElement): void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener("keydown", handleTabKey);
    this.eventListeners.set(`focus-trap-${element.id}`, handleTabKey);
  }

  public toggleHighContrast(): void {
    this.config.visual.highContrast = !this.config.visual.highContrast;
    document.body.classList.toggle("a11y-high-contrast");
    this.announceToScreenReader(
      `High contrast ${this.config.visual.highContrast ? "enabled" : "disabled"}`,
    );
  }

  public toggleLargeText(): void {
    this.config.visual.largeText = !this.config.visual.largeText;
    document.body.classList.toggle("a11y-large-text");
    this.announceToScreenReader(
      `Large text ${this.config.visual.largeText ? "enabled" : "disabled"}`,
    );
  }

  public toggleReducedMotion(): void {
    this.config.visual.reducedMotion = !this.config.visual.reducedMotion;
    document.body.classList.toggle("a11y-reduced-motion");
    this.announceToScreenReader(
      `Reduced motion ${this.config.visual.reducedMotion ? "enabled" : "disabled"}`,
    );
  }

  public toggleSimplifiedUI(): void {
    this.config.cognitive.simplifiedUI = !this.config.cognitive.simplifiedUI;
    document.body.classList.toggle("a11y-simplified");
    this.announceToScreenReader(
      `Simplified interface ${this.config.cognitive.simplifiedUI ? "enabled" : "disabled"}`,
    );
  }

  public setColorBlindnessFilter(
    type: "none" | "protanopia" | "deuteranopia" | "tritanopia",
  ): void {
    // Remove existing filter classes
    document.body.classList.remove(
      "a11y-protanopia",
      "a11y-deuteranopia",
      "a11y-tritanopia",
    );

    if (type !== "none") {
      document.body.classList.add(`a11y-${type}`);
    }

    this.config.visual.colorBlindness.type = type;
    this.config.visual.colorBlindness.enabled = type !== "none";

    this.announceToScreenReader(
      `Color blindness filter ${type === "none" ? "disabled" : `set to ${type}`}`,
    );
  }

  public validateAccessibility(): {
    score: number;
    issues: Array<{
      type: "error" | "warning";
      element: Element;
      description: string;
      wcag: string;
    }>;
  } {
    const issues: Array<{
      type: "error" | "warning";
      element: Element;
      description: string;
      wcag: string;
    }> = [];

    // Check for missing alt text on images
    document.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("alt") && !img.getAttribute("role")) {
        issues.push({
          type: "error",
          element: img,
          description: "Image missing alt text",
          wcag: "1.1.1",
        });
      }
    });

    // Check for missing labels on form inputs
    document.querySelectorAll("input, textarea, select").forEach((input) => {
      const hasLabel =
        document.querySelector(`label[for="${input.id}"]`) ||
        input.getAttribute("aria-label") ||
        input.getAttribute("aria-labelledby");

      if (!hasLabel && input.type !== "hidden") {
        issues.push({
          type: "error",
          element: input,
          description: "Form input missing label",
          wcag: "3.3.2",
        });
      }
    });

    // Check for proper heading structure
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let lastLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));

      if (index === 0 && level !== 1) {
        issues.push({
          type: "warning",
          element: heading,
          description: "Page should start with h1",
          wcag: "1.3.1",
        });
      }

      if (level > lastLevel + 1) {
        issues.push({
          type: "warning",
          element: heading,
          description: `Heading level skipped (h${lastLevel} to h${level})`,
          wcag: "1.3.1",
        });
      }

      lastLevel = level;
    });

    // Calculate score (100 - issues * 10, minimum 0)
    const errorCount = issues.filter((i) => i.type === "error").length;
    const warningCount = issues.filter((i) => i.type === "warning").length;
    const score = Math.max(0, 100 - errorCount * 10 - warningCount * 5);

    return { score, issues };
  }

  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.applyConfig();
  }

  private applyConfig(): void {
    // Apply configuration changes to DOM
    document.body.classList.toggle(
      "a11y-high-contrast",
      this.config.visual.highContrast,
    );
    document.body.classList.toggle(
      "a11y-large-text",
      this.config.visual.largeText,
    );
    document.body.classList.toggle(
      "a11y-reduced-motion",
      this.config.visual.reducedMotion,
    );
    document.body.classList.toggle(
      "a11y-simplified",
      this.config.cognitive.simplifiedUI,
    );
    document.body.classList.toggle(
      "a11y-large-targets",
      this.config.motor.largerClickTargets,
    );
  }

  public destroy(): void {
    // Remove event listeners
    this.eventListeners.forEach((handler, event) => {
      document.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Remove observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Remove skip links
    this.skipLinks.forEach((link) => link.remove());
    this.skipLinks = [];

    // Remove announcement regions
    this.announcementElements.forEach((element) => element.remove());
    this.announcementElements.clear();

    // Remove styles
    const styleElement = document.getElementById("a11y-global-styles");
    if (styleElement) {
      styleElement.remove();
    }

    this.isInitialized = false;
  }
}

export default AccessibilityEngine;
