/**
 * Trial Service
 * Handles trial system API calls
 */

const API_BASE = '/api';

interface TrialState {
  status: 'active' | 'expired' | 'converted' | 'not_started';
  daysRemaining: number;
  trialStartDate: string;
  trialEndDate: string;
  completedMilestones: string[];
  pendingMilestones: string[];
  activationScore: number;
  activationPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    milestone: string;
  }>;
}

interface TrialAnalytics {
  totalTrials: number;
  activeTrials: number;
  convertedTrials: number;
  expiredTrials: number;
  conversionRate: number;
  averageActivationScore: number;
  milestoneCompletionRates: Record<string, number>;
  dropOffPoints: Array<{
    milestone: string;
    dropOffRate: number;
  }>;
}

class TrialService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getTrialState(): Promise<{ success: boolean; data: TrialState }> {
    const response = await fetch(`${API_BASE}/trial/state`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get trial state');
    }

    return response.json();
  }

  async startTrial(): Promise<{ success: boolean; data: TrialState }> {
    const response = await fetch(`${API_BASE}/trial/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to start trial');
    }

    return response.json();
  }

  async completeMilestone(milestoneType: string): Promise<{ success: boolean; data: { milestone: string; completed: boolean } }> {
    const response = await fetch(`${API_BASE}/trial/milestone/${milestoneType}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to complete milestone');
    }

    return response.json();
  }

  async convertTrial(planType: string): Promise<{ success: boolean; data: { converted: boolean; newPlan: string } }> {
    const response = await fetch(`${API_BASE}/trial/convert`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ planType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to convert trial');
    }

    return response.json();
  }

  async getTrialAnalytics(): Promise<{ success: boolean; data: TrialAnalytics }> {
    const response = await fetch(`${API_BASE}/trial/analytics`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get trial analytics');
    }

    return response.json();
  }

  getMilestoneInfo(milestoneType: string): { name: string; description: string; points: number } {
    const milestones: Record<string, { name: string; description: string; points: number }> = {
      account_created: {
        name: 'Account Created',
        description: 'Complete your account setup',
        points: 10,
      },
      data_imported: {
        name: 'Data Imported',
        description: 'Import data from a file or connect a bank',
        points: 20,
      },
      first_categorization: {
        name: 'First Categorization',
        description: 'Use AI to categorize a transaction',
        points: 15,
      },
      first_invoice: {
        name: 'First Invoice',
        description: 'Create your first invoice',
        points: 15,
      },
      first_report: {
        name: 'First Report',
        description: 'Generate a financial report',
        points: 10,
      },
      ai_copilot_used: {
        name: 'AI Copilot Used',
        description: 'Ask the AI CFO a question',
        points: 15,
      },
      automation_created: {
        name: 'Automation Created',
        description: 'Set up an automation rule',
        points: 10,
      },
      bank_connected: {
        name: 'Bank Connected',
        description: 'Connect a bank account',
        points: 20,
      },
      team_member_invited: {
        name: 'Team Member Invited',
        description: 'Invite a team member',
        points: 10,
      },
      full_automation: {
        name: 'Full Automation',
        description: 'Achieve full automation status',
        points: 25,
      },
    };

    return milestones[milestoneType] || {
      name: milestoneType,
      description: '',
      points: 0,
    };
  }
}

export const trialService = new TrialService();
export default trialService;
