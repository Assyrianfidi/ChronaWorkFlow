export type RequestPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';

export interface RequestDescriptor {
  method: string;
  path: string;
}

function normalizePath(path: string): string {
  return path
    .replace(/[0-9a-f]{8,}/gi, ':id')
    .replace(/\d+/g, ':n');
}

export function classifyRequestPriority(req: RequestDescriptor): RequestPriority {
  const method = req.method.toUpperCase();
  const path = normalizePath(req.path);

  if (path === '/health' || path === '/readyz' || path === '/readiness') {
    return 'CRITICAL';
  }

  if (path.startsWith('/api/auth') || path.startsWith('/auth')) {
    return 'HIGH';
  }

  if (path.startsWith('/api/billing') || path.startsWith('/billing')) {
    return method === 'POST' ? 'HIGH' : 'NORMAL';
  }

  if (path.startsWith('/api/webhooks') || path.startsWith('/webhooks')) {
    return 'HIGH';
  }

  if (path.startsWith('/api/admin') || path.startsWith('/admin')) {
    return 'HIGH';
  }

  if (method === 'GET') {
    return 'NORMAL';
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    return 'HIGH';
  }

  return 'LOW';
}

export function isNonCritical(priority: RequestPriority): boolean {
  return priority === 'LOW' || priority === 'BACKGROUND';
}
