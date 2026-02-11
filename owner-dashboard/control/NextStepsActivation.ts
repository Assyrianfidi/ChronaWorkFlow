/**
 * ChronaWorkFlow Next Steps Activation Module
 * 
 * Generates detailed execution roadmap with:
 * - Task dependencies and priorities
 * - Resource requirements
 * - Milestone dates
 * - Risk mitigation strategies
 */

export interface RoadmapPhase {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  tasks: RoadmapTask[];
  dependencies: string[];
  deliverables: string[];
  risks: RiskItem[];
}

export interface RoadmapTask {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee: string;
  estimatedHours: number;
  actualHours?: number;
  dependencies: string[];
  blockers?: string[];
}

export interface RiskItem {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  owner: string;
}

export interface ResourceRequirement {
  type: 'personnel' | 'infrastructure' | 'budget' | 'tools';
  description: string;
  quantity: string;
  allocated: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  status: 'pending' | 'achieved' | 'missed';
  criteria: string[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase-1-build',
    name: 'Build/Deployment Phase',
    status: 'in_progress',
    priority: 'critical',
    startDate: '2025-02-07',
    endDate: '2025-02-14',
    tasks: [
      {
        id: 'ci-cd-setup',
        name: 'Configure CI/CD Pipeline',
        status: 'in_progress',
        assignee: 'DevOps Team',
        estimatedHours: 16,
        dependencies: [],
      },
      {
        id: 'docker-config',
        name: 'Docker Configuration for All Services',
        status: 'pending',
        assignee: 'Platform Team',
        estimatedHours: 24,
        dependencies: ['ci-cd-setup'],
      },
      {
        id: 'env-setup',
        name: 'Environment Configuration (Dev/Staging/Prod)',
        status: 'pending',
        assignee: 'DevOps Team',
        estimatedHours: 12,
        dependencies: ['docker-config'],
      },
      {
        id: 'auto-tests',
        name: 'Automated Test Suite Integration',
        status: 'pending',
        assignee: 'QA Team',
        estimatedHours: 20,
        dependencies: ['ci-cd-setup'],
      },
      {
        id: 'deploy-scripts',
        name: 'Deployment Scripts & Automation',
        status: 'pending',
        assignee: 'DevOps Team',
        estimatedHours: 16,
        dependencies: ['env-setup'],
      },
    ],
    dependencies: [],
    deliverables: [
      'CI/CD pipeline operational',
      'Docker images for all services',
      'Automated deployment scripts',
      'Test suite integrated',
    ],
    risks: [
      {
        id: 'risk-1',
        description: 'Docker build failures due to TypeScript conflicts',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Use tsconfig.server.json with proper overrides',
        owner: 'Platform Team',
      },
      {
        id: 'risk-2',
        description: 'Environment variable misconfiguration',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Centralized config management with validation',
        owner: 'DevOps Team',
      },
    ],
  },
  {
    id: 'phase-2-integration',
    name: 'System Integration Phase',
    status: 'pending',
    priority: 'critical',
    startDate: '2025-02-14',
    endDate: '2025-02-21',
    tasks: [
      {
        id: 'api-integration',
        name: 'API Gateway Integration',
        status: 'pending',
        assignee: 'Backend Team',
        estimatedHours: 24,
        dependencies: ['phase-1-build'],
      },
      {
        id: 'db-integration',
        name: 'Database Connection & Migration',
        status: 'pending',
        assignee: 'Database Team',
        estimatedHours: 16,
        dependencies: ['phase-1-build'],
      },
      {
        id: 'auth-integration',
        name: 'Authentication Service Integration',
        status: 'pending',
        assignee: 'Security Team',
        estimatedHours: 20,
        dependencies: ['api-integration'],
      },
      {
        id: 'billing-integration',
        name: 'Billing System Integration',
        status: 'pending',
        assignee: 'Backend Team',
        estimatedHours: 16,
        dependencies: ['db-integration'],
      },
      {
        id: 'integration-tests',
        name: 'End-to-End Integration Tests',
        status: 'pending',
        assignee: 'QA Team',
        estimatedHours: 32,
        dependencies: ['api-integration', 'db-integration', 'auth-integration'],
      },
      {
        id: 'data-validation',
        name: 'Data Flow Validation & TB Reconciliation',
        status: 'pending',
        assignee: 'Accounting Team',
        estimatedHours: 24,
        dependencies: ['billing-integration'],
      },
    ],
    dependencies: ['phase-1-build'],
    deliverables: [
      'All 15 subsystems connected',
      'Data flow validated',
      'TB reconciliation complete',
      'Integration tests passing',
    ],
    risks: [
      {
        id: 'risk-3',
        description: 'Database schema conflicts',
        probability: 'medium',
        impact: 'critical',
        mitigation: 'Prisma migration validation and backup strategy',
        owner: 'Database Team',
      },
      {
        id: 'risk-4',
        description: 'API contract mismatches',
        probability: 'low',
        impact: 'high',
        mitigation: 'OpenAPI spec validation and contract testing',
        owner: 'Backend Team',
      },
    ],
  },
  {
    id: 'phase-3-launch',
    name: 'Launch Phase',
    status: 'pending',
    priority: 'critical',
    startDate: '2025-02-21',
    endDate: '2025-02-28',
    tasks: [
      {
        id: 'staging-deploy',
        name: 'Staging Environment Deployment',
        status: 'pending',
        assignee: 'DevOps Team',
        estimatedHours: 8,
        dependencies: ['phase-2-integration'],
      },
      {
        id: 'uat-testing',
        name: 'User Acceptance Testing',
        status: 'pending',
        assignee: 'QA Team + Stakeholders',
        estimatedHours: 40,
        dependencies: ['staging-deploy'],
      },
      {
        id: 'prod-deploy',
        name: 'Production Deployment',
        status: 'pending',
        assignee: 'DevOps Team',
        estimatedHours: 12,
        dependencies: ['uat-testing'],
      },
      {
        id: 'monitoring-setup',
        name: 'Production Monitoring Setup',
        status: 'pending',
        assignee: 'DevOps Team',
        estimatedHours: 16,
        dependencies: ['prod-deploy'],
      },
      {
        id: 'rollback-test',
        name: 'Rollback Procedure Testing',
        status: 'pending',
        assignee: 'DevOps Team',
        estimatedHours: 4,
        dependencies: ['prod-deploy'],
      },
      {
        id: 'ceo-training',
        name: 'CEO Dashboard Training',
        status: 'pending',
        assignee: 'Product Team',
        estimatedHours: 8,
        dependencies: ['prod-deploy'],
      },
    ],
    dependencies: ['phase-2-integration'],
    deliverables: [
      'Production system live',
      'Monitoring active',
      'Rollback tested',
      'CEO trained on dashboard',
    ],
    risks: [
      {
        id: 'risk-5',
        description: 'Production deployment failure',
        probability: 'low',
        impact: 'critical',
        mitigation: 'Blue-green deployment with instant rollback',
        owner: 'DevOps Team',
      },
      {
        id: 'risk-6',
        description: 'Performance degradation under load',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Load testing completed before launch',
        owner: 'Platform Team',
      },
    ],
  },
];

export const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    name: 'CI/CD Pipeline Operational',
    targetDate: '2025-02-10',
    status: 'pending',
    criteria: ['All builds automated', 'Tests run on every commit', 'Docker images published'],
  },
  {
    id: 'm2',
    name: 'All Subsystems Integrated',
    targetDate: '2025-02-18',
    status: 'pending',
    criteria: ['15/15 subsystems connected', 'Data flow validated', 'TB reconciliation passed'],
  },
  {
    id: 'm3',
    name: 'Staging Ready',
    targetDate: '2025-02-22',
    status: 'pending',
    criteria: ['Staging environment deployed', 'UAT completed', 'No critical bugs'],
  },
  {
    id: 'm4',
    name: 'Production Launch',
    targetDate: '2025-02-28',
    status: 'pending',
    criteria: ['Production live', 'Monitoring active', 'CEO sign-off'],
  },
];

export const RESOURCE_REQUIREMENTS: ResourceRequirement[] = [
  { type: 'personnel', description: 'DevOps Engineers', quantity: '2 FTE', allocated: true },
  { type: 'personnel', description: 'Backend Developers', quantity: '3 FTE', allocated: true },
  { type: 'personnel', description: 'QA Engineers', quantity: '2 FTE', allocated: true },
  { type: 'infrastructure', description: 'CI/CD Runners', quantity: '4 parallel jobs', allocated: true },
  { type: 'infrastructure', description: 'Staging Environment', quantity: '3 regions', allocated: true },
  { type: 'infrastructure', description: 'Production Environment', quantity: '3 regions', allocated: false },
  { type: 'budget', description: 'Cloud Infrastructure', quantity: '$50K/month', allocated: true },
  { type: 'tools', description: 'Monitoring Stack', quantity: 'Datadog + PagerDuty', allocated: true },
];

export const generateRoadmapReport = () => {
  const totalTasks = ROADMAP_PHASES.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const completedTasks = ROADMAP_PHASES.reduce(
    (sum, phase) => sum + phase.tasks.filter(t => t.status === 'completed').length,
    0
  );
  const totalHours = ROADMAP_PHASES.reduce(
    (sum, phase) => sum + phase.tasks.reduce((t, task) => t + task.estimatedHours, 0),
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPhases: ROADMAP_PHASES.length,
      totalTasks,
      completedTasks,
      completionPercentage: Math.round((completedTasks / totalTasks) * 100),
      totalEstimatedHours: totalHours,
      criticalPath: ['phase-1-build', 'phase-2-integration', 'phase-3-launch'],
    },
    phases: ROADMAP_PHASES,
    milestones: MILESTONES,
    resources: RESOURCE_REQUIREMENTS,
    risks: ROADMAP_PHASES.flatMap(p => p.risks),
  };
};

export const getNextCriticalTask = (): RoadmapTask | null => {
  for (const phase of ROADMAP_PHASES) {
    if (phase.status === 'in_progress' || phase.status === 'pending') {
      const criticalTask = phase.tasks.find(
        t => t.status === 'pending' && t.dependencies.every(d => {
          // Check if dependency is completed
          const depPhase = ROADMAP_PHASES.find(p => p.id === d);
          return depPhase?.status === 'completed';
        })
      );
      if (criticalTask) return criticalTask;
    }
  }
  return null;
};

export const ROADMAP_METADATA = {
  projectName: 'ChronaWorkFlow Enterprise Launch',
  version: '3.0.0-enterprise',
  startDate: '2025-02-07',
  targetLaunchDate: '2025-02-28',
  duration: '21 days',
  status: 'IN_PROGRESS',
  health: 'ON_TRACK',
};
