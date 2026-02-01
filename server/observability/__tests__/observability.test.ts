import { describe, it, expect, beforeEach } from 'vitest';

import { createCorrelationId, createRequestId } from '../observability-context.js';
import { metricsEngine } from '../metrics-engine.js';
import { tracingEngine } from '../tracing-engine.js';

function setDeterministic(on: boolean) {
  if (on) {
    process.env.DETERMINISTIC_TEST_IDS = 'true';
  } else {
    delete process.env.DETERMINISTIC_TEST_IDS;
  }
}

describe('STEP16 observability core', () => {
  beforeEach(() => {
    metricsEngine.setGauge('reset', 0);
    tracingEngine.clear();
  });

  it('creates deterministic correlation ids when DETERMINISTIC_TEST_IDS=true', () => {
    setDeterministic(true);
    const c1 = createCorrelationId({ prefix: 'x', requestId: 'r1', tenantId: 't1' });
    const c2 = createCorrelationId({ prefix: 'x', requestId: 'r1', tenantId: 't1' });
    expect(c1).toBe('x_t1_r1');
    expect(c2).toBe('x_t1_r1');
  });

  it('metrics snapshot includes derived histogram p95/count', () => {
    setDeterministic(true);
    metricsEngine.observe('latency_ms', 10, { op: 'a' });
    metricsEngine.observe('latency_ms', 20, { op: 'a' });

    const snap = metricsEngine.snapshot();
    const names = new Set(snap.map((s) => s.name));
    expect(names.has('latency_ms_p95')).toBe(true);
    expect(names.has('latency_ms_count')).toBe(true);
  });

  it('tracing spans keep tenant/actor attributes', () => {
    setDeterministic(true);
    const ctx = {
      correlationId: 'corr',
      requestId: createRequestId('req'),
      tenantId: 'tenantA',
      actorId: 'userA',
      admissionDecision: 'ALLOW' as const,
    };

    const span = tracingEngine.startSpan(ctx as any, 'op');
    tracingEngine.endSpan(span.spanId);

    const spans = tracingEngine.listSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes.tenantId).toBe('tenantA');
    expect(spans[0].attributes.actorId).toBe('userA');
  });
});
