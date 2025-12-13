import express from "express";
import { FeatureService } from "../services/feature.service";
import { auth, authorizeRoles } from "../middleware/auth";
import { ROLES } from "../constants/roles";
import { prisma } from "../utils/prisma";
import { Role } from "@prisma/client";

const router = express.Router();
const featureService = new FeatureService();

router.use(auth);

router.get("/resolve", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const keysParam = String(req.query.keys ?? "");
    const keys = keysParam
      .split(",")
      .map((k) => k.trim())
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
  } catch (error) {
    next(error);
  }
});

router.use(authorizeRoles(ROLES.ADMIN));

router.get("/", async (req, res, next) => {
  try {
    const data = await featureService.listFeatures();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { id: "asc" },
    });

    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
});

router.put("/:key/assign/role/:role", async (req, res, next) => {
  try {
    const featureKey = req.params.key;
    const role = req.params.role as Role;
    const enabled = Boolean(req.body?.enabled);

    await featureService.setRoleFeature(role, featureKey, enabled);

    res.status(200).json({
      success: true,
      data: { role, featureKey, enabled },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:key/assign/user/:userId", async (req, res, next) => {
  try {
    const featureKey = req.params.key;
    const userId = parseInt(req.params.userId, 10);

    const enabled = Boolean(req.body?.enabled);

    await featureService.setUserFeature(userId, featureKey, enabled);

    res.status(200).json({
      success: true,
      data: { userId, featureKey, enabled },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:key/assign/company/:companyId", async (req, res, next) => {
  try {
    const featureKey = req.params.key;
    const companyId = req.params.companyId;
    const enabled = Boolean(req.body?.enabled);

    const members = await prisma.companyMember.findMany({
      where: { companyId },
      select: { userId: true },
    });

    await Promise.all(
      members.map((m) => featureService.setUserFeature(m.userId, featureKey, enabled)),
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
  } catch (error) {
    next(error);
  }
});

export default router;
