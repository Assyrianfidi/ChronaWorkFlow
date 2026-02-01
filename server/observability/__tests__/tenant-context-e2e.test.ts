import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { getRequestContext } from "../../runtime/request-context";

vi.mock("../../middleware/billing-enforcement", () => {
  return {
    getBillingEnforcementMode: vi.fn(async () => ({ mode: "ok", subscription: null })),
    enforcePlanLimits: vi.fn(async () => ({ allowed: true, warnings: [] })),
  };
});

describe("tenant context e2e", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves AsyncLocalStorage tenant context: middleware -> handler -> storage", async () => {
    process.env.JWT_SECRET = "test-secret";

    const { storage } = await import("../../storage");
    const { createApp } = await import("../../app");

    vi.spyOn(storage, "hasUserCompanyAccess").mockResolvedValue(true);

    const app = createApp();

    app.get("/api/invoices/__test__/unscoped/:id", async (req, res) => {
      const ctx = getRequestContext();
      const companyIdFromContext = typeof ctx?.companyId === "string" ? ctx.companyId : null;
      if (!companyIdFromContext) {
        return res.status(200).json({ companyIdFromContext, error: "missing companyId in request context" });
      }
      try {
        await storage.getInvoice(req.params.id);
        return res.status(500).json({ companyIdFromContext, error: "expected invariant violation" });
      } catch (err: any) {
        return res.status(200).json({
          companyIdFromContext,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    app.use((err: any, _req: any, res: any, _next: any) => {
      const ctx = getRequestContext();
      return res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
        ctx,
      });
    });

    const token = jwt.sign(
      { id: "user-1", role: "admin", currentCompanyId: "company-a" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const res = await request(app)
      .get("/api/invoices/__test__/unscoped/inv-1")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.companyIdFromContext).toBe("company-a");
    expect(String(res.body.error)).toMatch(/unscoped invoice read/i);
  });
});
