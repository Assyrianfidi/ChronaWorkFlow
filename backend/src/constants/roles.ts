export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
  AUDITOR: "AUDITOR",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_HIERARCHY: Record<string, number> = {
  [ROLES.ADMIN]: 5,
  [ROLES.AUDITOR]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.ACCOUNTANT]: 3,
  [ROLES.INVENTORY_MANAGER]: 2,
  [ROLES.USER]: 1,
} as const;
