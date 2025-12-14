import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  AccessibilityProvider,
  useAccessibility,
  AccessibilityControls,
  AccessibilityTest,
} from '../AccessibilityModes.js';
import { describe, expect, it, vi } from "vitest";

// Mock the UX mode context
vi.mock("../UserExperienceMode", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      accessibility: "standard",
    },
    updateCustomSettings: vi.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock document methods
Object.defineProperty(document, "documentElement", {
  value: {
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    },
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(document, "body", {
  value: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    style: {},
  },
  writable: true,
});

describe("AccessibilityProvider", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation(() => null);
    vi.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(
      <AccessibilityProvider>
        <div>Test Content</div>
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("loads saved config from localStorage", () => {
    const savedConfig = {
      mode: "high-contrast",
      fontSize: "large",
      lineHeight: "relaxed",
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "accessibility-config") return JSON.stringify(savedConfig);
      return null;
    });

    const TestComponent = () => {
      const { config } = useAccessibility();
      return <div>Mode: {config.mode}</div>;
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Mode: high-contrast")).toBeInTheDocument();
  });

  it("saves config to localStorage when changed", async () => {
    const TestComponent = () => {
      const { config, updateConfig } = useAccessibility();
      return (
        <div>
          <div>Mode: {config.mode}</div>
          <button onClick={() => updateConfig({ mode: "dyslexia-friendly" })}>
            Change Mode
          </button>
        </div>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.click(screen.getByText("Change Mode"));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "accessibility-config",
        expect.stringContaining("dyslexia-friendly"),
      );
    });
  });

  it("applies CSS classes to document based on mode", () => {
    const TestComponent = () => {
      const { updateConfig } = useAccessibility();
      return (
        <button onClick={() => updateConfig({ mode: "high-contrast" })}>
          Set High Contrast
        </button>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.click(screen.getByText("Set High Contrast"));

    expect(document.documentElement.classList.add).toHaveBeenCalledWith(
      "accessibility-high-contrast",
    );
  });

  it("applies font size styles", () => {
    const TestComponent = () => {
      const { updateConfig } = useAccessibility();
      return (
        <button onClick={() => updateConfig({ fontSize: "large" })}>
          Set Large Font
        </button>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.click(screen.getByText("Set Large Font"));

    expect(document.documentElement.style.fontSize).toBe("18px");
  });

  it("applies reduced motion when enabled", () => {
    const TestComponent = () => {
      const { updateConfig } = useAccessibility();
      return (
        <button onClick={() => updateConfig({ reducedMotion: true })}>
          Enable Reduced Motion
        </button>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.click(screen.getByText("Enable Reduced Motion"));

    expect(document.documentElement.classList.add).toHaveBeenCalledWith(
      "reduce-motion",
    );
  });
});

describe("AccessibilityControls", () => {
  it("renders all accessibility controls", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityControls />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Accessibility Settings")).toBeInTheDocument();
    expect(screen.getByText("Accessibility Mode")).toBeInTheDocument();
    expect(screen.getByText("Font Size")).toBeInTheDocument();
    expect(screen.getByText("Line Height")).toBeInTheDocument();
    expect(screen.getByText("Letter Spacing")).toBeInTheDocument();
    expect(screen.getByText("Colorblind Type")).toBeInTheDocument();
    expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
  });

  it("changes accessibility mode", async () => {
    render(
      <AccessibilityProvider>
        <AccessibilityControls />
      </AccessibilityProvider>,
    );

    const modeSelect = screen.getByDisplayValue("standard");
    fireEvent.change(modeSelect, { target: { value: "high-contrast" } });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it("changes font size", async () => {
    render(
      <AccessibilityProvider>
        <AccessibilityControls />
      </AccessibilityProvider>,
    );

    const fontSizeSelect = screen.getByDisplayValue("medium");
    fireEvent.change(fontSizeSelect, { target: { value: "large" } });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it("toggles boolean settings", async () => {
    render(
      <AccessibilityProvider>
        <AccessibilityControls />
      </AccessibilityProvider>,
    );

    const focusVisibleCheckbox = screen
      .getByText("Enhanced Focus Indicators")
      .querySelector("input");
    if (focusVisibleCheckbox) {
      fireEvent.click(focusVisibleCheckbox);
    }

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it("resets to defaults", async () => {
    render(
      <AccessibilityProvider>
        <AccessibilityControls />
      </AccessibilityProvider>,
    );

    const resetButton = screen.getByText("Reset to Defaults");
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("standard")).toBeInTheDocument();
      expect(screen.getByDisplayValue("medium")).toBeInTheDocument();
    });
  });
});

describe("AccessibilityTest", () => {
  it("renders test interface", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityTest />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Accessibility Testing")).toBeInTheDocument();
    expect(screen.getByText("Test Contrast Ratios")).toBeInTheDocument();
  });

  it("displays current configuration", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityTest />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Current Mode: standard")).toBeInTheDocument();
    expect(screen.getByText("Font Size: medium")).toBeInTheDocument();
    expect(screen.getByText("Line Height: normal")).toBeInTheDocument();
    expect(screen.getByText("Reduced Motion: No")).toBeInTheDocument();
  });

  it("triggers contrast test", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation();

    render(
      <AccessibilityProvider>
        <AccessibilityTest />
      </AccessibilityProvider>,
    );

    const testButton = screen.getByText("Test Contrast Ratios");
    fireEvent.click(testButton);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Contrast Test Results:",
      expect.any(Array),
    );

    consoleSpy.mockRestore();
  });
});

describe("useAccessibility hook", () => {
  it("throws error when used outside provider", () => {
    const TestComponent = () => {
      try {
        useAccessibility();
        return <div>Success</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /useAccessibility must be used within AccessibilityProvider/,
      ),
    ).toBeInTheDocument();
  });

  it("returns context when used within provider", () => {
    const TestComponent = () => {
      const { config, isHighContrast, isDyslexiaFriendly, isColorblindSafe } =
        useAccessibility();
      return (
        <div>
          <div>Mode: {config.mode}</div>
          <div>High Contrast: {isHighContrast ? "Yes" : "No"}</div>
          <div>Dyslexia Friendly: {isDyslexiaFriendly ? "Yes" : "No"}</div>
          <div>Colorblind Safe: {isColorblindSafe ? "Yes" : "No"}</div>
        </div>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Mode: standard")).toBeInTheDocument();
    expect(screen.getByText("High Contrast: No")).toBeInTheDocument();
    expect(screen.getByText("Dyslexia Friendly: No")).toBeInTheDocument();
    expect(screen.getByText("Colorblind Safe: No")).toBeInTheDocument();
  });

  it("updates computed values when mode changes", () => {
    const TestComponent = () => {
      const { config, updateConfig, isHighContrast } = useAccessibility();
      return (
        <div>
          <div>High Contrast: {isHighContrast ? "Yes" : "No"}</div>
          <button onClick={() => updateConfig({ mode: "high-contrast" })}>
            Enable High Contrast
          </button>
        </div>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("High Contrast: No")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Enable High Contrast"));

    expect(screen.getByText("High Contrast: Yes")).toBeInTheDocument();
  });

  it("provides font size, line height, and letter spacing values", () => {
    const TestComponent = () => {
      const { currentFontSize, currentLineHeight, currentLetterSpacing } =
        useAccessibility();
      return (
        <div>
          <div>Font Size: {currentFontSize}</div>
          <div>Line Height: {currentLineHeight}</div>
          <div>Letter Spacing: {currentLetterSpacing}</div>
        </div>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("Font Size: 16px")).toBeInTheDocument();
    expect(screen.getByText("Line Height: 1.5")).toBeInTheDocument();
    expect(screen.getByText("Letter Spacing: normal")).toBeInTheDocument();
  });
});

describe("Keyboard Navigation", () => {
  it("adds keyboard navigation class on keydown", () => {
    const TestComponent = () => <div>Test</div>;

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.body.classList.add).toHaveBeenCalledWith(
      "keyboard-navigation",
    );
  });

  it("removes keyboard navigation class on mousedown", () => {
    const TestComponent = () => <div>Test</div>;

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.mouseDown(document);

    expect(document.body.classList.remove).toHaveBeenCalledWith(
      "keyboard-navigation",
    );
  });
});

describe("Voice Navigation", () => {
  it("initializes voice navigation when enabled", () => {
    const TestComponent = () => {
      const { updateConfig } = useAccessibility();
      return (
        <button onClick={() => updateConfig({ voiceNavigation: true })}>
          Enable Voice Navigation
        </button>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    // Mock Web Speech API
    global.webkitSpeechRecognition = vi.fn();

    fireEvent.click(screen.getByText("Enable Voice Navigation"));

    // Should log that voice navigation is enabled
    expect(console.log).toHaveBeenCalledWith("Voice navigation enabled");
  });
});

describe("Colorblind Filters", () => {
  it("applies colorblind filter to body", () => {
    const TestComponent = () => {
      const { updateConfig } = useAccessibility();
      return (
        <button onClick={() => updateConfig({ colorBlindType: "protanopia" })}>
          Apply Protanopia Filter
        </button>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.click(screen.getByText("Apply Protanopia Filter"));

    expect(document.body.style.filter).toBe("url(#protanopia-filter)");
  });

  it("removes colorblind filter when set to none", () => {
    const TestComponent = () => {
      const { updateConfig } = useAccessibility();
      return (
        <button onClick={() => updateConfig({ colorBlindType: "none" })}>
          Remove Filter
        </button>
      );
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>,
    );

    fireEvent.click(screen.getByText("Remove Filter"));

    expect(document.body.style.filter).toBe("none");
  });
});
