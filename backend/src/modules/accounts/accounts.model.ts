import { Prisma } from "@prisma/client";
import { z } from "zod";

export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE",
}

export const accountCreateSchema = z.object({
  companyId: z.string().uuid({ message: "companyId must be a UUID" }),
  code: z.string().min(1, "code is required"),
  name: z.string().min(1, "name is required"),
  type: z.nativeEnum(AccountType),
  parentId: z.string().uuid().optional().nullable(),
  balance: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "balance must be a decimal with up to two places",
    )
    .optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const accountUpdateSchema = accountCreateSchema
  .partial()
  .refine((partial) => Object.keys(partial).length > 0, {
    message: "At least one field must be provided",
  });

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;

export const accountListQuerySchema = z.object({
  companyId: z.string().uuid({ message: "companyId must be a UUID" }),
});

export type AccountBalanceAdjustment = {
  accountId: string;
  amount: Prisma.Decimal | string | number;
};
