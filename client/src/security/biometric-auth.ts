declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from "react";
/**
 * Enterprise Biometric UX Authentication
 * Fingerprint, facial recognition, voice authentication, behavioral biometrics
 */

export interface BiometricAuthConfig {
  // Fingerprint authentication
  fingerprint: {
    enabled: boolean;
    requiredSamples: number;
    qualityThreshold: number;
    fallbackToPin: boolean;
    encryptionEnabled: boolean;
    storageMethod: "local" | "secure" | "cloud";
  };

  // Facial recognition
  facialRecognition: {
    enabled: boolean;
    livenessDetection: boolean;
    antiSpoofing: boolean;
    requiredLandmarks: number;
    confidenceThreshold: number;
    timeoutMs: number;
    privacyMode: boolean;
  };

  // Voice authentication
  voiceAuthentication: {
    enabled: boolean;
    requiredPhrases: string[];
    voiceprintDuration: number;
    backgroundNoiseFilter: boolean;
    antiReplayAttack: boolean;
    pitchAnalysis: boolean;
    speedAnalysis: boolean;
  };

  // Behavioral biometrics
  behavioralBiometrics: {
    enabled: boolean;
    keystrokeDynamics: boolean;
    mouseDynamics: boolean;
    touchDynamics: boolean;
    gesturePatterns: boolean;
    learningPeriod: number;
    confidenceThreshold: number;
    continuousVerification: boolean;
  };

  // Multi-factor authentication
  multiFactor: {
    enabled: boolean;
    requiredFactors: number;
    adaptiveAuthentication: boolean;
    riskBasedAuthentication: boolean;
    stepUpAuthentication: boolean;
    biometricOnlyMode: boolean;
  };

  // Security settings
  security: {
    maxAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    reauthInterval: number;
    encryptionAlgorithm: "AES-256" | "RSA-4096" | "ECC";
    keyRotationInterval: number;
  };
}

export interface BiometricTemplate {
  id: string;
  userId: string;
  type: "fingerprint" | "facial" | "voice" | "behavioral";
  template: any;
  quality: number;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
  confidence: number;
  encrypted: boolean;
  version: number;
}

export interface BiometricAttempt {
  id: string;
  userId: string;
  type: "fingerprint" | "facial" | "voice" | "behavioral";
  timestamp: Date;
  success: boolean;
  confidence: number;
  duration: number;
  errorCode?: string;
  errorMessage?: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    deviceId: string;
    biometricCapabilities: string[];
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  ipAddress: string;
}

export interface AuthenticationSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  method: "biometric" | "multi_factor" | "password" | "pin";
  biometricTypes: string[];
  factors: Array<{
    type: string;
    verified: boolean;
    timestamp: Date;
    confidence: number;
  }>;
  riskScore: number;
  adaptiveLevel: "low" | "medium" | "high" | "critical";
  status: "active" | "expired" | "terminated";
  ipAddress: string;
  userAgent: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type:
    | "authentication_success"
    | "authentication_failure"
    | "suspicious_activity"
    | "lockout"
    | "breach_attempt";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface RiskAssessment {
  userId: string;
  timestamp: Date;
  riskScore: number; // 0-100
  factors: Array<{
    type: "location" | "device" | "behavior" | "time" | "network";
    weight: number;
    score: number;
    description: string;
  }>;
  adaptiveLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  requiresStepUp: boolean;
}

export class BiometricAuthenticationEngine {
  private static instance: BiometricAuthenticationEngine;
  private config: BiometricAuthConfig;
  private fingerprintAuth: FingerprintAuthenticator;
  private facialAuth: FacialAuthenticator;
  private voiceAuth: VoiceAuthenticator;
  private behavioralAuth: BehavioralAuthenticator;
  private multiFactorAuth: MultiFactorAuthenticator;
  private riskAssessor: RiskAssessmentEngine;
  private securityMonitor: SecurityMonitor;
  private activeSessions: Map<string, AuthenticationSession> = new Map();
  private biometricTemplates: Map<string, BiometricTemplate[]> = new Map();
  private authenticationHistory: BiometricAttempt[] = [];
  private securityEvents: SecurityEvent[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.fingerprintAuth = new FingerprintAuthenticator(
      this.config.fingerprint,
    );
    this.facialAuth = new FacialAuthenticator(this.config.facialRecognition);
    this.voiceAuth = new VoiceAuthenticator(this.config.voiceAuthentication);
    this.behavioralAuth = new BehavioralAuthenticator(
      this.config.behavioralBiometrics,
    );
    this.multiFactorAuth = new MultiFactorAuthenticator(
      this.config.multiFactor,
    );
    this.riskAssessor = new RiskAssessmentEngine();
    this.securityMonitor = new SecurityMonitor();
    this.initializeBiometricAuth();
  }

  static getInstance(): BiometricAuthenticationEngine {
    if (!BiometricAuthenticationEngine.instance) {
      BiometricAuthenticationEngine.instance =
        new BiometricAuthenticationEngine();
    }
    return BiometricAuthenticationEngine.instance;
  }

  private getDefaultConfig(): BiometricAuthConfig {
    return {
      fingerprint: {
        enabled: true,
        requiredSamples: 3,
        qualityThreshold: 0.7,
        fallbackToPin: true,
        encryptionEnabled: true,
        storageMethod: "secure",
      },
      facialRecognition: {
        enabled: true,
        livenessDetection: true,
        antiSpoofing: true,
        requiredLandmarks: 68,
        confidenceThreshold: 0.85,
        timeoutMs: 10000,
        privacyMode: true,
      },
      voiceAuthentication: {
        enabled: true,
        requiredPhrases: ["Hello AccuBooks", "Verify my identity"],
        voiceprintDuration: 3000,
        backgroundNoiseFilter: true,
        antiReplayAttack: true,
        pitchAnalysis: true,
        speedAnalysis: true,
      },
      behavioralBiometrics: {
        enabled: true,
        keystrokeDynamics: true,
        mouseDynamics: true,
        touchDynamics: true,
        gesturePatterns: true,
        learningPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
        confidenceThreshold: 0.8,
        continuousVerification: true,
      },
      multiFactor: {
        enabled: true,
        requiredFactors: 2,
        adaptiveAuthentication: true,
        riskBasedAuthentication: true,
        stepUpAuthentication: true,
        biometricOnlyMode: false,
      },
      security: {
        maxAttempts: 3,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        reauthInterval: 60 * 60 * 1000, // 1 hour
        encryptionAlgorithm: "AES-256",
        keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    };
  }

  private async initializeBiometricAuth(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // Check biometric capabilities
      await this.checkBiometricCapabilities();

      // Load existing templates
      await this.loadBiometricTemplates();

      // Initialize security monitoring
      this.securityMonitor.startMonitoring();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize biometric authentication:", error);
      this.createSecurityEvent(
        "system_error",
        "high",
        "Biometric authentication initialization failed",
        { error },
      );
    }
  }

  private async checkBiometricCapabilities(): Promise<void> {
    const capabilities: string[] = [];

    // Check WebAuthn support
    if ("credentials" in navigator && "PublicKeyCredential" in window) {
      capabilities.push("webauthn");
    }

    // Check fingerprint API
    if ("authenticate" in navigator && "FingerprintReader" in window) {
      capabilities.push("fingerprint");
    }

    // Check camera access for facial recognition
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      capabilities.push("camera");
    } catch (error) {
      console.log("Camera not available");
    }

    // Check microphone access for voice authentication
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      capabilities.push("microphone");
    } catch (error) {
      console.log("Microphone not available");
    }

    // Store capabilities
    localStorage.setItem(
      "biometric-capabilities",
      JSON.stringify(capabilities),
    );
  }

  private async loadBiometricTemplates(): Promise<void> {
    try {
      const stored = localStorage.getItem("biometric-templates");
      if (stored) {
        const templates = JSON.parse(stored);
        templates.forEach((template: BiometricTemplate) => {
          if (!this.biometricTemplates.has(template.userId)) {
            this.biometricTemplates.set(template.userId, []);
          }
          this.biometricTemplates.get(template.userId)!.push(template);
        });
      }
    } catch (error) {
      console.warn("Failed to load biometric templates:", error);
    }
  }

  private setupEventListeners(): void {
    // Monitor for suspicious activities
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.checkForSuspiciousActivity();
      }
    });

    // Monitor for authentication attempts
    window.addEventListener("beforeunload", () => {
      this.terminateAllSessions();
    });
  }

  // Public API: Authentication methods
  public async authenticateWithFingerprint(
    userId: string,
  ): Promise<AuthenticationResult> {
    if (!this.isInitialized || !this.config.fingerprint.enabled) {
      throw new Error("Fingerprint authentication not available");
    }

    const startTime = Date.now();
    const attemptId = this.generateAttemptId();

    try {
      // Check risk assessment
      const riskAssessment = await this.riskAssessor.assessRisk(userId);

      // Perform fingerprint authentication
      const result = await this.fingerprintAuth.authenticate(userId);

      const duration = Date.now() - startTime;

      // Record attempt
      this.recordAttempt({
        id: attemptId,
        userId,
        type: "fingerprint",
        timestamp: new Date(),
        success: result.success,
        confidence: result.confidence,
        duration,
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getIPAddress(),
      });

      if (result.success) {
        // Create authentication session
        const session = await this.createSession(
          userId,
          "biometric",
          ["fingerprint"],
          riskAssessment.riskScore,
        );

        // Update template usage
        this.updateTemplateUsage(userId, "fingerprint");

        // Create security event
        this.createSecurityEvent(
          "authentication_success",
          "low",
          "Fingerprint authentication successful",
          {
            userId,
            confidence: result.confidence,
            sessionId: session.id,
          },
        );

        return {
          success: true,
          sessionId: session.id,
          confidence: result.confidence,
          adaptiveLevel: riskAssessment.adaptiveLevel,
          requiresStepUp: riskAssessment.requiresStepUp,
        };
      } else {
        // Handle failure
        await this.handleAuthenticationFailure(
          userId,
          "fingerprint",
          attemptId,
        );

        return {
          success: false,
          error: result.error,
          remainingAttempts: this.getRemainingAttempts(userId),
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordAttempt({
        id: attemptId,
        userId,
        type: "fingerprint",
        timestamp: new Date(),
        success: false,
        confidence: 0,
        duration,
        errorCode: "system_error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getIPAddress(),
      });

      throw error;
    }
  }

  public async authenticateWithFacialRecognition(
    userId: string,
  ): Promise<AuthenticationResult> {
    if (!this.isInitialized || !this.config.facialRecognition.enabled) {
      throw new Error("Facial recognition not available");
    }

    const startTime = Date.now();
    const attemptId = this.generateAttemptId();

    try {
      // Check risk assessment
      const riskAssessment = await this.riskAssessor.assessRisk(userId);

      // Perform facial recognition
      const result = await this.facialAuth.authenticate(userId);

      const duration = Date.now() - startTime;

      // Record attempt
      this.recordAttempt({
        id: attemptId,
        userId,
        type: "facial",
        timestamp: new Date(),
        success: result.success,
        confidence: result.confidence,
        duration,
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getIPAddress(),
      });

      if (result.success) {
        // Create authentication session
        const session = await this.createSession(
          userId,
          "biometric",
          ["facial"],
          riskAssessment.riskScore,
        );

        // Update template usage
        this.updateTemplateUsage(userId, "facial");

        // Create security event
        this.createSecurityEvent(
          "authentication_success",
          "low",
          "Facial recognition successful",
          {
            userId,
            confidence: result.confidence,
            sessionId: session.id,
          },
        );

        return {
          success: true,
          sessionId: session.id,
          confidence: result.confidence,
          adaptiveLevel: riskAssessment.adaptiveLevel,
          requiresStepUp: riskAssessment.requiresStepUp,
        };
      } else {
        // Handle failure
        await this.handleAuthenticationFailure(userId, "facial", attemptId);

        return {
          success: false,
          error: result.error,
          remainingAttempts: this.getRemainingAttempts(userId),
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordAttempt({
        id: attemptId,
        userId,
        type: "facial",
        timestamp: new Date(),
        success: false,
        confidence: 0,
        duration,
        errorCode: "system_error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getIPAddress(),
      });

      throw error;
    }
  }

  public async authenticateWithVoice(
    userId: string,
  ): Promise<AuthenticationResult> {
    if (!this.isInitialized || !this.config.voiceAuthentication.enabled) {
      throw new Error("Voice authentication not available");
    }

    const startTime = Date.now();
    const attemptId = this.generateAttemptId();

    try {
      // Check risk assessment
      const riskAssessment = await this.riskAssessor.assessRisk(userId);

      // Perform voice authentication
      const result = await this.voiceAuth.authenticate(userId);

      const duration = Date.now() - startTime;

      // Record attempt
      this.recordAttempt({
        id: attemptId,
        userId,
        type: "voice",
        timestamp: new Date(),
        success: result.success,
        confidence: result.confidence,
        duration,
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getIPAddress(),
      });

      if (result.success) {
        // Create authentication session
        const session = await this.createSession(
          userId,
          "biometric",
          ["voice"],
          riskAssessment.riskScore,
        );

        // Update template usage
        this.updateTemplateUsage(userId, "voice");

        // Create security event
        this.createSecurityEvent(
          "authentication_success",
          "low",
          "Voice authentication successful",
          {
            userId,
            confidence: result.confidence,
            sessionId: session.id,
          },
        );

        return {
          success: true,
          sessionId: session.id,
          confidence: result.confidence,
          adaptiveLevel: riskAssessment.adaptiveLevel,
          requiresStepUp: riskAssessment.requiresStepUp,
        };
      } else {
        // Handle failure
        await this.handleAuthenticationFailure(userId, "voice", attemptId);

        return {
          success: false,
          error: result.error,
          remainingAttempts: this.getRemainingAttempts(userId),
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordAttempt({
        id: attemptId,
        userId,
        type: "voice",
        timestamp: new Date(),
        success: false,
        confidence: 0,
        duration,
        errorCode: "system_error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getIPAddress(),
      });

      throw error;
    }
  }

  public async authenticateWithMultiFactor(
    userId: string,
  ): Promise<AuthenticationResult> {
    if (!this.isInitialized || !this.config.multiFactor.enabled) {
      throw new Error("Multi-factor authentication not available");
    }

    try {
      // Check risk assessment
      const riskAssessment = await this.riskAssessor.assessRisk(userId);

      // Determine required factors based on risk
      const requiredFactors = this.determineRequiredFactors(riskAssessment);

      // Perform multi-factor authentication
      const result = await this.multiFactorAuth.authenticate(
        userId,
        requiredFactors,
      );

      if (result.success) {
        // Create authentication session
        const session = await this.createSession(
          userId,
          "multi_factor",
          result.verifiedFactors,
          riskAssessment.riskScore,
        );

        // Create security event
        this.createSecurityEvent(
          "authentication_success",
          "low",
          "Multi-factor authentication successful",
          {
            userId,
            factors: result.verifiedFactors,
            sessionId: session.id,
          },
        );

        return {
          success: true,
          sessionId: session.id,
          confidence: result.confidence,
          adaptiveLevel: riskAssessment.adaptiveLevel,
          requiresStepUp: riskAssessment.requiresStepUp,
        };
      } else {
        // Handle failure
        await this.handleAuthenticationFailure(
          userId,
          "multi_factor",
          result.attemptId,
        );

        return {
          success: false,
          error: result.error,
          remainingAttempts: this.getRemainingAttempts(userId),
        };
      }
    } catch (error) {
      console.error("Multi-factor authentication failed:", error);
      throw error;
    }
  }

  // Template management
  public async enrollFingerprint(userId: string): Promise<EnrollmentResult> {
    if (!this.config.fingerprint.enabled) {
      throw new Error("Fingerprint enrollment not available");
    }

    try {
      const result = await this.fingerprintAuth.enroll(userId);

      if (result.success) {
        const template: BiometricTemplate = {
          id: this.generateTemplateId(),
          userId,
          type: "fingerprint",
          template: result.template,
          quality: result.quality,
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: 0,
          confidence: 0,
          encrypted: this.config.fingerprint.encryptionEnabled,
          version: 1,
        };

        this.saveTemplate(template);

        // Create security event
        this.createSecurityEvent(
          "template_enrolled",
          "low",
          "Fingerprint template enrolled",
          {
            userId,
            templateId: template.id,
            quality: result.quality,
          },
        );

        return {
          success: true,
          templateId: template.id,
          quality: result.quality,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("Fingerprint enrollment failed:", error);
      throw error;
    }
  }

  public async enrollFacialRecognition(
    userId: string,
  ): Promise<EnrollmentResult> {
    if (!this.config.facialRecognition.enabled) {
      throw new Error("Facial recognition enrollment not available");
    }

    try {
      const result = await this.facialAuth.enroll(userId);

      if (result.success) {
        const template: BiometricTemplate = {
          id: this.generateTemplateId(),
          userId,
          type: "facial",
          template: result.template,
          quality: result.quality,
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: 0,
          confidence: 0,
          encrypted: true,
          version: 1,
        };

        this.saveTemplate(template);

        // Create security event
        this.createSecurityEvent(
          "template_enrolled",
          "low",
          "Facial recognition template enrolled",
          {
            userId,
            templateId: template.id,
            quality: result.quality,
          },
        );

        return {
          success: true,
          templateId: template.id,
          quality: result.quality,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("Facial recognition enrollment failed:", error);
      throw error;
    }
  }

  public async enrollVoice(userId: string): Promise<EnrollmentResult> {
    if (!this.config.voiceAuthentication.enabled) {
      throw new Error("Voice authentication enrollment not available");
    }

    try {
      const result = await this.voiceAuth.enroll(userId);

      if (result.success) {
        const template: BiometricTemplate = {
          id: this.generateTemplateId(),
          userId,
          type: "voice",
          template: result.template,
          quality: result.quality,
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: 0,
          confidence: 0,
          encrypted: true,
          version: 1,
        };

        this.saveTemplate(template);

        // Create security event
        this.createSecurityEvent(
          "template_enrolled",
          "low",
          "Voice authentication template enrolled",
          {
            userId,
            templateId: template.id,
            quality: result.quality,
          },
        );

        return {
          success: true,
          templateId: template.id,
          quality: result.quality,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("Voice authentication enrollment failed:", error);
      throw error;
    }
  }

  // Session management
  public async createSession(
    userId: string,
    method: string,
    biometricTypes: string[],
    riskScore: number,
  ): Promise<AuthenticationSession> {
    const session: AuthenticationSession = {
      id: this.generateSessionId(),
      userId,
      startTime: new Date(),
      method,
      biometricTypes,
      factors: [],
      riskScore,
      adaptiveLevel: this.mapRiskToAdaptiveLevel(riskScore),
      status: "active",
      ipAddress: await this.getIPAddress(),
      userAgent: navigator.userAgent,
    };

    this.activeSessions.set(session.id, session);

    // Set session timeout
    setTimeout(() => {
      this.terminateSession(session.id);
    }, this.config.security.sessionTimeout);

    return session;
  }

  public terminateSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.status = "expired";
      this.activeSessions.delete(sessionId);

      // Create security event
      this.createSecurityEvent(
        "session_terminated",
        "low",
        "Authentication session terminated",
        {
          sessionId,
          userId: session.userId,
          duration: session.endTime.getTime() - session.startTime.getTime(),
        },
      );
    }
  }

  public terminateAllSessions(): void {
    this.activeSessions.forEach((session, sessionId) => {
      this.terminateSession(sessionId);
    });
  }

  public getSession(sessionId: string): AuthenticationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getActiveSessions(userId?: string): AuthenticationSession[] {
    const sessions = Array.from(this.activeSessions.values());
    return userId ? sessions.filter((s) => s.userId === userId) : sessions;
  }

  // Security monitoring
  private async handleAuthenticationFailure(
    userId: string,
    type: string,
    attemptId: string,
  ): Promise<void> {
    const recentFailures = this.getRecentFailures(userId);

    if (recentFailures.length >= this.config.security.maxAttempts) {
      // Lock account
      await this.lockAccount(userId);

      // Create security event
      this.createSecurityEvent(
        "lockout",
        "high",
        "Account locked due to multiple authentication failures",
        {
          userId,
          failureCount: recentFailures.length,
          type,
        },
      );
    } else {
      // Create security event
      this.createSecurityEvent(
        "authentication_failure",
        "medium",
        "Authentication failure",
        {
          userId,
          type,
          attemptId,
          remainingAttempts:
            this.config.security.maxAttempts - recentFailures.length,
        },
      );
    }
  }

  private getRecentFailures(userId: string): BiometricAttempt[] {
    const cutoff = Date.now() - this.config.security.lockoutDuration;
    return this.authenticationHistory.filter(
      (attempt) =>
        attempt.userId === userId &&
        !attempt.success &&
        attempt.timestamp.getTime() > cutoff,
    );
  }

  private async lockAccount(userId: string): Promise<void> {
    // Implement account lockout logic
    const lockoutUntil = new Date(
      Date.now() + this.config.security.lockoutDuration,
    );
    localStorage.setItem(`lockout-${userId}`, lockoutUntil.toISOString());
  }

  private isAccountLocked(userId: string): boolean {
    const lockoutUntil = localStorage.getItem(`lockout-${userId}`);
    if (lockoutUntil) {
      return new Date() < new Date(lockoutUntil);
    }
    return false;
  }

  private getRemainingAttempts(userId: string): number {
    const recentFailures = this.getRecentFailures(userId);
    return Math.max(
      0,
      this.config.security.maxAttempts - recentFailures.length,
    );
  }

  private checkForSuspiciousActivity(): void {
    // Check for suspicious activities
    const activeSessions = Array.from(this.activeSessions.values());

    // Multiple sessions from same user
    const userSessions = activeSessions.reduce(
      (acc, session) => {
        acc[session.userId] = (acc[session.userId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(userSessions).forEach(([userId, count]) => {
      if (count > 3) {
        this.createSecurityEvent(
          "suspicious_activity",
          "medium",
          "Multiple active sessions detected",
          {
            userId,
            sessionCount: count,
          },
        );
      }
    });
  }

  // Utility methods
  private generateAttemptId(): string {
    return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceId: this.getDeviceId(),
      biometricCapabilities: JSON.parse(
        localStorage.getItem("biometric-capabilities") || "[]",
      ),
    };
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem("device-id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("device-id", deviceId);
    }
    return deviceId;
  }

  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "unknown";
    }
  }

  private recordAttempt(attempt: BiometricAttempt): void {
    this.authenticationHistory.push(attempt);

    // Keep only recent attempts
    if (this.authenticationHistory.length > 1000) {
      this.authenticationHistory = this.authenticationHistory.slice(-1000);
    }
  }

  private saveTemplate(template: BiometricTemplate): void {
    if (!this.biometricTemplates.has(template.userId)) {
      this.biometricTemplates.set(template.userId, []);
    }
    this.biometricTemplates.get(template.userId)!.push(template);

    // Save to storage
    try {
      const templates = Array.from(this.biometricTemplates.values()).flat();
      localStorage.setItem("biometric-templates", JSON.stringify(templates));
    } catch (error) {
      console.warn("Failed to save biometric templates:", error);
    }
  }

  private updateTemplateUsage(userId: string, type: string): void {
    const templates = this.biometricTemplates.get(userId);
    if (templates) {
      const template = templates.find((t) => t.type === type);
      if (template) {
        template.lastUsed = new Date();
        template.usageCount++;
      }
    }
  }

  private createSecurityEvent(
    type: string,
    severity: string,
    description: string,
    details: Record<string, any>,
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: type as any,
      severity: severity as any,
      description,
      details,
      ipAddress: "unknown", // Would get from request
      userAgent: navigator.userAgent,
      resolved: false,
    };

    this.securityEvents.push(event);

    // Keep only recent events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineRequiredFactors(riskAssessment: RiskAssessment): string[] {
    const factors = ["fingerprint"]; // Always require fingerprint as base

    if (riskAssessment.riskScore > 50) {
      factors.push("facial");
    }

    if (riskAssessment.riskScore > 75) {
      factors.push("voice");
    }

    return factors;
  }

  private mapRiskToAdaptiveLevel(
    riskScore: number,
  ): "low" | "medium" | "high" | "critical" {
    if (riskScore < 25) return "low";
    if (riskScore < 50) return "medium";
    if (riskScore < 75) return "high";
    return "critical";
  }

  // Public API methods
  public getAuthenticationHistory(userId?: string): BiometricAttempt[] {
    return userId
      ? this.authenticationHistory.filter((a) => a.userId === userId)
      : [...this.authenticationHistory];
  }

  public getSecurityEvents(severity?: string): SecurityEvent[] {
    return severity
      ? this.securityEvents.filter((e) => e.severity === severity)
      : [...this.securityEvents];
  }

  public getBiometricTemplates(userId: string): BiometricTemplate[] {
    return this.biometricTemplates.get(userId) || [];
  }

  public async assessRisk(userId: string): Promise<RiskAssessment> {
    return this.riskAssessor.assessRisk(userId);
  }

  public updateConfig(newConfig: Partial<BiometricAuthConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update sub-systems
    this.fingerprintAuth.updateConfig(this.config.fingerprint);
    this.facialAuth.updateConfig(this.config.facialRecognition);
    this.voiceAuth.updateConfig(this.config.voiceAuthentication);
    this.behavioralAuth.updateConfig(this.config.behavioralBiometrics);
    this.multiFactorAuth.updateConfig(this.config.multiFactor);
  }

  public isBiometricAvailable(type: string): boolean {
    const capabilities = JSON.parse(
      localStorage.getItem("biometric-capabilities") || "[]",
    );

    switch (type) {
      case "fingerprint":
        return (
          capabilities.includes("webauthn") ||
          capabilities.includes("fingerprint")
        );
      case "facial":
        return capabilities.includes("camera");
      case "voice":
        return capabilities.includes("microphone");
      default:
        return false;
    }
  }

  public getSecurityMetrics(): SecurityMetrics {
    return {
      totalAuthentications: this.authenticationHistory.length,
      successRate: this.calculateSuccessRate(),
      averageConfidence: this.calculateAverageConfidence(),
      averageDuration: this.calculateAverageDuration(),
      lockoutCount: this.getLockoutCount(),
      securityEventCount: this.securityEvents.length,
      activeSessionsCount: this.activeSessions.size,
      enrolledTemplatesCount: Array.from(
        this.biometricTemplates.values(),
      ).flat().length,
    };
  }

  private calculateSuccessRate(): number {
    const total = this.authenticationHistory.length;
    const successful = this.authenticationHistory.filter(
      (a) => a.success,
    ).length;
    return total > 0 ? successful / total : 0;
  }

  private calculateAverageConfidence(): number {
    const successful = this.authenticationHistory.filter((a) => a.success);
    if (successful.length === 0) return 0;

    const totalConfidence = successful.reduce(
      (sum, a) => sum + a.confidence,
      0,
    );
    return totalConfidence / successful.length;
  }

  private calculateAverageDuration(): number {
    if (this.authenticationHistory.length === 0) return 0;

    const totalDuration = this.authenticationHistory.reduce(
      (sum, a) => sum + a.duration,
      0,
    );
    return totalDuration / this.authenticationHistory.length;
  }

  private getLockoutCount(): number {
    return this.securityEvents.filter((e) => e.type === "lockout").length;
  }
}

// Supporting interfaces
export interface AuthenticationResult {
  success: boolean;
  sessionId?: string;
  confidence?: number;
  adaptiveLevel?: string;
  requiresStepUp?: boolean;
  error?: string;
  remainingAttempts?: number;
}

export interface EnrollmentResult {
  success: boolean;
  templateId?: string;
  quality?: number;
  error?: string;
}

export interface SecurityMetrics {
  totalAuthentications: number;
  successRate: number;
  averageConfidence: number;
  averageDuration: number;
  lockoutCount: number;
  securityEventCount: number;
  activeSessionsCount: number;
  enrolledTemplatesCount: number;
}

// Supporting classes (simplified implementations)
class FingerprintAuthenticator {
  constructor(private config: BiometricAuthConfig["fingerprint"]) {}

  async authenticate(userId: string): Promise<any> {
    // Simulate fingerprint authentication
    return {
      success: Math.random() > 0.1,
      confidence: 0.8 + Math.random() * 0.2,
      error: Math.random() > 0.9 ? "Authentication failed" : undefined,
    };
  }

  async enroll(userId: string): Promise<any> {
    // Simulate fingerprint enrollment
    return {
      success: Math.random() > 0.1,
      template: "fingerprint-template-data",
      quality: 0.7 + Math.random() * 0.3,
      error: Math.random() > 0.9 ? "Enrollment failed" : undefined,
    };
  }

  updateConfig(config: BiometricAuthConfig["fingerprint"]): void {
    this.config = config;
  }
}

class FacialAuthenticator {
  constructor(private config: BiometricAuthConfig["facialRecognition"]) {}

  async authenticate(userId: string): Promise<any> {
    // Simulate facial recognition
    return {
      success: Math.random() > 0.15,
      confidence: 0.85 + Math.random() * 0.15,
      error: Math.random() > 0.85 ? "Face not recognized" : undefined,
    };
  }

  async enroll(userId: string): Promise<any> {
    // Simulate facial enrollment
    return {
      success: Math.random() > 0.1,
      template: "facial-recognition-template-data",
      quality: 0.8 + Math.random() * 0.2,
      error: Math.random() > 0.9 ? "Enrollment failed" : undefined,
    };
  }

  updateConfig(config: BiometricAuthConfig["facialRecognition"]): void {
    this.config = config;
  }
}

class VoiceAuthenticator {
  constructor(private config: BiometricAuthConfig["voiceAuthentication"]) {}

  async authenticate(userId: string): Promise<any> {
    // Simulate voice authentication
    return {
      success: Math.random() > 0.2,
      confidence: 0.75 + Math.random() * 0.25,
      error: Math.random() > 0.8 ? "Voice not recognized" : undefined,
    };
  }

  async enroll(userId: string): Promise<any> {
    // Simulate voice enrollment
    return {
      success: Math.random() > 0.15,
      template: "voice-authentication-template-data",
      quality: 0.7 + Math.random() * 0.3,
      error: Math.random() > 0.85 ? "Enrollment failed" : undefined,
    };
  }

  updateConfig(config: BiometricAuthConfig["voiceAuthentication"]): void {
    this.config = config;
  }
}

class BehavioralAuthenticator {
  constructor(private config: BiometricAuthConfig["behavioralBiometrics"]) {}

  updateConfig(config: BiometricAuthConfig["behavioralBiometrics"]): void {
    this.config = config;
  }
}

class MultiFactorAuthenticator {
  constructor(private config: BiometricAuthConfig["multiFactor"]) {}

  async authenticate(userId: string, requiredFactors: string[]): Promise<any> {
    // Simulate multi-factor authentication
    return {
      success: Math.random() > 0.05,
      confidence: 0.9 + Math.random() * 0.1,
      verifiedFactors: requiredFactors,
      attemptId: `mf-attempt-${Date.now()}`,
      error:
        Math.random() > 0.95 ? "Multi-factor authentication failed" : undefined,
    };
  }

  updateConfig(config: BiometricAuthConfig["multiFactor"]): void {
    this.config = config;
  }
}

class RiskAssessmentEngine {
  async assessRisk(userId: string): Promise<RiskAssessment> {
    // Simulate risk assessment
    const riskScore = Math.random() * 100;

    return {
      userId,
      timestamp: new Date(),
      riskScore,
      factors: [
        {
          type: "location" as const,
          weight: 0.3,
          score: Math.random() * 100,
          description: "Location-based risk factor",
        },
        {
          type: "device" as const,
          weight: 0.2,
          score: Math.random() * 100,
          description: "Device-based risk factor",
        },
        {
          type: "behavior" as const,
          weight: 0.3,
          score: Math.random() * 100,
          description: "Behavior-based risk factor",
        },
        {
          type: "time" as const,
          weight: 0.1,
          score: Math.random() * 100,
          description: "Time-based risk factor",
        },
        {
          type: "network" as const,
          weight: 0.1,
          score: Math.random() * 100,
          description: "Network-based risk factor",
        },
      ],
      adaptiveLevel:
        riskScore < 25
          ? "low"
          : riskScore < 50
            ? "medium"
            : riskScore < 75
              ? "high"
              : "critical",
      recommendations:
        riskScore > 50 ? ["Use additional authentication factors"] : [],
      requiresStepUp: riskScore > 75,
    };
  }
}

class SecurityMonitor {
  startMonitoring(): void {
    // Start security monitoring
  }
}

// React hook
export function useBiometricAuthentication() {
  const engine = BiometricAuthenticationEngine.getInstance();
  const [metrics, setMetrics] = React.useState(engine.getSecurityMetrics());
  const [activeSessions, setActiveSessions] = React.useState(
    engine.getActiveSessions(),
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(engine.getSecurityMetrics());
      setActiveSessions(engine.getActiveSessions());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    metrics,
    activeSessions,
    authenticateWithFingerprint:
      engine.authenticateWithFingerprint.bind(engine),
    authenticateWithFacialRecognition:
      engine.authenticateWithFacialRecognition.bind(engine),
    authenticateWithVoice: engine.authenticateWithVoice.bind(engine),
    authenticateWithMultiFactor:
      engine.authenticateWithMultiFactor.bind(engine),
    enrollFingerprint: engine.enrollFingerprint.bind(engine),
    enrollFacialRecognition: engine.enrollFacialRecognition.bind(engine),
    enrollVoice: engine.enrollVoice.bind(engine),
    getSession: engine.getSession.bind(engine),
    terminateSession: engine.terminateSession.bind(engine),
    getAuthenticationHistory: engine.getAuthenticationHistory.bind(engine),
    getSecurityEvents: engine.getSecurityEvents.bind(engine),
    getBiometricTemplates: engine.getBiometricTemplates.bind(engine),
    assessRisk: engine.assessRisk.bind(engine),
    updateConfig: engine.updateConfig.bind(engine),
    isBiometricAvailable: engine.isBiometricAvailable.bind(engine),
  };
}

export default BiometricAuthenticationEngine;
