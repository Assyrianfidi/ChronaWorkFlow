export type SloStatus = 'PASS' | 'WARN' | 'FAIL';

export interface SloThresholds {
  maxErrorRatePct: number;
  maxP95LatencyMs: number;
}

export interface SloWindowMetrics {
  totalRequests: number;
  errorRequests: number;
  p95LatencyMs: number;
}

export interface SloEvaluation {
  status: SloStatus;
  errorRatePct: number;
  p95LatencyMs: number;
  reasons: string[];
}

export function evaluateSlo(metrics: SloWindowMetrics, thresholds: SloThresholds): SloEvaluation {
  const reasons: string[] = [];
  const errorRatePct = metrics.totalRequests > 0
    ? (metrics.errorRequests / metrics.totalRequests) * 100
    : 0;

  if (errorRatePct > thresholds.maxErrorRatePct) {
    reasons.push(`error_rate_exceeded:${errorRatePct.toFixed(2)}>${thresholds.maxErrorRatePct}`);
  }

  if (metrics.p95LatencyMs > thresholds.maxP95LatencyMs) {
    reasons.push(`p95_latency_exceeded:${metrics.p95LatencyMs}>${thresholds.maxP95LatencyMs}`);
  }

  const status: SloStatus = reasons.length === 0
    ? 'PASS'
    : reasons.length === 1
      ? 'WARN'
      : 'FAIL';

  return {
    status,
    errorRatePct,
    p95LatencyMs: metrics.p95LatencyMs,
    reasons,
  };
}
