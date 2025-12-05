export const ROLES = {
  USER: 'user',
  ASSISTANT_MANAGER: 'assistant_manager',
  MANAGER: 'manager',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
  INVENTORY_MANAGER: 'inventory_manager'
};

export const ROLES_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.ASSISTANT_MANAGER]: 2,
  [ROLES.AUDITOR]: 2,
  [ROLES.INVENTORY_MANAGER]: 2,
  [ROLES.MANAGER]: 3,
  [ROLES.ADMIN]: 4
};

export default ROLES;
