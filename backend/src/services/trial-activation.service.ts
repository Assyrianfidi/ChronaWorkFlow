/**
 * Trial Activation Service
 * 14-day trial system with activation milestones and drop-off monitoring
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { EventBus } from '../events/event-bus';
import { CacheManager } from '../cache/cache-manager';

// Trial status
export type TrialStatus = 'active' | 'expired' | 'converted' | 'cancelled';

// Activation milestones
export type MilestoneType = 
  | 'account_created'
  | 'data_imported'
  | 'first_categorization'
  | 'first_invoice'
  | 'first_report'
  | 'ai_copilot_used'
  | 'automation_created'
  | 'team_member_invited'
  | 'bank_connected'
  | 'full_automation';

// Milestone definition
export interface Milestone {
  type: MilestoneType;
  name: string;
  description: string;
  targetDay: number; // Day by which this should be completed
  points: number;
  isRequired: boolean;
}

// User trial state
export interface UserTrialState {
  userId: number;
  companyId: string;
  trialStartDate: Date;
  trialEndDate: Date;
  status: TrialStatus;
  daysRemaining: number;
  completedMilestones: CompletedMilestone[];
  pendingMilestones: Milestone[];
  activationScore: number;
  activationPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: string[];
  lastActivityDate: Date;
  totalLogins: number;
  featuresUsed: string[];
}

export interface CompletedMilestone {
  type: MilestoneType;
  completedAt: Date;
  points: number;
}

// Trial configuration
export interface TrialConfig {
  trialDurationDays: number;
  milestones: Milestone[];
  dropOffThresholdDays: number;
  conversionDiscountPercent: number;
}

// Notification types
export type NotificationType = 
  | 'milestone_completed'
  | 'milestone_reminder'
  | 'trial_expiring'
  | 'trial_expired'
  | 'drop_off_warning'
  | 'conversion_offer';

export interface TrialNotification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  readAt?: Date;
}

export class TrialActivationService {
  private static instance: TrialActivationService;
  private eventBus: EventBus;
  private cache: CacheManager;
  private config: TrialConfig;

  private constructor() {
    this.eventBus = new EventBus();
    this.cache = new CacheManager();
    this.config = this.getDefaultConfig();
    this.setupEventListeners();
    logger.info('Trial Activation Service initialized');
  }

  static getInstance(): TrialActivationService {
    if (!TrialActivationService.instance) {
      TrialActivationService.instance = new TrialActivationService();
    }
    return TrialActivationService.instance;
  }

  private getDefaultConfig(): TrialConfig {
    return {
      trialDurationDays: 14,
      dropOffThresholdDays: 3,
      conversionDiscountPercent: 20,
      milestones: [
        {
          type: 'account_created',
          name: 'Account Created',
          description: 'Welcome to AccuBooks! Your account is ready.',
          targetDay: 0,
          points: 10,
          isRequired: true,
        },
        {
          type: 'data_imported',
          name: 'Data Imported',
          description: 'Import your existing data or connect your bank.',
          targetDay: 1,
          points: 20,
          isRequired: true,
        },
        {
          type: 'first_categorization',
          name: 'AI Auto-Categorization',
          description: 'Experience AI categorizing your transactions automatically.',
          targetDay: 1,
          points: 25,
          isRequired: true,
        },
        {
          type: 'first_invoice',
          name: 'First Invoice Created',
          description: 'Create your first invoice or import existing ones.',
          targetDay: 3,
          points: 15,
          isRequired: false,
        },
        {
          type: 'first_report',
          name: 'First Report Generated',
          description: 'Generate a financial report to see your business insights.',
          targetDay: 3,
          points: 15,
          isRequired: false,
        },
        {
          type: 'ai_copilot_used',
          name: 'AI CFO Copilot Used',
          description: 'Ask the AI CFO a question about your finances.',
          targetDay: 7,
          points: 30,
          isRequired: true,
        },
        {
          type: 'automation_created',
          name: 'Automation Created',
          description: 'Set up an automation rule to save time.',
          targetDay: 7,
          points: 20,
          isRequired: false,
        },
        {
          type: 'bank_connected',
          name: 'Bank Connected',
          description: 'Connect your bank for automatic transaction import.',
          targetDay: 7,
          points: 25,
          isRequired: false,
        },
        {
          type: 'team_member_invited',
          name: 'Team Member Invited',
          description: 'Invite a team member to collaborate.',
          targetDay: 14,
          points: 15,
          isRequired: false,
        },
        {
          type: 'full_automation',
          name: 'Full Automation Benefits',
          description: 'Experience the full power of AccuBooks automation.',
          targetDay: 14,
          points: 25,
          isRequired: false,
        },
      ],
    };
  }

  private setupEventListeners(): void {
    // Listen for user actions to track milestones
    this.eventBus.on('transaction.categorized', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'first_categorization');
    });

    this.eventBus.on('invoice.created', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'first_invoice');
    });

    this.eventBus.on('report.generated', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'first_report');
    });

    this.eventBus.on('copilot.query', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'ai_copilot_used');
    });

    this.eventBus.on('automation.created', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'automation_created');
    });

    this.eventBus.on('bank.connected', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'bank_connected');
    });

    this.eventBus.on('team.invited', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'team_member_invited');
    });

    this.eventBus.on('migration.completed', async (data: any) => {
      await this.checkAndCompleteMilestone(data.userId, 'data_imported');
    });
  }

  /**
   * Start trial for a new user
   */
  async startTrial(userId: number, companyId: string): Promise<UserTrialState> {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + this.config.trialDurationDays);

    // Update user with trial info
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'trial',
        subscriptionStatus: 'trialing',
      },
    });

    // Complete account_created milestone
    await this.completeMilestone(userId, 'account_created');

    const trialState = await this.getTrialState(userId, companyId);

    // Send welcome notification
    await this.sendNotification(userId, {
      type: 'milestone_completed',
      title: 'Welcome to AccuBooks!',
      message: `Your 14-day free trial has started. Complete the activation milestones to get the most out of AccuBooks.`,
      actionUrl: '/onboarding',
      actionLabel: 'Start Onboarding',
    });

    logger.info('Trial started', { userId, companyId, trialEndDate });

    this.eventBus.emit('trial.started', { userId, companyId, trialEndDate });

    return trialState;
  }

  /**
   * Get current trial state for a user
   */
  async getTrialState(userId: number, companyId: string): Promise<UserTrialState> {
    const cacheKey = `trial:${userId}`;
    const cached = await this.cache.get<UserTrialState>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        planType: true,
        subscriptionStatus: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const trialStartDate = user.createdAt;
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + this.config.trialDurationDays);

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Get completed milestones from activity tracking
    const completedMilestones = await this.getCompletedMilestones(userId);
    const completedTypes = new Set(completedMilestones.map(m => m.type));

    // Calculate pending milestones
    const pendingMilestones = this.config.milestones.filter(m => !completedTypes.has(m.type));

    // Calculate activation score
    const totalPoints = this.config.milestones.reduce((sum, m) => sum + m.points, 0);
    const earnedPoints = completedMilestones.reduce((sum, m) => sum + m.points, 0);
    const activationScore = earnedPoints;
    const activationPercentage = Math.round((earnedPoints / totalPoints) * 100);

    // Determine status
    let status: TrialStatus = 'active';
    if (user.subscriptionStatus === 'active' && user.planType !== 'trial') {
      status = 'converted';
    } else if (daysRemaining === 0) {
      status = 'expired';
    }

    // Calculate risk level
    const daysSinceStart = Math.ceil((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedMilestones = this.config.milestones.filter(m => m.targetDay <= daysSinceStart);
    const completedExpected = expectedMilestones.filter(m => completedTypes.has(m.type));
    const completionRate = expectedMilestones.length > 0 ? completedExpected.length / expectedMilestones.length : 1;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (completionRate < 0.3 || (daysRemaining <= 3 && activationPercentage < 50)) {
      riskLevel = 'high';
    } else if (completionRate < 0.6 || (daysRemaining <= 7 && activationPercentage < 70)) {
      riskLevel = 'medium';
    }

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(pendingMilestones, daysRemaining, riskLevel);

    // Get features used
    const featuresUsed = completedMilestones.map(m => m.type);

    const trialState: UserTrialState = {
      userId,
      companyId,
      trialStartDate,
      trialEndDate,
      status,
      daysRemaining,
      completedMilestones,
      pendingMilestones,
      activationScore,
      activationPercentage,
      riskLevel,
      recommendedActions,
      lastActivityDate: user.lastLogin || trialStartDate,
      totalLogins: 0, // Would be tracked separately
      featuresUsed,
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, trialState, { ttl: 300 });

    return trialState;
  }

  /**
   * Complete a milestone for a user
   */
  async completeMilestone(userId: number, milestoneType: MilestoneType): Promise<void> {
    const milestone = this.config.milestones.find(m => m.type === milestoneType);
    if (!milestone) {
      logger.warn('Unknown milestone type', { milestoneType });
      return;
    }

    // Check if already completed
    const existing = await this.getMilestoneCompletion(userId, milestoneType);
    if (existing) {
      return; // Already completed
    }

    // Record completion
    await prisma.activity.create({
      data: {
        type: 'milestone',
        action: 'completed',
        userId: userId.toString(),
        userName: '',
        description: `Completed milestone: ${milestone.name}`,
        metadata: {
          milestoneType,
          points: milestone.points,
        },
      },
    });

    // Invalidate cache
    await this.cache.delete(`trial:${userId}`);

    // Send notification
    await this.sendNotification(userId, {
      type: 'milestone_completed',
      title: `🎉 ${milestone.name} Completed!`,
      message: `You earned ${milestone.points} points. ${milestone.description}`,
    });

    logger.info('Milestone completed', { userId, milestoneType, points: milestone.points });

    this.eventBus.emit('milestone.completed', { userId, milestoneType, points: milestone.points });

    // Check for full automation milestone
    const completedMilestones = await this.getCompletedMilestones(userId);
    if (completedMilestones.length >= this.config.milestones.length - 1) {
      await this.completeMilestone(userId, 'full_automation');
    }
  }

  /**
   * Check and complete milestone if conditions are met
   */
  private async checkAndCompleteMilestone(userId: number, milestoneType: MilestoneType): Promise<void> {
    try {
      await this.completeMilestone(userId, milestoneType);
    } catch (error) {
      logger.error('Failed to complete milestone', { error, userId, milestoneType });
    }
  }

  /**
   * Get completed milestones for a user
   */
  private async getCompletedMilestones(userId: number): Promise<CompletedMilestone[]> {
    const activities = await prisma.activity.findMany({
      where: {
        userId: userId.toString(),
        type: 'milestone',
        action: 'completed',
      },
      orderBy: { timestamp: 'asc' },
    });

    return activities.map(a => {
      const metadata = a.metadata as any;
      return {
        type: metadata?.milestoneType as MilestoneType,
        completedAt: a.timestamp,
        points: metadata?.points || 0,
      };
    }).filter(m => m.type);
  }

  /**
   * Get milestone completion record
   */
  private async getMilestoneCompletion(userId: number, milestoneType: MilestoneType): Promise<any> {
    return prisma.activity.findFirst({
      where: {
        userId: userId.toString(),
        type: 'milestone',
        action: 'completed',
        metadata: {
          path: ['milestoneType'],
          equals: milestoneType,
        },
      },
    });
  }

  /**
   * Generate recommended actions based on trial state
   */
  private generateRecommendations(
    pendingMilestones: Milestone[],
    daysRemaining: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];

    // Prioritize required milestones
    const requiredPending = pendingMilestones.filter(m => m.isRequired);
    if (requiredPending.length > 0) {
      recommendations.push(`Complete ${requiredPending[0].name} to unlock key features`);
    }

    // Time-sensitive recommendations
    if (daysRemaining <= 3) {
      recommendations.push('Your trial ends soon! Upgrade now to keep your data and settings.');
    } else if (daysRemaining <= 7) {
      recommendations.push('Explore all features before your trial ends.');
    }

    // Risk-based recommendations
    if (riskLevel === 'high') {
      recommendations.push('Schedule a demo call to see how AccuBooks can help your business.');
      recommendations.push('Import your data to see the AI in action.');
    } else if (riskLevel === 'medium') {
      recommendations.push('Try the AI CFO Copilot to get instant financial insights.');
    }

    // Feature-specific recommendations
    const highValuePending = pendingMilestones.filter(m => m.points >= 20);
    if (highValuePending.length > 0) {
      recommendations.push(`${highValuePending[0].name}: ${highValuePending[0].description}`);
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Send notification to user
   */
  private async sendNotification(
    userId: number,
    notification: Omit<TrialNotification, 'id' | 'userId' | 'createdAt'>
  ): Promise<void> {
    await prisma.activityNotification.create({
      data: {
        userId: userId.toString(),
        activityId: `notif_${Date.now()}`,
        isRead: false,
      },
    });

    this.eventBus.emit('notification.created', {
      userId,
      ...notification,
    });
  }

  /**
   * Check for drop-off users and send reminders
   */
  async checkDropOffs(): Promise<void> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.config.dropOffThresholdDays);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        planType: 'trial',
        subscriptionStatus: 'trialing',
        lastLogin: {
          lt: thresholdDate,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastLogin: true,
      },
    });

    for (const user of inactiveUsers) {
      await this.sendNotification(user.id, {
        type: 'drop_off_warning',
        title: 'We miss you!',
        message: `You haven't logged in for a while. Your trial is still active - come back and explore AccuBooks!`,
        actionUrl: '/dashboard',
        actionLabel: 'Continue Trial',
      });

      logger.info('Drop-off notification sent', { userId: user.id, lastLogin: user.lastLogin });
    }
  }

  /**
   * Check for expiring trials and send reminders
   */
  async checkExpiringTrials(): Promise<void> {
    const warningDays = [7, 3, 1];
    
    for (const days of warningDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      
      const expiringUsers = await prisma.user.findMany({
        where: {
          planType: 'trial',
          subscriptionStatus: 'trialing',
          createdAt: {
            gte: new Date(targetDate.getTime() - this.config.trialDurationDays * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000),
            lt: new Date(targetDate.getTime() - this.config.trialDurationDays * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      for (const user of expiringUsers) {
        await this.sendNotification(user.id, {
          type: 'trial_expiring',
          title: `Your trial expires in ${days} day${days > 1 ? 's' : ''}!`,
          message: `Upgrade now to keep all your data and continue using AccuBooks. Get ${this.config.conversionDiscountPercent}% off your first year!`,
          actionUrl: '/pricing',
          actionLabel: 'Upgrade Now',
        });

        logger.info('Trial expiring notification sent', { userId: user.id, daysRemaining: days });
      }
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrial(
    userId: number,
    planType: 'starter' | 'pro' | 'business' | 'enterprise'
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType,
        subscriptionStatus: 'active',
      },
    });

    // Invalidate cache
    await this.cache.delete(`trial:${userId}`);

    logger.info('Trial converted', { userId, planType });

    this.eventBus.emit('trial.converted', { userId, planType });
  }

  /**
   * Get trial analytics
   */
  async getTrialAnalytics(): Promise<{
    activeTrials: number;
    conversionRate: number;
    avgActivationScore: number;
    milestoneCompletionRates: Record<MilestoneType, number>;
    dropOffRate: number;
  }> {
    const trialUsers = await prisma.user.findMany({
      where: {
        planType: 'trial',
      },
      select: {
        id: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    const activeTrials = trialUsers.filter(u => u.subscriptionStatus === 'trialing').length;
    
    const convertedUsers = await prisma.user.count({
      where: {
        subscriptionStatus: 'active',
        planType: {
          not: 'trial',
        },
      },
    });

    const totalTrialStarts = trialUsers.length + convertedUsers;
    const conversionRate = totalTrialStarts > 0 ? convertedUsers / totalTrialStarts : 0;

    // Calculate milestone completion rates
    const milestoneCompletionRates: Record<string, number> = {};
    for (const milestone of this.config.milestones) {
      const completions = await prisma.activity.count({
        where: {
          type: 'milestone',
          action: 'completed',
          metadata: {
            path: ['milestoneType'],
            equals: milestone.type,
          },
        },
      });
      milestoneCompletionRates[milestone.type] = totalTrialStarts > 0 ? completions / totalTrialStarts : 0;
    }

    return {
      activeTrials,
      conversionRate,
      avgActivationScore: 65, // Would be calculated from actual data
      milestoneCompletionRates: milestoneCompletionRates as Record<MilestoneType, number>,
      dropOffRate: 0.15, // Would be calculated from actual data
    };
  }
}

// Export singleton
export const trialActivationService = TrialActivationService.getInstance();
