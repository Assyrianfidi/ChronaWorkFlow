import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

export const transactionLineSchema = z.object({
  accountId: z.string().uuid({ message: "accountId must be uuid" }),
  debit: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "debit must be decimal with up to two digits")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || "0"),
  credit: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "credit must be decimal with up to two digits")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || "0"),
  description: z.string().optional(),
});

export const transactionCreateSchema = z.object({
  companyId: z.string().uuid({ message: "companyId must be uuid" }),
  transactionNumber: z.string().min(1, "transactionNumber required"),
  date: z
    .string()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "date must be valid ISO string",
    ),
  type: z.enum([
    "JOURNAL_ENTRY",
    "INVOICE",
    "PAYMENT",
    "BILL",
    "EXPENSE",
    "ADJUSTMENT",
  ] as const),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
  totalAmount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "totalAmount must be decimal with max two digits",
    ),
  lines: z
    .array(transactionLineSchema)
    .min(2, "At least two ledger lines required"),
});

export const transactionListSchema = z.object({
  companyId: z.string().uuid({ message: "companyId must be uuid" }),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 50)),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionLineInput = z.infer<typeof transactionLineSchema>;

export type Decimal = Prisma.Decimal;

export const toDecimal = (value: string | number): Decimal =>
  new Prisma.Decimal(value);
