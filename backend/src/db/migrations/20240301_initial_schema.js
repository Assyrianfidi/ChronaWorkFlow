"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
var drizzle_orm_1 = require("drizzle-orm");
var index_js_1 = require("../index.js");
function up() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, index_js_1.db.execute((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    -- Create enum type for user roles\n    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');\n\n    -- Create users table\n    CREATE TABLE IF NOT EXISTS users (\n      id SERIAL PRIMARY KEY,\n      name TEXT NOT NULL,\n      email TEXT NOT NULL UNIQUE,\n      password TEXT NOT NULL,\n      role user_role NOT NULL DEFAULT 'user',\n      is_active BOOLEAN NOT NULL DEFAULT true,\n      is_email_verified BOOLEAN NOT NULL DEFAULT false,\n      last_login_at TIMESTAMP,\n      password_reset_token TEXT,\n      password_reset_expires TIMESTAMP,\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create refresh_tokens table\n    CREATE TABLE IF NOT EXISTS refresh_tokens (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      token TEXT NOT NULL UNIQUE,\n      expires_at TIMESTAMP NOT NULL,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_sessions table\n    CREATE TABLE IF NOT EXISTS user_sessions (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      token TEXT NOT NULL UNIQUE,\n      ip_address TEXT,\n      user_agent TEXT,\n      expires_at TIMESTAMP NOT NULL,\n      last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create reconciliation_reports table\n    CREATE TABLE IF NOT EXISTS reconciliation_reports (\n      id SERIAL PRIMARY KEY,\n      title TEXT NOT NULL,\n      description TEXT,\n      amount DECIMAL(19, 4) NOT NULL,\n      status TEXT NOT NULL DEFAULT 'pending',\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      approved_by_id INTEGER REFERENCES users(id),\n      approved_at TIMESTAMP,\n      rejected_at TIMESTAMP,\n      rejection_reason TEXT,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      CONSTRAINT title_user_id UNIQUE (title, user_id)\n    );\n\n    -- Create audit_logs table\n    CREATE TABLE IF NOT EXISTS audit_logs (\n      id SERIAL PRIMARY KEY,\n      action TEXT NOT NULL,\n      entity_type TEXT NOT NULL,\n      entity_id INTEGER NOT NULL,\n      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,\n      ip_address TEXT,\n      user_agent TEXT,\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_preferences table\n    CREATE TABLE IF NOT EXISTS user_preferences (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)\n    );\n\n    -- Create notifications table\n    CREATE TABLE IF NOT EXISTS notifications (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      title TEXT NOT NULL,\n      message TEXT NOT NULL,\n      type TEXT NOT NULL,\n      is_read BOOLEAN NOT NULL DEFAULT false,\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      read_at TIMESTAMP,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_roles table\n    CREATE TABLE IF NOT EXISTS user_roles (\n      id SERIAL PRIMARY KEY,\n      name TEXT NOT NULL UNIQUE,\n      description TEXT,\n      permissions TEXT[] NOT NULL DEFAULT '{}',\n      is_system BOOLEAN NOT NULL DEFAULT false,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_role_mappings table\n    CREATE TABLE IF NOT EXISTS user_role_mappings (\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      PRIMARY KEY (user_id, role_id)\n    );\n  "], ["\n    -- Create enum type for user roles\n    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');\n\n    -- Create users table\n    CREATE TABLE IF NOT EXISTS users (\n      id SERIAL PRIMARY KEY,\n      name TEXT NOT NULL,\n      email TEXT NOT NULL UNIQUE,\n      password TEXT NOT NULL,\n      role user_role NOT NULL DEFAULT 'user',\n      is_active BOOLEAN NOT NULL DEFAULT true,\n      is_email_verified BOOLEAN NOT NULL DEFAULT false,\n      last_login_at TIMESTAMP,\n      password_reset_token TEXT,\n      password_reset_expires TIMESTAMP,\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create refresh_tokens table\n    CREATE TABLE IF NOT EXISTS refresh_tokens (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      token TEXT NOT NULL UNIQUE,\n      expires_at TIMESTAMP NOT NULL,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_sessions table\n    CREATE TABLE IF NOT EXISTS user_sessions (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      token TEXT NOT NULL UNIQUE,\n      ip_address TEXT,\n      user_agent TEXT,\n      expires_at TIMESTAMP NOT NULL,\n      last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create reconciliation_reports table\n    CREATE TABLE IF NOT EXISTS reconciliation_reports (\n      id SERIAL PRIMARY KEY,\n      title TEXT NOT NULL,\n      description TEXT,\n      amount DECIMAL(19, 4) NOT NULL,\n      status TEXT NOT NULL DEFAULT 'pending',\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      approved_by_id INTEGER REFERENCES users(id),\n      approved_at TIMESTAMP,\n      rejected_at TIMESTAMP,\n      rejection_reason TEXT,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      CONSTRAINT title_user_id UNIQUE (title, user_id)\n    );\n\n    -- Create audit_logs table\n    CREATE TABLE IF NOT EXISTS audit_logs (\n      id SERIAL PRIMARY KEY,\n      action TEXT NOT NULL,\n      entity_type TEXT NOT NULL,\n      entity_id INTEGER NOT NULL,\n      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,\n      ip_address TEXT,\n      user_agent TEXT,\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_preferences table\n    CREATE TABLE IF NOT EXISTS user_preferences (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)\n    );\n\n    -- Create notifications table\n    CREATE TABLE IF NOT EXISTS notifications (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      title TEXT NOT NULL,\n      message TEXT NOT NULL,\n      type TEXT NOT NULL,\n      is_read BOOLEAN NOT NULL DEFAULT false,\n      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n      read_at TIMESTAMP,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_roles table\n    CREATE TABLE IF NOT EXISTS user_roles (\n      id SERIAL PRIMARY KEY,\n      name TEXT NOT NULL UNIQUE,\n      description TEXT,\n      permissions TEXT[] NOT NULL DEFAULT '{}',\n      is_system BOOLEAN NOT NULL DEFAULT false,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      updated_at TIMESTAMP NOT NULL DEFAULT NOW()\n    );\n\n    -- Create user_role_mappings table\n    CREATE TABLE IF NOT EXISTS user_role_mappings (\n      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n      role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,\n      created_at TIMESTAMP NOT NULL DEFAULT NOW(),\n      PRIMARY KEY (user_id, role_id)\n    );\n  "]))))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function down() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, index_js_1.db.execute((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    DROP TABLE IF EXISTS user_role_mappings CASCADE;\n    DROP TABLE IF EXISTS user_roles CASCADE;\n    DROP TABLE IF EXISTS notifications CASCADE;\n    DROP TABLE IF EXISTS user_preferences CASCADE;\n    DROP TABLE IF EXISTS audit_logs CASCADE;\n    DROP TABLE IF EXISTS reconciliation_reports CASCADE;\n    DROP TABLE IF EXISTS user_sessions CASCADE;\n    DROP TABLE IF EXISTS refresh_tokens CASCADE;\n    DROP TABLE IF EXISTS users CASCADE;\n    DROP TYPE IF EXISTS user_role;\n  "], ["\n    DROP TABLE IF EXISTS user_role_mappings CASCADE;\n    DROP TABLE IF EXISTS user_roles CASCADE;\n    DROP TABLE IF EXISTS notifications CASCADE;\n    DROP TABLE IF EXISTS user_preferences CASCADE;\n    DROP TABLE IF EXISTS audit_logs CASCADE;\n    DROP TABLE IF EXISTS reconciliation_reports CASCADE;\n    DROP TABLE IF EXISTS user_sessions CASCADE;\n    DROP TABLE IF EXISTS refresh_tokens CASCADE;\n    DROP TABLE IF EXISTS users CASCADE;\n    DROP TYPE IF EXISTS user_role;\n  "]))))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Run the migration if this file is executed directly
if (require.main === module) {
    up()
        .then(function () {
        console.log('Migration completed successfully');
        process.exit(0);
    })
        .catch(function (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
var templateObject_1, templateObject_2;
