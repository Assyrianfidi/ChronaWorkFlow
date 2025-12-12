export interface ReportFormValues {
  title: string;
  description: string;
  status: "draft" | "in_review" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
  dueDate: string;
  isPublic: boolean;
  tags: string[];
  attachments: File[];
}

export interface ReportFormProps {
  initialValues?: Partial<ReportFormValues>;
  onSubmit: (data: ReportFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  className?: string;
}
