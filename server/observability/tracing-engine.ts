import { createCorrelationId, type ObservabilityContext } from './observability-context.js';

export interface TraceSpan {
  spanId: string;
  traceId: string;
  name: string;
  startMs: number;
  endMs?: number;
  status: 'OK' | 'ERROR';
  attributes: Record<string, string>;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

let counter = 0;

function nextId(prefix: string, seed: string): string {
  if (isDeterministic()) {
    counter += 1;
    return `${prefix}_${counter}`;
  }
  return createCorrelationId({ prefix, requestId: seed, tenantId: 'system' });
}

export class TracingEngine {
  private spans: Map<string, TraceSpan> = new Map();

  startSpan(ctx: ObservabilityContext, name: string, attributes: Record<string, string> = {}): TraceSpan {
    const spanId = nextId('span', ctx.requestId);
    const traceId = ctx.correlationId;

    const span: TraceSpan = {
      spanId,
      traceId,
      name,
      startMs: Date.now(),
      status: 'OK',
      attributes: {
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        ...(ctx.admissionDecision ? { admissionDecision: ctx.admissionDecision } : {}),
        ...(ctx.admissionReason ? { admissionReason: ctx.admissionReason } : {}),
        ...attributes,
      },
    };

    this.spans.set(spanId, span);
    return span;
  }

  endSpan(spanId: string, status: TraceSpan['status'] = 'OK'): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    span.endMs = Date.now();
    span.status = status;
  }

  listSpans(): TraceSpan[] {
    return Array.from(this.spans.values());
  }

  clear(): void {
    this.spans.clear();
  }
}

export const tracingEngine = new TracingEngine();
