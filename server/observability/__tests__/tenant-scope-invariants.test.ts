import { describe, it, expect } from "vitest";

import { storage } from "../../storage";
import { runWithRequestContext } from "../../runtime/request-context";

describe("tenant scope invariants", () => {
  it("fails closed: unscoped invoice reads are forbidden when request context has companyId", async () => {
    await expect(
      runWithRequestContext({ companyId: "company-a", userId: "user-1" }, () => storage.getInvoice("inv-1")),
    ).rejects.toThrow(/unscoped invoice read/i);
  });

  it("fails closed: cross-tenant companyId mismatch is forbidden", async () => {
    await expect(
      runWithRequestContext(
        { companyId: "company-a", userId: "user-1" },
        () => storage.getPaymentsByInvoiceByCompany("company-b", "inv-1"),
      ),
    ).rejects.toThrow(/cross-tenant/i);
  });
});
