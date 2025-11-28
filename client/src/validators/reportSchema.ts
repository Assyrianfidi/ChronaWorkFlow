import { z } from 'zod';

export const reportStatuses = ['DRAFT', 'PENDING', 'APPROVED'] as const;
export type ReportStatus = (typeof reportStatuses)[number];

// Helper function to convert string to number with validation
const toNumber = (val: unknown): number => {
  if (val === '' || val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export const reportFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  amount: z.preprocess(
    toNumber,
    z.number()
      .min(0.01, 'Amount must be greater than 0')
      .max(1_000_000, 'Amount must be less than 1,000,000')
  ),
  description: z.string().optional(),
  status: z
    .enum([reportStatuses[0], ...reportStatuses.slice(1)] as const)
    .default('DRAFT'),
  createdAt: z.date().default(() => new Date()),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const defaultValues: ReportFormValues = {
  title: '',
  amount: 0,
  description: '',
  status: 'DRAFT',
  createdAt: new Date(),
};
