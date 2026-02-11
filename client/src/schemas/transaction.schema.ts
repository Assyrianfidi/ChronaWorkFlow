import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  referenceNumber: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
});

export const updateTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .optional(),
  date: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  referenceNumber: z.string().optional(),
});

export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>;
