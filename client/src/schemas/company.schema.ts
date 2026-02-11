import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  description: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
