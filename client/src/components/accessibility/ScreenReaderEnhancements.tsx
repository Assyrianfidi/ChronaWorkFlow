
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useRef, useCallback } from "react";

// Screen reader interfaces
interface ScreenReaderSettings {
  rate: number; // Speech rate (0.5 - 2.0)
  pitch: number; // Voice pitch (0.5 - 2.0)
  volume: number; // Volume (0.0 - 1.0)
  voice: string; // Preferred voice
  language: string; // Language code
  punctuation: "none" | "some" | "all"; // Punctuation reading
  verbosity: "minimal" | "normal" | "verbose"; // Detail level
}

interface AriaLiveRegion {
  id: string;
  priority: "polite" | "assertive" | "off";
  content: string;
  timestamp: number;
}

interface ScreenReaderContextType {
  // Speech Synthesis
  speak: (text: string, options?: Partial<SpeechSynthesisUtterance>) => void;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  isSpeaking: boolean;

  // Settings
  settings: ScreenReaderSettings;
  updateSettings: (settings: Partial<ScreenReaderSettings>) => void;

  // Live Regions
  announce: (message: string, priority?: "polite" | "assertive") => void;
  clearAnnouncements: () => void;

  // Navigation
  announceNavigation: (element: Element, action: string) => void;
  announceFormChanges: (element: Element, change: string) => void;
  announceDataChanges: (data: any, context: string) => void;

  // Focus Management
  trapFocus: (element: HTMLElement) => () => void;
  announceFocus: (element: Element) => void;
}

const ScreenReaderContext = React.createContext<ScreenReaderContextType | null>(
  null,
);

// Default settings
const DEFAULT_SETTINGS: ScreenReaderSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voice: "",
  language: "en-US",
  punctuation: "some",
  verbosity: "normal",
};

// Screen Reader Enhancements Component
// @ts-ignore
export const ScreenReaderEnhancements: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [settings, setSettings] =
    useState<ScreenReaderSettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveRegions, setLiveRegions] = useState<AriaLiveRegion[]>([]);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const speechRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const focusTrapRef = useRef<{
    element: HTMLElement;
    restore: () => void;
  } | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechRef.current = window.speechSynthesis;

      // Load available voices
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      // Set up speech event listeners
      window.speechSynthesis.onstart = () => setIsSpeaking(true);
      window.speechSynthesis.onend = () => setIsSpeaking(false);
    }
  }, []);

  // Apply settings changes
  useEffect(() => {
    if (settings.voice && availableVoices.length > 0) {
      const voice = availableVoices.find(
        (v) => v.name === settings.voice || v.lang === settings.language,
      );
      if (voice && currentUtteranceRef.current) {
        currentUtteranceRef.current.voice = voice;
      }
    }
  }, [settings.voice, settings.language, availableVoices]);

  // Speech functions
  const speak = useCallback(
    (text: string, options: Partial<SpeechSynthesisUtterance> = {}) => {
      if (!speechRef.current) return;

      // Stop any current speech
      speechRef.current.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Apply settings
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      utterance.lang = settings.language;

      // Apply voice preference
      if (settings.voice) {
        const voice = availableVoices.find((v) => v.name === settings.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      // Apply options
      Object.assign(utterance, options);

      currentUtteranceRef.current = utterance;
      speechRef.current.speak(utterance);
    },
    [settings, availableVoices],
  );

  const stopSpeaking = useCallback(() => {
    if (speechRef.current) {
      speechRef.current.cancel();
    }
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (speechRef.current) {
      speechRef.current.pause();
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (speechRef.current) {
      speechRef.current.resume();
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<ScreenReaderSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  // Live region announcements
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const region: AriaLiveRegion = {
        id: `region-${Date.now()}`,
        priority,
        content: message,
        timestamp: Date.now(),
      };

      setLiveRegions((prev) => [...prev, region]);

      // Auto-remove after announcement
      setTimeout(() => {
        setLiveRegions((prev) => prev.filter((r) => r.id !== region.id));
      }, 1000);

      // Also speak if enabled
      if (settings.verbosity !== "minimal") {
        speak(message);
      }
    },
    [speak, settings.verbosity],
  );

  const clearAnnouncements = useCallback(() => {
    setLiveRegions([]);
  }, []);

  // Navigation announcements
  const announceNavigation = useCallback(
    (element: Element, action: string) => {
      let message = "";

      // Get element information
      const tagName = element.tagName.toLowerCase();
      const textContent = element.textContent?.trim() || "";
      const ariaLabel = element.getAttribute("aria-label") || "";
      const title = element.getAttribute("title") || "";

      // Build descriptive message
      if (ariaLabel) {
        message = `${action} ${ariaLabel}`;
      } else if (textContent) {
        message = `${action} ${tagName}: ${textContent}`;
      } else if (title) {
        message = `${action} ${tagName}: ${title}`;
      } else {
        message = `${action} ${tagName}`;
      }

      // Add role information
      const role = element.getAttribute("role");
      if (role) {
        message += `, role: ${role}`;
      }

      // Add state information
      if (element.getAttribute("aria-expanded")) {
        message += `, ${element.getAttribute("aria-expanded") === "true" ? "expanded" : "collapsed"}`;
      }

      if (element.getAttribute("aria-selected")) {
        message += `, ${element.getAttribute("aria-selected") === "true" ? "selected" : "not selected"}`;
      }

      announce(message, "assertive");
    },
    [announce],
  );

  // Form change announcements
  const announceFormChanges = useCallback(
    (element: Element, change: string) => {
      const label =
        element.getAttribute("aria-label") ||
        element.getAttribute("placeholder") ||
        element.getAttribute("title") ||
        element.textContent?.trim() ||
        "form field";

      let message = "";

      switch (change) {
        case "focus":
          message = `Focused on ${label}`;
          break;
        case "change":
// @ts-ignore
          const value = (element as HTMLInputElement).value || "";
          message = `${label} changed to ${value}`;
          break;
        case "error":
          message = `Error in ${label}`;
          break;
        case "valid":
          message = `${label} is valid`;
          break;
        default:
          message = `${label} ${change}`;
      }

      announce(message, "polite");
    },
    [announce],
  );

  // Data change announcements
  const announceDataChanges = useCallback(
    (data: any, context: string) => {
      let message = "";

      if (typeof data === "object" && data !== null) {
        const keys = Object.keys(data);
        if (keys.length === 0) {
          message = `No data in ${context}`;
        } else {
          message = `${context} updated with ${keys.length} items`;
          if (settings.verbosity === "verbose") {
            message += ": " + keys.slice(0, 3).join(", ");
            if (keys.length > 3) {
              message += ` and ${keys.length - 3} more`;
            }
          }
        }
      } else {
        message = `${context}: ${data}`;
      }

      announce(message, "polite");
    },
    [announce, settings.verbosity],
  );

  // Focus management
  const trapFocus = useCallback((element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
// @ts-ignore
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
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
      }
    };

    element.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    const restore = () => {
      element.removeEventListener("keydown", handleTabKey);
    };

    focusTrapRef.current = { element, restore };
    return restore;
  }, []);

  const announceFocus = useCallback(
    (element: Element) => {
      announceNavigation(element, "Focused on");
    },
    [announceNavigation],
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + S: Toggle screen reader
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        if (isSpeaking) {
          stopSpeaking();
        } else {
          announce("Screen reader enabled");
        }
      }

      // Alt + R: Read current page
      if (e.altKey && e.key === "r") {
        e.preventDefault();
        const mainContent = document.querySelector('main, [role="main"], body');
        const text = mainContent?.textContent?.trim() || "No content found";
        speak(text);
      }

      // Alt + H: Announce current heading
      if (e.altKey && e.key === "h") {
        e.preventDefault();
        const heading = document.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading) {
          announceNavigation(heading, "Current heading");
        }
      }

      // Alt + L: Announce links
      if (e.altKey && e.key === "l") {
        e.preventDefault();
        const links = document.querySelectorAll("a");
        announce(`Page contains ${links.length} links`);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSpeaking, stopSpeaking, speak, announce, announceNavigation]);

  // Auto-announce page changes
  useEffect(() => {
    // Announce page title changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          mutation.target === document.head
        ) {
          const title = document.title;
          if (title) {
            announce(`Page: ${title}`, "assertive");
          }
        }
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [announce]);

  const contextValue: ScreenReaderContextType = {
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    isSpeaking,
    settings,
    updateSettings,
    announce,
    clearAnnouncements,
    announceNavigation,
    announceFormChanges,
    announceDataChanges,
    trapFocus,
    announceFocus,
  };

  return (
    <ScreenReaderContext.Provider value={contextValue}>
      {children}

      {/* Live regions for screen readers */}
      {liveRegions.map((region) => (
        <div
          key={region.id}
          aria-live={region.priority}
          aria-atomic="true"
          className="sr-only"
        >
          {region.content}
        </div>
      ))}
    </ScreenReaderContext.Provider>
  );
};

// Hook
export const useScreenReader = (): ScreenReaderContextType => {
  const context = React.useContext(ScreenReaderContext);
  if (!context) {
    throw new Error(
      "useScreenReader must be used within ScreenReaderEnhancements",
    );
  }
  return context;
};

// Screen Reader Control Panel
// @ts-ignore
export const ScreenReaderControls: React.FC = () => {
  const { settings, updateSettings, isSpeaking, stopSpeaking } =
    useScreenReader();

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Screen Reader Settings</h3>

      <div className="space-y-4">
        {/* Speech Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Speech Rate: {settings.rate.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.rate}
            onChange={(e) =>
              updateSettings({ rate: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>

        {/* Speech Pitch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Speech Pitch: {settings.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.pitch}
            onChange={(e) =>
              updateSettings({ pitch: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volume: {Math.round(settings.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) =>
              updateSettings({ volume: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
          </select>
        </div>

        {/* Punctuation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Punctuation Reading
          </label>
          <select
            value={settings.punctuation}
            onChange={(e) =>
// @ts-ignore
// @ts-ignore
              updateSettings({ punctuation: e.target.value as any })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="none">None</option>
            <option value="some">Some</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Verbosity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verbosity Level
          </label>
          <select
            value={settings.verbosity}
            onChange={(e) =>
// @ts-ignore
// @ts-ignore
              updateSettings({ verbosity: e.target.value as any })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="minimal">Minimal</option>
            <option value="normal">Normal</option>
            <option value="verbose">Verbose</option>
          </select>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Stop Speaking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenReaderEnhancements;
