/**
 * React Hooks for Executive Intelligence & Explainability Layer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  SmartInsight,
  AutomationRule,
  AutomationExecution,
  AutomationStats,
  AutomationLimits,
  ExecutiveDashboardData,
  DismissInsightRequest,
  AutomationActivationRequest,
  AnalyticsEvent,
} from '../types/intelligence';

const API_BASE = '/api/automation';

/**
 * Fetch active smart insights
 */
export function useSmartInsights(severity?: string) {
  return useQuery<SmartInsight[]>({
    queryKey: ['insights', severity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      
      const response = await fetch(`${API_BASE}/insights?${params}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Generate new insights
 */
export function useGenerateInsights() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to generate insights');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

/**
 * Dismiss an insight
 */
export function useDismissInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ insightId, reason }: DismissInsightRequest) => {
      const response = await fetch(`${API_BASE}/insights/${insightId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) throw new Error('Failed to dismiss insight');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

/**
 * Fetch automation rules
 */
export function useAutomationRules(status?: string) {
  return useQuery<AutomationRule[]>({
    queryKey: ['automation-rules', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await fetch(`${API_BASE}/rules?${params}`);
      if (!response.ok) throw new Error('Failed to fetch automation rules');
      
      const data = await response.json();
      return data.data;
    },
  });
}

/**
 * Fetch automation executions
 */
export function useAutomationExecutions(ruleId?: string, limit: number = 50) {
  return useQuery<{ executions: AutomationExecution[]; total: number }>({
    queryKey: ['automation-executions', ruleId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ruleId) params.append('ruleId', ruleId);
      params.append('limit', limit.toString());
      
      const response = await fetch(`${API_BASE}/executions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch executions');
      
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Fetch automation statistics
 */
export function useAutomationStats(startDate?: Date, endDate?: Date) {
  return useQuery<AutomationStats>({
    queryKey: ['automation-stats', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await fetch(`${API_BASE}/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      return data.data;
    },
  });
}

/**
 * Fetch automation limits for current plan
 */
export function useAutomationLimits() {
  return useQuery<AutomationLimits>({
    queryKey: ['automation-limits'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/limits`);
      if (!response.ok) throw new Error('Failed to fetch limits');
      
      const data = await response.json();
      return data.data;
    },
  });
}

/**
 * Create automation rule
 */
export function useCreateAutomation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: AutomationActivationRequest) => {
      const response = await fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) throw new Error('Failed to create automation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-limits'] });
    },
  });
}

/**
 * Preview automation (dry-run)
 */
export function usePreviewAutomation() {
  return useMutation({
    mutationFn: async ({ ruleId, sampleData }: { ruleId: string; sampleData: any }) => {
      const response = await fetch(`${API_BASE}/rules/${ruleId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData }),
      });
      
      if (!response.ok) throw new Error('Failed to preview automation');
      return response.json();
    },
  });
}

/**
 * Execute automation manually
 */
export function useExecuteAutomation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ruleId, triggerData }: { ruleId: string; triggerData: any }) => {
      const response = await fetch(`${API_BASE}/rules/${ruleId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData }),
      });
      
      if (!response.ok) throw new Error('Failed to execute automation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

/**
 * Fetch automation templates
 */
export function useAutomationTemplates(category?: string) {
  return useQuery({
    queryKey: ['automation-templates', category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await fetch(`${API_BASE}/templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      return data.data;
    },
  });
}

/**
 * Comprehensive Executive Dashboard Data Hook
 */
export function useExecutiveDashboard() {
  const { data: insights, isLoading: insightsLoading } = useSmartInsights();
  const { data: rules, isLoading: rulesLoading } = useAutomationRules('ACTIVE');
  const { data: executions, isLoading: executionsLoading } = useAutomationExecutions(undefined, 10);
  const { data: stats, isLoading: statsLoading } = useAutomationStats();
  const { data: limits, isLoading: limitsLoading } = useAutomationLimits();

  const isLoading = insightsLoading || rulesLoading || executionsLoading || statsLoading || limitsLoading;

  const dashboardData: ExecutiveDashboardData | null = isLoading ? null : {
    risksAndAlerts: insights?.filter(i => i.severity === 'CRITICAL' || i.severity === 'WARNING') || [],
    smartInsights: insights || [],
    activeAutomations: rules || [],
    businessImpact: calculateBusinessImpact(executions?.executions || []),
    recentExecutions: executions?.executions || [],
    automationStats: stats || { total: 0, successful: 0, failed: 0, skipped: 0, successRate: 0 },
    limits: limits || { activeRules: 0, maxActiveRules: 0, executionsThisMonth: 0, maxExecutionsPerMonth: 0, withinLimits: true },
  };

  return {
    data: dashboardData,
    isLoading,
    refetch: () => {
      // Trigger refetch of all queries
    },
  };
}

/**
 * Analytics tracking hook
 */
export function useAnalytics() {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            eventId: `${Date.now()}-${Math.random()}`,
            eventType: event.eventType,
            featureFlag: 'AUTOMATION_ENGINE',
            featureName: 'Executive Intelligence',
            userId: 'current-user', // Will be populated by backend
            userRole: 'OWNER', // Will be populated by backend
            tenantId: 'current-tenant', // Will be populated by backend
            sessionId: sessionStorage.getItem('sessionId') || 'unknown',
            metadata: event.metadata,
            timestamp: new Date(),
          }],
        }),
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, []);

  return { trackEvent };
}

/**
 * Explainability data hook
 */
export function useExplainability(insight: SmartInsight | null) {
  const [isOpen, setIsOpen] = useState(false);
  const { trackEvent } = useAnalytics();

  const openExplainability = useCallback(() => {
    setIsOpen(true);
    if (insight) {
      trackEvent({
        eventType: 'EXPLAINABILITY_OPENED',
        insightId: insight.id,
        metadata: {
          insightType: insight.insightType,
          severity: insight.severity,
        },
      });
    }
  }, [insight, trackEvent]);

  const closeExplainability = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openExplainability,
    closeExplainability,
  };
}

/**
 * Helper function to calculate business impact from executions
 */
function calculateBusinessImpact(executions: AutomationExecution[]): {
  moneySaved: number;
  risksPrevented: number;
  timeAutomated: number;
  tasksCreated: number;
  alertsSent: number;
} {
  let moneySaved = 0;
  let risksPrevented = 0;
  let timeAutomated = 0;
  let tasksCreated = 0;
  let alertsSent = 0;

  executions.forEach(execution => {
    if (execution.status === 'SUCCESS') {
      // Estimate impact based on action types
      execution.actionsExecuted.forEach((action: any) => {
        if (action.action?.type === 'SEND_EMAIL' || action.action?.type === 'SEND_IN_APP_NOTIFICATION') {
          alertsSent++;
          timeAutomated += 5; // 5 minutes saved per alert
        }
        if (action.action?.type === 'CREATE_TASK') {
          tasksCreated++;
          timeAutomated += 10; // 10 minutes saved per task
        }
        if (action.action?.type === 'FLAG_TRANSACTION' || action.action?.type === 'LOCK_ACTION') {
          risksPrevented++;
          moneySaved += 500; // Estimated $500 saved per risk prevented
        }
        if (action.action?.type === 'GENERATE_REPORT') {
          timeAutomated += 30; // 30 minutes saved per report
        }
      });
    }
  });

  return {
    moneySaved,
    risksPrevented,
    timeAutomated,
    tasksCreated,
    alertsSent,
  };
}
