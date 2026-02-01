import jwt from 'jsonwebtoken';

import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { stableHash, stableId } from '../finance/ledger-invariants.js';

export type ExternalReportScope = {
  companyId: string;
  from: Date;
  to: Date;
  allowed: Array<'REPORTS_READ' | 'EXPORTS_READ'>;
};

export type AccountantAccessTokenPayload = {
  v: 1;
  typ: 'ACCOUNTANT_REPORT_ACCESS';
  jti: string;
  sub: string;
  companyId: string;
  validFrom: string;
  validTo: string;
  scope: Array<'REPORTS_READ' | 'EXPORTS_READ'>;
  exp: number;
};

export type ExternalAccessStore = {
  revoke(jti: string, revokedAt: Date): Promise<void>;
  isRevoked(jti: string): Promise<boolean>;
};

export class MemoryExternalAccessStore implements ExternalAccessStore {
  private revoked = new Map<string, string>();

  async revoke(jti: string, revokedAt: Date): Promise<void> {
    this.revoked.set(jti, revokedAt.toISOString());
  }

  async isRevoked(jti: string): Promise<boolean> {
    return this.revoked.has(jti);
  }
}

function getAudit() {
  return getImmutableAuditLogger();
}

function getSecret(): string {
  const secret = process.env.EXTERNAL_REPORTING_TOKEN_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error('Missing EXTERNAL_REPORTING_TOKEN_SECRET (or JWT_SECRET/SESSION_SECRET fallback)');
  return secret;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function makeJti(seed: string): string {
  return isDeterministic() ? `ext_${stableHash(seed).slice(0, 16)}` : stableId('ext', seed);
}

export class AccountantAccessService {
  constructor(private readonly store: ExternalAccessStore = new MemoryExternalAccessStore()) {}

  async grantAccess(input: {
    actorId: string;
    subject: { externalId: string };
    scope: ExternalReportScope;
    ttlSeconds: number;
    correlationId: string;
  }): Promise<string> {
    const jti = makeJti(`acct:${input.subject.externalId}:${input.scope.companyId}:${input.scope.from.toISOString()}:${input.scope.to.toISOString()}`);

    const payload: AccountantAccessTokenPayload = {
      v: 1,
      typ: 'ACCOUNTANT_REPORT_ACCESS',
      jti,
      sub: input.subject.externalId,
      companyId: input.scope.companyId,
      validFrom: input.scope.from.toISOString(),
      validTo: input.scope.to.toISOString(),
      scope: [...input.scope.allowed].sort(),
      exp: Math.floor(Date.now() / 1000) + input.ttlSeconds,
    };

    const token = jwt.sign(payload as any, getSecret(), { algorithm: 'HS256' });

    getAudit().logSecurityEvent({
      tenantId: input.scope.companyId,
      actorId: input.actorId,
      action: 'ACCOUNTANT_ACCESS_GRANTED',
      resourceType: 'EXTERNAL_ACCESS',
      resourceId: jti,
      outcome: 'SUCCESS',
      correlationId: input.correlationId,
      metadata: {
        subject: input.subject.externalId,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        scope: payload.scope,
        ttlSeconds: input.ttlSeconds,
      },
    });

    return token;
  }

  async revokeAccess(input: { actorId: string; jti: string; companyId: string; correlationId: string }): Promise<void> {
    await this.store.revoke(input.jti, new Date());

    getAudit().logSecurityEvent({
      tenantId: input.companyId,
      actorId: input.actorId,
      action: 'ACCOUNTANT_ACCESS_REVOKED',
      resourceType: 'EXTERNAL_ACCESS',
      resourceId: input.jti,
      outcome: 'SUCCESS',
      correlationId: input.correlationId,
      metadata: {},
    });
  }

  async verifyToken(input: { token: string; correlationId: string }): Promise<AccountantAccessTokenPayload> {
    const decoded = jwt.verify(input.token, getSecret(), { algorithms: ['HS256'] }) as any;

    if (!decoded || decoded.typ !== 'ACCOUNTANT_REPORT_ACCESS' || decoded.v !== 1) {
      throw new Error('Invalid accountant access token');
    }

    if (await this.store.isRevoked(String(decoded.jti))) {
      throw new Error('Access token revoked');
    }

    const now = Date.now();
    const validFrom = new Date(String(decoded.validFrom)).getTime();
    const validTo = new Date(String(decoded.validTo)).getTime();

    if (!Number.isFinite(validFrom) || !Number.isFinite(validTo)) {
      throw new Error('Invalid token validity window');
    }

    if (now < validFrom || now > validTo) {
      throw new Error('Access token outside validity window');
    }

    getAudit().logSecurityEvent({
      tenantId: String(decoded.companyId),
      actorId: String(decoded.sub),
      action: 'ACCOUNTANT_REPORT_READ',
      resourceType: 'REPORT',
      resourceId: String(decoded.companyId),
      outcome: 'SUCCESS',
      correlationId: input.correlationId,
      metadata: { validFrom: decoded.validFrom, validTo: decoded.validTo, scope: decoded.scope },
    });

    return decoded as AccountantAccessTokenPayload;
  }
}
