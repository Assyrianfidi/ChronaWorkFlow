import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAuthStore } from "@/store/auth-store";
import {
  UserExperienceModeProvider,
  useUserExperienceMode,
  UXModeSelector,
  UXCustomSettings,
} from '../UserExperienceMode';

// Mock the auth store
vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "user" },
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

describe("UserExperienceModeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
    useAuthStore.mockReturnValue({ user: { role: "user" } });
  });

  it("renders children correctly", () => {
    render(
      <UserExperienceModeProvider>
        <div>Test Content</div>
      </UserExperienceModeProvider>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("loads saved mode from localStorage", () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "ux-mode") return "power-user";
      return null;
    });

    const TestComponent = () => {
      const { currentMode } = useUserExperienceMode();
      return <div>Current mode: {currentMode.id}</div>;
    };

    render(
      <UserExperienceModeProvider>
        <TestComponent />
      </UserExperienceModeProvider>,
    );

    expect(screen.getByText(/Current mode:/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("power-user"))).toBeInTheDocument();
  });

  it("saves mode to localStorage when changed", async () => {
    const TestComponent = () => {
      const { currentMode, setMode } = useUserExperienceMode();
      return (
        <div>
          <div>Current mode: {currentMode.id}</div>
          <button
            onClick={() =>
              setMode({
                id: "power-user",
                name: "Power User",
                description: "Fast mode",
                icon: "⚡",
                theme: "dark",
                density: "compact",
                animations: "minimal",
                accessibility: "standard",
                notifications: "minimal",
                shortcuts: true,
                tooltips: false,
                sounds: false,
              })
            }
          >
            Switch to Power User
          </button>
        </div>
      );
    };

    render(
      <UserExperienceModeProvider>
        <TestComponent />
      </UserExperienceModeProvider>,
    );

    fireEvent.click(screen.getByText("Switch to Power User"));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ux-mode",
        "power-user",
      );
    });
  });

  it("auto-selects mode based on user role", () => {
    useAuthStore.mockReturnValue({ user: { role: "admin" } });

    const TestComponent = () => {
      const { currentMode } = useUserExperienceMode();
      return <div>Current mode: {currentMode.id}</div>;
    };

    render(
      <UserExperienceModeProvider>
        <TestComponent />
      </UserExperienceModeProvider>,
    );

    expect(screen.getByText("Current mode: power-user")).toBeInTheDocument();
  });
});

describe("UXModeSelector", () => {
  it("renders all available modes", () => {
    render(
      <UserExperienceModeProvider>
        <UXModeSelector />
      </UserExperienceModeProvider>,
    );

    expect(screen.getByText("User Experience Mode")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Power User")).toBeInTheDocument();
    expect(screen.getByText("Accessibility")).toBeInTheDocument();
    expect(screen.getByText("Presentation")).toBeInTheDocument();
    expect(screen.getByText("Mobile Optimized")).toBeInTheDocument();
  });

  it("switches mode when clicking on mode option", async () => {
    const TestComponent = () => (
      <UserExperienceModeProvider>
        <UXModeSelector />
      </UserExperienceModeProvider>
    );

    render(<TestComponent />);

    const powerUserButton = screen.getByText("Power User").closest("button");
    if (powerUserButton) {
      fireEvent.click(powerUserButton);
    }

    await waitFor(() => {
      expect(screen.getByText("Power User").closest("button")).toHaveClass(
        "border-blue-500",
      );
    });
  });
});

describe("UXCustomSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({ user: { role: "user" } });
    localStorageMock.getItem.mockImplementation(() => null);
  });

  it("renders custom settings controls", () => {
    render(
      <UserExperienceModeProvider>
        <UXCustomSettings />
      </UserExperienceModeProvider>,
    );

    expect(screen.getByText("Custom Settings")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Interface Density")).toBeInTheDocument();
    expect(screen.getByText("Animations")).toBeInTheDocument();
    expect(screen.getByText("Accessibility Mode")).toBeInTheDocument();
  });

  it("updates custom settings when changed", async () => {
    render(
      <UserExperienceModeProvider>
        <UXCustomSettings />
      </UserExperienceModeProvider>,
    );

    const themeSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(themeSelect, { target: { value: "dark" } });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(themeSelect).toHaveValue("dark");
    });
  });

  it("resets to defaults when reset button clicked", async () => {
    render(
      <UserExperienceModeProvider>
        <UXCustomSettings />
      </UserExperienceModeProvider>,
    );

    const resetButton = screen.getByText("Reset to Defaults");
    fireEvent.click(resetButton);

    await waitFor(() => {
      const themeSelect = screen.getAllByRole("combobox")[0];
      expect(themeSelect).toHaveValue("auto");
    });
  });
});

describe("useUserExperienceMode hook", () => {
  it("throws error when used outside provider", () => {
    const TestComponent = () => {
      try {
        useUserExperienceMode();
        return <div>Success</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /useUserExperienceMode must be used within UserExperienceModeProvider/,
      ),
    ).toBeInTheDocument();
  });

  it("returns context when used within provider", () => {
    const TestComponent = () => {
      const { currentMode, setMode, availableModes } = useUserExperienceMode();
      return (
        <div>
          <div>Current mode: {currentMode.name}</div>
          <div>Available modes: {availableModes.length}</div>
        </div>
      );
    };

    render(
      <UserExperienceModeProvider>
        <TestComponent />
      </UserExperienceModeProvider>,
    );

    expect(screen.getByText(/Current mode:/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Standard"))).toBeInTheDocument();
    expect(screen.getByText("Available modes: 5")).toBeInTheDocument();
  });

  it("updates custom settings correctly", () => {
    const TestComponent = () => {
      const { customSettings, updateCustomSettings } = useUserExperienceMode();
      return (
        <div>
          <div>Custom theme: {customSettings.theme || "auto"}</div>
          <button onClick={() => updateCustomSettings({ theme: "dark" })}>
            Set Dark Theme
          </button>
        </div>
      );
    };

    render(
      <UserExperienceModeProvider>
        <TestComponent />
      </UserExperienceModeProvider>,
    );

    fireEvent.click(screen.getByText("Set Dark Theme"));

    expect(screen.getByText("Custom theme: dark")).toBeInTheDocument();
  });
});
