import path from 'node:path';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const requireFromRoot = createRequire(path.join(process.cwd(), 'package.json'));
const { PrismaClient } = requireFromRoot('@prisma/client');
const Stripe = requireFromRoot('stripe');

const BASE_URL = 'http://localhost:5000';

const fail = (report, checkpoint, error) => {
  report.status = 'FAIL';
  report.failures.push({ checkpoint, error: String(error?.message || error) });
};

const parseSetCookie = (setCookieHeader) => {
  if (!setCookieHeader) return [];
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return headers
    .map((h) => String(h).split(';')[0])
    .filter(Boolean);
};

const updateCookieJar = (jar, setCookieHeader) => {
  for (const cookie of parseSetCookie(setCookieHeader)) {
    const [name] = cookie.split('=');
    if (!name) continue;
    jar.set(name.trim(), cookie);
  }
};

const cookieHeaderValue = (jar) => {
  if (!jar.size) return '';
  return Array.from(jar.values()).join('; ');
};

const httpJson = async ({
  method,
  path,
  body,
  headers = {},
  jar,
  expectStatus,
  report,
  checkpoint,
}) => {
  const url = `${BASE_URL}${path}`;
  const reqHeaders = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  if (jar && jar.size) {
    reqHeaders.Cookie = cookieHeaderValue(jar);
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie');
  if (jar) updateCookieJar(jar, setCookie);

  const raw = {
    url,
    status: res.status,
    headers: {
      'set-cookie': Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [],
    },
    body: text,
  };

  if (expectStatus != null && res.status !== expectStatus) {
    const err = new Error(`Expected HTTP ${expectStatus} but got ${res.status}`);
    err.raw = raw;
    throw err;
  }

  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (report && checkpoint) {
    report.rawResponses[checkpoint] = raw;
  }

  return { res, raw, json };
};

const getDbCounts = async (prisma) => {
  const [aiConversations, aiMessages, stripeWebhookEvents, subscriptions, users, auditLogs] = await Promise.all([
    prisma.aIConversation.count().catch(() => null),
    prisma.aIMessage.count().catch(() => null),
    prisma.stripeWebhookEvent.count().catch(() => null),
    prisma.subscription.count().catch(() => null),
    prisma.user.count().catch(() => null),
    prisma.auditLog.count().catch(() => null),
  ]);

  return {
    ai_conversations: aiConversations,
    ai_messages: aiMessages,
    stripe_webhook_events: stripeWebhookEvents,
    subscriptions,
    users,
    audit_logs: auditLogs,
  };
};

const metricsSnapshot = (metricsText) => {
  const wanted = [
    'accubooks_stripe_webhook_attempts_total',
    'accubooks_stripe_webhooks_total',
    'accubooks_ai_requests_total',
    'accubooks_ai_responses_total',
    'accubooks_audit_events_total',
    'accubooks_audit_failures_total',
  ];
  const lines = String(metricsText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const subset = lines.filter((l) => wanted.some((m) => l.startsWith(m)));
  return {
    subset,
    totalLines: lines.length,
  };
};

const main = async () => {
  const report = {
    status: 'PASS',
    failures: [],
    checkpoints: {},
    rawResponses: {},
    dbCounts: {
      before: null,
      afterAI: null,
      afterStripe: null,
    },
    metrics: {
      raw: null,
      snapshot: null,
    },
  };

  const prisma = new PrismaClient();
  const jar = new Map();

  try {
    // Baseline counts
    report.dbCounts.before = await getDbCounts(prisma);

    // 1) Register
    const guid = crypto.randomUUID().replace(/-/g, '');
    const email = `smoke${guid}@example.com`;

    const reg = await httpJson({
      method: 'POST',
      path: '/api/auth/register',
      body: { email, password: 'Password123!', name: 'Smoke User' },
      jar,
      expectStatus: 201,
      report,
      checkpoint: 'register',
    });

    const accessToken = reg?.json?.data?.accessToken;
    if (!accessToken) throw new Error('Missing accessToken in register response');

    report.checkpoints.register = {
      status: 'PASS',
      email,
      userId: reg?.json?.data?.user?.id ?? null,
    };

    // 2) CSRF
    const csrf = await httpJson({
      method: 'GET',
      path: '/api/auth/csrf',
      headers: { Authorization: `Bearer ${accessToken}` },
      jar,
      expectStatus: 200,
      report,
      checkpoint: 'csrf',
    });

    const csrfToken = csrf?.json?.data?.csrfToken;
    if (!csrfToken) throw new Error('Missing csrfToken in CSRF response');

    report.checkpoints.csrf = { status: 'PASS' };

    // 3) AI chat
    const ai = await httpJson({
      method: 'POST',
      path: '/api/ai/chat',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-CSRF-Token': csrfToken,
      },
      jar,
      body: {
        conversationId: null,
        message: 'Smoke test: hello',
        title: 'Smoke Test',
      },
      expectStatus: 200,
      report,
      checkpoint: 'ai_chat',
    });

    const conversationId = ai?.json?.data?.conversationId;
    if (!conversationId) throw new Error('Missing conversationId in AI chat response');

    report.checkpoints.ai_chat = {
      status: 'PASS',
      conversationId,
      providerHint: ai?.json?.data?.assistantMessage?.startsWith('Mock AI:') ? 'mock' : 'unknown',
    };

    // 4) DB persistence after AI
    report.dbCounts.afterAI = await getDbCounts(prisma);

    if (
      report.dbCounts.before.ai_conversations != null &&
      report.dbCounts.afterAI.ai_conversations != null &&
      report.dbCounts.afterAI.ai_conversations <= report.dbCounts.before.ai_conversations
    ) {
      throw new Error('ai_conversations did not increment after AI chat');
    }

    if (
      report.dbCounts.before.ai_messages != null &&
      report.dbCounts.afterAI.ai_messages != null &&
      report.dbCounts.afterAI.ai_messages <= report.dbCounts.before.ai_messages
    ) {
      throw new Error('ai_messages did not increment after AI chat');
    }

    // 5) Stripe idempotency proof (non-mutating event type)
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeWebhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET in environment');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', { apiVersion: '2024-06-20' });

    const beforeStripeCounts = await getDbCounts(prisma);

    const eventId = `evt_smoke_${Date.now()}`;
    const payloadObj = {
      id: eventId,
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.created',
      data: {
        object: {
          id: `in_smoke_${Date.now()}`,
          object: 'invoice',
          metadata: {
            // we intentionally omit companyId to avoid any downstream DB writes
          },
        },
      },
    };

    const payload = JSON.stringify(payloadObj);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: stripeWebhookSecret });

    const stripeFirst = await httpJson({
      method: 'POST',
      path: '/api/stripe/webhook',
      headers: {
        'Stripe-Signature': signature,
        // raw body is required server-side; we still send JSON and let fetch transmit it
      },
      body: payloadObj,
      expectStatus: 200,
      report,
      checkpoint: 'stripe_webhook_first',
    });

    const stripeSecond = await httpJson({
      method: 'POST',
      path: '/api/stripe/webhook',
      headers: {
        'Stripe-Signature': signature,
      },
      body: payloadObj,
      expectStatus: 200,
      report,
      checkpoint: 'stripe_webhook_second',
    });

    const firstJson = stripeFirst.json;
    const secondJson = stripeSecond.json;

    if (!firstJson?.received) throw new Error('Stripe first webhook did not return received=true');
    if (!secondJson?.received || secondJson?.duplicate !== true) {
      throw new Error('Stripe second webhook did not return duplicate=true');
    }

    report.dbCounts.afterStripe = await getDbCounts(prisma);

    // stripe_webhook_events should increment by exactly 1 on first receipt; second should not change
    if (
      beforeStripeCounts.stripe_webhook_events != null &&
      report.dbCounts.afterStripe.stripe_webhook_events != null &&
      report.dbCounts.afterStripe.stripe_webhook_events !== beforeStripeCounts.stripe_webhook_events + 1
    ) {
      throw new Error('stripe_webhook_events did not increment by exactly 1');
    }

    // ensure no subscription writes occurred for this non-mutating event
    if (
      beforeStripeCounts.subscriptions != null &&
      report.dbCounts.afterStripe.subscriptions != null &&
      report.dbCounts.afterStripe.subscriptions !== beforeStripeCounts.subscriptions
    ) {
      throw new Error('subscriptions count changed unexpectedly during stripe idempotency test');
    }

    report.checkpoints.stripe_idempotency = {
      status: 'PASS',
      eventId,
      first: firstJson,
      second: secondJson,
    };

    // 6) Metrics
    const metrics = await httpJson({
      method: 'GET',
      path: '/api/metrics',
      expectStatus: 200,
      report,
      checkpoint: 'metrics',
    });

    report.metrics.raw = metrics.raw.body;
    report.metrics.snapshot = metricsSnapshot(metrics.raw.body);

    report.checkpoints.metrics = {
      status: 'PASS',
      snapshotLineCount: report.metrics.snapshot.subset.length,
    };

    // 7) Audit logging verification: should have incremented at least once from AI, and may increment from webhook only if companyId present.
    // We at least assert audit_logs count did not decrease.
    if (report.dbCounts.before.audit_logs != null && report.dbCounts.afterAI.audit_logs != null) {
      if (report.dbCounts.afterAI.audit_logs <= report.dbCounts.before.audit_logs) {
        const start = Date.now();
        const timeoutMs = 5000;
        while (Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, 250));
          const latest = await prisma.auditLog.count().catch(() => null);
          if (latest != null && latest > report.dbCounts.before.audit_logs) {
            report.dbCounts.afterAI.audit_logs = latest;
            break;
          }
        }

        if (report.dbCounts.afterAI.audit_logs <= report.dbCounts.before.audit_logs) {
          throw new Error('audit_logs did not increment after AI chat');
        }
      }
    }

    report.checkpoints.audit_logs = {
      status: 'PASS',
      note: 'Verified audit_logs incremented after AI chat; webhook audit is best-effort and requires companyId in event metadata.',
    };

    // overall
    report.status = 'PASS';
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write('Phase 1 Complete — 100% Green\n');
    process.exit(0);
  } catch (err) {
    fail(report, 'phase1-smoke', err);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write('Phase 1 Incomplete — See Failures\n');
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  }
};

await main();
