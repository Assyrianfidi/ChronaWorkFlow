export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricSample {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

function labelKey(labels: Record<string, string>): string {
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`)
    .join('|');
}

export class MetricsEngine {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const k = `${name}|${labelKey(labels)}`;
    this.counters.set(k, (this.counters.get(k) ?? 0) + value);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const k = `${name}|${labelKey(labels)}`;
    this.gauges.set(k, value);
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const k = `${name}|${labelKey(labels)}`;
    const arr = this.histograms.get(k) ?? [];
    arr.push(value);
    if (arr.length > 1000) arr.splice(0, arr.length - 1000);
    this.histograms.set(k, arr);
  }

  snapshot(): MetricSample[] {
    const ts = Date.now();
    const out: MetricSample[] = [];

    for (const [k, v] of this.counters.entries()) {
      const [name, labelStr] = k.split('|', 2);
      out.push({ name, type: 'counter', value: v, timestamp: ts, labels: parseLabelStr(labelStr) });
    }

    for (const [k, v] of this.gauges.entries()) {
      const [name, labelStr] = k.split('|', 2);
      out.push({ name, type: 'gauge', value: v, timestamp: ts, labels: parseLabelStr(labelStr) });
    }

    for (const [k, arr] of this.histograms.entries()) {
      const [name, labelStr] = k.split('|', 2);
      const p95 = percentile(arr, 0.95);
      out.push({ name: `${name}_p95`, type: 'histogram', value: p95, timestamp: ts, labels: parseLabelStr(labelStr) });
      out.push({ name: `${name}_count`, type: 'histogram', value: arr.length, timestamp: ts, labels: parseLabelStr(labelStr) });
    }

    return out;
  }
}

function parseLabelStr(labelStr: string | undefined): Record<string, string> {
  if (!labelStr) return {};
  if (labelStr.trim() === '') return {};

  const labels: Record<string, string> = {};
  for (const part of labelStr.split('|')) {
    if (!part) continue;
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    labels[part.slice(0, idx)] = part.slice(idx + 1);
  }
  return labels;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

export const metricsEngine = new MetricsEngine();
