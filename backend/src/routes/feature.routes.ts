import express from "express";
import { FeatureService } from "../services/feature.service.js";
import { auth, authorizeRoles } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { prisma } from "../utils/prisma.js";
import { Role } from "@prisma/client";

const router = express.Router();
const featureService = new FeatureService();

router.use(auth);

router.get("/resolve", async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const keysParam = String(req.query.keys ?? "");
    const keys = keysParam
      .split(",")
      .map((k: any) => k.trim())
      .filter(Boolean);

    const result: Record<string, boolean> = {};

    for (const key of keys) {
      const resolution = await featureService.isFeatureEnabledForUser(
        key,
        req.user.id,
      );
      result[key] = resolution.enabled;
    }

    res.status(200).json({ success: true, data: { features: result } });
  } catch (error: any) {
    next(error);
  }
});

router.use(authorizeRoles(ROLES.ADMIN));

router.get("/", async (req: any, res: any, next: any) => {
  try {
    const data = await featureService.listFeatures();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    next(error);
  }
});

router.get("/users", async (req: any, res: any, next: any) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { id: "asc" },
    });

    res.status(200).json({ success: true, data: { users } });
  } catch (error: any) {
    next(error);
  }
});

router.put("/:key/assign/role/:role", async (req: any, res: any, next: any) => {
  try {
    const featureKey = req.params.key;
    const role = req.params.role as Role;
    const enabled = Boolean(req.body?.enabled);

    await featureService.setRoleFeature(role, featureKey, enabled);

    res.status(200).json({
      success: true,
      data: { role, featureKey, enabled },
    });
  } catch (error: any) {
    next(error);
  }
});

router.put("/:key/assign/user/:userId", async (req: any, res: any, next: any) => {
  try {
    const featureKey = req.params.key;
    const userId = req.params.userId;

    const enabled = Boolean(req.body?.enabled);

    await featureService.setUserFeature(userId, featureKey, enabled);

    res.status(200).json({
      success: true,
      data: { userId, featureKey, enabled },
    });
  } catch (error: any) {
    next(error);
  }
});

router.put("/:key/assign/company/:companyId", async (req: any, res: any, next: any) => {
  try {
    const featureKey = req.params.key;
    const companyId = req.params.companyId;
    const enabled = Boolean(req.body?.enabled);

    const members = await prisma.company_members.findMany({
      where: { companyId },
      select: { userId: true },
    });

    await Promise.all(
      members.map((m: any) => featureService.setUserFeature(m.userId, featureKey, enabled)),
    );

    res.status(200).json({
      success: true,
      data: {
        companyId,
        featureKey,
        enabled,
        userCount: members.length,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
