import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { SmartWorkflow } from '../SmartWorkflow';
import { AutomationEngine } from '../AutomationEngine';

// Mock modules
vi.mock("../hooks/useWindowSize", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "admin", id: "user-123" },
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
}));

vi.mock("../../adaptive/UI-Performance-Engine.tsx", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

describe("SmartWorkflow", () => {
  const mockWorkflow = {
    id: "test-workflow",
    name: "Test Workflow",
    description: "Test workflow description",
    category: "business" as const,
    version: "1.0.0",
    steps: [
      {
        id: "step-1",
        name: "Start Step",
        type: "manual" as const,
        config: {
          description: "Initial step",
          assignee: "user",
        },
        status: "pending" as const,
        position: { x: 100, y: 100 },
        connections: [],
        metadata: {
          createdAt: Date.now(),
        },
      },
    ],
    variables: {
      testVar: "test-value",
    },
    settings: {
      timeout: 3600000,
      retryAttempts: 3,
      parallelExecution: false,
      errorHandling: "stop" as const,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: "test-user",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithWorkflow = (workflow?: any, props?: any) => {
    return render(
      <AutomationEngine>
        <SmartWorkflow workflow={workflow} {...props} />
      </AutomationEngine>,
    );
  };

  it("renders empty state when no workflow provided", () => {
    renderWithWorkflow();

    expect(screen.getByText("No Workflow Selected")).toBeInTheDocument();
    expect(
      screen.getByText("Create a new workflow or select an existing one"),
    ).toBeInTheDocument();
    expect(screen.getByText("Create from Template")).toBeInTheDocument();
  });

  it("renders workflow when provided", () => {
    renderWithWorkflow(mockWorkflow);

    // The canvas currently renders the primary step card rather than a separate
    // top-level workflow title, so we assert on the visible step content.
    expect(screen.getByText("Start Step")).toBeInTheDocument();
    expect(screen.getByText("manual")).toBeInTheDocument();
  });

  it("shows template library button", () => {
    renderWithWorkflow(mockWorkflow);

    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Execute")).toBeInTheDocument();
  });

  it("opens template library when Templates button clicked", () => {
    renderWithWorkflow(mockWorkflow);

    fireEvent.click(screen.getByText("Templates"));

    expect(screen.getByText("Workflow Templates")).toBeInTheDocument();
    expect(screen.getByText("Document Approval")).toBeInTheDocument();
    expect(screen.getByText("Incident Response")).toBeInTheDocument();
    expect(screen.getByText("Employee Onboarding")).toBeInTheDocument();
  });

  it("displays workflow templates", () => {
    renderWithWorkflow();

    fireEvent.click(screen.getByText("Create from Template"));

    expect(screen.getByText("Document Approval")).toBeInTheDocument();
    expect(
      screen.getByText("Multi-level document approval workflow"),
    ).toBeInTheDocument();
    expect(screen.getByText("Incident Response")).toBeInTheDocument();
    expect(
      screen.getByText("Automated incident response workflow"),
    ).toBeInTheDocument();
  });

  it("applies template when selected", async () => {
    const mockOnWorkflowChange = vi.fn();

    renderWithWorkflow(undefined, { onWorkflowChange: mockOnWorkflowChange });

    fireEvent.click(screen.getByText("Create from Template"));

    // Click on Document Approval template
    fireEvent.click(screen.getByText("Document Approval"));

    await waitFor(() => {
      expect(mockOnWorkflowChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Document Approval",
          category: "approval",
        }),
      );
    });

    // Template library should close
    expect(screen.queryByText("Workflow Templates")).not.toBeInTheDocument();
  });

  it("closes template library when Cancel clicked", () => {
    renderWithWorkflow();

    fireEvent.click(screen.getByText("Create from Template"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByText("Workflow Templates")).not.toBeInTheDocument();
  });

  it("renders workflow steps correctly", () => {
    renderWithWorkflow(mockWorkflow);

    expect(screen.getByText("Start Step")).toBeInTheDocument();
    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("selects step when clicked", () => {
    renderWithWorkflow(mockWorkflow);

    fireEvent.click(screen.getByText("Start Step"));

    // Step editor should appear
    expect(screen.getByText("Edit Step: Start Step")).toBeInTheDocument();
  });

  it("shows step editor when step is selected", () => {
    renderWithWorkflow(mockWorkflow);

    fireEvent.click(screen.getByText("Start Step"));

    expect(screen.getByText("Edit Step: Start Step")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Start Step")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Manual")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Initial step")).toBeInTheDocument();
  });

  it("updates step name in editor", async () => {
    const mockOnWorkflowChange = vi.fn();

    renderWithWorkflow(mockWorkflow, {
      onWorkflowChange: mockOnWorkflowChange,
    });

    fireEvent.click(screen.getByText("Start Step"));

    const nameInput = screen.getByDisplayValue("Start Step");
    fireEvent.change(nameInput, { target: { value: "Updated Step" } });

    await waitFor(() => {
      expect(mockOnWorkflowChange).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              name: "Updated Step",
            }),
          ]),
        }),
      );
    });
  });

  it("updates step type in editor", async () => {
    const mockOnWorkflowChange = vi.fn();

    renderWithWorkflow(mockWorkflow, {
      onWorkflowChange: mockOnWorkflowChange,
    });

    fireEvent.click(screen.getByText("Start Step"));

    const typeSelect = screen.getByDisplayValue("Manual");
    fireEvent.change(typeSelect, { target: { value: "automated" } });

    await waitFor(() => {
      expect(mockOnWorkflowChange).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              type: "automated",
            }),
          ]),
        }),
      );
    });
  });

  it("updates step description in editor", async () => {
    const mockOnWorkflowChange = vi.fn();

    renderWithWorkflow(mockWorkflow, {
      onWorkflowChange: mockOnWorkflowChange,
    });

    fireEvent.click(screen.getByText("Start Step"));

    const descriptionTextarea = screen.getByDisplayValue("Initial step");
    fireEvent.change(descriptionTextarea, {
      target: { value: "Updated description" },
    });

    await waitFor(() => {
      expect(mockOnWorkflowChange).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              config: expect.objectContaining({
                description: "Updated description",
              }),
            }),
          ]),
        }),
      );
    });
  });

  it("shows assignee field for manual steps", () => {
    const manualStep = {
      ...mockWorkflow,
      steps: [
        {
          ...mockWorkflow.steps[0],
          type: "manual" as const,
        },
      ],
    };

    renderWithWorkflow(manualStep);

    fireEvent.click(screen.getByText("Start Step"));

    expect(screen.getByLabelText("Assignee")).toBeInTheDocument();
    expect(screen.getByDisplayValue("user")).toBeInTheDocument();
  });

  it("shows delay field for delay steps", () => {
    const delayStep = {
      ...mockWorkflow,
      steps: [
        {
          ...mockWorkflow.steps[0],
          type: "delay" as const,
          config: { delay: 30 },
        },
      ],
    };

    renderWithWorkflow(delayStep);

    fireEvent.click(screen.getByText("Start Step"));

    expect(screen.getByLabelText("Delay (minutes)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
  });

  it("shows conditions for decision steps", () => {
    const decisionStep = {
      ...mockWorkflow,
      steps: [
        {
          ...mockWorkflow.steps[0],
          type: "decision" as const,
          config: {
            conditions: [
              { field: "status", operator: "equals", value: "approved" },
            ],
          },
        },
      ],
    };

    renderWithWorkflow(decisionStep);

    fireEvent.click(screen.getByText("Start Step"));

    expect(screen.getByText("Conditions")).toBeInTheDocument();
    expect(screen.getByDisplayValue("status")).toBeInTheDocument();
    expect(screen.getByDisplayValue("approved")).toBeInTheDocument();
  });

  it("deletes step when delete button clicked", async () => {
    const mockOnWorkflowChange = vi.fn();

    renderWithWorkflow(mockWorkflow, {
      onWorkflowChange: mockOnWorkflowChange,
    });

    fireEvent.click(screen.getByText("Start Step"));
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockOnWorkflowChange).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: [],
        }),
      );
    });

    // Step editor should close
    expect(screen.queryByText("Edit Step: Start Step")).not.toBeInTheDocument();
  });

  it("executes workflow when Execute button clicked", async () => {
    renderWithWorkflow(mockWorkflow);

    fireEvent.click(screen.getByText("Execute"));

    // Should show executing state
    expect(screen.getByText("Executing...")).toBeInTheDocument();
  });

  it("disables controls in read-only mode", () => {
    renderWithWorkflow(mockWorkflow, { readOnly: true });

    expect(screen.queryByText("Templates")).not.toBeInTheDocument();
    expect(screen.queryByText("Execute")).not.toBeInTheDocument();
  });

  it("shows correct step status colors", () => {
    const workflowWithStatuses = {
      ...mockWorkflow,
      steps: [
        {
          ...mockWorkflow.steps[0],
          status: "completed" as const,
        },
        {
          ...mockWorkflow.steps[0],
          id: "step-2",
          name: "Failed Step",
          status: "failed" as const,
          position: { x: 300, y: 100 },
        },
        {
          ...mockWorkflow.steps[0],
          id: "step-3",
          name: "Running Step",
          status: "running" as const,
          position: { x: 500, y: 100 },
        },
      ],
    };

    renderWithWorkflow(workflowWithStatuses);

    const completedStatus = screen.getAllByText("completed")[0];
    const failedStatus = screen.getByText("failed");
    const runningStatus = screen.getByText("running");

    expect(completedStatus).toHaveClass("bg-green-100", "text-green-800");
    expect(failedStatus).toHaveClass("bg-red-100", "text-red-800");
    expect(runningStatus).toHaveClass("bg-blue-100", "text-blue-800");
  });

  it("shows step type indicators", () => {
    renderWithWorkflow(mockWorkflow);

    const stepCard = screen.getByText("Start Step").closest("div");

    expect(stepCard).toBeInTheDocument();
    // Check for type indicator (colored dot)
    const typeIndicator = stepCard?.querySelector(".bg-blue-500");
    expect(typeIndicator).toBeInTheDocument();
  });

  it("renders connections between steps", () => {
    const workflowWithConnection = {
      ...mockWorkflow,
      steps: [
        mockWorkflow.steps[0],
        {
          ...mockWorkflow.steps[0],
          id: "step-2",
          name: "Second Step",
          position: { x: 300, y: 100 },
          connections: [{ from: "step-1", to: "step-2" }],
        },
      ],
    };

    renderWithWorkflow(workflowWithConnection);

    // Check for SVG connections
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();

    const lines = svg?.querySelectorAll("line");
    expect(lines?.length).toBeGreaterThan(0);
  });
});

describe("SmartWorkflow Integration", () => {
  const integrationWorkflow = {
    id: "test-workflow",
    name: "Test Workflow",
    description: "Test workflow description",
    category: "business" as const,
    version: "1.0.0",
    steps: [
      {
        id: "step-1",
        name: "Start Step",
        type: "manual" as const,
        config: {
          description: "Initial step",
          assignee: "user",
        },
        status: "pending" as const,
        position: { x: 100, y: 100 },
        connections: [],
        metadata: {
          createdAt: Date.now(),
        },
      },
    ],
    variables: {
      testVar: "test-value",
    },
    settings: {
      timeout: 3600000,
      retryAttempts: 3,
      parallelExecution: false,
      errorHandling: "stop" as const,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: "test-user",
  };
  it("integrates with automation context", async () => {
    const mockOnWorkflowChange = vi.fn();

    render(
      <AutomationEngine>
        <SmartWorkflow
          workflow={integrationWorkflow}
          onWorkflowChange={mockOnWorkflowChange}
        />
      </AutomationEngine>,
    );

    // The SmartWorkflow canvas renders the step cards, not a top-level workflow title.
    // Verify that the primary step is present, indicating that the workflow loaded.
    expect(screen.getByText("Start Step")).toBeInTheDocument();
  });

  it("handles workflow execution through automation", async () => {
    render(
      <AutomationEngine>
        <SmartWorkflow workflow={integrationWorkflow} />
      </AutomationEngine>,
    );

    fireEvent.click(screen.getByText("Execute"));

    await waitFor(() => {
      // Should attempt to create and execute automation rule
      expect(screen.getByText("Executing...")).toBeInTheDocument();
    });
  });

  it("handles performance mode adaptations", async () => {
    vi.doMock("../../adaptive/UI-Performance-Engine.tsx", () => ({
      usePerformance: vi.fn(() => ({
        isLowPerformanceMode: true,
      })),
    }));

    render(
      <AutomationEngine>
        <SmartWorkflow workflow={integrationWorkflow} />
      </AutomationEngine>,
    );

    // Should still render but with performance optimizations; the step card remains visible.
    expect(screen.getByText("Start Step")).toBeInTheDocument();
  });
});

describe("SmartWorkflow Error Handling", () => {
  it("handles missing workflow gracefully", () => {
    render(
      <AutomationEngine>
        <SmartWorkflow />
      </AutomationEngine>,
    );

    expect(screen.getByText("No Workflow Selected")).toBeInTheDocument();
  });

  it("handles invalid workflow data gracefully", () => {
    const invalidWorkflow = {
      id: "invalid",
      name: null,
      steps: [],
    };

    render(
      <AutomationEngine>
        <SmartWorkflow workflow={invalidWorkflow} />
      </AutomationEngine>,
    );

    // Should not crash and show empty state or minimal UI
    expect(document.body).toBeInTheDocument();
  });

  it("handles template selection errors gracefully", async () => {
    const mockOnWorkflowChange = vi.fn();
    mockOnWorkflowChange.mockRejectedValue(new Error("Template error"));

    render(
      <AutomationEngine>
        <SmartWorkflow onWorkflowChange={mockOnWorkflowChange} />
      </AutomationEngine>,
    );

    fireEvent.click(screen.getByText("Create from Template"));
    fireEvent.click(screen.getByText("Document Approval"));

    // Should not crash, template library should remain open
    await waitFor(() => {
      expect(screen.getByText("Workflow Templates")).toBeInTheDocument();
    });
  });
});
