"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountListQuerySchema =
  exports.accountUpdateSchema =
  exports.accountCreateSchema =
  exports.AccountType =
    void 0;
var zod_1 = require("zod");
var AccountType;
(function (AccountType) {
  AccountType["ASSET"] = "ASSET";
  AccountType["LIABILITY"] = "LIABILITY";
  AccountType["EQUITY"] = "EQUITY";
  AccountType["REVENUE"] = "REVENUE";
  AccountType["EXPENSE"] = "EXPENSE";
})(AccountType || (exports.AccountType = AccountType = {}));
exports.accountCreateSchema = zod_1.z.object({
  companyId: zod_1.z.string().uuid({ message: "companyId must be a UUID" }),
  code: zod_1.z.string().min(1, "code is required"),
  name: zod_1.z.string().min(1, "name is required"),
  type: zod_1.z.nativeEnum(AccountType),
  parentId: zod_1.z.string().uuid().optional().nullable(),
  balance: zod_1.z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "balance must be a decimal with up to two places",
    )
    .optional(),
  description: zod_1.z.string().optional(),
  isActive: zod_1.z.boolean().optional(),
});
exports.accountUpdateSchema = exports.accountCreateSchema.partial().refine(
  function (partial) {
    return Object.keys(partial).length > 0;
  },
  { message: "At least one field must be provided" },
);
exports.accountListQuerySchema = zod_1.z.object({
  companyId: zod_1.z.string().uuid({ message: "companyId must be a UUID" }),
});
