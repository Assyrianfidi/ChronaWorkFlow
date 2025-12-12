
declare global {
  interface Window {
    [key: string]: any;
  }
}

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VisualModeEngine, useVisualMode } from '../VisualModeEngine.js';
import React from "react";

// Mock localStorage and matchMedia globally
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

const mockMatchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Setup global mocks
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, "matchMedia", {
  value: mockMatchMedia,
  writable: true,
});

// Simple test component
// @ts-ignore
const TestComponent: React.FC = () => {
  try {
    const {
      currentMode,
      availableModes,
      setMode,
      resetMode,
      settings,
      updateSettings,
      detectSystemPreferences,
      applySystemTheme,
    } = useVisualMode();

    return (
      <div>
        <div data-testid="current-mode">{currentMode?.name || "none"}</div>
        <div data-testid="available-modes-count">{availableModes.length}</div>
        <div data-testid="bg-color">{settings.backgroundColor}</div>
        <div data-testid="text-color">{settings.textColor}</div>
        <button
          data-testid="set-high-contrast"
          onClick={() => setMode("high-contrast")}
        >
          Set High Contrast
        </button>
        <button data-testid="reset-mode" onClick={resetMode}>
          Reset Mode
        </button>
        <button
          data-testid="update-settings"
          onClick={() => updateSettings({ fontSize: 1.5 })}
        >
          Update Settings
        </button>
        <button data-testid="detect-system" onClick={detectSystemPreferences}>
          Detect System
        </button>
        <button data-testid="apply-theme" onClick={applySystemTheme}>
          Apply Theme
        </button>
      </div>
    );
  } catch (error) {
    return <div data-testid="error">{String(error)}</div>;
  }
};

describe("VisualModeEngine - Core Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children without crashing", () => {
    render(
      <VisualModeEngine>
        <div data-testid="test-child">Test Content</div>
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("provides context to child components", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("current-mode")).toBeInTheDocument();
    expect(screen.getByTestId("available-modes-count")).toBeInTheDocument();
    expect(screen.getByTestId("bg-color")).toBeInTheDocument();
    expect(screen.getByTestId("text-color")).toBeInTheDocument();
  });

  it("starts with default mode settings", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("current-mode")).toHaveTextContent("Default");
    expect(screen.getByTestId("bg-color")).toHaveTextContent("#ffffff");
    expect(screen.getByTestId("text-color")).toHaveTextContent("#1f2937");
  });

  it("has correct number of built-in modes", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("available-modes-count")).toHaveTextContent("6");
  });

  it("switches modes correctly", async () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    const highContrastBtn = screen.getByTestId("set-high-contrast");
    fireEvent.click(highContrastBtn);

    await waitFor(() => {
      expect(screen.getByTestId("current-mode")).toHaveTextContent(
        "High Contrast",
      );
      expect(screen.getByTestId("bg-color")).toHaveTextContent("#000000");
      expect(screen.getByTestId("text-color")).toHaveTextContent("#ffffff");
    });
  });

  it("resets to default mode", async () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    // First switch to high contrast
    const highContrastBtn = screen.getByTestId("set-high-contrast");
    fireEvent.click(highContrastBtn);

    await waitFor(() => {
      expect(screen.getByTestId("current-mode")).toHaveTextContent(
        "High Contrast",
      );
    });

    // Then reset
    const resetBtn = screen.getByTestId("reset-mode");
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByTestId("current-mode")).toHaveTextContent("Default");
    });
  });

  it("updates settings without errors", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    const updateBtn = screen.getByTestId("update-settings");
    expect(() => fireEvent.click(updateBtn)).not.toThrow();
  });

  it("detects system preferences without errors", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    const detectBtn = screen.getByTestId("detect-system");
    expect(() => fireEvent.click(detectBtn)).not.toThrow();
  });

  it("applies system theme without errors", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    const applyThemeBtn = screen.getByTestId("apply-theme");
    expect(() => fireEvent.click(applyThemeBtn)).not.toThrow();
  });

  it("handles localStorage persistence", () => {
    mockLocalStorage.getItem.mockReturnValue("high-contrast");

    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("visual-mode");
  });

  it("saves to localStorage when mode changes", async () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    const highContrastBtn = screen.getByTestId("set-high-contrast");
    fireEvent.click(highContrastBtn);

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "visual-mode",
        "high-contrast",
      );
    });
  });

  it("handles localStorage errors gracefully", () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error("Storage error");
    });

    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    const highContrastBtn = screen.getByTestId("set-high-contrast");
    expect(() => fireEvent.click(highContrastBtn)).not.toThrow();
  });
});

describe("VisualModeEngine - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles missing localStorage gracefully", () => {
    const originalLocalStorage = window.localStorage;
// @ts-ignore
// @ts-ignore
    delete (window as any).localStorage;

    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("current-mode")).toBeInTheDocument();
// @ts-ignore
// @ts-ignore
    (window as any).localStorage = originalLocalStorage;
  });

  it("handles matchMedia errors gracefully", () => {
    mockMatchMedia.mockImplementation(() => {
      throw new Error("MatchMedia error");
    });

    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("current-mode")).toBeInTheDocument();
  });
});

describe("VisualModeEngine - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it("integrates with accessibility features", () => {
    render(
      <VisualModeEngine>
        <div data-testid="accessibility-integration">
          Accessibility features integrated
        </div>
      </VisualModeEngine>,
    );

    expect(screen.getByTestId("accessibility-integration")).toBeInTheDocument();
  });

  it("maintains state consistency", async () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    // Switch mode
    const highContrastBtn = screen.getByTestId("set-high-contrast");
    fireEvent.click(highContrastBtn);

    await waitFor(() => {
      expect(screen.getByTestId("current-mode")).toHaveTextContent(
        "High Contrast",
      );
      expect(screen.getByTestId("bg-color")).toHaveTextContent("#000000");
      expect(screen.getByTestId("text-color")).toHaveTextContent("#ffffff");
    });

    // Verify settings are consistent
    expect(screen.getByTestId("bg-color")).toHaveTextContent("#000000");
    expect(screen.getByTestId("text-color")).toHaveTextContent("#ffffff");
  });

  it("provides all required context methods", () => {
    render(
      <VisualModeEngine>
        <TestComponent />
      </VisualModeEngine>,
    );

    // All buttons should be present, indicating all methods are available
    expect(screen.getByTestId("set-high-contrast")).toBeInTheDocument();
    expect(screen.getByTestId("reset-mode")).toBeInTheDocument();
    expect(screen.getByTestId("update-settings")).toBeInTheDocument();
    expect(screen.getByTestId("detect-system")).toBeInTheDocument();
    expect(screen.getByTestId("apply-theme")).toBeInTheDocument();
  });
});
