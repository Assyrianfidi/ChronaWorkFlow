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

vi.mock("../../adaptive/UserExperienceMode.tsx", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      id: "standard",
      name: "Standard",
      animations: "normal",
      sounds: false,
      shortcuts: true,
    },
  })),
  UserExperienceModeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../adaptive/UI-Performance-Engine.tsx", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
  UIPerformanceEngine: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../adaptive/AccessibilityModes", () => ({
  useAccessibility: vi.fn(() => ({
    reducedMotion: false,
  })),
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../adaptive/AdaptiveLayoutEngine.tsx", () => ({
  AdaptiveLayoutEngine: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("Phase C Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders InteractionEngine", async () => {
    const { InteractionEngine } = await import("../InteractionEngine.tsx");

    render(
      <InteractionEngine>
        <div>Interaction Engine Test</div>
      </InteractionEngine>,
    );

    expect(screen.getByText("Interaction Engine Test")).toBeInTheDocument();
  });

  it("renders WorkflowManager", async () => {
    const { WorkflowManager } = await import("../WorkflowManager.tsx");

    render(
      <WorkflowManager>
        <div>Workflow Manager Test</div>
      </WorkflowManager>,
    );

    expect(screen.getByText("Workflow Manager Test")).toBeInTheDocument();
  });

  it("renders PredictiveAssistant", async () => {
    const { PredictiveAssistant } = await import("../PredictiveAssistant.tsx");

    render(
      <PredictiveAssistant>
        <div>Predictive Assistant Test</div>
      </PredictiveAssistant>,
    );

    expect(screen.getByText("Predictive Assistant Test")).toBeInTheDocument();
  });

  it("renders ErrorRecoveryUI", async () => {
    const { ErrorRecoveryUI } = await import("../ErrorRecoveryUI.tsx");

    render(
      <ErrorRecoveryUI>
        <div>Error Recovery UI Test</div>
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Error Recovery UI Test")).toBeInTheDocument();
  });

  it("renders all Phase C components together", async () => {
    const { InteractionEngine } = await import("../InteractionEngine.tsx");
    const { WorkflowManager } = await import("../WorkflowManager.tsx");
    const { PredictiveAssistant } = await import("../PredictiveAssistant.tsx");
    const { ErrorRecoveryUI } = await import("../ErrorRecoveryUI.tsx");

    render(
      <ErrorRecoveryUI>
        <PredictiveAssistant>
          <WorkflowManager>
            <InteractionEngine>
              <div>All Phase C Components</div>
            </InteractionEngine>
          </WorkflowManager>
        </PredictiveAssistant>
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("All Phase C Components")).toBeInTheDocument();
  });
});
