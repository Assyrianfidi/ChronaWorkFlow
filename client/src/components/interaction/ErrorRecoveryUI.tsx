
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from '@/components/adaptive/UserExperienceMode';
import { usePerformance } from '@/components/adaptive/UI-Performance-Engine';
import { useNotifications } from '@/components/adaptive/NotificationSystem';

// Error Recovery types and interfaces
export interface ErrorInfo {
  id: string;
  type:
    | "javascript"
    | "network"
    | "render"
    | "validation"
    | "permission"
    | "timeout"
    | "quota"
    | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  line?: number;
  column?: number;
  component?: string;
  context: Record<string, any>;
  recoverable: boolean;
  recovery?: RecoveryStrategy[];
  userImpact: UserImpact;
}

export interface UserImpact {
  functionality: "none" | "partial" | "full" | "blocked";
  data: "none" | "temporary" | "permanent" | "corrupted";
  experience: "minimal" | "degraded" | "poor" | "broken";
  actions: string[];
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  type:
    | "retry"
    | "refresh"
    | "fallback"
    | "reset"
    | "navigate"
    | "reconnect"
    | "clear-cache"
    | "custom";
  priority: number;
  automatic: boolean;
  handler: () => Promise<boolean>;
  conditions?: RecoveryCondition[];
  sideEffects?: string[];
}

export interface RecoveryCondition {
  field: string;
  operator: "equals" | "not-equals" | "contains" | "greater-than" | "less-than";
  value: any;
}

export interface ErrorPattern {
  id: string;
  name: string;
  pattern: RegExp | string;
  type: ErrorInfo["type"];
  severity: ErrorInfo["severity"];
  recovery: RecoveryStrategy[];
  frequency: number;
  lastSeen: number;
  autoRecovery: boolean;
}

export interface RecoverySession {
  id: string;
  errorId: string;
  startTime: number;
  endTime?: number;
  strategy: RecoveryStrategy;
  success: boolean;
  attempts: number;
  details: Record<string, any>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  lastError: ErrorInfo | null;
}

// Context for error recovery
interface ErrorRecoveryContextType {
  errors: ErrorInfo[];
  patterns: ErrorPattern[];
  sessions: RecoverySession[];
  addError: (error: Partial<ErrorInfo>) => void;
  recoverError: (errorId: string, strategyId: string) => Promise<boolean>;
  dismissError: (errorId: string) => void;
  clearErrors: () => void;
  getErrorStats: () => ErrorStats;
  addPattern: (pattern: ErrorPattern) => void;
  updatePattern: (id: string, updates: Partial<ErrorPattern>) => void;
  deletePattern: (id: string) => void;
  autoRecover: (error: ErrorInfo) => Promise<boolean>;
}

export interface ErrorStats {
  total: number;
  byType: Record<ErrorInfo["type"], number>;
  bySeverity: Record<ErrorInfo["severity"], number>;
  byComponent: Record<string, number>;
  recoveryRate: number;
  averageRecoveryTime: number;
}

const ErrorRecoveryContext =
  React.createContext<ErrorRecoveryContextType | null>(null);

// Built-in error patterns
const BUILTIN_PATTERNS: ErrorPattern[] = [
  {
    id: "network-timeout",
    name: "Network Timeout",
    pattern: /timeout|network|fetch/i,
    type: "network",
    severity: "medium",
    recovery: [
      {
        id: "retry-request",
        name: "Retry Request",
        description: "Retry the failed network request",
        type: "retry",
        priority: 1,
        automatic: true,
        handler: async () => {
          // Implementation would retry the specific request
          console.log("Retrying network request");
          return true;
        },
      },
      {
        id: "check-connection",
        name: "Check Connection",
        description: "Verify network connectivity",
        type: "reconnect",
        priority: 2,
        automatic: false,
        handler: async () => {
          // Check network status
          return navigator.onLine;
        },
      },
    ],
    frequency: 0,
    lastSeen: 0,
    autoRecovery: true,
  },
  {
    id: "javascript-runtime",
    name: "JavaScript Runtime Error",
    pattern: /TypeError|ReferenceError|SyntaxError/i,
    type: "javascript",
    severity: "high",
    recovery: [
      {
        id: "refresh-component",
        name: "Refresh Component",
        description: "Reload the affected component",
        type: "refresh",
        priority: 1,
        automatic: false,
        handler: async () => {
          // Implementation would refresh the component
          return true;
        },
      },
      {
        id: "fallback-ui",
        name: "Use Fallback UI",
        description: "Display simplified version",
        type: "fallback",
        priority: 2,
        automatic: true,
        handler: async () => {
          // Implementation would show fallback UI
          return true;
        },
      },
    ],
    frequency: 0,
    lastSeen: 0,
    autoRecovery: false,
  },
  {
    id: "permission-denied",
    name: "Permission Denied",
    pattern: /permission|denied|unauthorized|403/i,
    type: "permission",
    severity: "medium",
    recovery: [
      {
        id: "re-authenticate",
        name: "Re-authenticate",
        description: "Sign in again to refresh permissions",
        type: "navigate",
        priority: 1,
        automatic: false,
        handler: async () => {
          // Navigate to login page
          window.location.href = "/login";
          return true;
        },
      },
    ],
    frequency: 0,
    lastSeen: 0,
    autoRecovery: false,
  },
  {
    id: "quota-exceeded",
    name: "Storage Quota Exceeded",
    pattern: /quota|storage|exceeded/i,
    type: "quota",
    severity: "medium",
    recovery: [
      {
        id: "clear-cache",
        name: "Clear Cache",
        description: "Clear application cache to free space",
        type: "clear-cache",
        priority: 1,
        automatic: false,
        handler: async () => {
          if ("caches" in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
            return true;
          }
          return false;
        },
      },
    ],
    frequency: 0,
    lastSeen: 0,
    autoRecovery: false,
  },
];

// Error Recovery Manager
class ErrorRecoveryManager {
  private errors: ErrorInfo[] = [];
  private patterns: Map<string, ErrorPattern> = new Map();
  private sessions: RecoverySession[] = [];
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();

  constructor() {
    this.initializePatterns();
    this.setupGlobalHandlers();
  }

  private initializePatterns(): void {
    BUILTIN_PATTERNS.forEach((pattern) => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  private setupGlobalHandlers(): void {
    // Global error handler
    if (typeof window !== "undefined") {
      window.addEventListener("error", this.handleGlobalError.bind(this));
      window.addEventListener(
        "unhandledrejection",
        this.handleUnhandledRejection.bind(this),
      );
    }
  }

  private handleGlobalError(event: ErrorEvent): void {
    this.addError({
      type: "javascript",
      severity: "medium",
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      recoverable: true,
      userImpact: {
        functionality: "partial",
        data: "none",
        experience: "degraded",
        actions: ["retry", "refresh"],
      },
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.addError({
      type: "javascript",
      severity: "high",
      message: event.reason?.message || "Unhandled promise rejection",
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      context: {
        reason: event.reason,
        userAgent: navigator.userAgent,
      },
      recoverable: true,
      userImpact: {
        functionality: "partial",
        data: "none",
        experience: "poor",
        actions: ["retry", "refresh"],
      },
    });
  }

  addError(error: Partial<ErrorInfo>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      id: Math.random().toString(36).substr(2, 9),
      type: error.type || "unknown",
      severity: error.severity || "medium",
      message: error.message || "Unknown error",
      timestamp: error.timestamp || Date.now(),
      url: error.url || window.location.href,
      context: error.context || {},
      recoverable: error.recoverable !== false,
      userImpact: error.userImpact || {
        functionality: "partial",
        data: "none",
        experience: "degraded",
        actions: ["retry"],
      },
      ...error,
    };

    this.errors.push(errorInfo);
    this.updatePatterns(errorInfo);
    this.emitEvent("error-added", errorInfo);

    // Attempt auto-recovery
    if (errorInfo.recoverable) {
      this.autoRecover(errorInfo);
    }

    return errorInfo;
  }

  private updatePatterns(error: ErrorInfo): void {
    for (const pattern of this.patterns.values()) {
      const matches = this.matchPattern(pattern, error);
      if (matches) {
        pattern.frequency++;
        pattern.lastSeen = error.timestamp;

        // Update pattern severity if error is more severe
        if (this.compareSeverity(error.severity, pattern.severity) > 0) {
          pattern.severity = error.severity;
        }
      }
    }
  }

  private matchPattern(pattern: ErrorPattern, error: ErrorInfo): boolean {
    if (pattern.type !== error.type) return false;

    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(error.message);
    } else {
      return error.message.includes(pattern.pattern);
    }
  }

  private compareSeverity(
    severity1: ErrorInfo["severity"],
    severity2: ErrorInfo["severity"],
  ): number {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityOrder[severity1] - severityOrder[severity2];
  }

  async autoRecover(error: ErrorInfo): Promise<boolean> {
    const matchingPatterns = Array.from(this.patterns.values()).filter(
      (pattern) => this.matchPattern(pattern, error) && pattern.autoRecovery,
    );

    if (matchingPatterns.length === 0) return false;

    // Sort by priority and try recovery strategies
    const strategies = matchingPatterns
      .flatMap((pattern) => pattern.recovery)
      .filter((strategy) => strategy.automatic)
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of strategies) {
      try {
        const success = await this.executeStrategy(strategy, error);
        if (success) {
          this.emitEvent("auto-recovery-success", { error, strategy });
          return true;
        }
      } catch (recoveryError) {
        console.warn("Auto-recovery failed:", recoveryError);
      }
    }

    return false;
  }

  async executeStrategy(
    strategy: RecoveryStrategy,
    error: ErrorInfo,
  ): Promise<boolean> {
    const session: RecoverySession = {
      id: Math.random().toString(36).substr(2, 9),
      errorId: error.id,
      startTime: Date.now(),
      strategy,
      success: false,
      attempts: 1,
      details: {},
    };

    this.sessions.push(session);
    this.emitEvent("recovery-started", { session, error });

    try {
      const success = await strategy.handler();
      session.success = success;
      session.endTime = Date.now();

      this.emitEvent("recovery-completed", { session, success });
      return success;
    } catch (recoveryError) {
      session.success = false;
      session.endTime = Date.now();
      session.details.error = recoveryError;

      this.emitEvent("recovery-failed", { session, error: recoveryError });
      return false;
    }
  }

  async recoverError(errorId: string, strategyId: string): Promise<boolean> {
    const error = this.errors.find((e) => e.id === errorId);
    if (!error) return false;

    const strategy = this.findStrategy(strategyId);
    if (!strategy) return false;

    return await this.executeStrategy(strategy, error);
  }

  private findStrategy(strategyId: string): RecoveryStrategy | undefined {
    for (const pattern of this.patterns.values()) {
      const strategy = pattern.recovery.find((s) => s.id === strategyId);
      if (strategy) return strategy;
    }
    return undefined;
  }

  dismissError(errorId: string): void {
    const index = this.errors.findIndex((e) => e.id === errorId);
    if (index > -1) {
      this.errors.splice(index, 1);
      this.emitEvent("error-dismissed", { errorId });
    }
  }

  clearErrors(): void {
    this.errors = [];
    this.emitEvent("errors-cleared", {});
  }

  getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errors.length,
      byType: {} as Record<ErrorInfo["type"], number>,
      bySeverity: {} as Record<ErrorInfo["severity"], number>,
      byComponent: {} as Record<string, number>,
      recoveryRate: 0,
      averageRecoveryTime: 0,
    };

    this.errors.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] =
        (stats.bySeverity[error.severity] || 0) + 1;

      if (error.component) {
        stats.byComponent[error.component] =
          (stats.byComponent[error.component] || 0) + 1;
      }
    });

    // Calculate recovery rate
    const relevantSessions = this.sessions.filter((s) =>
      this.errors.some((e) => e.id === s.errorId),
    );

    if (relevantSessions.length > 0) {
      const successfulRecoveries = relevantSessions.filter(
        (s) => s.success,
      ).length;
      stats.recoveryRate = successfulRecoveries / relevantSessions.length;

      const totalTime = relevantSessions.reduce(
        (sum, s) => sum + (s.endTime! - s.startTime),
        0,
      );
      stats.averageRecoveryTime = totalTime / relevantSessions.length;
    }

    return stats;
  }

  addPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.emitEvent("pattern-added", pattern);
  }

  updatePattern(id: string, updates: Partial<ErrorPattern>): void {
    const pattern = this.patterns.get(id);
    if (pattern) {
      const updated = { ...pattern, ...updates };
      this.patterns.set(id, updated);
      this.emitEvent("pattern-updated", updated);
    }
  }

  deletePattern(id: string): void {
    if (this.patterns.delete(id)) {
      this.emitEvent("pattern-deleted", { id });
    }
  }

  private emitEvent(type: string, data: any): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach((listener) => listener(data));
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  // Public getters
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }

  getSessions(): RecoverySession[] {
    return [...this.sessions];
  }
}

// Error Boundary Component
export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    isolate?: boolean;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
      lastError: {
        id: Math.random().toString(36).substr(2, 9),
        type: "render",
        severity: "high",
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        url: window.location.href,
        component: errorInfo.componentStack.split("\n")[1]?.trim() || "Unknown",
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name,
        },
        recoverable: true,
        userImpact: {
          functionality: "partial",
          data: "none",
          experience: "poor",
          actions: ["retry", "refresh"],
        },
      },
    });

    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const { addError } = React.useContext(ErrorRecoveryContext)!;

  useEffect(() => {
    addError({
      type: "render",
      severity: "high",
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      context: {
        componentStack: error.stack,
      },
      recoverable: true,
      userImpact: {
        functionality: "partial",
        data: "none",
        experience: "poor",
        actions: ["retry", "refresh"],
      },
    });
  }, [error, addError]);

  return (
    <div className="error-boundary-fallback p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="text-center">
        <div className="text-red-600 dark:text-red-400 text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-red-700 dark:text-red-300 mb-4">{error.message}</p>
        <div className="space-x-4">
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Error Recovery UI Component
export function ErrorRecoveryUI({ children }: { children: React.ReactNode }) {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const { success } = useNotifications();

  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [patterns, setPatterns] = useState<ErrorPattern[]>(BUILTIN_PATTERNS);
  const [sessions, setSessions] = useState<RecoverySession[]>([]);
  const [showErrorPanel, setShowErrorPanel] = useState(false);

  const managerRef = useRef<ErrorRecoveryManager>();

  // Initialize manager
  useEffect(() => {
    managerRef.current = new ErrorRecoveryManager();

    // Setup event listeners
    const handleErrorAdded = (error: ErrorInfo) => {
      setErrors((prev) => [...prev, error]);

      // Show notification for critical errors
      if (error.severity === "critical") {
        success(`Critical error: ${error.message}`, {
          type: "error",
          duration: 10000,
        });
      }
    };

    const handleRecoveryCompleted = ({
      session,
      success,
    }: {
      session: RecoverySession;
      success: boolean;
    }) => {
      setSessions((prev) => [...prev, session]);

      if (success) {
        success(`Error recovered: ${session.strategy.name}`, {
          type: "success",
          duration: 3000,
        });
      }
    };

    managerRef.current.addEventListener("error-added", handleErrorAdded);
    managerRef.current.addEventListener(
      "recovery-completed",
      handleRecoveryCompleted,
    );

    return () => {
      managerRef.current?.removeEventListener("error-added", handleErrorAdded);
      managerRef.current?.removeEventListener(
        "recovery-completed",
        handleRecoveryCompleted,
      );
    };
  }, [success]);

  const addError = useCallback((error: Partial<ErrorInfo>) => {
    if (managerRef.current) {
      managerRef.current.addError(error);
    }
  }, []);

  const recoverError = useCallback(
    async (errorId: string, strategyId: string): Promise<boolean> => {
      if (managerRef.current) {
        return await managerRef.current.recoverError(errorId, strategyId);
      }
      return false;
    },
    [],
  );

  const dismissError = useCallback((errorId: string) => {
    if (managerRef.current) {
      managerRef.current.dismissError(errorId);
      setErrors((prev) => prev.filter((e) => e.id !== errorId));
    }
  }, []);

  const clearErrors = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearErrors();
      setErrors([]);
    }
  }, []);

  const getErrorStats = useCallback((): ErrorStats => {
    if (managerRef.current) {
      return managerRef.current.getErrorStats();
    }
    return {
      total: 0,
      byType: {} as Record<ErrorInfo["type"], number>,
      bySeverity: {} as Record<ErrorInfo["severity"], number>,
      byComponent: {} as Record<string, number>,
      recoveryRate: 0,
      averageRecoveryTime: 0,
    };
  }, []);

  const addPattern = useCallback((pattern: ErrorPattern) => {
    if (managerRef.current) {
      managerRef.current.addPattern(pattern);
      setPatterns((prev) => [...prev, pattern]);
    }
  }, []);

  const updatePattern = useCallback(
    (id: string, updates: Partial<ErrorPattern>) => {
      if (managerRef.current) {
        managerRef.current.updatePattern(id, updates);
        setPatterns((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        );
      }
    },
    [],
  );

  const deletePattern = useCallback((id: string) => {
    if (managerRef.current) {
      managerRef.current.deletePattern(id);
      setPatterns((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const autoRecover = useCallback(
    async (error: ErrorInfo): Promise<boolean> => {
      if (managerRef.current) {
        return await managerRef.current.autoRecover(error);
      }
      return false;
    },
    [],
  );

  const contextValue: ErrorRecoveryContextType = {
    errors,
    patterns,
    sessions,
    addError,
    recoverError,
    dismissError,
    clearErrors,
    getErrorStats,
    addPattern,
    updatePattern,
    deletePattern,
    autoRecover,
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
      {errors.length > 0 && (
        <ErrorPanel
          errors={errors}
          onDismiss={dismissError}
          onRecover={recoverError}
          onClear={clearErrors}
          visible={showErrorPanel}
          onToggleVisible={() => setShowErrorPanel(!showErrorPanel)}
        />
      )}
    </ErrorRecoveryContext.Provider>
  );
}

// Error Panel Component
function ErrorPanel({
  errors,
  onDismiss,
  onRecover,
  onClear,
  visible,
  onToggleVisible,
}: {
  errors: ErrorInfo[];
  onDismiss: (id: string) => void;
  onRecover: (errorId: string, strategyId: string) => Promise<boolean>;
  onClear: () => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  const { patterns } = React.useContext(ErrorRecoveryContext)!;
  const [recovering, setRecovering] = useState<Set<string>>(new Set());

  const getRecoveryStrategies = (error: ErrorInfo): RecoveryStrategy[] => {
    const matchingPatterns = patterns.filter((pattern) =>
      error.message.match(
        pattern.pattern instanceof RegExp
          ? pattern.pattern
          : new RegExp(pattern.pattern, "i"),
      ),
    );

    return matchingPatterns.flatMap((pattern) => pattern.recovery);
  };

  const handleRecover = async (errorId: string, strategyId: string) => {
    setRecovering((prev) => new Set(prev).add(errorId));

    try {
      await onRecover(errorId, strategyId);
    } finally {
      setRecovering((prev) => {
        const next = new Set(prev);
        next.delete(errorId);
        return next;
      });
    }
  };

  const criticalErrors = errors.filter((e) => e.severity === "critical");
  const hasCriticalErrors = criticalErrors.length > 0;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Errors ({errors.length})
              </h3>
              {hasCriticalErrors && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded">
                  {criticalErrors.length} Critical
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onClear}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear All
              </button>
              <button
                onClick={onToggleVisible}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {visible ? "▼" : "▲"}
              </button>
            </div>
          </div>

          {visible && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {errors.slice(0, 5).map((error) => {
                const strategies = getRecoveryStrategies(error);
                const isRecovering = recovering.has(error.id);

                return (
                  <div
                    key={error.id}
                    className={`p-3 rounded border ${
                      error.severity === "critical"
                        ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                        : error.severity === "high"
                          ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                          : error.severity === "medium"
                            ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                            : "border-gray-300 bg-gray-50 dark:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {error.type.charAt(0).toUpperCase() +
                            error.type.slice(1)}{" "}
                          Error
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {error.message}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                          {error.recoverable && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Recoverable
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onDismiss(error.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        ×
                      </button>
                    </div>

                    {strategies.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Recovery Options:
                        </div>
                        <div className="space-y-1">
                          {strategies.slice(0, 2).map((strategy) => (
                            <button
                              key={strategy.id}
                              onClick={() =>
                                handleRecover(error.id, strategy.id)
                              }
                              disabled={isRecovering}
                              className="w-full text-left px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                            >
                              {isRecovering ? "Recovering..." : strategy.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {errors.length > 5 && (
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  ... and {errors.length - 5} more errors
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for using error recovery
export function useErrorRecovery() {
  const context = React.useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error("useErrorRecovery must be used within ErrorRecoveryUI");
  }
  return context;
}

// Error Boundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    isolate?: boolean;
  } = {},
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...options}>
        {/* @ts-ignore */}
        <Component {...(props as P)} />
      </ErrorBoundary>
    );
  };
}

// Async Error Handler
export function useAsyncError() {
  const { addError } = useErrorRecovery();

  return useCallback(
    (error: Error, context?: Record<string, any>) => {
      addError({
        type: "javascript",
        severity: "medium",
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        url: window.location.href,
        context: context || {},
        recoverable: true,
        userImpact: {
          functionality: "partial",
          data: "none",
          experience: "degraded",
          actions: ["retry"],
        },
      });
    },
    [addError],
  );
}

export default ErrorRecoveryUI;
