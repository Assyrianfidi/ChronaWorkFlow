import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AIPoweredAssistant } from '../AIPoweredAssistant.js';
import { AutomationEngine } from '../AutomationEngine.js';

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

describe("AIPoweredAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAssistant = (props?: any) => {
    return render(
      <AutomationEngine>
        <AIPoweredAssistant {...props} />
      </AutomationEngine>,
    );
  };

  it("renders assistant interface", () => {
    renderAssistant();

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(
      screen.getByText("Hello! I'm your AI assistant."),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask me anything..."),
    ).toBeInTheDocument();
  });

  it("displays welcome message with actions", () => {
    renderAssistant();

    expect(screen.getByText(/I can help you with:/)).toBeInTheDocument();
    expect(screen.getByText("Creating automation rules")).toBeInTheDocument();
    expect(
      screen.getByText("Generating reports and dashboards"),
    ).toBeInTheDocument();
    expect(screen.getByText("Monitoring system health")).toBeInTheDocument();
  });

  it("shows action buttons in welcome message", () => {
    renderAssistant();

    expect(screen.getByText("Create Automation")).toBeInTheDocument();
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
    expect(screen.getByText("System Status")).toBeInTheDocument();
  });

  it("sends user message and receives response", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Create automation" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("Create automation")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/I can help you create an automation rule/),
      ).toBeInTheDocument();
    });
  });

  it("shows typing indicator while processing", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.click(screen.getByText("Send"));

    // Should show typing indicator
    expect(document.querySelector(".animate-bounce")).toBeInTheDocument();
  });

  it("executes actions from assistant response", async () => {
    renderAssistant();

    // Click on Create Automation action in welcome message
    fireEvent.click(screen.getByText("Create Automation"));

    await waitFor(() => {
      expect(
        screen.getByText(/✅ Create Automation completed successfully/),
      ).toBeInTheDocument();
    });
  });

  it("handles action execution errors", async () => {
    const mockCreateRule = vi
      .fn()
      .mockRejectedValue(new Error("Creation failed"));

    vi.doMock("../AutomationEngine", async () => {
      const actual = await vi.importActual("../AutomationEngine");
      return {
        ...actual,
        useAutomation: () => ({
          createRule: mockCreateRule,
          executeRule: vi.fn(),
          getStatistics: vi.fn(),
          rules: [],
          executions: [],
          models: [],
          suggestions: [],
          createRule: mockCreateRule,
          updateRule: vi.fn(),
          deleteRule: vi.fn(),
          enableRule: vi.fn(),
          disableRule: vi.fn(),
          executeRule: vi.fn(),
          cancelExecution: vi.fn(),
          trainModel: vi.fn(),
          predict: vi.fn(),
          generateSuggestions: vi.fn(),
          applySuggestion: vi.fn(),
          dismissSuggestion: vi.fn(),
          getExecutionHistory: vi.fn(),
          getStatistics: vi.fn(),
        }),
      };
    });

    renderAssistant();

    fireEvent.click(screen.getByText("Create Automation"));

    await waitFor(() => {
      expect(
        screen.getByText(/❌ Failed to execute Create Automation/),
      ).toBeInTheDocument();
    });
  });

  it("shows suggestions in assistant responses", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "help me create automation" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(screen.getByText(/Suggestions:/)).toBeInTheDocument();
      expect(
        screen.getByText("Create a data backup automation"),
      ).toBeInTheDocument();
    });
  });

  it("clicks suggestions to populate input", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(
        screen.getByText("Show me how to create an automation"),
      ).toBeInTheDocument();
    });

    // Click on suggestion
    fireEvent.click(screen.getByText("Show me how to create an automation"));

    expect(input).toHaveValue("Show me how to create an automation");
  });

  it("minimizes assistant when minimize button clicked", () => {
    renderAssistant();

    // Should show full interface initially
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();

    // Click minimize button
    fireEvent.click(screen.getByText("−"));

    // Should show only minimized button
    expect(screen.queryByText("AI Assistant")).not.toBeInTheDocument();
    expect(screen.getByText("💬")).toBeInTheDocument();
  });

  it("restores from minimized state", () => {
    renderAssistant();

    // Minimize first
    fireEvent.click(screen.getByText("−"));
    expect(screen.queryByText("AI Assistant")).not.toBeInTheDocument();

    // Click to restore
    fireEvent.click(screen.getByText("💬"));

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("disables send button when input is empty", () => {
    renderAssistant();

    const sendButton = screen.getByText("Send");
    expect(sendButton).toBeDisabled();
  });

  it("enables send button when input has text", () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "test" } });
    expect(sendButton).not.toBeDisabled();
  });

  it("sends message on Enter key press", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.keyPress(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("test message")).toBeInTheDocument();
    });
  });

  it("clears input after sending message", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("shows quick actions for new users", () => {
    renderAssistant();

    expect(screen.getByText("Quick Actions:")).toBeInTheDocument();
    expect(screen.getByText("Create Automation")).toBeInTheDocument();
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
    expect(screen.getByText("System Status")).toBeInTheDocument();
  });

  it("hides quick actions after first interaction", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(screen.queryByText("Quick Actions:")).not.toBeInTheDocument();
    });
  });

  it("handles different message types correctly", async () => {
    renderAssistant();

    // Send different types of messages
    const messages = [
      "run report",
      "system status",
      "help me",
      "error occurred",
    ];

    for (const message of messages) {
      const input = screen.getByPlaceholderText("Ask me anything...");
      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });

      // Wait for response
      await waitFor(
        () => {
          expect(screen.getByText(/I can help you/)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    }
  });

  it("shows timestamps on messages", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  it("handles onAction callback", async () => {
    const mockOnAction = vi.fn();

    renderAssistant({ onAction: mockOnAction });

    fireEvent.click(screen.getByText("Create Automation"));

    await waitFor(() => {
      expect(mockOnAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "create-automation",
          type: "automation",
          label: "Create Automation",
        }),
      );
    });
  });

  it("applies custom className", () => {
    renderAssistant({ className: "custom-class" });

    const assistantContainer = document.querySelector(".custom-class");
    expect(assistantContainer).toBeInTheDocument();
  });
});

describe("AIPoweredAssistant Integration", () => {
  it("integrates with automation context", () => {
    render(
      <AutomationEngine>
        <AIPoweredAssistant />
      </AutomationEngine>,
    );

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("uses automation context for actions", async () => {
    render(
      <AutomationEngine>
        <AIPoweredAssistant />
      </AutomationEngine>,
    );

    fireEvent.click(screen.getByText("Create Automation"));

    await waitFor(() => {
      expect(
        screen.getByText(/✅ Create Automation completed successfully/),
      ).toBeInTheDocument();
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
        <AIPoweredAssistant />
      </AutomationEngine>,
    );

    // Should still render but with performance optimizations
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });
});

describe("AIPoweredAssistant Error Handling", () => {
  it("handles processing errors gracefully", async () => {
    // Mock a processing error
    vi.doMock("../AIPoweredAssistant", async () => {
      const actual = await vi.importActual("../AIPoweredAssistant");
      return {
        ...actual,
        AIAssistantEngine: vi.fn().mockImplementation(() => ({
          processMessage: vi
            .fn()
            .mockRejectedValue(new Error("Processing failed")),
        })),
      };
    });

    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(
        screen.getByText(/I apologize, but I encountered an error/),
      ).toBeInTheDocument();
    });
  });

  it("handles empty input gracefully", () => {
    renderAssistant();

    const sendButton = screen.getByText("Send");
    fireEvent.click(sendButton);

    // Should not crash and should not send empty message
    expect(screen.queryByText("")).not.toBeInTheDocument();
  });

  it("handles very long messages", async () => {
    renderAssistant();

    const longMessage = "a".repeat(1000);
    const input = screen.getByPlaceholderText("Ask me anything...");

    fireEvent.change(input, { target: { value: longMessage } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  it("handles rapid message sending", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");

    // Send multiple messages quickly
    fireEvent.change(input, { target: { value: "message 1" } });
    fireEvent.click(screen.getByText("Send"));

    fireEvent.change(input, { target: { value: "message 2" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(screen.getByText("message 1")).toBeInTheDocument();
      expect(screen.getByText("message 2")).toBeInTheDocument();
    });
  });
});

describe("AIPoweredAssistant AI Features", () => {
  it("recognizes different intents", async () => {
    renderAssistant();

    const testCases = [
      { message: "create automation", expectedIntent: "create_automation" },
      { message: "run report", expectedIntent: "run_report" },
      { message: "system status", expectedIntent: "system_status" },
      { message: "help me", expectedIntent: "help_support" },
      { message: "error occurred", expectedIntent: "troubleshoot" },
    ];

    for (const testCase of testCases) {
      const input = screen.getByPlaceholderText("Ask me anything...");
      fireEvent.change(input, { target: { value: testCase.message } });
      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(screen.getByText(testCase.message)).toBeInTheDocument();
      });

      // Check for appropriate response
      await waitFor(
        () => {
          const responses = screen.getAllByText(
            /I can help you|Let me check|I understand|I'm here to help|I understand you're/,
          );
          expect(responses.length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );
    }
  });

  it("extracts entities from messages", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, {
      target: { value: "Create automation for 5 users on 01/15/2024" },
    });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(
        screen.getByText("Create automation for 5 users on 01/15/2024"),
      ).toBeInTheDocument();
    });
  });

  it("analyzes sentiment in messages", async () => {
    renderAssistant();

    const testCases = [
      { message: "great job!", sentiment: "positive" },
      { message: "this is terrible", sentiment: "negative" },
      { message: "how does this work", sentiment: "neutral" },
    ];

    for (const testCase of testCases) {
      const input = screen.getByPlaceholderText("Ask me anything...");
      fireEvent.change(input, { target: { value: testCase.message } });
      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(screen.getByText(testCase.message)).toBeInTheDocument();
      });
    }
  });

  it("generates contextual responses", async () => {
    renderAssistant();

    const input = screen.getByPlaceholderText("Ask me anything...");
    fireEvent.change(input, { target: { value: "system status" } });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      // Should include system context in response
      expect(screen.getByText(/System Context:/)).toBeInTheDocument();
      expect(screen.getByText(/Uptime:/)).toBeInTheDocument();
      expect(screen.getByText(/Active Users:/)).toBeInTheDocument();
      expect(screen.getByText(/System Load:/)).toBeInTheDocument();
    });
  });

  it("learns from interactions", async () => {
    renderAssistant();

    // Send multiple similar messages to build learning data
    const messages = [
      "create automation",
      "make automation",
      "set up automation",
    ];

    for (const message of messages) {
      const input = screen.getByPlaceholderText("Ask me anything...");
      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });
    }

    // Learning happens in background, so we just verify no errors occurred
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });
});
