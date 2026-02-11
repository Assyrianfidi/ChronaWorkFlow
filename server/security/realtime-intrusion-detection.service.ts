/**
 * Real-Time Intrusion Detection & Monitoring Service
 * Monitors traffic patterns, detects anomalies, and responds to threats
 */

import { Request } from 'express';
import { logger } from '../utils/structured-logger';
import { metrics } from '../utils/metrics';
import { db } from '../db';
import * as s from '../../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface IntrusionDetectionResult {
  timestamp: string;
  detectedThreats: ThreatDetection[];
  blockedIPs: string[];
  anomalies: AnomalyDetection[];
  status: 'SECURE' | 'THREATS_DETECTED' | 'UNDER_ATTACK';
  summary: string;
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'sql_injection_attempt' | 'xss_attempt' | 'ddos' | 'suspicious_pattern' | 'unauthorized_access';
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceIP: string;
  targetEndpoint: string;
  description: string;
  evidence: Record<string, any>;
  detectedAt: string;
  actionTaken: 'blocked' | 'throttled' | 'alerted' | 'monitored';
}

export interface AnomalyDetection {
  type: 'unusual_traffic_spike' | 'abnormal_access_pattern' | 'unexpected_api_usage' | 'geographic_anomaly';
  severity: 'high' | 'medium' | 'low';
  description: string;
  metrics: Record<string, number>;
  detectedAt: string;
}

export interface TrafficPattern {
  ip: string;
  requestCount: number;
  failedAuthCount: number;
  endpoints: string[];
  userAgents: string[];
  firstSeen: Date;
  lastSeen: Date;
}

export class RealtimeIntrusionDetectionService {
  private static instance: RealtimeIntrusionDetectionService;
  private trafficPatterns: Map<string, TrafficPattern> = new Map();
  private blockedIPs: Set<string> = new Set();
  private throttledIPs: Map<string, number> = new Map(); // IP -> unthrottle timestamp
  private alertsSent: Map<string, Date> = new Map(); // Alert type -> last sent time
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  static getInstance(): RealtimeIntrusionDetectionService {
    if (!RealtimeIntrusionDetectionService.instance) {
      RealtimeIntrusionDetectionService.instance = new RealtimeIntrusionDetectionService();
    }
    return RealtimeIntrusionDetectionService.instance;
  }

  /**
   * Monitor incoming request for threats
   */
  async monitorRequest(req: Request): Promise<ThreatDetection | null> {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const endpoint = req.path;
    const method = req.method;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Update traffic pattern
    this.updateTrafficPattern(ip, endpoint, userAgent);

    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      return {
        id: `threat-${Date.now()}`,
        type: 'unauthorized_access',
        severity: 'high',
        sourceIP: ip,
        targetEndpoint: endpoint,
        description: 'Request from blocked IP',
        evidence: { ip, endpoint, method },
        detectedAt: new Date().toISOString(),
        actionTaken: 'blocked'
      };
    }

    // Check for brute force attacks
    const bruteForceDetection = await this.detectBruteForce(ip);
    if (bruteForceDetection) {
      return bruteForceDetection;
    }

    // Check for SQL injection attempts
    const sqlInjectionDetection = this.detectSQLInjectionAttempt(req);
    if (sqlInjectionDetection) {
      return sqlInjectionDetection;
    }

    // Check for XSS attempts
    const xssDetection = this.detectXSSAttempt(req);
    if (xssDetection) {
      return xssDetection;
    }

    // Check for DDoS patterns
    const ddosDetection = this.detectDDoS(ip);
    if (ddosDetection) {
      return ddosDetection;
    }

    return null;
  }

  /**
   * Run comprehensive intrusion detection analysis
   */
  async runIntrusionDetection(): Promise<IntrusionDetectionResult> {
    const timestamp = new Date().toISOString();
    const detectedThreats: ThreatDetection[] = [];
    const anomalies: AnomalyDetection[] = [];

    try {
      logger.info('Running real-time intrusion detection analysis');

      // Analyze traffic patterns for anomalies
      const trafficAnomalies = this.analyzeTrafficPatterns();
      anomalies.push(...trafficAnomalies);

      // Check for unusual API usage
      const apiAnomalies = await this.detectUnusualAPIUsage();
      anomalies.push(...apiAnomalies);

      // Check for geographic anomalies
      const geoAnomalies = this.detectGeographicAnomalies();
      anomalies.push(...geoAnomalies);

      // Determine overall status
      const hasCriticalThreats = detectedThreats.some(t => t.severity === 'critical');
      const hasHighThreats = detectedThreats.some(t => t.severity === 'high');
      const status = hasCriticalThreats ? 'UNDER_ATTACK' : hasHighThreats ? 'THREATS_DETECTED' : 'SECURE';

      const summary = `Intrusion detection completed. Status: ${status}. Threats: ${detectedThreats.length}, Anomalies: ${anomalies.length}, Blocked IPs: ${this.blockedIPs.size}`;

      logger.info(summary, {
        status,
        threatsCount: detectedThreats.length,
        anomaliesCount: anomalies.length,
        blockedIPsCount: this.blockedIPs.size
      });

      metrics.incrementCounter('intrusion_detection_runs_total', 1, { status });

      // Send alerts if critical
      if (hasCriticalThreats) {
        await this.sendSecurityAlert('CRITICAL', detectedThreats);
      }

      return {
        timestamp,
        detectedThreats,
        blockedIPs: Array.from(this.blockedIPs),
        anomalies,
        status,
        summary
      };
    } catch (error) {
      logger.error('Intrusion detection failed', error as Error);
      throw error;
    }
  }

  /**
   * Update traffic pattern for IP
   */
  private updateTrafficPattern(ip: string, endpoint: string, userAgent: string): void {
    let pattern = this.trafficPatterns.get(ip);

    if (!pattern) {
      pattern = {
        ip,
        requestCount: 0,
        failedAuthCount: 0,
        endpoints: [],
        userAgents: [],
        firstSeen: new Date(),
        lastSeen: new Date()
      };
      this.trafficPatterns.set(ip, pattern);
    }

    pattern.requestCount++;
    pattern.lastSeen = new Date();

    if (!pattern.endpoints.includes(endpoint)) {
      pattern.endpoints.push(endpoint);
    }

    if (!pattern.userAgents.includes(userAgent)) {
      pattern.userAgents.push(userAgent);
    }
  }

  /**
   * Detect brute force attacks
   */
  private async detectBruteForce(ip: string): Promise<ThreatDetection | null> {
    try {
      // Check failed login attempts in last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const failedLogins = await db
        .select({ count: sql<number>`count(*)` })
        .from(s.auditLogs)
        .where(
          and(
            eq(s.auditLogs.action, 'auth.login.failed'),
            gte(s.auditLogs.createdAt, fifteenMinutesAgo)
          )
        );

      const failedCount = Number(failedLogins[0]?.count || 0);

      if (failedCount > 10) {
        // Block IP
        this.blockedIPs.add(ip);

        logger.warn('Brute force attack detected', {
          ip,
          failedAttempts: failedCount
        });

        metrics.incrementCounter('brute_force_attacks_detected', 1, { ip });

        return {
          id: `threat-brute-force-${Date.now()}`,
          type: 'brute_force',
          severity: 'critical',
          sourceIP: ip,
          targetEndpoint: '/api/auth/login',
          description: `Brute force attack detected: ${failedCount} failed login attempts`,
          evidence: { failedAttempts: failedCount, timeWindow: '15 minutes' },
          detectedAt: new Date().toISOString(),
          actionTaken: 'blocked'
        };
      }

      return null;
    } catch (error) {
      logger.error('Brute force detection failed', error as Error);
      return null;
    }
  }

  /**
   * Detect SQL injection attempts
   */
  private detectSQLInjectionAttempt(req: Request): ThreatDetection | null {
    const sqlPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /exec(\s|\+)+(s|x)p\w+/i
    ];

    const ip = req.ip || 'unknown';
    const endpoint = req.path;

    // Check query parameters
    const queryString = JSON.stringify(req.query);
    for (const pattern of sqlPatterns) {
      if (pattern.test(queryString)) {
        this.blockedIPs.add(ip);

        logger.warn('SQL injection attempt detected', {
          ip,
          endpoint,
          query: queryString
        });

        metrics.incrementCounter('sql_injection_attempts_detected', 1, { ip });

        return {
          id: `threat-sqli-${Date.now()}`,
          type: 'sql_injection_attempt',
          severity: 'critical',
          sourceIP: ip,
          targetEndpoint: endpoint,
          description: 'SQL injection pattern detected in request',
          evidence: { query: queryString },
          detectedAt: new Date().toISOString(),
          actionTaken: 'blocked'
        };
      }
    }

    // Check request body
    if (req.body) {
      const bodyString = JSON.stringify(req.body);
      for (const pattern of sqlPatterns) {
        if (pattern.test(bodyString)) {
          this.blockedIPs.add(ip);

          logger.warn('SQL injection attempt detected in body', {
            ip,
            endpoint
          });

          return {
            id: `threat-sqli-${Date.now()}`,
            type: 'sql_injection_attempt',
            severity: 'critical',
            sourceIP: ip,
            targetEndpoint: endpoint,
            description: 'SQL injection pattern detected in request body',
            evidence: { bodyLength: bodyString.length },
            detectedAt: new Date().toISOString(),
            actionTaken: 'blocked'
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect XSS attempts
   */
  private detectXSSAttempt(req: Request): ThreatDetection | null {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*onerror/gi
    ];

    const ip = req.ip || 'unknown';
    const endpoint = req.path;

    // Check query parameters
    const queryString = JSON.stringify(req.query);
    for (const pattern of xssPatterns) {
      if (pattern.test(queryString)) {
        this.throttledIPs.set(ip, Date.now() + 60 * 60 * 1000); // Throttle for 1 hour

        logger.warn('XSS attempt detected', {
          ip,
          endpoint,
          query: queryString
        });

        metrics.incrementCounter('xss_attempts_detected', 1, { ip });

        return {
          id: `threat-xss-${Date.now()}`,
          type: 'xss_attempt',
          severity: 'high',
          sourceIP: ip,
          targetEndpoint: endpoint,
          description: 'XSS pattern detected in request',
          evidence: { query: queryString },
          detectedAt: new Date().toISOString(),
          actionTaken: 'throttled'
        };
      }
    }

    return null;
  }

  /**
   * Detect DDoS patterns
   */
  private detectDDoS(ip: string): ThreatDetection | null {
    const pattern = this.trafficPatterns.get(ip);

    if (pattern) {
      const timeSinceFirstSeen = Date.now() - pattern.firstSeen.getTime();
      const requestsPerSecond = pattern.requestCount / (timeSinceFirstSeen / 1000);

      // If more than 50 requests per second, likely DDoS
      if (requestsPerSecond > 50) {
        this.blockedIPs.add(ip);

        logger.warn('DDoS attack detected', {
          ip,
          requestsPerSecond,
          totalRequests: pattern.requestCount
        });

        metrics.incrementCounter('ddos_attacks_detected', 1, { ip });

        return {
          id: `threat-ddos-${Date.now()}`,
          type: 'ddos',
          severity: 'critical',
          sourceIP: ip,
          targetEndpoint: 'multiple',
          description: `DDoS attack detected: ${requestsPerSecond.toFixed(2)} requests/second`,
          evidence: {
            requestsPerSecond,
            totalRequests: pattern.requestCount,
            duration: timeSinceFirstSeen
          },
          detectedAt: new Date().toISOString(),
          actionTaken: 'blocked'
        };
      }
    }

    return null;
  }

  /**
   * Analyze traffic patterns for anomalies
   */
  private analyzeTrafficPatterns(): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    // Check for unusual traffic spikes
    const totalRequests = Array.from(this.trafficPatterns.values()).reduce(
      (sum, pattern) => sum + pattern.requestCount,
      0
    );

    if (totalRequests > 10000) {
      anomalies.push({
        type: 'unusual_traffic_spike',
        severity: 'high',
        description: `Unusual traffic spike detected: ${totalRequests} requests`,
        metrics: { totalRequests },
        detectedAt: new Date().toISOString()
      });
    }

    return anomalies;
  }

  /**
   * Detect unusual API usage
   */
  private async detectUnusualAPIUsage(): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    try {
      // Check for unusual endpoint access patterns
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const apiCalls = await db
        .select({ count: sql<number>`count(*)` })
        .from(s.auditLogs)
        .where(gte(s.auditLogs.createdAt, oneHourAgo));

      const callCount = Number(apiCalls[0]?.count || 0);

      if (callCount > 5000) {
        anomalies.push({
          type: 'unexpected_api_usage',
          severity: 'medium',
          description: `Unexpected API usage spike: ${callCount} calls in last hour`,
          metrics: { apiCalls: callCount },
          detectedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to detect unusual API usage', error as Error);
    }

    return anomalies;
  }

  /**
   * Detect geographic anomalies
   */
  private detectGeographicAnomalies(): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    // In production, this would use GeoIP to detect unusual access patterns
    // For now, we return empty array

    return anomalies;
  }

  /**
   * Send security alert to admins
   */
  private async sendSecurityAlert(severity: string, threats: ThreatDetection[]): Promise<void> {
    try {
      // Check if we've sent an alert recently (avoid spam)
      const lastAlert = this.alertsSent.get(severity);
      if (lastAlert && Date.now() - lastAlert.getTime() < 5 * 60 * 1000) {
        return; // Don't send if we sent one in last 5 minutes
      }

      logger.warn('Sending security alert to admins', {
        severity,
        threatsCount: threats.length
      });

      // In production, this would send email/SMS/Slack notifications
      // For now, we just log

      this.alertsSent.set(severity, new Date());

      // Log to audit table
      await db.insert(s.auditLogs).values({
        companyId: null,
        userId: null,
        action: 'security.alert.sent',
        entityType: 'system',
        entityId: severity,
        changes: JSON.stringify({
          severity,
          threatsCount: threats.length,
          threats: threats.map(t => ({ type: t.type, sourceIP: t.sourceIP }))
        })
      });
    } catch (error) {
      logger.error('Failed to send security alert', error as Error);
    }
  }

  /**
   * Cleanup old traffic patterns
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [ip, pattern] of this.trafficPatterns.entries()) {
      if (pattern.lastSeen.getTime() < oneHourAgo) {
        this.trafficPatterns.delete(ip);
      }
    }

    // Cleanup throttled IPs
    for (const [ip, unthrottleTime] of this.throttledIPs.entries()) {
      if (Date.now() > unthrottleTime) {
        this.throttledIPs.delete(ip);
      }
    }

    logger.info('Intrusion detection cleanup completed', {
      activePatterns: this.trafficPatterns.size,
      blockedIPs: this.blockedIPs.size,
      throttledIPs: this.throttledIPs.size
    });
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    logger.warn(`IP blocked: ${ip}`, { reason });
    metrics.incrementCounter('ips_blocked_total', 1, { reason });
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    logger.info(`IP unblocked: ${ip}`);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  /**
   * Get traffic patterns
   */
  getTrafficPatterns(): TrafficPattern[] {
    return Array.from(this.trafficPatterns.values());
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.trafficPatterns.clear();
    this.blockedIPs.clear();
    this.throttledIPs.clear();
  }
}

export const realtimeIntrusionDetection = RealtimeIntrusionDetectionService.getInstance();
