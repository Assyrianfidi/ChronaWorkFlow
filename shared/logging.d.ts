export type LogLevel = 'info' | 'warn' | 'error';
export type LogEvent = {
    level: LogLevel;
    message: string;
    timestamp: string;
    component: string;
    environment?: string;
    apiVersion?: string;
    data?: Record<string, unknown>;
};
export declare const logEvent: (event: Omit<LogEvent, 'timestamp' | 'environment'>) => void;
export declare const logError: (component: string, message: string, error: unknown, data?: Record<string, unknown>) => void;
type MetricsSnapshot = {
    requestCount: number;
    errorCount: number;
    lastRequestAt?: string;
    lastErrorAt?: string;
};
export declare const recordRequest: (key: string) => void;
export declare const recordError: (key: string) => void;
export declare const getMetricsSnapshot: () => Record<string, MetricsSnapshot>;
export {};
//# sourceMappingURL=logging.d.ts.map