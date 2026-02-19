/**
 * Anomaly Detection Engine
 * Automatically identifies duplicate payments, missing entries, and mis-categorized transactions
 */

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { CacheManager } from '../cache/cache-manager.js';
import { EventBus } from '../events/event-bus.js';

// Anomaly types
export type AnomalyType = 
  | 'duplicate_payment'
  | 'duplicate_invoice'
  | 'missing_entry'
  | 'mis_categorized'
  | 'unusual_amount'
  | 'unusual_timing'
  | 'unusual_vendor'
  | 'round_number'
  | 'sequential_number'
  | 'weekend_transaction'
  | 'after_hours'
  | 'split_transaction';

// Severity levels
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

// Detected anomaly
export interface DetectedAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;
  title: string;
  description: string;
  transactionIds: string[];
  amount: number;
  potentialSavings: number;
  detectedAt: Date;
  status: 'new' | 'reviewed' | 'resolved' | 'dismissed';
  resolution?: string;
  metadata: Record<string, any>;
  suggestedActions: string[];
}

// Anomaly detection result
export interface AnomalyDetectionResult {
  companyId: string;
  scanDate: Date;
  totalTransactionsScanned: number;
  anomaliesFound: number;
  anomalies: DetectedAnomaly[];
  summary: AnomalySummary;
  processingTime: number;
}

export interface AnomalySummary {
  byType: Record<AnomalyType, number>;
  bySeverity: Record<AnomalySeverity, number>;
  totalPotentialSavings: number;
  criticalCount: number;
  requiresReview: number;
}

// Detection configuration
interface DetectionConfig {
  duplicateThreshold: number; // Days to look for duplicates
  amountVarianceThreshold: number; // Percentage variance for unusual amounts
  roundNumberThreshold: number; // Amount above which round numbers are flagged
  minTransactionsForPattern: number; // Minimum transactions to establish pattern
}

export class AnomalyDetectionEngine {
  private static instance: AnomalyDetectionEngine;
  private cache: CacheManager;
  private eventBus: EventBus;
  private config: DetectionConfig;

  private constructor() {
    this.cache = new CacheManager();
    this.eventBus = new EventBus();
    this.config = {
      duplicateThreshold: 7,
      amountVarianceThreshold: 50,
      roundNumberThreshold: 500,
      minTransactionsForPattern: 5,
    };
    logger.info('Anomaly Detection Engine initialized');
  }

  static getInstance(): AnomalyDetectionEngine {
    if (!AnomalyDetectionEngine.instance) {
      AnomalyDetectionEngine.instance = new AnomalyDetectionEngine();
    }
    return AnomalyDetectionEngine.instance;
  }

  async scanForAnomalies(
    companyId: string,
    daysToScan: number = 90
  ): Promise<AnomalyDetectionResult> {
    const startTime = performance.now();
    const anomalies: DetectedAnomaly[] = [];

    try {
      // Get transactions for scanning
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToScan);

      const transactions = await prisma.transactions.findMany({
        where: {
          companyId,
          date: { gte: startDate },
        },
        include: {
          lines: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      // Run all detection algorithms
      const duplicatePayments = await this.detectDuplicatePayments(transactions);
      const unusualAmounts = await this.detectUnusualAmounts(transactions, companyId);
      const misCategorized = await this.detectMisCategorized(transactions);
      const roundNumbers = this.detectRoundNumbers(transactions);
      const weekendTransactions = this.detectWeekendTransactions(transactions);
      const splitTransactions = this.detectSplitTransactions(transactions);
      const sequentialNumbers = this.detectSequentialNumbers(transactions);

      // Combine all anomalies
      anomalies.push(
        ...duplicatePayments,
        ...unusualAmounts,
        ...misCategorized,
        ...roundNumbers,
        ...weekendTransactions,
        ...splitTransactions,
        ...sequentialNumbers
      );

      // Generate summary
      const summary = this.generateSummary(anomalies);

      const result: AnomalyDetectionResult = {
        companyId,
        scanDate: new Date(),
        totalTransactionsScanned: transactions.length,
        anomaliesFound: anomalies.length,
        anomalies: anomalies.sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        summary,
        processingTime: performance.now() - startTime,
      };

      // Emit events for critical anomalies
      for (const anomaly of anomalies.filter(a => a.severity === 'critical')) {
        this.eventBus.emit('anomaly.critical', {
          companyId,
          anomaly,
        });
      }

      logger.info('Anomaly scan completed', {
        companyId,
        transactionsScanned: transactions.length,
        anomaliesFound: anomalies.length,
        criticalCount: summary.criticalCount,
        potentialSavings: summary.totalPotentialSavings,
      });

      return result;
    } catch (error: any) {
      logger.error('Anomaly detection failed', { error, companyId });
      throw error;
    }
  }

  private async detectDuplicatePayments(transactions: any[]): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];
    const seen = new Map<string, any[]>();

    for (const tx of transactions) {
      // Create a key based on amount and similar description
      const amount = Number(tx.amount);
      const descKey = this.normalizeDescription(tx.description || '');
      const key = `${amount.toFixed(2)}:${descKey}`;

      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(tx);
    }

    // Find duplicates within threshold days
    for (const [key, txs] of seen) {
      if (txs.length >= 2) {
        // Check if transactions are within threshold days
        for (let i = 0; i < txs.length; i++) {
          for (let j = i + 1; j < txs.length; j++) {
            const daysDiff = Math.abs(
              (new Date(txs[i].date).getTime() - new Date(txs[j].date).getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff <= this.config.duplicateThreshold && daysDiff > 0) {
              const amount = Number(txs[i].amount);
              
              anomalies.push({
                id: `dup_${txs[i].id}_${txs[j].id}`,
                type: 'duplicate_payment',
                severity: amount > 1000 ? 'high' : amount > 100 ? 'medium' : 'low',
                confidence: daysDiff <= 3 ? 0.95 : 0.8,
                title: 'Potential Duplicate Payment',
                description: `Two transactions of $${amount.toLocaleString()} with similar descriptions found ${daysDiff} days apart.`,
                transactionIds: [txs[i].id, txs[j].id],
                amount,
                potentialSavings: amount,
                detectedAt: new Date(),
                status: 'new',
                metadata: {
                  daysBetween: daysDiff,
                  description1: txs[i].description,
                  description2: txs[j].description,
                  date1: txs[i].date,
                  date2: txs[j].date,
                },
                suggestedActions: [
                  'Review both transactions for accuracy',
                  'Check if this is a legitimate recurring payment',
                  'Contact vendor to verify payment status',
                ],
              });
            }
          }
        }
      }
    }

    return anomalies;
  }

  private async detectUnusualAmounts(transactions: any[], companyId: string): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];

    // Group transactions by description pattern
    const groups = new Map<string, number[]>();
    
    for (const tx of transactions) {
      const key = this.normalizeDescription(tx.description || '');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(Number(tx.amount));
    }

    // Find outliers in each group
    for (const [description, amounts] of groups) {
      if (amounts.length >= this.config.minTransactionsForPattern) {
        const mean = amounts.reduce((a: any, b: any) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sum: any, a: any) => sum + Math.pow(a - mean, 2), 0) / amounts.length
        );

        // Find transactions that are outliers
        for (const tx of transactions) {
          if (this.normalizeDescription(tx.description || '') === description) {
            const amount = Number(tx.amount);
            const zScore = stdDev > 0 ? Math.abs((amount - mean) / stdDev) : 0;

            if (zScore > 2.5) {
              const variance = ((amount - mean) / mean) * 100;
              
              anomalies.push({
                id: `unusual_${tx.id}`,
                type: 'unusual_amount',
                severity: zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low',
                confidence: Math.min(0.95, 0.6 + (zScore * 0.1)),
                title: 'Unusual Transaction Amount',
                description: `Transaction of $${amount.toLocaleString()} is ${variance > 0 ? 'higher' : 'lower'} than typical (${Math.abs(variance).toFixed(1)}% variance from average of $${mean.toFixed(2)}).`,
                transactionIds: [tx.id],
                amount,
                potentialSavings: amount > mean ? amount - mean : 0,
                detectedAt: new Date(),
                status: 'new',
                metadata: {
                  zScore,
                  mean,
                  stdDev,
                  variance,
                  sampleSize: amounts.length,
                },
                suggestedActions: [
                  'Verify transaction amount is correct',
                  'Check for data entry errors',
                  'Review vendor invoice or receipt',
                ],
              });
            }
          }
        }
      }
    }

    return anomalies;
  }

  private async detectMisCategorized(transactions: any[]): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];

    // Keywords that suggest specific categories
    const categoryKeywords: Record<string, string[]> = {
      'EXPENSE': ['payment', 'purchase', 'buy', 'expense', 'fee', 'cost'],
      'REVENUE': ['received', 'deposit', 'income', 'sale', 'payment received'],
      'ASSET': ['equipment', 'furniture', 'computer', 'vehicle'],
    };

    for (const tx of transactions) {
      const description = (tx.description || '').toLowerCase();
      
      for (const line of tx.transaction_lines || []) {
        const accountType = line.account?.type;
        
        // Check if description suggests different category
        for (const [expectedType, keywords] of Object.entries(categoryKeywords)) {
          const hasKeyword = keywords.some(kw => description.includes(kw));
          
          if (hasKeyword && accountType !== expectedType) {
            // Check if it's a significant mismatch
            const amount = Number(line.debit) + Number(line.credit);
            
            if (amount > 100) {
              anomalies.push({
                id: `miscat_${tx.id}_${line.id}`,
                type: 'mis_categorized',
                severity: amount > 1000 ? 'medium' : 'low',
                confidence: 0.7,
                title: 'Potential Mis-categorization',
                description: `Transaction "${tx.description}" may be incorrectly categorized as ${accountType}. Keywords suggest it should be ${expectedType}.`,
                transactionIds: [tx.id],
                amount,
                potentialSavings: 0,
                detectedAt: new Date(),
                status: 'new',
                metadata: {
                  currentCategory: accountType,
                  suggestedCategory: expectedType,
                  matchedKeywords: keywords.filter(kw => description.includes(kw)),
                },
                suggestedActions: [
                  `Review if this should be categorized as ${expectedType}`,
                  'Check account assignment for accuracy',
                  'Update category if incorrect',
                ],
              });
            }
          }
        }
      }
    }

    return anomalies;
  }

  private detectRoundNumbers(transactions: any[]): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = [];

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      
      // Check for suspiciously round numbers above threshold
      if (amount >= this.config.roundNumberThreshold) {
        const isRound = amount % 100 === 0 || amount % 500 === 0 || amount % 1000 === 0;
        
        if (isRound) {
          // Check if this vendor typically has round numbers
          const isTypical = false; // Would check historical data
          
          if (!isTypical) {
            anomalies.push({
              id: `round_${tx.id}`,
              type: 'round_number',
              severity: 'low',
              confidence: 0.5,
              title: 'Round Number Transaction',
              description: `Transaction of exactly $${amount.toLocaleString()} may warrant review. Round numbers can indicate estimates or errors.`,
              transactionIds: [tx.id],
              amount,
              potentialSavings: 0,
              detectedAt: new Date(),
              status: 'new',
              metadata: {
                roundTo: amount % 1000 === 0 ? 1000 : amount % 500 === 0 ? 500 : 100,
              },
              suggestedActions: [
                'Verify amount matches invoice or receipt',
                'Check if this is an estimate that needs updating',
              ],
            });
          }
        }
      }
    }

    return anomalies;
  }

  private detectWeekendTransactions(transactions: any[]): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = [];

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const dayOfWeek = date.getDay();
      const amount = Number(tx.amount);

      // Flag large weekend transactions
      if ((dayOfWeek === 0 || dayOfWeek === 6) && amount > 500) {
        anomalies.push({
          id: `weekend_${tx.id}`,
          type: 'weekend_transaction',
          severity: amount > 5000 ? 'medium' : 'low',
          confidence: 0.6,
          title: 'Weekend Transaction',
          description: `Large transaction of $${amount.toLocaleString()} recorded on ${dayOfWeek === 0 ? 'Sunday' : 'Saturday'}.`,
          transactionIds: [tx.id],
          amount,
          potentialSavings: 0,
          detectedAt: new Date(),
          status: 'new',
          metadata: {
            dayOfWeek: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
            transactionDate: date.toISOString(),
          },
          suggestedActions: [
            'Verify transaction date is correct',
            'Check if this is a legitimate business transaction',
          ],
        });
      }
    }

    return anomalies;
  }

  private detectSplitTransactions(transactions: any[]): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = [];

    // Group transactions by date and similar description
    const groups = new Map<string, any[]>();

    for (const tx of transactions) {
      const dateKey = new Date(tx.date).toISOString().split('T')[0];
      const descKey = this.normalizeDescription(tx.description || '');
      const key = `${dateKey}:${descKey}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tx);
    }

    // Find potential splits (multiple small transactions that could be one)
    for (const [key, txs] of groups) {
      if (txs.length >= 3) {
        const totalAmount = txs.reduce((sum: any, tx: any) => sum + Number(tx.amount), 0);
        const avgAmount = totalAmount / txs.length;

        // If all amounts are similar and relatively small
        const allSimilar = txs.every(tx => {
          const amount = Number(tx.amount);
          return Math.abs(amount - avgAmount) / avgAmount < 0.2;
        });

        if (allSimilar && avgAmount < 500 && totalAmount > 1000) {
          anomalies.push({
            id: `split_${txs.map(t => t.id).join('_')}`,
            type: 'split_transaction',
            severity: totalAmount > 5000 ? 'high' : 'medium',
            confidence: 0.75,
            title: 'Potential Split Transaction',
            description: `${txs.length} similar transactions totaling $${totalAmount.toLocaleString()} on the same day may be split to avoid approval thresholds.`,
            transactionIds: txs.map(t => t.id),
            amount: totalAmount,
            potentialSavings: 0,
            detectedAt: new Date(),
            status: 'new',
            metadata: {
              transactionCount: txs.length,
              averageAmount: avgAmount,
              totalAmount,
            },
            suggestedActions: [
              'Review if these should be a single transaction',
              'Check approval policies for split transactions',
              'Verify business justification for multiple payments',
            ],
          });
        }
      }
    }

    return anomalies;
  }

  private detectSequentialNumbers(transactions: any[]): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = [];

    // Sort by transaction number
    const sorted = [...transactions].sort((a, b) => 
      a.transactionNumber.localeCompare(b.transactionNumber)
    );

    // Look for gaps in sequential numbers
    for (let i = 1; i < sorted.length; i++) {
      const prevNum = this.extractNumber(sorted[i-1].transactionNumber);
      const currNum = this.extractNumber(sorted[i].transactionNumber);

      if (prevNum !== null && currNum !== null) {
        const gap = currNum - prevNum;

        if (gap > 1 && gap < 10) {
          anomalies.push({
            id: `gap_${sorted[i-1].id}_${sorted[i].id}`,
            type: 'sequential_number',
            severity: 'low',
            confidence: 0.6,
            title: 'Missing Transaction Numbers',
            description: `Gap of ${gap - 1} transaction number(s) between ${sorted[i-1].transactionNumber} and ${sorted[i].transactionNumber}.`,
            transactionIds: [sorted[i-1].id, sorted[i].id],
            amount: 0,
            potentialSavings: 0,
            detectedAt: new Date(),
            status: 'new',
            metadata: {
              previousNumber: sorted[i-1].transactionNumber,
              currentNumber: sorted[i].transactionNumber,
              gap: gap - 1,
            },
            suggestedActions: [
              'Check if transactions were deleted',
              'Verify numbering sequence is correct',
              'Review audit trail for missing entries',
            ],
          });
        }
      }
    }

    return anomalies;
  }

  private generateSummary(anomalies: DetectedAnomaly[]): AnomalySummary {
    const byType: Record<AnomalyType, number> = {} as Record<AnomalyType, number>;
    const bySeverity: Record<AnomalySeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalPotentialSavings = 0;

    for (const anomaly of anomalies) {
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
      bySeverity[anomaly.severity]++;
      totalPotentialSavings += anomaly.potentialSavings;
    }

    return {
      byType,
      bySeverity,
      totalPotentialSavings,
      criticalCount: bySeverity.critical,
      requiresReview: bySeverity.critical + bySeverity.high,
    };
  }

  // Real-time anomaly detection for new transactions
  async analyzeTransaction(transaction: any, companyId: string): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];

    // Get recent transactions for comparison
    const recentTransactions = await prisma.transactions.findMany({
      where: {
        companyId,
        date: {
          gte: new Date(Date.now() - this.config.duplicateThreshold * 24 * 60 * 60 * 1000),
        },
        id: { not: transaction.id },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Check for duplicates
    const duplicates = await this.detectDuplicatePayments([transaction, ...recentTransactions]);
    anomalies.push(...duplicates.filter(a => a.transactionIds.includes(transaction.id)));

    // Check for unusual amount
    const unusual = await this.detectUnusualAmounts([transaction, ...recentTransactions], companyId);
    anomalies.push(...unusual.filter(a => a.transactionIds.includes(transaction.id)));

    // Check for mis-categorization
    const miscat = await this.detectMisCategorized([transaction]);
    anomalies.push(...miscat);

    // Emit events for any detected anomalies
    for (const anomaly of anomalies) {
      this.eventBus.emit('anomaly.detected', {
        companyId,
        transactionId: transaction.id,
        anomaly,
      });
    }

    return anomalies;
  }

  // Helper methods
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[0-9]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30);
  }

  private extractNumber(transactionNumber: string): number | null {
    const match = transactionNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  // Resolve anomaly
  async resolveAnomaly(
    anomalyId: string,
    resolution: 'resolved' | 'dismissed',
    notes?: string
  ): Promise<void> {
    logger.info('Anomaly resolved', {
      anomalyId,
      resolution,
      notes,
    });

    this.eventBus.emit('anomaly.resolved', {
      anomalyId,
      resolution,
      notes,
    });
  }
}

// Export singleton
export const anomalyDetectionEngine = AnomalyDetectionEngine.getInstance();
