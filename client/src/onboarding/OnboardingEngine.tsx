
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from 'react';
/**
 * Universal Onboarding Engine
 * Step-by-step onboarding with role-based flows, interactive tooltips, and feature discovery
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content?: React.ReactNode;
  target?: string; // CSS selector for target element
  position?: "top" | "bottom" | "left" | "right" | "center";
  type: "tooltip" | "modal" | "highlight" | "interactive";
  action?: {
    type: "click" | "hover" | "focus" | "custom";
    target?: string;
    handler?: () => void | Promise<void>;
  };
  validation?: {
    type: "element_exists" | "element_clicked" | "custom";
    target?: string;
    handler?: () => boolean | Promise<boolean>;
  };
  skippable?: boolean;
  required?: boolean;
  category?: "getting-started" | "features" | "advanced" | "role-specific";
  audience?: "beginner" | "professional" | "admin" | "all";
  priority?: number;
  estimatedTime?: number; // in seconds
  resources?: {
    title: string;
    url: string;
    type: "video" | "article" | "documentation";
  }[];
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  targetAudience: "beginner" | "professional" | "admin" | "all";
  category: "getting-started" | "features" | "advanced" | "role-specific";
  steps: OnboardingStep[];
  estimatedDuration: number; // in minutes
  prerequisites?: string[];
  tags?: string[];
  version: string;
}

export interface OnboardingProgress {
  flowId: string;
  stepId: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  timeSpent?: number; // in seconds
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export interface OnboardingUser {
  id: string;
  role: "beginner" | "professional" | "admin" | "super_admin";
  experienceLevel: "novice" | "intermediate" | "expert";
  preferences: {
    showTooltips: boolean;
    autoStart: boolean;
    allowSkipping: boolean;
    showProgress: boolean;
    interactiveMode: boolean;
  };
  progress: OnboardingProgress[];
  completedFlows: string[];
  lastActivity: Date;
}

export class OnboardingEngine {
  private flows: Map<string, OnboardingFlow> = new Map();
  private currentFlow: OnboardingFlow | null = null;
  private currentStepIndex: number = 0;
  private user: OnboardingUser | null = null;
  private isActive: boolean = false;
  private eventListeners: Map<string, EventListener> = new Map();
  private observers: Map<string, MutationObserver> = new Map();

  constructor() {
    this.initializeDefaultFlows();
    this.loadUserProgress();
  }

  private initializeDefaultFlows(): void {
    // Beginner Onboarding Flow
    const beginnerFlow: OnboardingFlow = {
      id: "beginner-getting-started",
      name: "Getting Started with AccuBooks",
      description:
        "Learn the basics of AccuBooks and set up your first account",
      targetAudience: "beginner",
      category: "getting-started",
      steps: [
        {
          id: "welcome",
          title: "Welcome to AccuBooks!",
          description:
            "Let's get you started with the basics of modern accounting software.",
          type: "modal",
          skippable: false,
          required: true,
          audience: "beginner",
          priority: 1,
          estimatedTime: 30,
          content: (
            <div className="welcome-content">
              <h3>🎉 Welcome!</h3>
              <p>
                AccuBooks is designed to make accounting simple and intuitive.
              </p>
              <ul>
                <li>Track income and expenses</li>
                <li>Generate professional reports</li>
                <li>Manage customers and vendors</li>
                <li>Stay tax-compliant</li>
              </ul>
            </div>
          ),
        },
        {
          id: "dashboard-overview",
          title: "Your Dashboard",
          description:
            "This is your command center. Here you can see your business at a glance.",
          target: ".dashboard-container",
          position: "bottom",
          type: "tooltip",
          skippable: true,
          required: true,
          audience: "beginner",
          priority: 2,
          estimatedTime: 45,
          action: {
            type: "click",
            target: ".dashboard-kpi-card:first-child",
          },
        },
        {
          id: "first-transaction",
          title: "Record Your First Transaction",
          description:
            "Let's record your first income or expense. This is the core of bookkeeping.",
          target: ".add-transaction-button",
          position: "left",
          type: "interactive",
          skippable: false,
          required: true,
          audience: "beginner",
          priority: 3,
          estimatedTime: 120,
          validation: {
            type: "element_clicked",
            target: ".add-transaction-button",
          },
        },
        {
          id: "navigation-basics",
          title: "Navigate Like a Pro",
          description:
            "Learn how to move around AccuBooks efficiently using the sidebar.",
          target: ".navigation-sidebar",
          position: "right",
          type: "tooltip",
          skippable: true,
          required: true,
          audience: "beginner",
          priority: 4,
          estimatedTime: 60,
        },
        {
          id: "reports-intro",
          title: "Understanding Reports",
          description:
            "Reports help you make informed business decisions. Let's explore them.",
          target: ".reports-section",
          position: "top",
          type: "tooltip",
          skippable: true,
          required: false,
          audience: "beginner",
          priority: 5,
          estimatedTime: 90,
        },
      ],
      estimatedDuration: 15,
      tags: ["beginner", "essentials", "quick-start"],
      version: "1.0.0",
    };

    // Professional Onboarding Flow
    const professionalFlow: OnboardingFlow = {
      id: "professional-features",
      name: "Professional Features",
      description:
        "Master advanced features for professional accounting workflows",
      targetAudience: "professional",
      category: "features",
      steps: [
        {
          id: "advanced-dashboard",
          title: "Advanced Dashboard Analytics",
          description:
            "Explore real-time KPIs, heatmaps, and predictive insights.",
          target: ".enterprise-dashboard",
          position: "center",
          type: "modal",
          skippable: true,
          required: false,
          audience: "professional",
          priority: 1,
          estimatedTime: 120,
        },
        {
          id: "keyboard-shortcuts",
          title: "Keyboard Shortcuts",
          description:
            "Speed up your workflow with powerful keyboard shortcuts.",
          type: "modal",
          skippable: true,
          required: false,
          audience: "professional",
          priority: 2,
          estimatedTime: 60,
          content: (
            <div className="shortcuts-content">
              <h4>⚡ Essential Shortcuts</h4>
              <div className="shortcut-list">
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>K</kbd>
                  <span>Open command palette</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>B</kbd>
                  <span>Toggle sidebar</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>/</kbd>
                  <span>Search</span>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "bulk-operations",
          title: "Bulk Operations",
          description: "Learn how to handle multiple transactions efficiently.",
          target: ".bulk-actions-toolbar",
          position: "top",
          type: "interactive",
          skippable: true,
          required: false,
          audience: "professional",
          priority: 3,
          estimatedTime: 180,
        },
      ],
      estimatedDuration: 10,
      tags: ["professional", "productivity", "advanced"],
      version: "1.0.0",
    };

    // Admin Onboarding Flow
    const adminFlow: OnboardingFlow = {
      id: "admin-configuration",
      name: "Admin Configuration",
      description: "Configure system settings, user management, and security",
      targetAudience: "admin",
      category: "role-specific",
      steps: [
        {
          id: "user-management",
          title: "User Management",
          description: "Add and manage users, roles, and permissions.",
          target: ".admin-users-section",
          position: "right",
          type: "interactive",
          skippable: false,
          required: true,
          audience: "admin",
          priority: 1,
          estimatedTime: 300,
        },
        {
          id: "security-settings",
          title: "Security Configuration",
          description: "Set up security policies and access controls.",
          target: ".security-settings",
          position: "left",
          type: "tooltip",
          skippable: false,
          required: true,
          audience: "admin",
          priority: 2,
          estimatedTime: 240,
        },
        {
          id: "system-integrations",
          title: "System Integrations",
          description: "Connect third-party services and APIs.",
          target: ".integrations-panel",
          position: "top",
          type: "modal",
          skippable: true,
          required: false,
          audience: "admin",
          priority: 3,
          estimatedTime: 180,
        },
      ],
      estimatedDuration: 20,
      tags: ["admin", "configuration", "security"],
      version: "1.0.0",
    };

    this.flows.set(beginnerFlow.id, beginnerFlow);
    this.flows.set(professionalFlow.id, professionalFlow);
    this.flows.set(adminFlow.id, adminFlow);
  }

  private loadUserProgress(): void {
    // Load from localStorage or API
    try {
      const stored = localStorage.getItem("onboarding-user");
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load user progress:", error);
    }
  }

  private saveUserProgress(): void {
    if (this.user) {
      try {
        localStorage.setItem("onboarding-user", JSON.stringify(this.user));
      } catch (error) {
        console.warn("Failed to save user progress:", error);
      }
    }
  }

  public setUser(user: OnboardingUser): void {
    this.user = user;
    this.saveUserProgress();
  }

  public registerFlow(flow: OnboardingFlow): void {
    this.flows.set(flow.id, flow);
  }

  public getAvailableFlows(userRole?: string): OnboardingFlow[] {
    const role = userRole || this.user?.role || "beginner";

    return Array.from(this.flows.values())
      .filter(
        (flow) => flow.targetAudience === role || flow.targetAudience === "all",
      )
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  public startFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow || !this.user) return false;

    // Check prerequisites
    if (flow.prerequisites) {
      const hasPrerequisites = flow.prerequisites.every((prereq) =>
        this.user!.completedFlows.includes(prereq),
      );
      if (!hasPrerequisites) return false;
    }

    this.currentFlow = flow;
    this.currentStepIndex = 0;
    this.isActive = true;

    // Initialize progress
    const existingProgress = this.user.progress.find(
      (p) => p.flowId === flowId,
    );
    if (!existingProgress) {
      this.user.progress.push({
        flowId,
        stepId: flow.steps[0].id,
        status: "in_progress",
        startTime: new Date(),
      });
    }

    this.saveUserProgress();
    this.executeCurrentStep();

    return true;
  }

  public stopFlow(): void {
    if (this.currentFlow && this.user) {
      const progress = this.user.progress.find(
        (p) => p.flowId === this.currentFlow!.id,
      );
      if (progress) {
        progress.status = "pending";
        progress.endTime = new Date();
      }
    }

    this.currentFlow = null;
    this.currentStepIndex = 0;
    this.isActive = false;
    this.cleanup();
    this.saveUserProgress();
  }

  public nextStep(): boolean {
    if (!this.currentFlow || !this.user) return false;

    const currentStep = this.currentFlow.steps[this.currentStepIndex];
    const progress = this.user.progress.find(
      (p) => p.flowId === this.currentFlow!.id,
    );

    if (progress) {
      progress.status = "completed";
      progress.endTime = new Date();
      if (progress.startTime) {
        progress.timeSpent =
          (progress.endTime.getTime() - progress.startTime.getTime()) / 1000;
      }
    }

    // Move to next step
    this.currentStepIndex++;

    if (this.currentStepIndex >= this.currentFlow.steps.length) {
      // Flow completed
      this.completeFlow();
      return false;
    }

    // Start next step
    const nextStep = this.currentFlow.steps[this.currentStepIndex];
    if (progress) {
      progress.stepId = nextStep.id;
      progress.status = "in_progress";
      progress.startTime = new Date();
    }

    this.saveUserProgress();
    this.executeCurrentStep();

    return true;
  }

  public previousStep(): boolean {
    if (!this.currentFlow || this.currentStepIndex <= 0 || !this.user)
      return false;

    this.currentStepIndex--;
    const step = this.currentFlow.steps[this.currentStepIndex];

    const progress = this.user.progress.find(
      (p) => p.flowId === this.currentFlow!.id,
    );
    if (progress) {
      progress.stepId = step.id;
      progress.status = "in_progress";
    }

    this.saveUserProgress();
    this.executeCurrentStep();

    return true;
  }

  public skipStep(): boolean {
    if (!this.currentFlow || !this.user) return false;

    const currentStep = this.currentFlow.steps[this.currentStepIndex];
    if (!currentStep.skippable) return false;

    const progress = this.user.progress.find(
      (p) => p.flowId === this.currentFlow!.id,
    );
    if (progress) {
      progress.status = "skipped";
      progress.endTime = new Date();
    }

    return this.nextStep();
  }

  private completeFlow(): void {
    if (!this.currentFlow || !this.user) return;

    // Mark flow as completed
    if (!this.user.completedFlows.includes(this.currentFlow.id)) {
      this.user.completedFlows.push(this.currentFlow.id);
    }

    // Update progress
    const progress = this.user.progress.find(
      (p) => p.flowId === this.currentFlow!.id,
    );
    if (progress) {
      progress.status = "completed";
      progress.endTime = new Date();
    }

    this.user.lastActivity = new Date();
    this.saveUserProgress();
    this.cleanup();

    // Show completion message
    this.showCompletionMessage();
  }

  private executeCurrentStep(): void {
    if (!this.currentFlow) return;

    const step = this.currentFlow.steps[this.currentStepIndex];
    this.cleanup();

    switch (step.type) {
      case "tooltip":
        this.showTooltip(step);
        break;
      case "modal":
        this.showModal(step);
        break;
      case "highlight":
        this.highlightElement(step);
        break;
      case "interactive":
        this.startInteractiveStep(step);
        break;
    }

    // Setup validation
    if (step.validation) {
      this.setupValidation(step);
    }
  }

  private showTooltip(step: OnboardingStep): void {
    const tooltip = document.createElement("div");
    tooltip.className = "onboarding-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <h3>${step.title}</h3>
        <p>${step.description}</p>
        ${step.content ? '<div class="tooltip-custom-content"></div>' : ""}
        <div class="tooltip-actions">
          ${step.skippable ? '<button class="skip-btn">Skip</button>' : ""}
          <button class="next-btn">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        this.positionTooltip(tooltip, target, step.position || "top");
      }
    } else {
      tooltip.style.position = "fixed";
      tooltip.style.top = "50%";
      tooltip.style.left = "50%";
      tooltip.style.transform = "translate(-50%, -50%)";
    }

    // Add custom content
    if (step.content && tooltip.querySelector(".tooltip-custom-content")) {
      const contentContainer = tooltip.querySelector(".tooltip-custom-content");
      if (contentContainer && step.content) {
        // This would need React rendering in a real implementation
        contentContainer.innerHTML = "<div>Custom content would go here</div>";
      }
    }

    // Setup event listeners
    const nextBtn = tooltip.querySelector(".next-btn");
    const skipBtn = tooltip.querySelector(".skip-btn");

    if (nextBtn) {
      const handler = () => this.nextStep();
      nextBtn.addEventListener("click", handler);
      this.eventListeners.set("next-btn", handler);
    }

    if (skipBtn) {
      const handler = () => this.skipStep();
      skipBtn.addEventListener("click", handler);
      this.eventListeners.set("skip-btn", handler);
    }
  }

  private showModal(step: OnboardingStep): void {
    const modal = document.createElement("div");
    modal.className = "onboarding-modal-overlay";
    modal.innerHTML = `
      <div class="onboarding-modal">
        <div class="modal-content">
          <h2>${step.title}</h2>
          <p>${step.description}</p>
          ${step.content ? '<div class="modal-custom-content"></div>' : ""}
          <div class="modal-actions">
            ${step.skippable ? '<button class="skip-btn">Skip</button>' : ""}
            <button class="next-btn">Next</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add custom content
    if (step.content && modal.querySelector(".modal-custom-content")) {
      const contentContainer = modal.querySelector(".modal-custom-content");
      if (contentContainer && step.content) {
        // This would need React rendering in a real implementation
        contentContainer.innerHTML = "<div>Custom content would go here</div>";
      }
    }

    // Setup event listeners
    const nextBtn = modal.querySelector(".next-btn");
    const skipBtn = modal.querySelector(".skip-btn");

    if (nextBtn) {
      const handler = () => this.nextStep();
      nextBtn.addEventListener("click", handler);
      this.eventListeners.set("next-btn", handler);
    }

    if (skipBtn) {
      const handler = () => this.skipStep();
      skipBtn.addEventListener("click", handler);
      this.eventListeners.set("skip-btn", handler);
    }
  }

  private highlightElement(step: OnboardingStep): void {
    if (!step.target) return;

    const target = document.querySelector(step.target);
    if (!target) return;

    // Create highlight overlay
    const overlay = document.createElement("div");
    overlay.className = "onboarding-highlight-overlay";

    const rect = target.getBoundingClientRect();
    overlay.innerHTML = `
      <div class="highlight-spotlight" style="
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
      "></div>
      <div class="highlight-content" style="
        top: ${rect.bottom + 10}px;
        left: ${rect.left}px;
      ">
        <h3>${step.title}</h3>
        <p>${step.description}</p>
        <div class="highlight-actions">
          ${step.skippable ? '<button class="skip-btn">Skip</button>' : ""}
          <button class="next-btn">Got it</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Setup event listeners
    const nextBtn = overlay.querySelector(".next-btn");
    const skipBtn = overlay.querySelector(".skip-btn");

    if (nextBtn) {
      const handler = () => this.nextStep();
      nextBtn.addEventListener("click", handler);
      this.eventListeners.set("next-btn", handler);
    }

    if (skipBtn) {
      const handler = () => this.skipStep();
      skipBtn.addEventListener("click", handler);
      this.eventListeners.set("skip-btn", handler);
    }
  }

  private startInteractiveStep(step: OnboardingStep): void {
    // Show instruction tooltip
    const instruction = document.createElement("div");
    instruction.className = "onboarding-instruction";
    instruction.innerHTML = `
      <div class="instruction-content">
        <h3>${step.title}</h3>
        <p>${step.description}</p>
        <div class="instruction-actions">
          ${step.skippable ? '<button class="skip-btn">Skip</button>' : ""}
        </div>
      </div>
    `;

    document.body.appendChild(instruction);

    // Position instruction
    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        this.positionTooltip(instruction, target, step.position || "top");
      }
    } else {
      instruction.style.position = "fixed";
      instruction.style.top = "20px";
      instruction.style.right = "20px";
    }

    // Setup event listeners
    const skipBtn = instruction.querySelector(".skip-btn");
    if (skipBtn) {
      const handler = () => this.skipStep();
      skipBtn.addEventListener("click", handler);
      this.eventListeners.set("skip-btn", handler);
    }

    // Execute action if specified
    if (step.action) {
      this.executeAction(step.action);
    }
  }

  private executeAction(action: OnboardingStep["action"]): void {
    if (!action) return;

    switch (action.type) {
      case "click":
        if (action.target) {
          const target = document.querySelector(action.target);
          if (target) {
            target.click();
          }
        }
        break;
      case "hover":
        if (action.target) {
          const target = document.querySelector(action.target);
          if (target) {
            const event = new MouseEvent("mouseenter", { bubbles: true });
            target.dispatchEvent(event);
          }
        }
        break;
      case "focus":
        if (action.target) {
          const target = document.querySelector(action.target) as HTMLElement;
          if (target) {
            target.focus();
          }
        }
        break;
      case "custom":
        if (action.handler) {
          action.handler();
        }
        break;
    }
  }

  private setupValidation(step: OnboardingStep): void {
    if (!step.validation) return;

    const validate = async () => {
      let isValid = false;

      switch (step.validation!.type) {
        case "element_exists":
          if (step.validation!.target) {
            const element = document.querySelector(step.validation!.target);
            isValid = !!element;
          }
          break;
        case "element_clicked":
          // This would be handled by event listeners
          break;
        case "custom":
          if (step.validation!.handler) {
            isValid = await step.validation!.handler();
          }
          break;
      }

      if (isValid) {
        setTimeout(() => this.nextStep(), 500);
      }
    };

    // Setup validation based on type
    if (step.validation.type === "element_clicked" && step.validation.target) {
      const target = document.querySelector(step.validation.target);
      if (target) {
        const handler = () => {
          validate();
          target.removeEventListener("click", handler);
        };
        target.addEventListener("click", handler);
        this.eventListeners.set("validation", handler);
      }
    } else {
      // For other types, validate periodically
      const interval = setInterval(() => {
        validate();
      }, 1000);

      setTimeout(() => clearInterval(interval), 30000); // Timeout after 30 seconds
    }
  }

  private positionTooltip(
    tooltip: HTMLElement,
    target: Element,
    position: string,
  ): void {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - tooltipRect.height - 10;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = rect.bottom + 10;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 10;
        break;
      case "right":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 10;
        break;
    }

    tooltip.style.position = "fixed";
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.zIndex = "10000";

    // Adjust if out of bounds
    if (left < 10) {
      tooltip.style.left = "10px";
    }
    if (left + tooltipRect.width > window.innerWidth - 10) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
    }
    if (top < 10) {
      tooltip.style.top = "10px";
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
      tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
    }
  }

  private showCompletionMessage(): void {
    if (!this.currentFlow) return;

    const message = document.createElement("div");
    message.className = "onboarding-completion-message";
    message.innerHTML = `
      <div class="completion-content">
        <div class="completion-icon">🎉</div>
        <h2>Congratulations!</h2>
        <p>You've completed the "${this.currentFlow.name}" onboarding flow.</p>
        <div class="completion-actions">
          <button class="close-btn">Close</button>
          <button class="explore-btn">Explore More</button>
        </div>
      </div>
    `;

    document.body.appendChild(message);

    const closeBtn = message.querySelector(".close-btn");
    const exploreBtn = message.querySelector(".explore-btn");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        message.remove();
      });
    }

    if (exploreBtn) {
      exploreBtn.addEventListener("click", () => {
        message.remove();
        // Show available flows
        this.showAvailableFlows();
      });
    }
  }

  private showAvailableFlows(): void {
    const availableFlows = this.getAvailableFlows();
    const incompleteFlows = availableFlows.filter(
      (flow) => !this.user?.completedFlows.includes(flow.id),
    );

    if (incompleteFlows.length === 0) return;

    const modal = document.createElement("div");
    modal.className = "onboarding-flows-modal";
    modal.innerHTML = `
      <div class="flows-content">
        <h2>Continue Learning</h2>
        <p>Here are more onboarding flows to help you master AccuBooks:</p>
        <div class="flows-list">
          ${incompleteFlows
            .map(
              (flow) => `
            <div class="flow-card" data-flow-id="${flow.id}">
              <h3>${flow.name}</h3>
              <p>${flow.description}</p>
              <div class="flow-meta">
                <span class="duration">${flow.estimatedDuration} min</span>
                <span class="category">${flow.category}</span>
              </div>
              <button class="start-flow-btn">Start</button>
            </div>
          `,
            )
            .join("")}
        </div>
        <button class="close-modal-btn">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    modal.querySelectorAll(".start-flow-btn").forEach((btn) => {
      const flowCard = btn.closest(".flow-card");
      const flowId = flowCard?.getAttribute("data-flow-id");

      if (flowId) {
        btn.addEventListener("click", () => {
          modal.remove();
          this.startFlow(flowId);
        });
      }
    });

    const closeBtn = modal.querySelector(".close-modal-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.remove();
      });
    }
  }

  private cleanup(): void {
    // Remove event listeners
    this.eventListeners.forEach((handler, key) => {
      document.removeEventListener(key, handler);
    });
    this.eventListeners.clear();

    // Remove observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Remove onboarding elements
    document
      .querySelectorAll(
        ".onboarding-tooltip, .onboarding-modal-overlay, .onboarding-highlight-overlay, .onboarding-instruction, .onboarding-completion-message, .onboarding-flows-modal",
      )
      .forEach((el) => {
        el.remove();
      });
  }

  public getCurrentStep(): OnboardingStep | null {
    if (
      !this.currentFlow ||
      this.currentStepIndex >= this.currentFlow.steps.length
    ) {
      return null;
    }
    return this.currentFlow.steps[this.currentStepIndex];
  }

  public getProgress(): {
    currentStep: number;
    totalSteps: number;
    completedFlows: string[];
    totalFlows: number;
  } {
    return {
      currentStep: this.currentStepIndex + 1,
      totalSteps: this.currentFlow?.steps.length || 0,
      completedFlows: this.user?.completedFlows || [],
      totalFlows: this.flows.size,
    };
  }

  public isActive(): boolean {
    return this.isActive;
  }

  public destroy(): void {
    this.cleanup();
    this.flows.clear();
    this.currentFlow = null;
    this.user = null;
  }
}

export default OnboardingEngine;
