export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ASSISTANT_MANAGER: 'assistant_manager',
  USER: 'user',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_HIERARCHY: Record<string, number> = {
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.ASSISTANT_MANAGER]: 2,
  [ROLES.USER]: 1,
} as const;
