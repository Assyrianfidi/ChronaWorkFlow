declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAccessibility } from "./AccessibilityContext";

// Voice command interfaces
interface VoiceCommand {
  id: string;
  phrase: string | string[];
  action: string;
  parameters?: Record<string, any>;
  description: string;
  category: "navigation" | "form" | "data" | "system" | "custom";
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface VoiceCommandEngineContextType {
  // Voice Recognition
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;

  // Command Processing
  recognizedCommands: VoiceCommand[];
  executeCommand: (command: VoiceCommand, transcript?: string) => Promise<void>;
  addCustomCommand: (command: VoiceCommand) => void;
  removeCustomCommand: (commandId: string) => void;

  // Voice Settings
  language: string;
  confidence: number;
  continuous: boolean;
  interimResults: boolean;

  // Accessibility Features
  visualFeedback: boolean;
  audioFeedback: boolean;
  hapticFeedback: boolean;
}

const VoiceCommandEngineContext =
  React.createContext<VoiceCommandEngineContextType | null>(null);

// Built-in voice commands
const BUILTIN_COMMANDS: VoiceCommand[] = [
  // Navigation Commands
  {
    id: "nav-dashboard",
    phrase: ["go to dashboard", "show dashboard", "open dashboard"],
    action: "navigate",
    parameters: { route: "/dashboard" },
    description: "Navigate to dashboard",
    category: "navigation",
  },
  {
    id: "nav-accounts",
    phrase: ["go to accounts", "show accounts", "open accounts"],
    action: "navigate",
    parameters: { route: "/accounts" },
    description: "Navigate to accounts",
    category: "navigation",
  },
  {
    id: "nav-reports",
    phrase: ["go to reports", "show reports", "open reports"],
    action: "navigate",
    parameters: { route: "/reports" },
    description: "Navigate to reports",
    category: "navigation",
  },

  // Form Commands
  {
    id: "form-submit",
    phrase: ["submit form", "save form", "send form"],
    action: "submit",
    description: "Submit current form",
    category: "form",
  },
  {
    id: "form-cancel",
    phrase: ["cancel form", "close form", "reset form"],
    action: "cancel",
    description: "Cancel current form",
    category: "form",
  },
  {
    id: "form-clear",
    phrase: ["clear form", "reset fields", "empty form"],
    action: "clear",
    description: "Clear all form fields",
    category: "form",
  },

  // Data Commands
  {
    id: "data-refresh",
    phrase: ["refresh data", "reload data", "update data"],
    action: "refresh",
    description: "Refresh current data",
    category: "data",
  },
  {
    id: "data-export",
    phrase: ["export data", "download data", "save data"],
    action: "export",
    description: "Export current data",
    category: "data",
  },
  {
    id: "data-search",
    phrase: ["search for", "find", "look for"],
    action: "search",
    description: "Search for data",
    category: "data",
  },

  // System Commands
  {
    id: "sys-help",
    phrase: ["help", "what can I say", "commands"],
    action: "help",
    description: "Show available commands",
    category: "system",
  },
  {
    id: "sys-settings",
    phrase: ["settings", "preferences", "options"],
    action: "settings",
    description: "Open settings",
    category: "system",
  },
  {
    id: "sys-voice-toggle",
    phrase: ["voice on", "voice off", "toggle voice"],
    action: "toggleVoice",
    description: "Toggle voice commands",
    category: "system",
  },
];

// Voice Command Engine Component
export const VoiceCommandEngine: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedCommands, setRecognizedCommands] =
    useState<VoiceCommand[]>(BUILTIN_COMMANDS);
  const [customCommands, setCustomCommands] = useState<VoiceCommand[]>([]);
  const [language, setLanguage] = useState("en-US");
  const [confidence, setConfidence] = useState(0.7);
  const [continuous, setContinuous] = useState(true);
  const [interimResults, setInterimResults] = useState(true);
  const [visualFeedback, setVisualFeedback] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  const recognitionRef = useRef<any>(null);
  const { announceToScreenReader } = useAccessibility();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = handleRecognitionResult;
      recognitionRef.current.onerror = handleRecognitionError;
      recognitionRef.current.onend = handleRecognitionEnd;
    }
  }, [continuous, interimResults, language]);

  // Handle speech recognition results
  const handleRecognitionResult = useCallback((event: any) => {
    const last = event.results.length - 1;
    const result = event.results[last];

    if (result.isFinal) {
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence;

      // Process the command
      processVoiceCommand(transcript, confidence);
    }
  }, []);

  // Handle recognition errors
  const handleRecognitionError = useCallback(
    (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (audioFeedback) {
        playErrorSound();
      }

      announceToScreenReader(`Voice recognition error: ${event.error}`);
    },
    [audioFeedback, announceToScreenReader],
  );

  // Handle recognition end
  const handleRecognitionEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  // Process voice command
  const processVoiceCommand = useCallback(
    async (transcript: string, confidence: number) => {
      if (confidence < 0.5) {
        announceToScreenReader("Command not recognized. Please try again.");
        return;
      }

      // Find matching command
      const allCommands = [...recognizedCommands, ...customCommands];
      let matchedCommand: VoiceCommand | null = null;

      for (const command of allCommands) {
        const phrases = Array.isArray(command.phrase)
          ? command.phrase
          : [command.phrase];

        for (const phrase of phrases) {
          if (transcript.includes(phrase.toLowerCase())) {
            matchedCommand = command;
            break;
          }
        }

        if (matchedCommand) break;
      }

      if (matchedCommand) {
        await executeCommand(matchedCommand, transcript);
      } else {
        announceToScreenReader(
          'Command not found. Say "help" for available commands.',
        );

        if (audioFeedback) {
          playErrorSound();
        }
      }
    },
    [recognizedCommands, customCommands, announceToScreenReader, audioFeedback],
  );

  // Execute voice command
  const executeCommand = useCallback(
    async (command: VoiceCommand, transcript?: string) => {
      try {
        announceToScreenReader(`Executing: ${command.description}`);

        if (audioFeedback) {
          playSuccessSound();
        }

        if (hapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(100);
        }

        // Execute command based on action
        switch (command.action) {
          case "navigate":
            if (command.parameters?.route) {
              window.location.href = command.parameters.route;
            }
            break;

          case "submit":
            const submitButton = document.querySelector(
              'button[type="submit"], input[type="submit"]',
            ) as HTMLButtonElement;
            if (submitButton) {
              submitButton.click();
            }
            break;

          case "cancel":
            const cancelButton = document.querySelector(
              'button[type="button"]',
            ) as HTMLButtonElement;
            if (
              cancelButton &&
              (cancelButton.textContent?.includes("Cancel") ||
                cancelButton.textContent?.includes("Close"))
            ) {
              cancelButton.click();
            }
            break;

          case "clear":
            const inputs = document.querySelectorAll("input, textarea, select");
            inputs.forEach((input) => {
              if (
                input instanceof HTMLInputElement ||
                input instanceof HTMLTextAreaElement ||
                input instanceof HTMLSelectElement
              ) {
                input.value = "";
              }
            });
            break;

          case "refresh":
            window.location.reload();
            break;

          case "export":
            triggerExport();
            break;

          case "search":
            const searchInput = document.querySelector(
              'input[type="search"], input[placeholder*="search" i]',
            ) as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              const searchTerm = (transcript || "")
                .replace(/search for|find|look for/gi, "")
                .trim();
              searchInput.value = searchTerm;
              searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            }
            break;

          case "help":
            showVoiceCommandsHelp();
            break;

          case "settings":
            window.location.href = "/settings";
            break;

          case "toggleVoice":
            toggleListening();
            break;

          default:
            announceToScreenReader("Command action not implemented");
        }
      } catch (error) {
        console.error("Error executing voice command:", error);
        announceToScreenReader("Error executing command");

        if (audioFeedback) {
          playErrorSound();
        }
      }
    },
    [announceToScreenReader, audioFeedback, hapticFeedback],
  );

  // Voice control functions
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);

      announceToScreenReader("Voice commands activated");

      if (audioFeedback) {
        playStartSound();
      }
    }
  }, [isListening, announceToScreenReader, audioFeedback]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);

      announceToScreenReader("Voice commands deactivated");

      if (audioFeedback) {
        playStopSound();
      }
    }
  }, [isListening, announceToScreenReader, audioFeedback]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Command management
  const addCustomCommand = useCallback(
    (command: VoiceCommand) => {
      setCustomCommands((prev) => [...prev, command]);
      announceToScreenReader(`Custom command added: ${command.description}`);
    },
    [announceToScreenReader],
  );

  const removeCustomCommand = useCallback(
    (commandId: string) => {
      setCustomCommands((prev) => prev.filter((cmd) => cmd.id !== commandId));
      announceToScreenReader("Custom command removed");
    },
    [announceToScreenReader],
  );

  // Utility functions
  const playSuccessSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17PwU",
    );
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17PwU",
    );
    audio.play().catch(() => {});
  };

  const playStartSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17PwU",
    );
    audio.play().catch(() => {});
  };

  const playStopSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17PwU",
    );
    audio.play().catch(() => {});
  };

  const triggerExport = () => {
    const exportButton = document.querySelector(
      'button[aria-label*="export" i], button:contains("Export")',
    ) as HTMLButtonElement;
    if (exportButton) {
      exportButton.click();
    } else {
      announceToScreenReader("Export function not available");
    }
  };

  const showVoiceCommandsHelp = () => {
    const commandsText = allCommands
      .map(
        (cmd) =>
          `${cmd.description}: ${Array.isArray(cmd.phrase) ? cmd.phrase.join(", ") : cmd.phrase}`,
      )
      .join("\n");

    announceToScreenReader("Available voice commands:\n" + commandsText);
  };

  const allCommands = [...recognizedCommands, ...customCommands];

  const contextValue: VoiceCommandEngineContextType = {
    isListening,
    startListening,
    stopListening,
    toggleListening,
    recognizedCommands: allCommands,
    executeCommand,
    addCustomCommand,
    removeCustomCommand,
    language,
    confidence,
    continuous,
    interimResults,
    visualFeedback,
    audioFeedback,
    hapticFeedback,
  };

  return (
    <VoiceCommandEngineContext.Provider value={contextValue}>
      {children}
    </VoiceCommandEngineContext.Provider>
  );
};

// Hook
export const useVoiceCommands = (): VoiceCommandEngineContextType => {
  const context = React.useContext(VoiceCommandEngineContext);
  if (!context) {
    throw new Error("useVoiceCommands must be used within VoiceCommandEngine");
  }
  return context;
};

// Voice Control Component
export const VoiceControl: React.FC = () => {
  const { isListening, toggleListening, visualFeedback } = useVoiceCommands();

  if (!visualFeedback) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg transition-all duration-200 ${
          isListening
            ? "bg-red-500 animate-pulse"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        aria-label={
          isListening ? "Stop voice commands" : "Start voice commands"
        }
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {isListening && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded-lg shadow-lg">
          <div className="text-sm font-medium text-gray-900">Listening...</div>
          <div className="text-xs text-gray-500">Say a command</div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandEngine;
