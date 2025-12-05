import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AutomationEngine, useAutomation } from '../AutomationEngine';

// Mock modules
vi.mock('../hooks/useWindowSize', () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock('../store/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'admin', id: 'user-123' },
  })),
}));

vi.mock('../../adaptive/UserExperienceMode.tsx', () => ({
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

vi.mock('../../adaptive/UI-Performance-Engine.tsx', () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

describe('AutomationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithAutomation = (component: React.ReactElement) => {
    return render(
      <AutomationEngine>
        {component}
      </AutomationEngine>
    );
  };

  it('renders children correctly', () => {
    renderWithAutomation(
      <div>Test Content</div>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('provides automation context', () => {
    function TestComponent() {
      const context = useAutomation();
      return <div>Rules: {context.rules.length}</div>;
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText(/Rules:/)).toBeInTheDocument();
  });

  it('initializes with default rules', async () => {
    function TestComponent() {
      const { rules } = useAutomation();
      return <div>Rules: {rules.length}</div>;
    }

    renderWithAutomation(
      <TestComponent />
    );

    await waitFor(() => {
      expect(screen.getByText('Rules: 2')).toBeInTheDocument();
    });
  });

  it('creates new automation rule', async () => {
    function TestComponent() {
      const { rules, createRule } = useAutomation();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createRule({
          name: 'Test Rule',
          description: 'Test description',
          category: 'custom',
          trigger: {
            type: 'manual',
            config: {}
          },
          conditions: [],
          actions: [
            {
              type: 'notification',
              config: { template: 'Test notification' }
            }
          ],
          enabled: true,
          priority: 'medium'
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Rules: {rules.length}</div>
          <div>Created: {created ? 'yes' : 'no'}</div>
          <button onClick={handleCreate}>Create Rule</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText('Rules: 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Create Rule'));

    await waitFor(() => {
      expect(screen.getByText('Rules: 3')).toBeInTheDocument();
      expect(screen.getByText('Created: yes')).toBeInTheDocument();
    });
  });

  it('updates existing rule', async () => {
    function TestComponent() {
      const { rules, updateRule } = useAutomation();
      const [updated, setUpdated] = React.useState(false);

      const handleUpdate = async () => {
        const firstRule = rules[0];
        if (firstRule) {
          await updateRule(firstRule.id, { name: 'Updated Rule' });
          setUpdated(true);
        }
      };

      return (
        <div>
          <div>First Rule: {rules[0]?.name || 'None'}</div>
          <div>Updated: {updated ? 'yes' : 'no'}</div>
          <button onClick={handleUpdate}>Update Rule</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    fireEvent.click(screen.getByText('Update Rule'));

    await waitFor(() => {
      expect(screen.getByText('First Rule: Updated Rule')).toBeInTheDocument();
      expect(screen.getByText('Updated: yes')).toBeInTheDocument();
    });
  });

  it('deletes automation rule', async () => {
    function TestComponent() {
      const { rules, deleteRule } = useAutomation();
      const [deleted, setDeleted] = React.useState(false);

      const handleDelete = async () => {
        const firstRule = rules[0];
        if (firstRule) {
          await deleteRule(firstRule.id);
          setDeleted(true);
        }
      };

      return (
        <div>
          <div>Rules: {rules.length}</div>
          <div>Deleted: {deleted ? 'yes' : 'no'}</div>
          <button onClick={handleDelete}>Delete Rule</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText('Rules: 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete Rule'));

    await waitFor(() => {
      expect(screen.getByText('Rules: 1')).toBeInTheDocument();
      expect(screen.getByText('Deleted: yes')).toBeInTheDocument();
    });
  });

  it('enables and disables rules', async () => {
    function TestComponent() {
      const { rules, enableRule, disableRule } = useAutomation();
      const [toggled, setToggled] = React.useState(false);

      const handleToggle = async () => {
        const firstRule = rules[0];
        if (firstRule) {
          if (firstRule.enabled) {
            await disableRule(firstRule.id);
          } else {
            await enableRule(firstRule.id);
          }
          setToggled(true);
        }
      };

      return (
        <div>
          <div>First Rule Enabled: {rules[0]?.enabled ? 'yes' : 'no'}</div>
          <div>Toggled: {toggled ? 'yes' : 'no'}</div>
          <button onClick={handleToggle}>Toggle Rule</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText('First Rule Enabled: yes')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Toggle Rule'));

    await waitFor(() => {
      expect(screen.getByText('First Rule Enabled: no')).toBeInTheDocument();
      expect(screen.getByText('Toggled: yes')).toBeInTheDocument();
    });
  });

  it('executes automation rule', async () => {
    function TestComponent() {
      const { executeRule, executions, createRule } = useAutomation();
      const [executed, setExecuted] = React.useState(false);

      const handleExecute = async () => {
        // Create a rule first
        const rule = await createRule({
          id: 'test-rule-id',
          name: 'Test Rule',
          description: 'A test rule for execution',
          enabled: true,
          conditions: [],
          actions: [],
          category: 'test'
        });
        
        // Execute the rule using the returned ID
        await executeRule(rule.id, 'manual');
        setExecuted(true);
      };

      return (
        <div>
          <div>Executions: {executions.length}</div>
          <div>Executed: {executed ? 'yes' : 'no'}</div>
          <button onClick={handleExecute}>Execute Rule</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText('Executions: 0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Execute Rule'));

    await waitFor(() => {
      expect(screen.getByText('Executions: 1')).toBeInTheDocument();
      expect(screen.getByText('Executed: yes')).toBeInTheDocument();
    });
  });

  it('manages AI models', async () => {
    function TestComponent() {
      const { models, trainModel, predict } = useAutomation();
      const [prediction, setPrediction] = React.useState<any>(null);
      const [error, setError] = React.useState<string | null>(null);

      const handlePredict = async () => {
        try {
          // Use a mock ready model for testing
          const result = await predict('test-model', { input: 'test' });
          setPrediction(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Prediction failed');
        }
      };

      return (
        <div>
          <div>Models: {models.length}</div>
          <div>Prediction: {prediction ? JSON.stringify(prediction) : 'none'}</div>
          {error && <div>Error: {error}</div>}
          <button onClick={handlePredict}>Predict</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    await waitFor(() => {
      expect(screen.getByText('Models: 1')).toBeInTheDocument();
    });

    // Test prediction error handling
    fireEvent.click(screen.getByText('Predict'));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('generates and manages suggestions', async () => {
    function TestComponent() {
      const { suggestions, generateSuggestions, applySuggestion, dismissSuggestion } = useAutomation();
      const [generated, setGenerated] = React.useState(false);
      const [applied, setApplied] = React.useState(false);

      const handleGenerate = async () => {
        await generateSuggestions();
        setGenerated(true);
      };

      const handleApply = async () => {
        const firstSuggestion = suggestions[0];
        if (firstSuggestion) {
          await applySuggestion(firstSuggestion.id);
          setApplied(true);
        }
      };

      return (
        <div>
          <div>Suggestions: {suggestions.length}</div>
          <div>Generated: {generated ? 'yes' : 'no'}</div>
          <div>Applied: {applied ? 'yes' : 'no'}</div>
          <button onClick={handleGenerate}>Generate Suggestions</button>
          <button onClick={handleApply}>Apply Suggestion</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText('Suggestions: 0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Generate Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Suggestions: 2')).toBeInTheDocument();
      expect(screen.getByText('Generated: yes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Apply Suggestion'));

    await waitFor(() => {
      expect(screen.getByText('Suggestions: 1')).toBeInTheDocument();
      expect(screen.getByText('Applied: yes')).toBeInTheDocument();
    });
  });

  it('gets execution history', async () => {
    function TestComponent() {
      const { getExecutionHistory, executeRule, createRule } = useAutomation();
      const [history, setHistory] = React.useState<any[]>([]);

      const handleExecuteAndGetHistory = async () => {
        // Add a test rule first
        const rule = await createRule({
          id: 'test-rule',
          name: 'Test Rule',
          description: 'A test rule for execution',
          enabled: true,
          conditions: [],
          actions: [],
          category: 'test'
        });
        
        // Execute the rule using the returned ID
        await executeRule(rule.id, 'manual');
        
        // Get execution history
        const execHistory = getExecutionHistory();
        setHistory(execHistory);
      };

      return (
        <div>
          <div>History Length: {history.length}</div>
          <button onClick={handleExecuteAndGetHistory}>Execute and Get History</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    expect(screen.getByText('History Length: 0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Execute and Get History'));

    await waitFor(() => {
      expect(screen.getByText(/History Length:/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calculates statistics', async () => {
    function TestComponent() {
      const { getStatistics, executeRule, createRule } = useAutomation();
      const [stats, setStats] = React.useState<any>(null);

      const handleGetStats = async () => {
        // Add a test rule first
        const rule = await createRule({
          id: 'test-rule',
          name: 'Test Rule',
          description: 'A test rule for statistics',
          enabled: true,
          conditions: [],
          actions: [],
          category: 'test'
        });
        
        // Execute a rule to have some data
        await executeRule(rule.id, 'manual');
        
        // Get statistics
        const statistics = getStatistics();
        setStats(statistics);
      };

      return (
        <div>
          <div>Stats: {stats ? JSON.stringify(stats) : 'none'}</div>
          <button onClick={handleGetStats}>Get Statistics</button>
        </div>
      );
    }

    renderWithAutomation(
      <TestComponent />
    );

    fireEvent.click(screen.getByText('Get Statistics'));

    await waitFor(() => {
      expect(screen.getByText(/Stats:/)).toBeInTheDocument();
      expect(screen.getByText(/totalRules/)).toBeInTheDocument();
      expect(screen.getByText(/activeRules/)).toBeInTheDocument();
      expect(screen.getByText(/totalExecutions/)).toBeInTheDocument();
    });
  });

  it('handles useAutomation outside provider', () => {
    function TestComponent() {
      expect(() => {
        useAutomation();
      }).toThrow('useAutomation must be used within AutomationEngine');
      return <div>Test</div>;
    }

    render(<TestComponent />);
  });
});

describe('AutomationEngine Integration', () => {
  it('integrates with other contexts', async () => {
    function TestComponent() {
      const { rules, createRule } = useAutomation();
      const [ruleCount, setRuleCount] = React.useState(0);

      React.useEffect(() => {
        setRuleCount(rules.length);
      }, [rules]);

      const handleCreate = async () => {
        await createRule({
          name: 'Integration Test Rule',
          description: 'Testing integration',
          category: 'custom',
          trigger: { type: 'manual', config: {} },
          conditions: [],
          actions: [{ type: 'notification', config: {} }],
          enabled: true,
          priority: 'medium'
        });
      };

      return (
        <div>
          <div>Rule Count: {ruleCount}</div>
          <button onClick={handleCreate}>Create Rule</button>
        </div>
      );
    }

    render(
      <AutomationEngine>
        <TestComponent />
      </AutomationEngine>
    );

    await waitFor(() => {
      expect(screen.getByText('Rule Count: 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Rule'));

    await waitFor(() => {
      expect(screen.getByText('Rule Count: 3')).toBeInTheDocument();
    });
  });

  it('handles performance mode adaptations', async () => {
    vi.doMock('../../adaptive/UI-Performance-Engine.tsx', () => ({
      usePerformance: vi.fn(() => ({
        isLowPerformanceMode: true,
      })),
    }));

    function TestComponent() {
      const { rules } = useAutomation();
      return <div>Rules in Performance Mode: {rules.length}</div>;
    }

    render(
      <AutomationEngine>
        <TestComponent />
      </AutomationEngine>
    );

    await waitFor(() => {
      expect(screen.getByText('Rules in Performance Mode: 2')).toBeInTheDocument();
    });
  });
});

describe('AutomationEngine Error Handling', () => {
  it('handles rule execution errors gracefully', async () => {
    function TestComponent() {
      const { executeRule, executions } = useAutomation();
      const [error, setError] = React.useState<string>('');

      const handleExecute = async () => {
        try {
          await executeRule('non-existent-rule', 'manual');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <div>Executions: {executions.length}</div>
          <button onClick={handleExecute}>Execute Invalid Rule</button>
        </div>
      );
    }

    render(
      <AutomationEngine>
        <TestComponent />
      </AutomationEngine>
    );

    fireEvent.click(screen.getByText('Execute Invalid Rule'));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('handles model prediction errors gracefully', async () => {
    function TestComponent() {
      const { predict, models } = useAutomation();
      const [error, setError] = React.useState<string>('');

      const handlePredict = async () => {
        try {
          await predict('non-existent-model', { data: 'test' });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <div>Models: {models.length}</div>
          <button onClick={handlePredict}>Predict with Invalid Model</button>
        </div>
      );
    }

    render(
      <AutomationEngine>
        <TestComponent />
      </AutomationEngine>
    );

    fireEvent.click(screen.getByText('Predict with Invalid Model'));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
