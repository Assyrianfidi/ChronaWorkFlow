import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  WorkflowManager,
  useWorkflowManager,
  WorkflowBuilder,
  WorkflowExecutionEngine,
} from '../WorkflowManager.tsx';

// Mock modules
vi.mock('../hooks/useWindowSize', () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock('../store/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'user' },
  })),
}));

vi.mock('../adaptive/UserExperienceMode.tsx', () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      id: 'standard',
      name: 'Standard',
      animations: 'normal',
      sounds: false,
      shortcuts: true,
    },
  })),
}));

vi.mock('../adaptive/UI-Performance-Engine.tsx', () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

// Helper function to render with providers
const renderWithProviders = async (component: React.ReactElement) => {
  const { UserExperienceModeProvider } = await import('../../adaptive/UserExperienceMode.tsx');
  const { UIPerformanceEngine } = await import('../../adaptive/UI-Performance-Engine.tsx');
  const { AccessibilityProvider } = await import('../../adaptive/AccessibilityModes');
  const { AdaptiveLayoutEngine } = await import('../../adaptive/AdaptiveLayoutEngine.tsx');
  
  return render(
    <AdaptiveLayoutEngine>
      <UserExperienceModeProvider>
        <AccessibilityProvider>
          <UIPerformanceEngine>
            {component}
          </UIPerformanceEngine>
        </AccessibilityProvider>
      </UserExperienceModeProvider>
    </AdaptiveLayoutEngine>
  );
};

describe('WorkflowManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('renders children correctly', async () => {
    await renderWithProviders(
      <WorkflowManager>
        <div>Test Content</div>
      </WorkflowManager>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('provides workflow context', () => {
    let contextValue: any = null;

    function TestComponent() {
      contextValue = useWorkflowManager();
      return <div>Test</div>;
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    expect(contextValue).toBeDefined();
    expect(contextValue.workflows).toEqual([]);
    expect(contextValue.executions).toEqual([]);
    expect(contextValue.templates).toHaveLength(2); // Built-in templates
  });

  it('loads workflows from localStorage', () => {
    const savedWorkflows = [
      {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'Test Description',
        category: 'Test',
        version: '1.0.0',
        steps: [],
        triggers: [],
        permissions: [],
        settings: {
          timeout: 300000,
          retries: 3,
          parallel: false,
          notifications: true,
          logging: true,
          validation: 'strict' as const,
        },
        metadata: {},
      },
    ];

    localStorage.setItem('workflows', JSON.stringify(savedWorkflows));

    function TestComponent() {
      const { workflows } = useWorkflowManager();
      return <div>Workflows: {workflows.length}</div>;
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    expect(screen.getByText('Workflows: 1')).toBeInTheDocument();
  });

  it('creates new workflow successfully', async () => {
    function TestComponent() {
      const { createWorkflow, workflows } = useWorkflowManager();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createWorkflow({
          name: 'New Workflow',
          description: 'Test workflow',
          category: 'Test',
          steps: [],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Workflows: {workflows.length}</div>
          <div>Created: {created ? 'yes' : 'no'}</div>
          <button onClick={handleCreate}>Create Workflow</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    expect(screen.getByText('Workflows: 0')).toBeInTheDocument();
    expect(screen.getByText('Created: no')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Workflows: 1')).toBeInTheDocument();
      expect(screen.getByText('Created: yes')).toBeInTheDocument();
    });
  });

  it('updates existing workflow', async () => {
    function TestComponent() {
      const { createWorkflow, updateWorkflow, workflows } = useWorkflowManager();
      const [updated, setUpdated] = React.useState(false);
      const [workflowId, setWorkflowId] = React.useState<string | null>(null);

      const handleCreate = async () => {
        const workflow = await createWorkflow({
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Test',
          steps: [],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setWorkflowId(workflow.id);
      };

      const handleUpdate = async () => {
        if (workflowId) {
          await updateWorkflow(workflowId, {
            name: 'Updated Workflow',
          });
          setUpdated(true);
        }
      };

      return (
        <div>
          <div>Workflows: {workflows.length}</div>
          <div>Updated: {updated ? 'yes' : 'no'}</div>
          <button onClick={handleCreate}>Create</button>
          <button onClick={handleUpdate} disabled={!workflowId}>Update</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Workflows: 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(screen.getByText('Updated: yes')).toBeInTheDocument();
    });
  });

  it('deletes workflow', async () => {
    function TestComponent() {
      const { createWorkflow, deleteWorkflow, workflows } = useWorkflowManager();
      const [deleted, setDeleted] = React.useState(false);
      const [workflowId, setWorkflowId] = React.useState<string | null>(null);

      const handleCreate = async () => {
        const workflow = await createWorkflow({
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Test',
          steps: [],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setWorkflowId(workflow.id);
      };

      const handleDelete = async () => {
        if (workflowId) {
          await deleteWorkflow(workflowId);
          setDeleted(true);
        }
      };

      return (
        <div>
          <div>Workflows: {workflows.length}</div>
          <div>Deleted: {deleted ? 'yes' : 'no'}</div>
          <button onClick={handleCreate}>Create</button>
          <button onClick={handleDelete} disabled={!workflowId}>Delete</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Workflows: 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Workflows: 0')).toBeInTheDocument();
      expect(screen.getByText('Deleted: yes')).toBeInTheDocument();
    });
  });

  it('executes workflow', async () => {
    function TestComponent() {
      const { createWorkflow, executeWorkflow, executions } = useWorkflowManager();
      const [executed, setExecuted] = React.useState(false);
      const [workflowId, setWorkflowId] = React.useState<string | null>(null);

      const handleCreate = async () => {
        const workflow = await createWorkflow({
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Test',
          steps: [
            {
              id: 'step-1',
              name: 'Test Step',
              description: 'Test step description',
              type: 'data',
              config: { data: { test: 'value' } },
              dependencies: [],
            },
          ],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setWorkflowId(workflow.id);
      };

      const handleExecute = async () => {
        if (workflowId) {
          await executeWorkflow(workflowId, { testData: 'test' });
          setExecuted(true);
        }
      };

      return (
        <div>
          <div>Executions: {executions.length}</div>
          <div>Executed: {executed ? 'yes' : 'no'}</div>
          <button onClick={handleCreate}>Create</button>
          <button onClick={handleExecute} disabled={!workflowId}>Execute</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Executions: 0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Execute'));

    await waitFor(() => {
      expect(screen.getByText('Executions: 1')).toBeInTheDocument();
      expect(screen.getByText('Executed: yes')).toBeInTheDocument();
    });
  });

  it('validates workflow correctly', async () => {
    function TestComponent() {
      const { validateWorkflow } = useWorkflowManager();
      const [validation, setValidation] = React.useState<any>(null);

      const handleValidate = () => {
        const result = validateWorkflow({
          id: 'test-workflow',
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Test',
          version: '1.0.0',
          steps: [
            {
              id: 'step-1',
              name: 'Step 1',
              description: 'First step',
              type: 'data',
              config: {},
              dependencies: [], // No dependencies - valid
            },
            {
              id: 'step-2',
              name: 'Step 2',
              description: 'Second step',
              type: 'action',
              config: {},
              dependencies: ['step-1'], // Valid dependency
            },
          ],
          triggers: [],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setValidation(result);
      };

      return (
        <div>
          <div>Valid: {validation?.valid ? 'yes' : 'no'}</div>
          <div>Errors: {validation?.errors?.length || 0}</div>
          <button onClick={handleValidate}>Validate</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Validate'));

    await waitFor(() => {
      expect(screen.getByText('Valid: yes')).toBeInTheDocument();
      expect(screen.getByText('Errors: 0')).toBeInTheDocument();
    });
  });

  it('detects circular dependencies', async () => {
    function TestComponent() {
      const { validateWorkflow } = useWorkflowManager();
      const [validation, setValidation] = React.useState<any>(null);

      const handleValidate = () => {
        const result = validateWorkflow({
          id: 'test-workflow',
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Test',
          version: '1.0.0',
          steps: [
            {
              id: 'step-1',
              name: 'Step 1',
              description: 'First step',
              type: 'data',
              config: {},
              dependencies: ['step-2'], // Circular dependency
            },
            {
              id: 'step-2',
              name: 'Step 2',
              description: 'Second step',
              type: 'action',
              config: {},
              dependencies: ['step-1'], // Circular dependency
            },
          ],
          triggers: [],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setValidation(result);
      };

      return (
        <div>
          <div>Valid: {validation?.valid ? 'yes' : 'no'}</div>
          <div>Errors: {validation?.errors?.length || 0}</div>
          <button onClick={handleValidate}>Validate</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Validate'));

    await waitFor(() => {
      expect(screen.getByText('Valid: no')).toBeInTheDocument();
      expect(screen.getByText('Errors: 2')).toBeInTheDocument(); // Both steps have circular dependency errors
    });
  });

  it('imports template correctly', async () => {
    function TestComponent() {
      const { importTemplate, workflows } = useWorkflowManager();
      const [imported, setImported] = React.useState(false);

      const handleImport = async () => {
        await importTemplate('user-onboarding', {
          userId: 'test-user',
          role: 'admin',
        });
        setImported(true);
      };

      return (
        <div>
          <div>Workflows: {workflows.length}</div>
          <div>Imported: {imported ? 'yes' : 'no'}</div>
          <button onClick={handleImport}>Import Template</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    expect(screen.getByText('Workflows: 0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Import Template'));

    await waitFor(() => {
      expect(screen.getByText('Workflows: 1')).toBeInTheDocument();
      expect(screen.getByText('Imported: yes')).toBeInTheDocument();
    });
  });

  it('exports workflow correctly', async () => {
    function TestComponent() {
      const { createWorkflow, exportWorkflow } = useWorkflowManager();
      const [exported, setExported] = React.useState(false);
      const [workflowId, setWorkflowId] = React.useState<string | null>(null);

      const handleCreate = async () => {
        const workflow = await createWorkflow({
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Test',
          steps: [],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });
        setWorkflowId(workflow.id);
      };

      const handleExport = async () => {
        if (workflowId) {
          const template = await exportWorkflow(workflowId);
          setExported(!!template);
        }
      };

      return (
        <div>
          <div>Exported: {exported ? 'yes' : 'no'}</div>
          <button onClick={handleCreate}>Create</button>
          <button onClick={handleExport} disabled={!workflowId}>Export</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Export')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Exported: yes')).toBeInTheDocument();
    });
  });
});

describe('WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workflow builder interface', () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    expect(screen.getByText('Workflow Builder')).toBeInTheDocument();
    expect(screen.getByText('Create from Template')).toBeInTheDocument();
  });

  it('displays available templates', () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    expect(screen.getByText('User Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Invoice Processing')).toBeInTheDocument();
    expect(screen.getByText('Complete user onboarding process')).toBeInTheDocument();
    expect(screen.getByText('Process and approve invoices')).toBeInTheDocument();
  });

  it('selects template when clicked', () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    const userOnboardingCard = screen.getByText('User Onboarding').closest('div');
    fireEvent.click(userOnboardingCard!);

    // Template should be selected (visual feedback would be in styling)
    expect(screen.getByText('Template Variables')).toBeInTheDocument();
  });

  it('shows template variables when selected', async () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    // Select user onboarding template
    const userOnboardingCard = screen.getByText('User Onboarding').closest('div');
    fireEvent.click(userOnboardingCard!);

    await waitFor(() => {
      expect(screen.getByText('User Id')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });

  it('creates workflow from template', async () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    // Select user onboarding template
    const userOnboardingCard = screen.getByText('User Onboarding').closest('div');
    fireEvent.click(userOnboardingCard!);

    await waitFor(() => {
      expect(screen.getByText('Template Variables')).toBeInTheDocument();
    });

    // Fill in variables
    const userIdInput = screen.getByPlaceholderText('User ID');
    fireEvent.change(userIdInput, { target: { value: 'test-user' } });

    // Create workflow
    fireEvent.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      // Should show success or navigate away
      expect(screen.queryByText('Template Variables')).not.toBeInTheDocument();
    });
  });

  it('cancels template selection', async () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    // Select template
    const userOnboardingCard = screen.getByText('User Onboarding').closest('div');
    fireEvent.click(userOnboardingCard!);

    await waitFor(() => {
      expect(screen.getByText('Template Variables')).toBeInTheDocument();
    });

    // Cancel selection
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Template Variables')).not.toBeInTheDocument();
    });
  });

  it('validates required template variables', async () => {
    render(
      <WorkflowManager>
        <WorkflowBuilder />
      </WorkflowManager>
    );

    // Select template
    const userOnboardingCard = screen.getByText('User Onboarding').closest('div');
    fireEvent.click(userOnboardingCard!);

    await waitFor(() => {
      expect(screen.getByText('Template Variables')).toBeInTheDocument();
    });

    // Try to create without filling required fields
    fireEvent.click(screen.getByText('Create Workflow'));

    // Should still be on variables page (validation prevents creation)
    expect(screen.getByText('Template Variables')).toBeInTheDocument();
  });
});

describe('Workflow Execution Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes simple workflow steps', async () => {
    function TestComponent() {
      const { createWorkflow, executeWorkflow, executions } = useWorkflowManager();
      const [executionId, setExecutionId] = React.useState<string | null>(null);

      const handleCreateAndExecute = async () => {
        const workflow = await createWorkflow({
          name: 'Simple Workflow',
          description: 'Test workflow',
          category: 'Test',
          steps: [
            {
              id: 'step-1',
              name: 'Data Step',
              description: 'Process data',
              type: 'data',
              config: { data: { processed: true } },
              dependencies: [],
            },
          ],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });

        const execution = await executeWorkflow(workflow.id);
        setExecutionId(execution.id);
      };

      const execution = executions.find(e => e.id === executionId);

      return (
        <div>
          <div>Status: {execution?.status || 'none'}</div>
          <div>Completed Steps: {execution?.completedSteps?.length || 0}</div>
          <button onClick={handleCreateAndExecute}>Execute Workflow</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Execute Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Status: completed')).toBeInTheDocument();
      expect(screen.getByText('Completed Steps: 1')).toBeInTheDocument();
    });
  });

  it('handles step dependencies correctly', async () => {
    function TestComponent() {
      const { createWorkflow, executeWorkflow, executions } = useWorkflowManager();
      const [executionId, setExecutionId] = React.useState<string | null>(null);

      const handleCreateAndExecute = async () => {
        const workflow = await createWorkflow({
          name: 'Dependency Workflow',
          description: 'Test workflow with dependencies',
          category: 'Test',
          steps: [
            {
              id: 'step-1',
              name: 'First Step',
              description: 'First step',
              type: 'data',
              config: { data: { step1: true } },
              dependencies: [],
            },
            {
              id: 'step-2',
              name: 'Second Step',
              description: 'Second step depends on first',
              type: 'data',
              config: { data: { step2: true } },
              dependencies: ['step-1'],
            },
          ],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });

        const execution = await executeWorkflow(workflow.id);
        setExecutionId(execution.id);
      };

      const execution = executions.find(e => e.id === executionId);

      return (
        <div>
          <div>Completed Steps: {execution?.completedSteps?.length || 0}</div>
          <div>Step 1 Completed: {execution?.completedSteps?.includes('step-1') ? 'yes' : 'no'}</div>
          <div>Step 2 Completed: {execution?.completedSteps?.includes('step-2') ? 'yes' : 'no'}</div>
          <button onClick={handleCreateAndExecute}>Execute Workflow</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Execute Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Completed Steps: 2')).toBeInTheDocument();
      expect(screen.getByText('Step 1 Completed: yes')).toBeInTheDocument();
      expect(screen.getByText('Step 2 Completed: yes')).toBeInTheDocument();
    });
  });

  it('emits workflow events', async () => {
    const eventListener = vi.fn();

    function TestComponent() {
      const { createWorkflow, executeWorkflow } = useWorkflowManager();
      const [executed, setExecuted] = React.useState(false);

      React.useEffect(() => {
        // Listen for workflow events
        window.addEventListener('workflow-event', eventListener);
        return () => window.removeEventListener('workflow-event', eventListener);
      }, []);

      const handleCreateAndExecute = async () => {
        const workflow = await createWorkflow({
          name: 'Event Test Workflow',
          description: 'Test workflow events',
          category: 'Test',
          steps: [
            {
              id: 'step-1',
              name: 'Test Step',
              description: 'Test step',
              type: 'data',
              config: {},
              dependencies: [],
            },
          ],
          triggers: [{ type: 'manual', config: {} }],
          permissions: [],
          settings: {
            timeout: 300000,
            retries: 3,
            parallel: false,
            notifications: true,
            logging: true,
            validation: 'strict',
          },
          metadata: {},
        });

        await executeWorkflow(workflow.id);
        setExecuted(true);
      };

      return (
        <div>
          <div>Executed: {executed ? 'yes' : 'no'}</div>
          <button onClick={handleCreateAndExecute}>Execute Workflow</button>
        </div>
      );
    }

    renderWithProviders(
      <WorkflowManager>
        <TestComponent />
      </WorkflowManager>
    );

    fireEvent.click(screen.getByText('Execute Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Executed: yes')).toBeInTheDocument();
      expect(eventListener).toHaveBeenCalled();
    });
  });
});
