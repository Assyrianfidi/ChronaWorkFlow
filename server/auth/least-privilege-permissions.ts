// CRITICAL: Least-Privilege Default Permissions
// MANDATORY: New users get minimal permissions, new features default to NO access

import { TenantUserRole } from '../tenant/tenant-service.js';
import { Permission, PermissionValidator, getPermissionRegistry } from './tenant-permissions.js';
import { logger } from '../utils/structured-logger.js';

export interface DefaultPermissionConfig {
  newUsers: {
    defaultRole: TenantUserRole;
    minimalPermissions: Permission[];
  };
  newFeatures: {
    defaultAccess: 'DENY' | 'ALLOW';
    requiredPermissions: Permission[];
  };
  validation: {
    failOnMissingPermissions: boolean;
    failOnUnmappedFeatures: boolean;
  };
}

/**
 * CRITICAL: Least-Privilege Permission Manager
 * 
 * This class enforces least-privilege defaults and ensures that
 * new users get minimal permissions and new features default to NO access.
 */
export class LeastPrivilegePermissionManager {
  private config: DefaultPermissionConfig;
  private permissionRegistry = getPermissionRegistry();

  constructor(config: Partial<DefaultPermissionConfig> = {}) {
    this.config = {
      newUsers: {
        defaultRole: TenantUserRole.VIEWER,
        minimalPermissions: [
          'users:read',
          'users:profile:read'
        ]
      },
      newFeatures: {
        defaultAccess: 'DENY',
        requiredPermissions: []
      },
      validation: {
        failOnMissingPermissions: true,
        failOnUnmappedFeatures: true
      },
      ...config
    };

    this.validateConfiguration();
  }

  /**
   * CRITICAL: Get default permissions for new users
   */
  getNewUserPermissions(): {
    role: TenantUserRole;
    permissions: Permission[];
  } {
    const role = this.config.newUsers.defaultRole;
    const permissions = PermissionValidator.getRolePermissions(role);

    // CRITICAL: Ensure minimal permissions are included
    const allPermissions = new Set(permissions);
    for (const permission of this.config.newUsers.minimalPermissions) {
      if (!PermissionValidator.isValidPermission(permission)) {
        throw new Error(`Invalid minimal permission: ${permission}`);
      }
      allPermissions.add(permission);
    }

    logger.info('New user permissions configured', {
      role,
      permissionCount: allPermissions.size,
      minimalPermissions: this.config.newUsers.minimalPermissions
    });

    return {
      role,
      permissions: Array.from(allPermissions)
    };
  }

  /**
   * CRITICAL: Check if feature requires explicit permission
   */
  requiresExplicitPermission(featureName: string): boolean {
    return this.config.newFeatures.defaultAccess === 'DENY';
  }

  /**
   * CRITICAL: Get required permissions for a feature
   */
  getRequiredPermissions(featureName: string): Permission[] {
    // CRITICAL: In a real implementation, this would look up feature permissions
    // For now, we use the configured required permissions
    return this.config.newFeatures.requiredPermissions;
  }

  /**
   * CRITICAL: Validate feature permission mapping
   */
  validateFeaturePermissions(
    featureName: string,
    requiredPermissions: Permission[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // CRITICAL: Check if all required permissions are valid
    for (const permission of requiredPermissions) {
      if (!PermissionValidator.isValidPermission(permission)) {
        errors.push(`Invalid permission for feature ${featureName}: ${permission}`);
      }
    }

    // CRITICAL: Check if feature has any permissions mapped
    if (this.config.validation.failOnUnmappedFeatures && requiredPermissions.length === 0) {
      errors.push(`Feature ${featureName} has no permissions mapped and failOnUnmappedFeatures is enabled`);
    }

    // CRITICAL: Check if permissions are assigned to roles
    if (this.config.validation.failOnMissingPermissions) {
      for (const permission of requiredPermissions) {
        const hasRoleAssignment = Array.from(this.permissionRegistry.rolePermissions.values())
          .some(rolePermissions => rolePermissions.includes(permission));

        if (!hasRoleAssignment) {
          errors.push(`Permission ${permission} for feature ${featureName} is not assigned to any role`);
        }
      }
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      logger.error('Feature permission validation failed', new Error('FEATURE_PERMISSION_VALIDATION_FAILED'), {
        featureName,
        errors,
        requiredPermissions
      });
    }

    return { isValid, errors };
  }

  /**
   * CRITICAL: Validate all permission mappings
   */
  validateAllPermissionMappings(): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    // CRITICAL: Validate permission registry
    const registryValidation = PermissionValidator.validateRegistry();
    if (!registryValidation.isValid) {
      allErrors.push(...registryValidation.errors);
    }

    // CRITICAL: Validate minimal permissions for new users
    for (const permission of this.config.newUsers.minimalPermissions) {
      if (!PermissionValidator.isValidPermission(permission)) {
        allErrors.push(`Invalid minimal permission for new users: ${permission}`);
      }
    }

    // CRITICAL: Validate required permissions for new features
    for (const permission of this.config.newFeatures.requiredPermissions) {
      if (!PermissionValidator.isValidPermission(permission)) {
        allErrors.push(`Invalid required permission for new features: ${permission}`);
      }
    }

    // CRITICAL: Ensure default role exists
    if (!Array.from(this.permissionRegistry.rolePermissions.keys()).includes(this.config.newUsers.defaultRole)) {
      allErrors.push(`Default role ${this.config.newUsers.defaultRole} is not defined in permission registry`);
    }

    const isValid = allErrors.length === 0;

    if (!isValid) {
      logger.error('Permission mapping validation failed', new Error('PERMISSION_MAPPING_VALIDATION_FAILED'), {
        errorCount: allErrors.length,
        errors: allErrors
      });
    } else {
      logger.info('All permission mappings validated successfully');
    }

    return { isValid, errors: allErrors };
  }

  /**
   * CRITICAL: Check if user has sufficient permissions for role
   */
  validateUserPermissions(
    userRole: TenantUserRole,
    userPermissions: Permission[]
  ): { isValid: boolean; missingPermissions: Permission[] } {
    const expectedPermissions = PermissionValidator.getRolePermissions(userRole);
    const missingPermissions = expectedPermissions.filter(p => !userPermissions.includes(p));

    const isValid = missingPermissions.length === 0;

    if (!isValid) {
      logger.warn('User permission validation failed', {
        userRole,
        expectedCount: expectedPermissions.length,
        actualCount: userPermissions.length,
        missingPermissions
      });
    }

    return { isValid, missingPermissions };
  }

  /**
   * CRITICAL: Apply least-privilege principle to existing permissions
   */
  applyLeastPrivilege(
    currentPermissions: Permission[],
    userRole: TenantUserRole
  ): Permission[] {
    const rolePermissions = PermissionValidator.getRolePermissions(userRole);
    
    // CRITICAL: Only keep permissions that are explicitly granted to the role
    const validPermissions = currentPermissions.filter(permission => 
      rolePermissions.includes(permission) && PermissionValidator.isValidPermission(permission)
    );

    // CRITICAL: Ensure minimal permissions are always included
    for (const permission of this.config.newUsers.minimalPermissions) {
      if (rolePermissions.includes(permission) && !validPermissions.includes(permission)) {
        validPermissions.push(permission);
      }
    }

    logger.debug('Applied least-privilege principle', {
      userRole,
      originalCount: currentPermissions.length,
      filteredCount: validPermissions.length,
      removedCount: currentPermissions.length - validPermissions.length
    });

    return validPermissions;
  }

  /**
   * CRITICAL: Get permission recommendations for role upgrade
   */
  getPermissionUpgradeRecommendations(
    currentRole: TenantUserRole,
    targetRole: TenantUserRole
  ): {
    addedPermissions: Permission[];
    removedPermissions: Permission[];
    requiresExplicitGrant: Permission[];
  } {
    const currentPermissions = PermissionValidator.getRolePermissions(currentRole);
    const targetPermissions = PermissionValidator.getRolePermissions(targetRole);

    const addedPermissions = targetPermissions.filter(p => !currentPermissions.includes(p));
    const removedPermissions = currentPermissions.filter(p => !targetPermissions.includes(p));
    
    // CRITICAL: Permissions that require explicit grant (not automatically granted by role)
    const requiresExplicitGrant = addedPermissions.filter(permission => {
      // In a real implementation, this would check for sensitive permissions
      // that require explicit admin approval
      const sensitivePermissions = [
        'users:delete',
        'system:admin',
        'system:tenant:delete',
        'billing:refund',
        'accounting:transaction:delete'
      ];
      return sensitivePermissions.includes(permission);
    });

    return {
      addedPermissions,
      removedPermissions,
      requiresExplicitGrant
    };
  }

  /**
   * CRITICAL: Validate configuration
   */
  private validateConfiguration(): void {
    // CRITICAL: Validate default role
    if (!Array.from(this.permissionRegistry.rolePermissions.keys()).includes(this.config.newUsers.defaultRole)) {
      throw new Error(`Invalid default role: ${this.config.newUsers.defaultRole}`);
    }

    // CRITICAL: Validate minimal permissions
    for (const permission of this.config.newUsers.minimalPermissions) {
      if (!PermissionValidator.isValidPermission(permission)) {
        throw new Error(`Invalid minimal permission: ${permission}`);
      }
    }

    // CRITICAL: Validate required permissions
    for (const permission of this.config.newFeatures.requiredPermissions) {
      if (!PermissionValidator.isValidPermission(permission)) {
        throw new Error(`Invalid required permission: ${permission}`);
      }
    }

    logger.info('Least-privilege configuration validated', {
      defaultRole: this.config.newUsers.defaultRole,
      minimalPermissionCount: this.config.newUsers.minimalPermissions.length,
      defaultAccess: this.config.newFeatures.defaultAccess,
      validationConfig: this.config.validation
    });
  }

  /**
   * CRITICAL: Get configuration summary
   */
  getConfigurationSummary(): {
    newUserDefaults: {
      role: TenantUserRole;
      minimalPermissions: Permission[];
    };
    newFeatureDefaults: {
      defaultAccess: string;
      requiredPermissions: Permission[];
    };
    validationConfig: {
      failOnMissingPermissions: boolean;
      failOnUnmappedFeatures: boolean;
    };
  } {
    return {
      newUserDefaults: {
        role: this.config.newUsers.defaultRole,
        minimalPermissions: [...this.config.newUsers.minimalPermissions]
      },
      newFeatureDefaults: {
        defaultAccess: this.config.newFeatures.defaultAccess,
        requiredPermissions: [...this.config.newFeatures.requiredPermissions]
      },
      validationConfig: {
        ...this.config.validation
      }
    };
  }
}

/**
 * CRITICAL: Factory function for creating least-privilege manager
 */
export const createLeastPrivilegePermissionManager = (
  config?: Partial<DefaultPermissionConfig>
): LeastPrivilegePermissionManager => {
  return new LeastPrivilegePermissionManager(config);
};

/**
 * CRITICAL: Global least-privilege manager instance
 */
let globalLeastPrivilegeManager: LeastPrivilegePermissionManager | null = null;

/**
 * CRITICAL: Get or create global least-privilege manager
 */
export const getLeastPrivilegePermissionManager = (
  config?: Partial<DefaultPermissionConfig>
): LeastPrivilegePermissionManager => {
  if (!globalLeastPrivilegeManager) {
    globalLeastPrivilegeManager = new LeastPrivilegePermissionManager(config);
  }
  return globalLeastPrivilegeManager;
};

/**
 * CRITICAL: CI validation function for permission mappings
 */
export const validatePermissionMappingsForCI = (): { 
  success: boolean; 
  errors: string[]; 
  warnings: string[] 
} => {
  const manager = createLeastPrivilegePermissionManager({
    validation: {
      failOnMissingPermissions: true,
      failOnUnmappedFeatures: true
    }
  });

  const validation = manager.validateAllPermissionMappings();
  const warnings: string[] = [];

  // CRITICAL: Add warnings for potential security issues
  if (manager.getConfigurationSummary().newUserDefaults.minimalPermissions.length > 5) {
    warnings.push('New users have many minimal permissions - consider reducing for better security');
  }

  if (manager.getConfigurationSummary().newFeatureDefaults.defaultAccess === 'ALLOW') {
    warnings.push('New features default to ALLOW - this is a security risk');
  }

  return {
    success: validation.isValid,
    errors: validation.errors,
    warnings
  };
};
