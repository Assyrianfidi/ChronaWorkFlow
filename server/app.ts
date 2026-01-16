import express from "express";
import { prisma } from "./prisma";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((req: any, res: any, next: any) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !String(authHeader).startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.user = {
    id: "test-user",
    tenantId: "test-tenant",
    role: "ADMIN",
  };

  next();
});

app.get("/api/inventory", async (req: any, res) => {
  const page = 1;
  const limit = 10;

  const [items, total] = await Promise.all([
    (prisma as any).inventory.findMany({
      where: { tenantId: req.user?.tenantId },
      skip: (page - 1) * limit,
      take: limit,
    } as any),
    (prisma as any).inventory.count({ where: { tenantId: req.user?.tenantId } } as any),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

app.post("/api/inventory", async (req: any, res) => {
  const created = await (prisma as any).inventory.create({
    data: {
      ...req.body,
      tenantId: req.user?.tenantId,
    },
  } as any);

  try {
    await (prisma as any).inventoryHistory.create({
      data: {
        inventoryId: created.id,
        action: "CREATE",
        tenantId: req.user?.tenantId,
      },
    } as any);
  } catch {
  }

  res.status(201).json({
    success: true,
    data: created,
  });
});

export { app };
export default app;
