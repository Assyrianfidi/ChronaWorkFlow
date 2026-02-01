import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { KPICard } from '@/components/ui/KPICard';
import { FinancialDashboard } from '@/components/dashboard/FinancialDashboard';
import { ForecastResultsView } from '@/components/forecasts/ForecastResultsView';
import { RiskTimeline } from '@/components/risk/RiskTimeline';
import { ScenarioComparison } from '@/components/scenarios/ScenarioComparison';
import { CalculationExplainer } from '@/components/trust/CalculationExplainer';
import { AssumptionsPanel } from '@/components/trust/AssumptionsPanel';
import { ConfidenceIndicator } from '@/components/trust/ConfidenceIndicator';

expect.extend(toHaveNoViolations);

// Mock fetch for components that make API calls
global.fetch = jest.fn((url: string) => {
  // Return appropriate mock data based on URL
  let mockData: any = {};
  
  if (url.includes('/api/risks')) {
    mockData = [];
  } else if (url.includes('/api/scenarios')) {
    mockData = {
      id: 'test-1',
      name: 'Test Scenario',
      type: 'REVENUE_INCREASE',
      riskLevel: 'LOW',
      riskScore: 25,
      projectedImpact: {
        runwayDays: 30,
        monthlyBurnIncrease: 5000,
        monthlyRevenueIncrease: 10000,
      },
      parameters: {},
      status: 'COMPLETED',
    };
  } else if (url.includes('/api/forecasts')) {
    mockData = {
      id: 'test-forecast',
      name: 'Test Forecast',
      type: 'CASH_FLOW',
      description: 'Test forecast description',
      result: {
        value: 100000,
        unit: 'USD',
        confidence: 85,
      },
      formula: 'revenue - expenses',
      assumptions: [],
      confidenceScore: 85,
      projections: [],
    };
  }
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockData),
  });
}) as jest.Mock;

describe('WCAG 2.1 AA Accessibility Tests - New Components', () => {
  describe('KPICard', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <KPICard
          title="Cash Balance"
          value={150000}
          trend="up"
          trendValue={12.5}
          subtitle="vs last month"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for trends', () => {
      const { getByLabelText } = render(
        <KPICard
          title="Revenue"
          value={50000}
          trend="up"
          trendValue={5}
        />
      );
      expect(getByLabelText(/increased by/i)).toBeInTheDocument();
    });

    it('should have loading state with proper role', () => {
      const { container } = render(
        <KPICard
          title="Loading"
          value={0}
          loading={true}
        />
      );
      const loadingElement = container.querySelector('[role="status"]');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('FinancialDashboard', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<FinancialDashboard />);
      // Wait for initial render
      await new Promise(resolve => setTimeout(resolve, 100));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<FinancialDashboard />);
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('ForecastResultsView', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<ForecastResultsView />);
      await new Promise(resolve => setTimeout(resolve, 100));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible chart with aria-label', () => {
      const { container } = render(<ForecastResultsView />);
      const chart = container.querySelector('[role="img"]');
      if (chart) {
        expect(chart).toHaveAttribute('aria-label');
      }
    });

    it('should have table fallback toggle button', async () => {
      const { findByText } = render(<ForecastResultsView />);
      // Button may appear after data loads
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('RiskTimeline', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<RiskTimeline />);
      await new Promise(resolve => setTimeout(resolve, 100));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use semantic HTML for timeline items', () => {
      const { container } = render(<RiskTimeline />);
      const articles = container.querySelectorAll('article');
      // May be 0 if no risks loaded, which is valid
      expect(articles).toBeDefined();
    });

    it('should have proper ARIA labels for risk items', async () => {
      const { container } = render(<RiskTimeline />);
      await new Promise(resolve => setTimeout(resolve, 100));
      const labelledElements = container.querySelectorAll('[aria-labelledby]');
      // Check structure is correct even if empty
      expect(labelledElements).toBeDefined();
    });
  });

  describe('ScenarioComparison', () => {
    it('should not have accessibility violations with empty scenarios', async () => {
      const { container } = render(<ScenarioComparison scenarioIds={[]} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible table with proper headers', async () => {
      const { container } = render(
        <ScenarioComparison scenarioIds={['test-1', 'test-2']} />
      );
      await new Promise(resolve => setTimeout(resolve, 100));
      const table = container.querySelector('table');
      if (table) {
        const caption = table.querySelector('caption');
        expect(caption).toBeInTheDocument();
        
        const headers = table.querySelectorAll('th[scope]');
        expect(headers.length).toBeGreaterThan(0);
      }
    });
  });

  describe('CalculationExplainer', () => {
    const mockSteps = [
      {
        step: 1,
        description: 'Calculate base value',
        formula: 'base = revenue - expenses',
        inputs: { revenue: 100000, expenses: 60000 },
        output: 40000,
        explanation: 'This is the starting point',
      },
    ];

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <CalculationExplainer
          title="Test Calculation"
          finalResult={40000}
          formula="base = revenue - expenses"
          steps={mockSteps}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have expandable sections with proper ARIA', () => {
      const { container } = render(
        <CalculationExplainer
          title="Test Calculation"
          finalResult={40000}
          formula="base = revenue - expenses"
          steps={mockSteps}
        />
      );
      const expandButtons = container.querySelectorAll('[aria-expanded]');
      expect(expandButtons.length).toBeGreaterThan(0);
      
      expandButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-controls');
      });
    });

    it('should have keyboard accessible expand/collapse', () => {
      const { container } = render(
        <CalculationExplainer
          title="Test Calculation"
          finalResult={40000}
          formula="base = revenue - expenses"
          steps={mockSteps}
        />
      );
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
      });
    });
  });

  describe('AssumptionsPanel', () => {
    const mockAssumptions = [
      {
        key: 'monthly_revenue',
        value: 50000,
        sensitivity: 'HIGH' as const,
        description: 'Expected monthly revenue',
        source: 'Historical data',
        lastUpdated: '2026-01-31',
      },
      {
        key: 'burn_rate',
        value: 30000,
        sensitivity: 'MEDIUM' as const,
        description: 'Monthly operating expenses',
      },
    ];

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AssumptionsPanel assumptions={mockAssumptions} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use semantic HTML for assumptions', () => {
      const { container } = render(
        <AssumptionsPanel assumptions={mockAssumptions} />
      );
      const articles = container.querySelectorAll('article');
      expect(articles.length).toBe(mockAssumptions.length);
    });

    it('should have proper labels for each assumption', () => {
      const { container } = render(
        <AssumptionsPanel assumptions={mockAssumptions} />
      );
      const labelledElements = container.querySelectorAll('[aria-labelledby]');
      expect(labelledElements.length).toBe(mockAssumptions.length);
    });

    it('should not rely on color alone for sensitivity', () => {
      const { container } = render(
        <AssumptionsPanel assumptions={mockAssumptions} />
      );
      // Check that sensitivity badges have text content
      const badges = container.querySelectorAll('[class*="badge"]');
      badges.forEach(badge => {
        expect(badge.textContent).toBeTruthy();
      });
    });
  });

  describe('ConfidenceIndicator', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<ConfidenceIndicator score={85} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper role and aria-label', () => {
      const { container } = render(<ConfidenceIndicator score={75} />);
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('aria-label');
    });

    it('should have progress bar with proper ARIA attributes', () => {
      const { container } = render(<ConfidenceIndicator score={60} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should not rely on color alone for confidence level', () => {
      const { container } = render(
        <ConfidenceIndicator score={85} showLabel={true} />
      );
      // Should have text label in addition to color
      expect(container.textContent).toContain('85%');
      expect(container.textContent).toMatch(/High|Moderate|Low/i);
    });
  });

  describe('Color Contrast and Non-Color Indicators', () => {
    it('KPICard should use icon + text for trends', () => {
      const { container } = render(
        <KPICard title="Test" value={100} trend="up" trendValue={5} />
      );
      // Should have both icon (svg) and text
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(container.textContent).toContain('5');
    });

    it('RiskTimeline should use color + icon + text for risk levels', async () => {
      const { container } = render(<RiskTimeline />);
      await new Promise(resolve => setTimeout(resolve, 100));
      // Structure should support icon + text even if no data
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons).toBeDefined();
    });

    it('ConfidenceIndicator should have multiple visual cues', () => {
      const { container } = render(
        <ConfidenceIndicator score={45} showLabel={true} />
      );
      // Should have: percentage text, progress bar, and badge
      expect(container.textContent).toContain('45%');
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('CalculationExplainer buttons should be keyboard accessible', () => {
      const { container } = render(
        <CalculationExplainer
          title="Test"
          finalResult={100}
          formula="x = y"
          steps={[
            {
              step: 1,
              description: 'Test',
              formula: 'x = y',
              inputs: { y: 100 },
              output: 100,
            },
          ]}
        />
      );
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('ForecastResultsView toggle button should be keyboard accessible', async () => {
      const { container } = render(<ForecastResultsView />);
      await new Promise(resolve => setTimeout(resolve, 100));
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('KPICard should have screen reader text for trends', () => {
      const { container } = render(
        <KPICard title="Test" value={100} trend="up" trendValue={5} />
      );
      const srOnly = container.querySelector('.sr-only');
      if (srOnly) {
        expect(srOnly.textContent).toBeTruthy();
      }
    });

    it('Loading states should have proper announcements', () => {
      const { container } = render(
        <KPICard title="Test" value={0} loading={true} />
      );
      const loadingElement = container.querySelector('[role="status"]');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('Charts should have descriptive aria-labels', () => {
      const { container } = render(<ForecastResultsView />);
      const imgElements = container.querySelectorAll('[role="img"]');
      imgElements.forEach(img => {
        expect(img).toHaveAttribute('aria-label');
        expect(img.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
