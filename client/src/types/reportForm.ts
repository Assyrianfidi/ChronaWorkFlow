import { z } from 'zod';

export const REPORT_STATUSES = ['draft', 'in_review', 'approved', 'rejected'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

export interface ReportAuthor {
  id: string;
  name: string;
  email: string;
}

export interface ReportAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface ReportFormData {
  id?: string;
  title: string;
  description: string;
  status: ReportStatus;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  attachments: File[];
  existingAttachments: ReportAttachment[];
  isPublic: boolean;
  tags: string[];
  assigneeId?: string;
  notes?: string;
}

export const reportFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  status: z.enum(REPORT_STATUSES),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  priority: z.enum(['low', 'medium', 'high']),
  attachments: z
    .array(z.instanceof(File))
    .max(5, 'You can upload up to 5 files')
    .refine(
      (files) => files.every((file) => file.size <= 5 * 1024 * 1024),
      'Each file must be less than 5MB'
    ),
  existingAttachments: z.array(z.any()).default([]),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().min(1, 'Tag cannot be empty')).max(5, 'Maximum 5 tags allowed'),
  assigneeId: z.string().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

// Default form values
export const defaultValues: ReportFormValues = {
  title: '',
  description: '',
  status: 'draft',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  priority: 'medium',
  attachments: [],
  existingAttachments: [],
  isPublic: false,
  tags: [],
  notes: '',
};

// Type guard for ReportStatus
export const isReportStatus = (status: string): status is ReportStatus => {
  return REPORT_STATUSES.includes(status as ReportStatus);
};
