// Multi-tenancy Tenant Model and Ownership
// First-class tenant support with immutable identifiers and role-based access

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  settings: TenantSettings;
  subscriptionPlan: TenantSubscriptionPlan;
  subscriptionStatus: TenantSubscriptionStatus;
  maxUsers: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt?: Date;
}

export interface TenantSettings {
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: TenantUserRole;
  sessionTimeout: number; // minutes
  passwordPolicy: PasswordPolicy;
  twoFactorRequired: boolean;
  auditLogRetention: number; // days
  dataRetention: number; // days
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // number of previous passwords to prevent
}

export enum TenantSubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export enum TenantSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID'
}

export enum TenantUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  VIEWER = 'VIEWER'
}

export interface UserTenant {
  id: string;
  userId: string;
  tenantId: string;
  role: TenantUserRole;
  isActive: boolean;
  invitedAt?: Date;
  joinedAt: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  invitedBy?: string;
}

export interface TenantUser {
  user: {
    id: string;
    name?: string;
    email?: string;
    isActive: boolean;
    lastLogin?: Date;
  };
  tenantMembership: UserTenant;
}

export class TenantService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new tenant with immutable identifier
   */
  async createTenant(data: {
    name: string;
    domain?: string;
    logo?: string;
    settings?: Partial<TenantSettings>;
    subscriptionPlan?: TenantSubscriptionPlan;
    maxUsers?: number;
    createdBy: string;
  }): Promise<Tenant> {
    // Generate immutable tenant ID and slug
    const tenantId = this.generateTenantId();
    const slug = this.generateSlug(data.name);

    // Validate slug uniqueness
    const existingSlug = await this.prisma.$queryRaw`
      SELECT id FROM tenants WHERE slug = ${slug} AND deleted_at IS NULL
    ` as Array<{ id: string }>;

    if (existingSlug.length > 0) {
      throw new Error(`Tenant with slug "${slug}" already exists`);
    }

    // Default settings
    const defaultSettings: TenantSettings = {
      allowUserRegistration: false,
      requireEmailVerification: true,
      defaultUserRole: TenantUserRole.EMPLOYEE,
      sessionTimeout: 480, // 8 hours
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 3
      },
      twoFactorRequired: false,
      auditLogRetention: 90,
      dataRetention: 2555 // 7 years
    };

    const settings = { ...defaultSettings, ...data.settings };

    // Create tenant
    const tenant = await this.prisma.$queryRaw`
      INSERT INTO tenants (
        id, name, slug, domain, logo, settings, 
        subscription_plan, subscription_status, max_users, 
        is_active, created_at, updated_at, created_by
      ) VALUES (
        ${tenantId}, ${data.name}, ${slug}, ${data.domain || null}, 
        ${data.logo || null}, ${JSON.stringify(settings)}, 
        ${data.subscriptionPlan || TenantSubscriptionPlan.FREE}, 
        ${TenantSubscriptionStatus.ACTIVE}, ${data.maxUsers || 5}, 
        true, NOW(), NOW(), ${data.createdBy}
      )
      RETURNING *
    ` as Array<Tenant>;

    return tenant[0];
  }

  /**
   * Get tenant by ID (immutable identifier)
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const tenants = await this.prisma.$queryRaw`
      SELECT * FROM tenants 
      WHERE id = ${tenantId} AND deleted_at IS NULL
    ` as Array<Tenant>;

    return tenants[0] || null;
  }

  /**
   * Get tenant by slug (immutable slug)
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const tenants = await this.prisma.$queryRaw`
      SELECT * FROM tenants 
      WHERE slug = ${slug} AND deleted_at IS NULL
    ` as Array<Tenant>;

    return tenants[0] || null;
  }

  /**
   * Update tenant settings (never updates ID or slug)
   */
  async updateTenant(tenantId: string, data: {
    name?: string;
    domain?: string;
    logo?: string;
    settings?: Partial<TenantSettings>;
    subscriptionPlan?: TenantSubscriptionPlan;
    subscriptionStatus?: TenantSubscriptionStatus;
    maxUsers?: number;
    isActive?: boolean;
  }): Promise<Tenant> {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push(`name = $${updates.length + 1}`);
      values.push(data.name);
    }

    if (data.domain !== undefined) {
      updates.push(`domain = $${updates.length + 1}`);
      values.push(data.domain);
    }

    if (data.logo !== undefined) {
      updates.push(`logo = $${updates.length + 1}`);
      values.push(data.logo);
    }

    if (data.settings !== undefined) {
      updates.push(`settings = $${updates.length + 1}`);
      values.push(JSON.stringify(data.settings));
    }

    if (data.subscriptionPlan !== undefined) {
      updates.push(`subscription_plan = $${updates.length + 1}`);
      values.push(data.subscriptionPlan);
    }

    if (data.subscriptionStatus !== undefined) {
      updates.push(`subscription_status = $${updates.length + 1}`);
      values.push(data.subscriptionStatus);
    }

    if (data.maxUsers !== undefined) {
      updates.push(`max_users = $${updates.length + 1}`);
      values.push(data.maxUsers);
    }

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${updates.length + 1}`);
      values.push(data.isActive);
    }

    updates.push(`updated_at = NOW()`);
    values.push(tenantId);

    const query = `
      UPDATE tenants 
      SET ${updates.join(', ')}
      WHERE id = $${updates.length}
      RETURNING *
    `;

    const tenants = await this.prisma.$queryRawUnsafe(query, ...values) as Array<Tenant>;

    if (tenants.length === 0) {
      throw new Error('Tenant not found');
    }

    return tenants[0];
  }

  /**
   * Soft delete tenant (retention compliant)
   */
  async deleteTenant(tenantId: string, deletedBy: string): Promise<void> {
    // Check if tenant exists
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check compliance constraints
    const hasActiveSubscriptions = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE tenant_id = ${tenantId} AND status = 'ACTIVE' AND deleted_at IS NULL
    ` as Array<{ count: number }>;

    if (hasActiveSubscriptions[0].count > 0) {
      throw new Error('Cannot delete tenant with active subscriptions');
    }

    // Soft delete
    await this.prisma.$queryRaw`
      UPDATE tenants 
      SET deleted_at = NOW(), updated_at = NOW(), is_active = false
      WHERE id = ${tenantId}
    `;

    // Deactivate all user memberships
    await this.prisma.$queryRaw`
      UPDATE user_tenants 
      SET is_active = false, updated_at = NOW
      WHERE tenant_id = ${tenantId}
    `;
  }

  /**
   * Add user to tenant
   */
  async addUserToTenant(data: {
    userId: string;
    tenantId: string;
    role: TenantUserRole;
    invitedBy?: string;
  }): Promise<UserTenant> {
    const membershipId = this.generateMembershipId();

    // Check if user already has membership
    const existing = await this.prisma.$queryRaw`
      SELECT id FROM user_tenants 
      WHERE user_id = ${data.userId} AND tenant_id = ${data.tenantId} AND deleted_at IS NULL
    ` as Array<{ id: string }>;

    if (existing.length > 0) {
      throw new Error('User already has membership in this tenant');
    }

    // Check tenant user limits
    const tenant = await this.getTenantById(data.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const currentUsers = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM user_tenants 
      WHERE tenant_id = ${data.tenantId} AND is_active = true AND deleted_at IS NULL
    ` as Array<{ count: number }>;

    if (currentUsers[0].count >= tenant.maxUsers) {
      throw new Error('Tenant user limit reached');
    }

    // Create membership
    const memberships = await this.prisma.$queryRaw`
      INSERT INTO user_tenants (
        id, user_id, tenant_id, role, is_active, 
        invited_at, joined_at, created_at, updated_at, invited_by
      ) VALUES (
        ${membershipId}, ${data.userId}, ${data.tenantId}, ${data.role}, 
        true, NOW(), NOW(), NOW(), NOW(), ${data.invitedBy || null}
      )
      RETURNING *
    ` as Array<UserTenant>;

    return memberships[0];
  }

  /**
   * Remove user from tenant (soft delete)
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    // Check if user is owner
    const membership = await this.prisma.$queryRaw`
      SELECT role FROM user_tenants 
      WHERE user_id = ${userId} AND tenant_id = ${tenantId} 
      AND is_active = true AND deleted_at IS NULL
    ` as Array<{ role: TenantUserRole }>;

    if (membership.length === 0) {
      throw new Error('User membership not found');
    }

    if (membership[0].role === TenantUserRole.OWNER) {
      // Check if there are other owners
      const otherOwners = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM user_tenants 
        WHERE tenant_id = ${tenantId} AND role = ${TenantUserRole.OWNER} 
        AND is_active = true AND deleted_at IS NULL AND user_id != ${userId}
      ` as Array<{ count: number }>;

      if (otherOwners[0].count === 0) {
        throw new Error('Cannot remove the only owner from tenant');
      }
    }

    // Soft delete membership
    await this.prisma.$queryRaw`
      UPDATE user_tenants 
      SET is_active = false, deleted_at = NOW(), updated_at = NOW
      WHERE user_id = ${userId} AND tenant_id = ${tenantId}
    `;
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(userId: string, tenantId: string, newRole: TenantUserRole): Promise<UserTenant> {
    // Check if membership exists
    const membership = await this.prisma.$queryRaw`
      SELECT * FROM user_tenants 
      WHERE user_id = ${userId} AND tenant_id = ${tenantId} 
      AND is_active = true AND deleted_at IS NULL
    ` as Array<UserTenant>;

    if (membership.length === 0) {
      throw new Error('User membership not found');
    }

    // If changing owner role, ensure there will be at least one owner
    if (membership[0].role === TenantUserRole.OWNER && newRole !== TenantUserRole.OWNER) {
      const otherOwners = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM user_tenants 
        WHERE tenant_id = ${tenantId} AND role = ${TenantUserRole.OWNER} 
        AND is_active = true AND deleted_at IS NULL AND user_id != ${userId}
      ` as Array<{ count: number }>;

      if (otherOwners[0].count === 0) {
        throw new Error('Cannot remove the only owner from tenant');
      }
    }

    // Update role
    const updated = await this.prisma.$queryRaw`
      UPDATE user_tenants 
      SET role = ${newRole}, updated_at = NOW
      WHERE user_id = ${userId} AND tenant_id = ${tenantId}
      RETURNING *
    ` as Array<UserTenant>;

    return updated[0];
  }

  /**
   * Get user's tenants
   */
  async getUserTenants(userId: string): Promise<TenantUser[]> {
    const results = await this.prisma.$queryRaw`
      SELECT 
        u.id, u.name, u.email, u.is_active as user_is_active, u.last_login,
        ut.id as membership_id, ut.role, ut.is_active as membership_is_active,
        ut.invited_at, ut.joined_at, ut.last_active_at, ut.created_at as membership_created_at,
        t.id as tenant_id, t.name as tenant_name, t.slug, t.domain, t.logo,
        t.subscription_plan, t.subscription_status, t.is_active as tenant_is_active
      FROM user_tenants ut
      JOIN users u ON ut.user_id = u.id
      JOIN tenants t ON ut.tenant_id = t.id
      WHERE ut.user_id = ${userId} 
      AND ut.is_active = true 
      AND ut.deleted_at IS NULL
      AND t.deleted_at IS NULL
      ORDER BY ut.joined_at DESC
    ` as Array<any>;

    return results.map(row => ({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: row.user_is_active,
        lastLogin: row.last_login
      },
      tenantMembership: {
        id: row.membership_id,
        userId: userId,
        tenantId: row.tenant_id,
        role: row.role,
        isActive: row.membership_is_active,
        invitedAt: row.invited_at,
        joinedAt: row.joined_at,
        lastActiveAt: row.last_active_at,
        createdAt: row.membership_created_at,
        updatedAt: row.membership_created_at
      }
    }));
  }

  /**
   * Get tenant users
   */
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const results = await this.prisma.$queryRaw`
      SELECT 
        u.id, u.name, u.email, u.is_active as user_is_active, u.last_login,
        ut.id as membership_id, ut.role, ut.is_active as membership_is_active,
        ut.invited_at, ut.joined_at, ut.last_active_at, ut.created_at as membership_created_at,
        ut.invited_by
      FROM user_tenants ut
      JOIN users u ON ut.user_id = u.id
      WHERE ut.tenant_id = ${tenantId} 
      AND ut.is_active = true 
      AND ut.deleted_at IS NULL
      AND u.deleted_at IS NULL
      ORDER BY ut.joined_at ASC
    ` as Array<any>;

    return results.map(row => ({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: row.user_is_active,
        lastLogin: row.last_login
      },
      tenantMembership: {
        id: row.membership_id,
        userId: row.id,
        tenantId: tenantId,
        role: row.role,
        isActive: row.membership_is_active,
        invitedAt: row.invited_at,
        joinedAt: row.joined_at,
        lastActiveAt: row.last_active_at,
        createdAt: row.membership_created_at,
        updatedAt: row.membership_created_at,
        invitedBy: row.invited_by
      }
    }));
  }

  /**
   * Check if user has specific role in tenant
   */
  async hasTenantRole(userId: string, tenantId: string, role: TenantUserRole): Promise<boolean> {
    const result = await this.prisma.$queryRaw`
      SELECT 1 FROM user_tenants 
      WHERE user_id = ${userId} 
      AND tenant_id = ${tenantId} 
      AND role = ${role}
      AND is_active = true 
      AND deleted_at IS NULL
      LIMIT 1
    ` as Array<{ 1: number }>;

    return result.length > 0;
  }

  /**
   * Check if user has any of the specified roles in tenant
   */
  async hasAnyTenantRole(userId: string, tenantId: string, roles: TenantUserRole[]): Promise<boolean> {
    const result = await this.prisma.$queryRaw`
      SELECT 1 FROM user_tenants 
      WHERE user_id = ${userId} 
      AND tenant_id = ${tenantId} 
      AND role = ANY(${roles})
      AND is_active = true 
      AND deleted_at IS NULL
      LIMIT 1
    ` as Array<{ 1: number }>;

    return result.length > 0;
  }

  /**
   * Get user's primary tenant (first joined or most recently active)
   */
  async getPrimaryTenant(userId: string): Promise<Tenant | null> {
    const result = await this.prisma.$queryRaw`
      SELECT t.* FROM tenants t
      JOIN user_tenants ut ON t.id = ut.tenant_id
      WHERE ut.user_id = ${userId}
      AND ut.is_active = true
      AND ut.deleted_at IS NULL
      AND t.deleted_at IS NULL
      ORDER BY 
        CASE WHEN ut.last_active_at IS NOT NULL THEN ut.last_active_at ELSE ut.joined_at END DESC
      LIMIT 1
    ` as Array<Tenant>;

    return result[0] || null;
  }

  /**
   * Update user's last active timestamp in tenant
   */
  async updateLastActive(userId: string, tenantId: string): Promise<void> {
    await this.prisma.$queryRaw`
      UPDATE user_tenants 
      SET last_active_at = NOW(), updated_at = NOW
      WHERE user_id = ${userId} 
      AND tenant_id = ${tenantId} 
      AND is_active = true 
      AND deleted_at IS NULL
    `;
  }

  /**
   * Generate immutable tenant ID
   */
  private generateTenantId(): string {
    return `tn_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate immutable slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Generate membership ID
   */
  private generateMembershipId(): string {
    return `mb_${randomBytes(16).toString('hex')}`;
  }
}

// Export singleton instance
export const createTenantService = (prisma: PrismaClient): TenantService => {
  return new TenantService(prisma);
};
