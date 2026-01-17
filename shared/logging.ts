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

const nowIso = (): string => new Date().toISOString();

const envName = (): string | undefined => {
  const v = process.env.NODE_ENV;
  return v ? String(v) : undefined;
};

export const logEvent = (event: Omit<LogEvent, 'timestamp' | 'environment'>): void => {
  const enriched: LogEvent = {
    ...event,
    timestamp: nowIso(),
    environment: envName(),
  };

  const payload = JSON.stringify(enriched);

  if (enriched.level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
};

export const logError = (
  component: string,
  message: string,
  error: unknown,
  data?: Record<string, unknown>,
): void => {
  const errMessage = error instanceof Error ? error.message : 'Unknown error';

  logEvent({
    level: 'error',
    component,
    message,
    data: {
      ...(data ?? {}),
      error: errMessage,
    },
  });
};

type MetricsSnapshot = {
  requestCount: number;
  errorCount: number;
  lastRequestAt?: string;
  lastErrorAt?: string;
};

const metrics: Record<string, MetricsSnapshot> = {};

const ensureMetrics = (key: string): MetricsSnapshot => {
  metrics[key] ??= { requestCount: 0, errorCount: 0 };
  return metrics[key];
};

export const recordRequest = (key: string): void => {
  const m = ensureMetrics(key);
  m.requestCount += 1;
  m.lastRequestAt = nowIso();
};

export const recordError = (key: string): void => {
  const m = ensureMetrics(key);
  m.errorCount += 1;
  m.lastErrorAt = nowIso();
};

export const getMetricsSnapshot = (): Record<string, MetricsSnapshot> => {
  return { ...metrics };
};
