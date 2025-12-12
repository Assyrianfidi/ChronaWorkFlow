
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from 'react';
/**
 * Interactive Feedback Hook
 * React hook for managing advanced micro-interactions and feedback
 */

import { useEffect, useRef, useCallback } from "react";
import InteractionEngine, {
  InteractionConfig,
} from '../utils/interaction-engine.js.js';

interface UseInteractiveFeedbackOptions {
  hapticFeedback?: boolean;
  soundFeedback?: boolean;
  visualFeedback?: boolean;
  physics?: {
    mass?: number;
    friction?: number;
    spring?: number;
    damping?: number;
  };
  easing?:
    | "linear"
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "bounce"
    | "elastic";
  duration?: number;
  delay?: number;
  parallax?: boolean;
  ripple?: boolean;
  glow?: boolean;
}

interface InteractiveFeedbackReturn {
  elementRef: React.RefObject<HTMLElement>;
  triggerHover: (isEntering: boolean) => void;
  triggerClick: () => void;
  triggerFocus: (isFocused: boolean) => void;
  triggerDrag: (isDragging: boolean) => void;
  setInteractionEnabled: (enabled: boolean) => void;
}

export const useInteractiveFeedback = (
  interactionType: "hover" | "click" | "focus" | "drag",
  options: UseInteractiveFeedbackOptions = {},
): InteractiveFeedbackReturn => {
  const elementRef = useRef<HTMLElement>(null);
  const engineRef = useRef<InteractionEngine | null>(null);
  const interactionIdRef = useRef<string>("");
  const isEnabledRef = useRef<boolean>(true);

  // Initialize interaction engine
  useEffect(() => {
    if (typeof window !== "undefined") {
      engineRef.current = new InteractionEngine();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  // Register interaction when element is available
  useEffect(() => {
    if (elementRef.current && engineRef.current && isEnabledRef.current) {
      const id = `interaction-${Date.now()}-${Math.random()}`;
      interactionIdRef.current = id;

      const config: InteractionConfig = {
        type: interactionType,
        element: elementRef.current,
        options: {
          hapticFeedback: options.hapticFeedback ?? false,
          soundFeedback: options.soundFeedback ?? false,
          visualFeedback: options.visualFeedback ?? true,
          physics: options.physics,
          easing: options.easing || "ease-out",
          duration: options.duration || 200,
          delay: options.delay || 0,
        },
      };

      engineRef.current.registerInteraction(id, config);

      // Add parallax effect if enabled
      if (options.parallax) {
        elementRef.current.classList.add("parallax-enabled");
      }

      // Add ripple effect if enabled
      if (options.ripple) {
        elementRef.current.classList.add("ripple-enabled");
      }

      // Add glow effect if enabled
      if (options.glow) {
        elementRef.current.classList.add("glow-enabled");
      }
    }

    return () => {
      if (engineRef.current && interactionIdRef.current) {
        engineRef.current.unregisterInteraction(interactionIdRef.current);
      }
    };
  }, [interactionType, options]);

  const triggerHover = useCallback(
    (isEntering: boolean) => {
      if (!elementRef.current || !isEnabledRef.current) return;

      if (isEntering) {
        elementRef.current.classList.add("hover-active");
        if (options.glow) {
          elementRef.current.classList.add("glow-active");
        }
      } else {
        elementRef.current.classList.remove("hover-active");
        if (options.glow) {
          elementRef.current.classList.remove("glow-active");
        }
      }
    },
    [options.glow],
  );

  const triggerClick = useCallback(() => {
    if (!elementRef.current || !isEnabledRef.current) return;

    elementRef.current.classList.add("click-active");
    setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.classList.remove("click-active");
      }
    }, 200);
  }, []);

  const triggerFocus = useCallback((isFocused: boolean) => {
    if (!elementRef.current || !isEnabledRef.current) return;

    if (isFocused) {
      elementRef.current.classList.add("focus-active");
    } else {
      elementRef.current.classList.remove("focus-active");
    }
  }, []);

  const triggerDrag = useCallback((isDragging: boolean) => {
    if (!elementRef.current || !isEnabledRef.current) return;

    if (isDragging) {
      elementRef.current.classList.add("drag-active");
    } else {
      elementRef.current.classList.remove("drag-active");
    }
  }, []);

  const setInteractionEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;

    if (elementRef.current) {
      if (enabled) {
        elementRef.current.classList.remove("interaction-disabled");
      } else {
        elementRef.current.classList.add("interaction-disabled");
      }
    }
  }, []);

  return {
    elementRef,
    triggerHover,
    triggerClick,
    triggerFocus,
    triggerDrag,
    setInteractionEnabled,
  };
};

// Specialized hooks for different interaction types
export const useHoverFeedback = (
  options: UseInteractiveFeedbackOptions = {},
) => {
  return useInteractiveFeedback("hover", options);
};

export const useClickFeedback = (
  options: UseInteractiveFeedbackOptions = {},
) => {
  return useInteractiveFeedback("click", options);
};

export const useFocusFeedback = (
  options: UseInteractiveFeedbackOptions = {},
) => {
  return useInteractiveFeedback("focus", options);
};

export const useDragFeedback = (
  options: UseInteractiveFeedbackOptions = {},
) => {
  return useInteractiveFeedback("drag", options);
};

// Advanced feedback hook with multiple interaction types
interface UseAdvancedFeedbackOptions extends UseInteractiveFeedbackOptions {
  interactions?: Array<"hover" | "click" | "focus" | "drag">;
  autoEnable?: boolean;
}

export const useAdvancedFeedback = (
  options: UseAdvancedFeedbackOptions = {},
) => {
  const elementRef = useRef<HTMLElement>(null);
  const interactions = options.interactions || ["hover", "click"];
  const autoEnable = options.autoEnable ?? true;

  const hoverFeedback = useHoverFeedback(options);
  const clickFeedback = useClickFeedback(options);
  const focusFeedback = useFocusFeedback(options);
  const dragFeedback = useDragFeedback(options);

  const feedbackMap = {
    hover: hoverFeedback,
    click: clickFeedback,
    focus: focusFeedback,
    drag: dragFeedback,
  };

  // Auto-enable interactions
  useEffect(() => {
    if (autoEnable) {
      interactions.forEach((interaction) => {
        const feedback = feedbackMap[interaction];
        if (feedback) {
          feedback.setInteractionEnabled(true);
        }
      });
    }
  }, [autoEnable, interactions]);

  const triggerInteraction = useCallback(
    (type: "hover" | "click" | "focus" | "drag", ...args: any[]) => {
      const feedback = feedbackMap[type];
      if (!feedback) return;

      switch (type) {
        case "hover":
          feedback.triggerHover(args[0]);
          break;
        case "click":
          feedback.triggerClick();
          break;
        case "focus":
          feedback.triggerFocus(args[0]);
          break;
        case "drag":
          feedback.triggerDrag(args[0]);
          break;
      }
    },
    [feedbackMap],
  );

  const setInteractionEnabled = useCallback(
    (type: "hover" | "click" | "focus" | "drag" | "all", enabled: boolean) => {
      if (type === "all") {
        Object.values(feedbackMap).forEach((feedback) => {
          feedback.setInteractionEnabled(enabled);
        });
      } else {
        const feedback = feedbackMap[type];
        if (feedback) {
          feedback.setInteractionEnabled(enabled);
        }
      }
    },
    [feedbackMap],
  );

  return {
    elementRef,
    triggerInteraction,
    setInteractionEnabled,
    hover: hoverFeedback,
    click: clickFeedback,
    focus: focusFeedback,
    drag: dragFeedback,
  };
};

// Hook for managing global interaction settings
export const useInteractionSettings = () => {
  const [settings, setSettings] = useState({
    hapticFeedback: false,
    soundFeedback: false,
    visualFeedback: true,
    reducedMotion: false,
    highContrast: false,
  });

  const updateSetting = useCallback(
    (key: keyof typeof settings, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetToDefaults = useCallback(() => {
    setSettings({
      hapticFeedback: false,
      soundFeedback: false,
      visualFeedback: true,
      reducedMotion: false,
      highContrast: false,
    });
  }, []);

  // Detect user preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => {
      updateSetting("reducedMotion", e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    updateSetting("reducedMotion", mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [updateSetting]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    const handleChange = (e: MediaQueryListEvent) => {
      updateSetting("highContrast", e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    updateSetting("highContrast", mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [updateSetting]);

  return {
    settings,
    updateSetting,
    resetToDefaults,
  };
};
