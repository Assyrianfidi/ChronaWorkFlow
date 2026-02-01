export type DevInvariantCode =
  | 'IDEMPOTENCY_LIFECYCLE_INVALID'
  | 'TENANT_ISOLATION_INVARIANT'
  | 'RBAC_INVARIANT_VIOLATION';

export class DevInvariantViolation extends Error {
  public readonly code: DevInvariantCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: DevInvariantCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DevInvariantViolation';
    this.code = code;
    this.details = details;
  }
}

export function isProduction(): boolean {
  return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

export function devInvariant(
  condition: unknown,
  code: DevInvariantCode,
  message: string,
  details?: Record<string, unknown>,
): asserts condition {
  if (isProduction()) return;
  if (!condition) {
    throw new DevInvariantViolation(code, message, details);
  }
}
