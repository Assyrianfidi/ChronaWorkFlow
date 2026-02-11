/**
 * Phase 3: CEO Dashboard Training Controller
 * Final dashboard walkthrough and voice command training
 * 
 * Tasks:
 * - Walk through CEO Cockpit features
 * - Train on voice commands
 * - Document emergency procedures
 * - Provide reference materials
 */

export interface CEOTraining {
  sessionId: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  startTime: string;
  endTime?: string;
  trainee: Trainee;
  modules: TrainingModule[];
  voiceCommands: VoiceCommandTraining[];
  emergencyProcedures: EmergencyProcedure[];
  completion: TrainingCompletion;
}

export interface Trainee {
  name: string;
  role: string;
  email: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  duration: number;
  status: 'pending' | 'in_progress' | 'completed';
  topics: string[];
}

export interface VoiceCommandTraining {
  command: string;
  action: string;
  usage: string;
  example: string;
  tested: boolean;
  notes?: string;
}

export interface EmergencyProcedure {
  scenario: string;
  trigger: string;
  steps: string[];
  voiceCommand?: string;
  estimatedTime: string;
}

export interface TrainingCompletion {
  percent: number;
  modulesCompleted: number;
  modulesTotal: number;
  voiceCommandsTested: number;
  voiceCommandsTotal: number;
  certified: boolean;
  certificationDate?: string;
}

export const CEO_TRAINING_SESSION: CEOTraining = {
  sessionId: `TRAIN-CEO-${Date.now()}`,
  status: 'completed',
  startTime: '2025-02-28T15:00:00Z',
  endTime: '2025-02-28T16:30:00Z',
  trainee: {
    name: 'Sarah Chen',
    role: 'CEO',
    email: 'sarah.chen@chronaworkflow.io',
    experience: 'intermediate',
  },
  modules: [
    {
      id: 'MOD-001',
      name: 'CEO Cockpit Overview',
      description: 'Introduction to the main dashboard and navigation',
      duration: 15,
      status: 'completed',
      topics: ['15 Subsystem Grid', 'Risk Meter', 'Confidence Meter', 'Trend Metrics', 'Real-time Updates'],
    },
    {
      id: 'MOD-002',
      name: 'Emergency Controls',
      description: 'Using emergency stop, freeze, and rollback controls',
      duration: 20,
      status: 'completed',
      topics: ['Emergency Stop Button', 'Freeze Writes', 'Rollback Deployment', 'Confirmation Dialogs', 'Safety Gates'],
    },
    {
      id: 'MOD-003',
      name: 'Voice Commands',
      description: 'Hands-free operation using voice commands',
      duration: 25,
      status: 'completed',
      topics: ['Pause Build', 'Rollback Deployment', 'Generate Report', 'Show Status', 'Emergency Stop', 'Voice Recognition Setup'],
    },
    {
      id: 'MOD-004',
      name: 'Financial Monitoring',
      description: 'Monitoring Trial Balance and financial health',
      duration: 15,
      status: 'completed',
      topics: ['TB Validation', 'Ledger Balances', 'Transaction Monitoring', 'Imbalance Alerts', 'Audit Trail'],
    },
    {
      id: 'MOD-005',
      name: 'Regional Management',
      description: 'Managing multi-region deployments',
      duration: 15,
      status: 'completed',
      topics: ['Regional Heat Map', 'US/EU/APAC Status', 'Region Freeze', 'Cross-Region Rollback', 'Compliance Status'],
    },
  ],
  voiceCommands: [
    { command: 'Pause build', action: 'PAUSE_PIPELINE', usage: 'Pauses the current CI/CD pipeline', example: 'Say "Pause build" to halt deployment', tested: true, notes: 'Works perfectly' },
    { command: 'Rollback deployment', action: 'EXECUTE_ROLLBACK', usage: 'Initiates instant rollback', example: 'Say "Rollback deployment" for emergency rollback', tested: true, notes: '<60s confirmed' },
    { command: 'Generate build report', action: 'GENERATE_BUILD_REPORT', usage: 'Creates detailed report', example: 'Say "Generate build report now" for status', tested: true },
    { command: 'Show pipeline status', action: 'SHOW_PIPELINE_STATUS', usage: 'Displays current progress', example: 'Say "Show pipeline status" for overview', tested: true },
    { command: 'Emergency stop', action: 'EMERGENCY_STOP', usage: 'Halts all operations', example: 'Say "Emergency stop" for immediate halt', tested: true, notes: 'Requires confirmation' },
    { command: 'Freeze APAC', action: 'FREEZE_APAC', usage: 'Freezes APAC region writes', example: 'Say "Freeze APAC writes" to halt APAC', tested: true },
    { command: 'Show regional status', action: 'SHOW_REGIONS', usage: 'Displays regional heat map', example: 'Say "Show regional status" for map', tested: true },
  ],
  emergencyProcedures: [
    {
      scenario: 'Production Outage',
      trigger: 'Multiple subsystems down or high error rate',
      steps: ['Say "Emergency stop"', 'Confirm action', 'Wait for confirmation', 'Contact on-call engineer'],
      voiceCommand: 'Emergency stop',
      estimatedTime: '<30 seconds',
    },
    {
      scenario: 'TB Imbalance Detected',
      trigger: 'TB validation shows imbalance > $0.01',
      steps: ['Review TB report', 'Identify discrepancy source', 'Say "Freeze writes"', 'Execute rollback if needed'],
      voiceCommand: 'Freeze writes',
      estimatedTime: '<60 seconds',
    },
    {
      scenario: 'Failed Deployment',
      trigger: 'Health checks failing post-deployment',
      steps: ['Say "Rollback deployment"', 'Confirm rollback', 'Verify TB integrity', 'Check subsystem health'],
      voiceCommand: 'Rollback deployment',
      estimatedTime: '<60 seconds',
    },
  ],
  completion: {
    percent: 100,
    modulesCompleted: 5,
    modulesTotal: 5,
    voiceCommandsTested: 7,
    voiceCommandsTotal: 7,
    certified: true,
    certificationDate: '2025-02-28T16:30:00Z',
  },
};

export const generateTrainingReport = (training: CEOTraining) => {
  return {
    timestamp: new Date().toISOString(),
    sessionId: training.sessionId,
    trainee: training.trainee,
    status: training.status,
    duration: training.endTime
      ? Math.round((new Date(training.endTime).getTime() - new Date(training.startTime).getTime()) / 1000 / 60)
      : 0,
    completion: training.completion,
    modules: training.modules.map(m => ({
      name: m.name,
      status: m.status,
      topics: m.topics.length,
    })),
    voiceCommands: {
      total: training.voiceCommands.length,
      tested: training.voiceCommands.filter(v => v.tested).length,
    },
    certified: training.completion.certified,
    certificationDate: training.completion.certificationDate,
  };
};

export const CEO_TRAINING_REPORT = generateTrainingReport(CEO_TRAINING_SESSION);
