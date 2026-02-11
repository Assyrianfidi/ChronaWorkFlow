import { z } from "zod";

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  customerId: z.string().optional(),
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters"),
  companyId: z.string().min(1, "Company is required"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive("Quantity must be positive"),
        unitPrice: z.number().positive("Unit price must be positive"),
        amount: z.number().positive("Amount must be positive"),
      }),
    )
    .optional(),
});

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  dueDate: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof updateInvoiceSchema>;
