"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES_HIERARCHY = exports.ROLES = void 0;
exports.ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  ASSISTANT_MANAGER: "assistant_manager",
  USER: "user",
};
exports.ROLES_HIERARCHY =
  ((_a = {}),
  (_a[exports.ROLES.ADMIN] = 4),
  (_a[exports.ROLES.MANAGER] = 3),
  (_a[exports.ROLES.ASSISTANT_MANAGER] = 2),
  (_a[exports.ROLES.USER] = 1),
  _a);
