import { describe, it, expect } from 'vitest';

import { createApp } from '../../app.js';
import { registerAllRoutes } from '../../routes/index.js';

type ExpressLayer = {
  name?: string;
  handle?: Function;
  route?: { path?: string; methods?: Record<string, boolean> };
  regexp?: RegExp;
};

function getExpressStack(app: any): ExpressLayer[] {
  const stack = app?._router?.stack;
  return Array.isArray(stack) ? (stack as ExpressLayer[]) : [];
}

function isApiRegexp(regexp: unknown): boolean {
  if (!(regexp instanceof RegExp)) return false;
  const src = String(regexp);
  return src.includes('\\/api') || src.includes('^\\/api');
}

function isApiLayer(layer: ExpressLayer): boolean {
  if (!layer) return false;

  if (layer.route?.path && typeof layer.route.path === 'string') {
    return layer.route.path.startsWith('/api');
  }

  return isApiRegexp(layer.regexp);
}

function identifyApiGuardMiddleware(layer: ExpressLayer): string | null {
  const fn = layer.handle;
  if (typeof fn !== 'function') return null;

  if (fn.name === 'authenticateMiddleware') return 'authenticate';
  if (fn.name === 'enforceBillingStatusMiddleware') return 'enforceBillingStatus';
  if (fn.name === 'enforcePlanLimitsMiddleware') return 'enforcePlanLimits';

  const src = Function.prototype.toString.call(fn);

  if (src.includes('COMPANY_ISOLATION_PUBLIC_PATHS')) return 'enforceCompanyIsolation';
  if (src.includes('inferAction') && src.includes('rbac.unknown_route')) return 'authorizeRequest';
  if (src.includes('getBillingEnforcementMode')) return 'enforceBillingStatus';
  if (src.includes('checkPlanLimits') && src.includes('create_invoice')) return 'enforcePlanLimits';

  return null;
}

function listApiRoutesForEvidence(stack: ExpressLayer[]): string[] {
  const out: string[] = [];

  for (const layer of stack) {
    if (!layer?.route?.path || typeof layer.route.path !== 'string') continue;
    if (!layer.route.path.startsWith('/api')) continue;

    const methods = layer.route.methods
      ? Object.keys(layer.route.methods).filter((m) => layer.route?.methods?.[m])
      : [];

    out.push(`${methods.map((m) => m.toUpperCase()).join(',') || 'ALL'} ${layer.route.path}`);
  }

  return out.sort();
}

describe('api guard chain invariants', () => {
  it('mounts /api exactly once and applies the mandatory guard chain before any /api routes', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const app = createApp();
    await registerAllRoutes(app);

    const stack = getExpressStack(app);

    // Evidence: list all direct /api routes visible in the Express stack.
    const apiRoutes = listApiRoutesForEvidence(stack);
    // Keep logs concise but auditor-useful.
    console.log(`[evidence] Express /api route count: ${apiRoutes.length}`);
    for (const r of apiRoutes) console.log(`[evidence] ${r}`);

    const guardStarts: number[] = [];
    for (let i = 0; i < stack.length; i += 1) {
      const id = identifyApiGuardMiddleware(stack[i]);
      if (id === 'authenticate') guardStarts.push(i);
    }

    expect(guardStarts.length).toBe(1);

    const guardStart = guardStarts[0];

    // Hard fail if anything /api-related is registered before the guard chain start.
    const preApiLayers = stack.slice(0, guardStart).filter(isApiLayer);
    expect(preApiLayers.length).toBe(0);

    const expected = [
      'authenticate',
      'enforceCompanyIsolation',
      'authorizeRequest',
      'enforceBillingStatus',
      'enforcePlanLimits',
    ];

    const actual = expected.map((_, idx) => identifyApiGuardMiddleware(stack[guardStart + idx]));
    expect(actual).toEqual(expected);
  });
});
