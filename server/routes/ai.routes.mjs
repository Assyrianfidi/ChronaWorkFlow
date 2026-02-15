import express from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/error.middleware.mjs';
import { requireCompanyAccess, requireSubscription, userRateLimit, auditLog } from '../middleware/auth.middleware.mjs';
import { incCounter } from '../utils/metrics.mjs';

const router = express.Router();
const getPrisma = () => global.prisma;

const createMessageSchema = z.object({
  conversationId: z.string().nullable().optional(),
  message: z.string().min(1).max(8000),
  title: z.string().max(140).optional(),
});

const AI_LIMITS = {
  STARTER: { requestsPerHour: 10 },
  GROWTH: { requestsPerHour: 60 },
  ENTERPRISE: { requestsPerHour: 300 },
};

const aiRequests = new Map();

const aiRateLimit = () => {
  return (req, res, next) => {
    const companyId = req.user?.companyId || req.user?.id;
    if (!companyId) return next();

    const plan = req.user.company?.subscriptionPlan || req.user.subscriptionPlan || 'STARTER';
    const limit = AI_LIMITS[plan]?.requestsPerHour ?? AI_LIMITS.STARTER.requestsPerHour;

    const key = `${companyId}:${new Date().getUTCHours()}`;
    const current = aiRequests.get(key) || 0;

    if (current >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `AI request limit reached for this hour (${limit}/hour). Please try again later or upgrade your plan.`,
      });
    }

    aiRequests.set(key, current + 1);
    next();
  };
};

const getProvider = () => (process.env.AI_PROVIDER || 'mock').toLowerCase();

async function callOpenAI(messages) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no content');
  return content;
}

async function callGateway(messages, companyId) {
  const baseUrl = process.env.AI_SERVICE_URL;
  const apiKey = process.env.AI_SERVICE_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error('AI gateway is not configured (AI_SERVICE_URL / AI_SERVICE_API_KEY)');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Company-ID': companyId,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`AI gateway error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data = await response.json();
  const content = data?.content || data?.message || data?.response;
  if (!content) throw new Error('AI gateway returned no content');
  return content;
}

function buildSystemPrompt() {
  return (
    'You are the AccuBooks assistant. You help with accounting workflows, reports, and operational guidance. ' +
    'Do not invent financial facts. Ask clarifying questions when needed. ' +
    'If asked for legal/tax advice, provide general info and recommend a professional.'
  );
}

router.get(
  '/conversations',
  requireCompanyAccess('ai'),
  asyncHandler(async (req, res) => {
    if (!prisma) {
      return res.json({ success: true, data: { conversations: [] } });
    }

    const companyId = req.user.companyId || req.user.id;
    const conversations = await prisma.aIConversation.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    res.json({ success: true, data: { conversations } });
  })
);

router.get(
  '/conversations/:id',
  requireCompanyAccess('ai'),
  asyncHandler(async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Service Unavailable', message: 'Database not available' });
    }

    const companyId = req.user.companyId || req.user.id;
    const convo = await prisma.aIConversation.findFirst({
      where: { id: req.params.id, companyId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!convo) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Conversation not found' });
    }

    res.json({ success: true, data: { conversation: convo } });
  })
);

router.post(
  '/chat',
  requireSubscription('STARTER', 'GROWTH', 'ENTERPRISE'),
  requireCompanyAccess('ai'),
  userRateLimit({ max: 30 }),
  aiRateLimit(),
  auditLog('generated', 'ai'),
  asyncHandler(async (req, res) => {
    const validated = createMessageSchema.parse(req.body);

    const companyId = req.user.companyId || req.user.id;
    const userId = req.user.id;
    const plan = req.user.company?.subscriptionPlan || req.user.subscriptionPlan || 'STARTER';

    const prisma = getPrisma();

    if (!prisma) {
      const assistant = `AI is not available because the database is not connected. You said: ${validated.message}`;
      return res.json({
        success: true,
        data: {
          conversationId: 'mock',
          assistantMessage: assistant,
        },
      });
    }

    const conversation = validated.conversationId
      ? await prisma.aIConversation.findFirst({ where: { id: validated.conversationId, companyId } })
      : await prisma.aIConversation.create({
          data: {
            title: validated.title || validated.message.slice(0, 60),
            companyId,
            userId,
          },
        });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Conversation not found' });
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: validated.message,
      },
    });

    const recent = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      ...recent
        .reverse()
        .map((m) => ({ role: m.role.toLowerCase(), content: m.content })),
    ];

    let assistantText;
    const provider = getProvider();

    incCounter('accubooks_ai_requests_total', {
      provider,
      plan,
    });

    if (provider === 'openai') {
      assistantText = await callOpenAI(messages);
    } else if (provider === 'gateway') {
      assistantText = await callGateway(messages, companyId);
    } else {
      assistantText = `Mock AI: I received your message: "${validated.message}". Configure AI_PROVIDER=openai or gateway to enable live responses.`;
    }

    incCounter('accubooks_ai_responses_total', {
      provider,
      plan,
    });

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: assistantText,
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        assistantMessage: assistantText,
      },
    });
  })
);

export default router;
