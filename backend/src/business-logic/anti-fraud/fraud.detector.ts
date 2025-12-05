import { ApiError, ErrorCodes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';

/**
 * Anti-fraud detection system
 * Monitors transactions for suspicious patterns and behaviors
 */

export interface TransactionPattern {
  userId: string;
  accountId: string;
  amount: number;
  timestamp: Date;
  location?: string;
  device?: string;
  ipAddress?: string;
  merchantCategory?: string;
}

export interface FraudAlert {
  id: string;
  userId: string;
  accountId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number; // 0-1
  detectedAt: Date;
  transactionId?: string;
  metadata: Record<string, any>;
  action: 'block' | 'flag' | 'monitor' | 'approve';
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'block' | 'flag' | 'monitor' | 'approve';
  checkFunction: (patterns: TransactionPattern[], currentTransaction: TransactionPattern) => FraudAlert | null;
}

export interface UserProfile {
  userId: string;
  avgTransactionAmount: number;
  transactionFrequency: number; // per day
  usualLocations: string[];
  usualDevices: string[];
  usualMerchants: string[];
  accountAge: number; // in days
  riskScore: number; // 0-1
}

export class FraudDetector {
  private static rules: FraudRule[] = [];
  private static userProfiles: Map<string, UserProfile> = new Map();

  /**
   * Initialize fraud detection rules
   */
  static initializeRules(): void {
    this.rules = [
      // Rule 1: Unusually large transaction
      {
        id: 'LARGE_AMOUNT',
        name: 'Unusually Large Transaction',
        description: 'Transaction amount is significantly higher than user average',
        enabled: true,
        severity: 'high',
        action: 'flag',
        checkFunction: this.checkLargeAmount.bind(this)
      },

      // Rule 2: Rapid successive transactions
      {
        id: 'RAPID_TRANSACTIONS',
        name: 'Rapid Successive Transactions',
        description: 'Multiple transactions in short time period',
        enabled: true,
        severity: 'medium',
        action: 'monitor',
        checkFunction: this.checkRapidTransactions.bind(this)
      },

      // Rule 3: Unusual location
      {
        id: 'UNUSUAL_LOCATION',
        name: 'Transaction from Unusual Location',
        description: 'Transaction from location not normally used by user',
        enabled: true,
        severity: 'medium',
        action: 'flag',
        checkFunction: this.checkUnusualLocation.bind(this)
      },

      // Rule 4: Unusual device
      {
        id: 'UNUSUAL_DEVICE',
        name: 'Transaction from Unusual Device',
        description: 'Transaction from device not normally used by user',
        enabled: true,
        severity: 'medium',
        action: 'flag',
        checkFunction: this.checkUnusualDevice.bind(this)
      },

      // Rule 5: Round number amount (potential money laundering)
      {
        id: 'ROUND_AMOUNT',
        name: 'Round Number Transaction',
        description: 'Transaction amount is a round number (potential structuring)',
        enabled: true,
        severity: 'low',
        action: 'monitor',
        checkFunction: this.checkRoundAmount.bind(this)
      },

      // Rule 6: High velocity transactions
      {
        id: 'HIGH_VELOCITY',
        name: 'High Velocity Transactions',
        description: 'Many transactions exceeding normal frequency',
        enabled: true,
        severity: 'high',
        action: 'block',
        checkFunction: this.checkHighVelocity.bind(this)
      },

      // Rule 7: New account high value
      {
        id: 'NEW_ACCOUNT_HIGH_VALUE',
        name: 'High Value Transaction from New Account',
        description: 'Large transaction from recently created account',
        enabled: true,
        severity: 'critical',
        action: 'block',
        checkFunction: this.checkNewAccountHighValue.bind(this)
      },

      // Rule 8: Suspicious merchant category
      {
        id: 'SUSPICIOUS_MERCHANT',
        name: 'Transaction with Suspicious Merchant',
        description: 'Transaction with merchant category flagged as high risk',
        enabled: true,
        severity: 'medium',
        action: 'flag',
        checkFunction: this.checkSuspiciousMerchant.bind(this)
      },

      // Rule 9: Multiple failed transactions
      {
        id: 'MULTIPLE_FAILED',
        name: 'Multiple Failed Transactions',
        description: 'Multiple failed transaction attempts',
        enabled: true,
        severity: 'high',
        action: 'block',
        checkFunction: this.checkMultipleFailed.bind(this)
      },

      // Rule 10: Account takeover pattern
      {
        id: 'ACCOUNT_TAKEOVER',
        name: 'Potential Account Takeover',
        description: 'Multiple indicators of account takeover',
        enabled: true,
        severity: 'critical',
        action: 'block',
        checkFunction: this.checkAccountTakeover.bind(this)
      }
    ];
  }

  /**
   * Analyze transaction for fraud
   */
  static async analyzeTransaction(
    currentTransaction: TransactionPattern,
    historicalPatterns: TransactionPattern[]
  ): Promise<{
    approved: boolean;
    alerts: FraudAlert[];
    riskScore: number;
  }> {
    this.initializeRules();
    
    const alerts: FraudAlert[] = [];
    let highestSeverity = 'low';
    
    // Get or create user profile
    const userProfile = this.getUserProfile(currentTransaction.userId, historicalPatterns);
    
    // Run all enabled rules
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const alert = rule.checkFunction(historicalPatterns, currentTransaction);
        if (alert) {
          alerts.push(alert);
          
          // Track highest severity
          if (this.getSeverityLevel(alert.severity) > this.getSeverityLevel(highestSeverity)) {
            highestSeverity = alert.severity;
          }
        }
      } catch (error) {
        console.error(`Error in fraud rule ${rule.id}:`, error);
      }
    }

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(alerts, userProfile);
    
    // Determine if transaction should be blocked
    const blocked = alerts.some(alert => alert.action === 'block');
    
    // Log fraud analysis
    logger.warn('Suspicious activity detected', {
      transactionId: currentTransaction.timestamp.getTime().toString(),
      amount: currentTransaction.amount,
      riskScore,
      alertsCount: alerts.length,
      blocked,
      highestSeverity
    });

    return {
      approved: !blocked,
      alerts,
      riskScore
    };
  }

  /**
   * Fraud rule implementations
   */
  private static checkLargeAmount(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    const userPatterns = patterns.filter(p => p.userId === current.userId);
    
    if (userPatterns.length < 5) return null; // Not enough history
    
    const avgAmount = userPatterns.reduce((sum, p) => sum + p.amount, 0) / userPatterns.length;
    const threshold = avgAmount * 5; // 5x average
    
    if (current.amount > threshold) {
      return {
        id: `ALERT_${Date.now()}_LARGE`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'LARGE_AMOUNT',
        severity: 'high',
        description: `Transaction amount $${current.amount} is ${Math.round(current.amount / avgAmount)}x user average`,
        confidence: Math.min(0.9, (current.amount / avgAmount - 5) / 10),
        detectedAt: new Date(),
        metadata: {
          avgAmount,
          threshold,
          ratio: current.amount / avgAmount
        },
        action: 'flag'
      };
    }
    
    return null;
  }

  private static checkRapidTransactions(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    const userPatterns = patterns.filter(p => 
      p.userId === current.userId && 
      p.accountId === current.accountId
    );
    
    // Check for transactions in last 5 minutes
    const fiveMinutesAgo = new Date(current.timestamp.getTime() - 5 * 60 * 1000);
    const recentTransactions = userPatterns.filter(p => p.timestamp > fiveMinutesAgo);
    
    if (recentTransactions.length >= 3) {
      return {
        id: `ALERT_${Date.now()}_RAPID`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'RAPID_TRANSACTIONS',
        severity: 'medium',
        description: `${recentTransactions.length} transactions in last 5 minutes`,
        confidence: Math.min(0.8, recentTransactions.length / 5),
        detectedAt: new Date(),
        metadata: {
          recentCount: recentTransactions.length,
          timeframe: '5 minutes'
        },
        action: 'monitor'
      };
    }
    
    return null;
  }

  private static checkUnusualLocation(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    if (!current.location) return null;
    
    const userPatterns = patterns.filter(p => p.userId === current.userId && p.location);
    const locations = [...new Set(userPatterns.map(p => p.location!))];
    
    if (locations.length > 0 && !locations.includes(current.location)) {
      return {
        id: `ALERT_${Date.now()}_LOCATION`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'UNUSUAL_LOCATION',
        severity: 'medium',
        description: `Transaction from new location: ${current.location}`,
        confidence: 0.7,
        detectedAt: new Date(),
        metadata: {
          newLocation: current.location,
          usualLocations: locations
        },
        action: 'flag'
      };
    }
    
    return null;
  }

  private static checkUnusualDevice(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    if (!current.device) return null;
    
    const userPatterns = patterns.filter(p => p.userId === current.userId && p.device);
    const devices = [...new Set(userPatterns.map(p => p.device!))];
    
    if (devices.length > 0 && !devices.includes(current.device)) {
      return {
        id: `ALERT_${Date.now()}_DEVICE`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'UNUSUAL_DEVICE',
        severity: 'medium',
        description: `Transaction from new device: ${current.device}`,
        confidence: 0.6,
        detectedAt: new Date(),
        metadata: {
          newDevice: current.device,
          usualDevices: devices
        },
        action: 'flag'
      };
    }
    
    return null;
  }

  private static checkRoundAmount(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    // Check if amount is a round number (e.g., 1000, 5000, 10000)
    const isRoundNumber = current.amount >= 1000 && 
                         current.amount % 1000 === 0 && 
                         current.amount.toString().length <= 5;
    
    if (isRoundNumber) {
      return {
        id: `ALERT_${Date.now()}_ROUND`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'ROUND_AMOUNT',
        severity: 'low',
        description: `Round number transaction: $${current.amount}`,
        confidence: 0.4,
        detectedAt: new Date(),
        metadata: {
          amount: current.amount
        },
        action: 'monitor'
      };
    }
    
    return null;
  }

  private static checkHighVelocity(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    const userPatterns = patterns.filter(p => 
      p.userId === current.userId && 
      p.timestamp > new Date(current.timestamp.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
    );
    
    // More than 50 transactions in 24 hours
    if (userPatterns.length > 50) {
      return {
        id: `ALERT_${Date.now()}_VELOCITY`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'HIGH_VELOCITY',
        severity: 'high',
        description: `${userPatterns.length} transactions in last 24 hours`,
        confidence: Math.min(0.9, userPatterns.length / 100),
        detectedAt: new Date(),
        metadata: {
          transactionCount: userPatterns.length,
          timeframe: '24 hours'
        },
        action: 'block'
      };
    }
    
    return null;
  }

  private static checkNewAccountHighValue(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    const userPatterns = patterns.filter(p => p.userId === current.userId);
    
    if (userPatterns.length === 0 && current.amount > 5000) {
      return {
        id: `ALERT_${Date.now()}_NEW_HIGH`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'NEW_ACCOUNT_HIGH_VALUE',
        severity: 'critical',
        description: `High value transaction ($${current.amount}) from new account`,
        confidence: 0.8,
        detectedAt: new Date(),
        metadata: {
          amount: current.amount,
          isFirstTransaction: true
        },
        action: 'block'
      };
    }
    
    return null;
  }

  private static checkSuspiciousMerchant(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    if (!current.merchantCategory) return null;
    
    const suspiciousCategories = [
      'CRYPTOCURRENCY_EXCHANGE',
      'GAMBLING',
      'MONEY_TRANSFER',
      'PRECIOUS_METALS',
      'CASH_ADVANCE'
    ];
    
    if (suspiciousCategories.includes(current.merchantCategory)) {
      return {
        id: `ALERT_${Date.now()}_MERCHANT`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'SUSPICIOUS_MERCHANT',
        severity: 'medium',
        description: `Transaction with suspicious merchant: ${current.merchantCategory}`,
        confidence: 0.6,
        detectedAt: new Date(),
        metadata: {
          merchantCategory: current.merchantCategory
        },
        action: 'flag'
      };
    }
    
    return null;
  }

  private static checkMultipleFailed(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    // This would need access to failed transaction attempts
    // For now, return null as we don't have that data
    return null;
  }

  private static checkAccountTakeover(
    patterns: TransactionPattern[],
    current: TransactionPattern
  ): FraudAlert | null {
    let suspiciousIndicators = 0;
    
    // Check for multiple risk factors
    if (current.location && current.device) {
      const userPatterns = patterns.filter(p => p.userId === current.userId);
      const locations = [...new Set(userPatterns.map(p => p.location).filter(Boolean))];
      const devices = [...new Set(userPatterns.map(p => p.device).filter(Boolean))];
      
      if (!locations.includes(current.location!)) suspiciousIndicators++;
      if (!devices.includes(current.device!)) suspiciousIndicators++;
    }
    
    if (current.amount > 10000) suspiciousIndicators++;
    
    if (suspiciousIndicators >= 2) {
      return {
        id: `ALERT_${Date.now()}_TAKEOVER`,
        userId: current.userId,
        accountId: current.accountId,
        alertType: 'ACCOUNT_TAKEOVER',
        severity: 'critical',
        description: `Multiple indicators of account takeover (${suspiciousIndicators} risk factors)`,
        confidence: 0.8,
        detectedAt: new Date(),
        metadata: {
          suspiciousIndicators,
          factors: {
            unusualLocation: current.location && !patterns.some(p => p.location === current.location),
            unusualDevice: current.device && !patterns.some(p => p.device === current.device),
            highAmount: current.amount > 10000
          }
        },
        action: 'block'
      };
    }
    
    return null;
  }

  /**
   * Helper methods
   */
  private static getUserProfile(userId: string, patterns: TransactionPattern[]): UserProfile {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    const userPatterns = patterns.filter(p => p.userId === userId);
    const avgAmount = userPatterns.length > 0 
      ? userPatterns.reduce((sum, p) => sum + p.amount, 0) / userPatterns.length 
      : 0;
    
    const locations = [...new Set(userPatterns.map(p => p.location).filter(Boolean))];
    const devices = [...new Set(userPatterns.map(p => p.device).filter(Boolean))];
    const merchants = [...new Set(userPatterns.map(p => p.merchantCategory).filter(Boolean))];
    
    const profile: UserProfile = {
      userId,
      avgTransactionAmount: avgAmount,
      transactionFrequency: userPatterns.length / Math.max(1, userPatterns.length > 0 ? 30 : 30), // per day
      usualLocations: locations.filter(Boolean) as string[],
      usualDevices: devices.filter(Boolean) as string[],
      usualMerchants: merchants.filter(Boolean) as string[],
      accountAge: userPatterns.length > 0 
        ? (Date.now() - Math.min(...userPatterns.map(p => p.timestamp.getTime()))) / (1000 * 60 * 60 * 24)
        : 0,
      riskScore: 0.5 // Default medium risk
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  private static calculateRiskScore(alerts: FraudAlert[], profile: UserProfile): number {
    if (alerts.length === 0) return profile.riskScore * 0.5; // Reduce risk with no alerts
    
    const severityWeights = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    const maxSeverity = Math.max(...alerts.map(a => severityWeights[a.severity]));
    
    return Math.min(1, profile.riskScore + maxSeverity * 0.5);
  }

  private static getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 0;
  }

  /**
   * Public API methods
   */
  static addCustomRule(rule: FraudRule): void {
    this.rules.push(rule);
  }

  static enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = true;
  }

  static disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = false;
  }

  static getActiveRules(): FraudRule[] {
    return this.rules.filter(r => r.enabled);
  }
}

/**
 * Fraud monitoring service
 */
export class FraudMonitoringService {
  private static alerts: FraudAlert[] = [];

  static async recordAlert(alert: FraudAlert): Promise<void> {
    this.alerts.push(alert);
    
    // Log the fraud alert
    logger.warn('Fraud alert recorded', {
      alertId: alert.id,
      alertType: alert.alertType,
      severity: alert.severity,
      confidence: alert.confidence,
      action: alert.action,
      userId: alert.userId
    });

    // If critical alert, trigger immediate notification
    if (alert.severity === 'critical') {
      await this.triggerCriticalAlert(alert);
    }
  }

  private static async triggerCriticalAlert(alert: FraudAlert): Promise<void> {
    // In a real system, this would send notifications to security team
    console.error('CRITICAL FRAUD ALERT:', alert);
    
    logger.error('Critical fraud alert', {
      alertId: alert.id,
      userId: alert.userId,
      description: alert.description
    });
  }

  static getAlertsForUser(userId: string, limit: number = 50): FraudAlert[] {
    return this.alerts
      .filter(a => a.userId === userId)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  static getAlertsBySeverity(severity: string, limit: number = 100): FraudAlert[] {
    return this.alerts
      .filter(a => a.severity === severity)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }
}
