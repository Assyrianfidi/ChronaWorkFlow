"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoleMappings = exports.userRoles = exports.notifications = exports.userPreferences = exports.auditLogs = exports.reconciliationReports = exports.userSessions = exports.refreshTokens = exports.users = exports.userRoleEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// Enums
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['admin', 'manager', 'user']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    role: (0, pg_core_1.text)('role').default('user').notNull(),
    isActive: (0, pg_core_1.boolean)('isActive').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
});
// Refresh Tokens
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('userId').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expiresAt').notNull(),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
});
// User Sessions
exports.userSessions = (0, pg_core_1.pgTable)('user_sessions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('userId').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    ipAddress: (0, pg_core_1.text)('ipAddress'),
    userAgent: (0, pg_core_1.text)('userAgent'),
    expiresAt: (0, pg_core_1.timestamp)('expiresAt').notNull(),
    lastActiveAt: (0, pg_core_1.timestamp)('lastActiveAt').defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
});
// Reconciliation Reports
exports.reconciliationReports = (0, pg_core_1.pgTable)('reconciliation_reports', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    title: (0, pg_core_1.text)('title').notNull(),
    amount: (0, pg_core_1.decimal)('amount', { precision: 19, scale: 4 }).notNull(),
    userId: (0, pg_core_1.integer)('userId').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
});
// Audit Logs
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    action: (0, pg_core_1.text)('action').notNull(),
    entityType: (0, pg_core_1.text)('entityType').notNull(),
    entityId: (0, pg_core_1.integer)('entityId').notNull(),
    userId: (0, pg_core_1.integer)('userId').references(function () { return exports.users.id; }, { onDelete: 'set null' }),
    ipAddress: (0, pg_core_1.text)('ipAddress'),
    userAgent: (0, pg_core_1.text)('userAgent'),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
});
// User Preferences
exports.userPreferences = (0, pg_core_1.pgTable)('user_preferences', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('userId').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    preferences: (0, pg_core_1.jsonb)('preferences').$type().default({}).notNull(),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
}, function (table) { return ({
    userIdUnique: (0, pg_core_1.unique)('user_preferences_user_id_unique').on(table.userId),
}); });
// Notifications
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('userId').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    type: (0, pg_core_1.text)('type').notNull(),
    isRead: (0, pg_core_1.boolean)('isRead').default(false).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}),
    readAt: (0, pg_core_1.timestamp)('readAt'),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
});
// User Roles and Permissions
// This is a junction table for many-to-many relationship between users and roles
exports.userRoles = (0, pg_core_1.pgTable)('user_roles', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    permissions: (0, pg_core_1.text)('permissions').array().notNull().default([]),
    isSystem: (0, pg_core_1.boolean)('isSystem').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('createdAt').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').defaultNow().notNull(),
});
exports.userRoleMappings = (0, pg_core_1.pgTable)('user_role_mappings', {
    userId: (0, pg_core_1.integer)('userId').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    roleId: (0, pg_core_1.integer)('roleId').notNull().references(function () { return exports.userRoles.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, function (table) { return ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.userId, table.roleId] }),
}); });
