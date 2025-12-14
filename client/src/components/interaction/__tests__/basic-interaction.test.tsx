import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock modules
vi.mock("../hooks/useWindowSize", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "user" },
  })),
}));

vi.mock("../adaptive/UserExperienceMode.tsx", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      id: "standard",
      name: "Standard",
      animations: "normal",
      sounds: false,
      shortcuts: true,
    },
  })),
}));

vi.mock("../adaptive/UI-Performance-Engine.tsx", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

vi.mock("../adaptive/AccessibilityModes", () => ({
  useAccessibility: vi.fn(() => ({
    reducedMotion: false,
  })),
}));

// Mock cn utility
vi.mock("cn", () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

describe("Basic Interaction Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic interaction component", async () => {
    // Import dynamically to avoid JSX issues
    const { InteractionEngine } = await import("../InteractionEngine.tsx");
    const { UserExperienceModeProvider } = await import(
      "../../adaptive/UserExperienceMode.tsx"
    );
    const { UIPerformanceEngine } = await import(
      "../../adaptive/UI-Performance-Engine.tsx"
    );
    const { AccessibilityProvider } = await import(
      "../../adaptive/AccessibilityModes"
    );
    const { AdaptiveLayoutEngine } = await import(
      "../../adaptive/AdaptiveLayoutEngine.tsx"
    );

    render(
      <AdaptiveLayoutEngine>
        <UserExperienceModeProvider>
          <AccessibilityProvider>
            <UIPerformanceEngine>
              <InteractionEngine>
                <div>Test Content</div>
              </InteractionEngine>
            </UIPerformanceEngine>
          </AccessibilityProvider>
        </UserExperienceModeProvider>
      </AdaptiveLayoutEngine>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
