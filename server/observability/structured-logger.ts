import { logger as baseLogger, type LogContext } from '../utils/structured-logger.js';

import type { ObservabilityContext } from './observability-context.js';

export type ObservabilityLogContext = LogContext & {
  correlationId: string;
  requestId: string;
  tenantId: string;
  actorId: string;
  admissionDecision?: string;
  admissionReason?: string;
};

export function toLogContext(ctx: ObservabilityContext, extra?: LogContext): ObservabilityLogContext {
  return {
    ...(extra || {}),
    correlationId: ctx.correlationId,
    requestId: ctx.requestId,
    tenantId: ctx.tenantId,
    actorId: ctx.actorId,
    ...(ctx.admissionDecision ? { admissionDecision: ctx.admissionDecision } : {}),
    ...(ctx.admissionReason ? { admissionReason: ctx.admissionReason } : {}),
  };
}

export const observabilityLogger = {
  info(message: string, ctx: ObservabilityContext, extra?: LogContext) {
    baseLogger.info(message, toLogContext(ctx, extra));
  },
  warn(message: string, ctx: ObservabilityContext, extra?: LogContext) {
    baseLogger.warn(message, toLogContext(ctx, extra));
  },
  error(message: string, error: Error | undefined, ctx: ObservabilityContext, extra?: LogContext) {
    baseLogger.error(message, error, toLogContext(ctx, extra));
  },
  debug(message: string, ctx: ObservabilityContext, extra?: LogContext) {
    baseLogger.debug(message, toLogContext(ctx, extra));
  },
};
