import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Base report schema for form input
export const reportFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  amount: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0.01, "Amount must be greater than 0"),
  ),
  description: z.string().optional(),
  date: z
    .union([z.date(), z.string().datetime()])
    .transform((val) => new Date(val)),
  category: z.string().min(1, "Please select a category"),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

// Report schema for database/API (extends form schema with additional fields)
export const reportSchema = reportFormSchema.extend({
  id: z.string().uuid(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type for form data input
type ReportFormInputInternal = z.input<typeof reportFormSchema>;

// Type for validated form data output
type ReportFormDataInternal = z.output<typeof reportFormSchema>;

// Type for complete report data (including database fields)
type ReportInternal = z.infer<typeof reportSchema>;

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum(["USER", "ADMIN", "MANAGER", "AUDITOR", "INVENTORY_MANAGER"])
    .default("USER"),
  isActive: z.boolean().default(true),
});

// Company schemas
export const companyFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const companySchema = companyFormSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Account schemas
export const accountFormSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(2, "Account name must be at least 2 characters"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  parentId: z.string().uuid().optional().or(z.null()),
  balance: z.number().default(0),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const accountSchema = accountFormSchema.extend({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Company member schema
export const companyMemberSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.number(),
  role: z.string().default("MEMBER"),
});

// Inventory item schemas
export const inventoryItemFormSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.number().optional(),
  supplierId: z.number().optional(),
  quantity: z.number().min(0, "Quantity must be non-negative").default(0),
  unit: z.string().min(1, "Unit is required"),
  costPrice: z.number().min(0, "Cost price must be non-negative").default(0),
  sellingPrice: z
    .number()
    .min(0, "Selling price must be non-negative")
    .default(0),
  reorderPoint: z
    .number()
    .min(0, "Reorder point must be non-negative")
    .default(0),
  location: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  tenantId: z.string().uuid(),
});

export const inventoryItemSchema = inventoryItemFormSchema.extend({
  id: z.string().uuid(),
  createdById: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Category schemas
export const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
});

export const categorySchema = categoryFormSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Supplier schemas
export const supplierFormSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const supplierSchema = supplierFormSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type CompanyFormInput = z.infer<typeof companyFormSchema>;
export type Company = z.infer<typeof companySchema>;
export type AccountFormInput = z.infer<typeof accountFormSchema>;
export type Account = z.infer<typeof accountSchema>;
export type CompanyMember = z.infer<typeof companyMemberSchema>;
export type InventoryItemFormInput = z.infer<typeof inventoryItemFormSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
export type Category = z.infer<typeof categorySchema>;
export type SupplierFormInput = z.infer<typeof supplierFormSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type {
  ReportFormInputInternal as ReportFormInput,
  ReportFormDataInternal as ReportFormData,
  ReportInternal as Report,
};
