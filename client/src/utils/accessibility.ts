declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
/**
 * WCAG 2.1 AA Accessibility Utilities
 * Comprehensive accessibility helpers for React components
 */

// Focus management utilities
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  ) as NodeListOf<HTMLElement>;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener("keydown", handleTabKey);

  return () => {
    element.removeEventListener("keydown", handleTabKey);
  };
};

// ARIA live regions
export const announceToScreenReader = (
  message: string,
  priority: "polite" | "assertive" = "polite",
) => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  e: KeyboardEvent,
  actions: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  },
) => {
  switch (e.key) {
    case "Enter":
    case " ":
      e.preventDefault();
      if (e.key === "Enter" && actions.onEnter) actions.onEnter();
      if (e.key === " " && actions.onSpace) actions.onSpace();
      break;
    case "Escape":
      if (actions.onEscape) actions.onEscape();
      break;
    case "ArrowUp":
      e.preventDefault();
      if (actions.onArrowUp) actions.onArrowUp();
      break;
    case "ArrowDown":
      e.preventDefault();
      if (actions.onArrowDown) actions.onArrowDown();
      break;
    case "ArrowLeft":
      e.preventDefault();
      if (actions.onArrowLeft) actions.onArrowLeft();
      break;
    case "ArrowRight":
      e.preventDefault();
      if (actions.onArrowRight) actions.onArrowRight();
      break;
    case "Home":
      e.preventDefault();
      if (actions.onHome) actions.onHome();
      break;
    case "End":
      e.preventDefault();
      if (actions.onEnd) actions.onEnd();
      break;
  }
};

// Color contrast checker
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((val) => {
      const normalized = parseInt(val) / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsContrastRatio = (
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return level === "AA" ? ratio >= 4.5 : ratio >= 7;
};

// Skip link generator
export const createSkipLinks = (containerId: string) => {
  const skipLinks = [
    { href: "#main-content", text: "Skip to main content" },
    { href: "#navigation", text: "Skip to navigation" },
    { href: "#search", text: "Skip to search" },
  ];

  return skipLinks.map((link) => ({
    ...link,
    className: "skip-link",
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      const target = document.querySelector(link.href) as HTMLElement;
      if (target && typeof target.focus === "function") {
        target.focus();
        target.scrollIntoView({ behavior: "smooth" });
      }
    },
  }));
};

// Heading level validator
export const validateHeadingLevels = (container: HTMLElement): string[] => {
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const errors: string[] = [];
  let previousLevel = 0;

  headings.forEach((heading, index) => {
    const currentLevel = parseInt(heading.tagName.charAt(1));

    if (index === 0 && currentLevel !== 1) {
      errors.push(
        `First heading should be h1, found ${heading.tagName.toLowerCase()}`,
      );
    }

    if (currentLevel > previousLevel + 1) {
      errors.push(
        `Heading level skipped: from h${previousLevel} to ${heading.tagName.toLowerCase()}`,
      );
    }

    previousLevel = currentLevel;
  });

  return errors;
};

// Alt text validator
export const validateAltText = (container: HTMLElement): string[] => {
  const images = container.querySelectorAll("img");
  const errors: string[] = [];

  images.forEach((img, index) => {
    const alt = img.getAttribute("alt");

    if (alt === null) {
      errors.push(`Image ${index + 1} is missing alt attribute`);
    } else if (alt === "") {
      // Decorative images should have empty alt
      if (img.getAttribute("role") !== "presentation") {
        errors.push(
          `Image ${index + 1} has empty alt but no role="presentation"`,
        );
      }
    }
  });

  return errors;
};

// Form validation helper
export const validateFormAccessibility = (form: HTMLElement): string[] => {
  const errors: string[] = [];
  const inputs = form.querySelectorAll("input, select, textarea");

  inputs.forEach((input, index) => {
    const label =
      form.querySelector(`label[for="${input.id}"]`) || input.closest("label");

    if (!label) {
      errors.push(`Input ${index + 1} has no associated label`);
    }

    if (
      input.hasAttribute("required") &&
      !input.getAttribute("aria-required")
    ) {
      errors.push(
        `Required input ${index + 1} should have aria-required="true"`,
      );
    }

    if (
      input.hasAttribute("aria-invalid") &&
      !input.getAttribute("aria-describedby")
    ) {
      errors.push(
        `Invalid input ${index + 1} should have aria-describedby pointing to error message`,
      );
    }
  });

  return errors;
};

// Landmark roles validator
export const validateLandmarks = (container: HTMLElement): string[] => {
  const landmarks = container.querySelectorAll(
    '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"], [role="form"]',
  );
  const errors: string[] = [];

  if (!container.querySelector('[role="main"], main')) {
    errors.push('Missing main landmark (role="main" or <main> element)');
  }

  if (!container.querySelector('[role="banner"], header')) {
    errors.push('Missing banner landmark (role="banner" or <header> element)');
  }

  if (!container.querySelector('[role="navigation"], nav')) {
    errors.push(
      'Missing navigation landmark (role="navigation" or <nav> element)',
    );
  }

  return errors;
};

// Comprehensive accessibility checker
export const runAccessibilityAudit = (
  containerId: string,
): {
  passed: boolean;
  errors: string[];
  warnings: string[];
} => {
  const container = document.getElementById(containerId);
  if (!container) {
    return {
      passed: false,
      errors: [`Container with id "${containerId}" not found`],
      warnings: [],
    };
  }

  const headingErrors = validateHeadingLevels(container);
  const altTextErrors = validateAltText(container);
  const formErrors = validateFormAccessibility(container);
  const landmarkErrors = validateLandmarks(container);

  const allErrors = [
    ...headingErrors,
    ...altTextErrors,
    ...formErrors,
    ...landmarkErrors,
  ];

  return {
    passed: allErrors.length === 0,
    errors: allErrors,
    warnings: [],
  };
};

// Focus visible polyfill for better focus management
export const setupFocusVisible = () => {
  let hadKeyboardEvent = false;

  const handleKeyDown = () => {
    hadKeyboardEvent = true;
  };

  const handleMouseDown = () => {
    hadKeyboardEvent = false;
  };

  const handleFocusVisible = (e: FocusEvent) => {
    const target = e.target as HTMLElement;

    if (hadKeyboardEvent) {
      target.classList.add("focus-visible");
    } else {
      target.classList.remove("focus-visible");
    }
  };

  const handleBlur = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove("focus-visible");
  };

  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("mousedown", handleMouseDown, true);
  document.addEventListener("focus", handleFocusVisible, true);
  document.addEventListener("blur", handleBlur, true);

  return () => {
    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("mousedown", handleMouseDown, true);
    document.removeEventListener("focus", handleFocusVisible, true);
    document.removeEventListener("blur", handleBlur, true);
  };
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// High contrast detection
export const prefersHighContrast = (): boolean => {
  return window.matchMedia("(prefers-contrast: high)").matches;
};

// Screen reader detection (heuristic)
export const detectScreenReader = (): boolean => {
  // This is a heuristic approach - no foolproof way to detect screen readers
  const hasScreenReader =
    window.speechSynthesis && window.speechSynthesis.getVoices().length > 0;

  return (
    hasScreenReader ||
    navigator.userAgent.includes("NVDA") ||
    navigator.userAgent.includes("JAWS") ||
    navigator.userAgent.includes("VoiceOver")
  );
};

// Dark mode detection
export const prefersDarkMode = (): boolean => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// Accessibility context for React components
export interface AccessibilityContext {
  announce: (message: string, priority?: "polite" | "assertive") => void;
  trapFocus: (element: HTMLElement) => () => void;
  prefersReducedMotion: () => boolean;
  prefersHighContrast: () => boolean;
  detectScreenReader: () => boolean;
  prefersDarkMode: () => boolean;
}

export const createAccessibilityContext = (): AccessibilityContext => {
  return {
    announce: announceToScreenReader,
    trapFocus,
    prefersReducedMotion,
    prefersHighContrast,
    detectScreenReader,
    prefersDarkMode,
  };
};
