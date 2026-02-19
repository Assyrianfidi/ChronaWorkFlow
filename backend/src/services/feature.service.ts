import { Prisma, Role } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export type FeatureKey = string;

export type FeatureListItem = {
  key: FeatureKey;
  globalEnabled: boolean;
  roleDefaults: Partial<Record<Role, boolean>>;
  userOverrides: Array<{ userId: number; enabled: boolean }>;
};

export type FeatureListResponse = {
  features: FeatureListItem[];
};

export type FeatureResolution = {
  featureKey: FeatureKey;
  enabled: boolean;
  source: "user" | "role" | "default";
};

export class FeatureService {
  async listFeatures(): Promise<FeatureListResponse> {
    const [roleRows, userRows] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`
        SELECT role, "featureName", enabled
        FROM role_features
      `) as Promise<Array<{ role: Role; featureName: string; enabled: boolean }>>,
      prisma.$queryRaw(Prisma.sql`
          SELECT "userId", "featureName", enabled
          FROM user_features
        `) as Promise<Array<{ userId: number; featureName: string; enabled: boolean }>>,
    ]);

    const keys = Array.from(
      new Set([
        ...roleRows.map((r: any) => r.featureName),
        ...userRows.map((u: any) => u.featureName),
      ]),
    ).sort();

    const roleDefaultsByKey = new Map<FeatureKey, Partial<Record<Role, boolean>>>();
    for (const row of roleRows) {
      const curr = roleDefaultsByKey.get(row.featureName) ?? {};
      curr[row.role] = row.enabled;
      roleDefaultsByKey.set(row.featureName, curr);
    }

    const userOverridesByKey = new Map<FeatureKey, Array<{ userId: number; enabled: boolean }>>();
    for (const row of userRows) {
      const curr = userOverridesByKey.get(row.featureName) ?? [];
      curr.push({ userId: row.userId, enabled: row.enabled });
      userOverridesByKey.set(row.featureName, curr);
    }

    const features: FeatureListItem[] = keys.map((key: any) => ({
      key,
      globalEnabled: false,
      roleDefaults: roleDefaultsByKey.get(key) ?? {},
      userOverrides: userOverridesByKey.get(key) ?? [],
    }));

    return { features };
  }

  async setRoleFeature(
    role: Role,
    featureKey: FeatureKey,
    enabled: boolean,
  ): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO role_features (role, "featureName", enabled, "createdAt", "updatedAt")
        VALUES (${role}, ${featureKey}, ${enabled}, NOW(), NOW())
        ON CONFLICT (role, "featureName")
        DO UPDATE SET enabled = EXCLUDED.enabled, "updatedAt" = NOW()
      `,
    );
  }

  async setUserFeature(
    userId: number,
    featureKey: FeatureKey,
    enabled: boolean,
  ): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO user_features ("userId", "featureName", enabled, "createdAt", "updatedAt")
        VALUES (${userId}, ${featureKey}, ${enabled}, NOW(), NOW())
        ON CONFLICT ("userId", "featureName")
        DO UPDATE SET enabled = EXCLUDED.enabled, "updatedAt" = NOW()
      `,
    );
  }

  async isFeatureEnabledForUser(
    featureKey: FeatureKey,
    userId: number,
    companyId?: string,
  ): Promise<FeatureResolution> {
    const userOverrideRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT enabled
        FROM user_features
        WHERE "userId" = ${userId} AND "featureName" = ${featureKey}
        LIMIT 1
      `,
    ) as Array<{ enabled: boolean }>;

    const userOverride = userOverrideRows[0];

    if (userOverride) {
      return {
        featureKey,
        enabled: userOverride.enabled,
        source: "user",
      };
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, currentCompanyId: true },
    });

    if (!user) {
      return { featureKey, enabled: false, source: "default" };
    }

    const effectiveCompanyId = companyId ?? user.currentCompanyId ?? undefined;
    void effectiveCompanyId;

    const roleDefaultRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT enabled
        FROM role_features
        WHERE role = ${user.role} AND "featureName" = ${featureKey}
        LIMIT 1
      `,
    );

    const roleDefault = roleDefaultRows[0];

    if (roleDefault) {
      return {
        featureKey,
        enabled: roleDefault.enabled,
        source: "role",
      };
    }

    return { featureKey, enabled: false, source: "default" };
  }
}
