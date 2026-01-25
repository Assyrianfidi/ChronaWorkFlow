import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Form, { FormField, FormActions } from "./Form";
import type { ReportFormProps, ReportFormValues } from "./types";

const attachmentSchema = typeof File !== "undefined" ? z.instanceof(File) : z.any();

const reportSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["draft", "in_review", "approved", "rejected"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().min(1, "Due date is required"),
  isPublic: z.boolean(),
  tags: z.array(z.string()).optional().default([]),
  attachments: z.array(attachmentSchema).optional().default([]),
});

const defaultValues: ReportFormValues = {
  title: "",
  description: "",
  status: "draft",
  priority: "medium",
  dueDate: new Date().toISOString().split("T")[0],
  isPublic: false,
  tags: [],
  attachments: [],
};

export function ReportForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  className,
}: ReportFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { ...defaultValues, ...initialValues },
    mode: "onSubmit",
  });

  const handleFormSubmit = async (data: ReportFormValues) => {
    try {
      await onSubmit(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)} className={className}>
      <FormField label="Title" error={errors.title?.message} required>
        <Input
          {...register("title")}
          placeholder="Enter report title"
          aria-label="Title"
          aria-invalid={errors.title ? "true" : "false"}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message} required>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          placeholder="Enter report description"
          aria-label="Description"
          aria-invalid={errors.description ? "true" : "false"}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="Status *" error={errors.status?.message} required>
        <select
          {...register("status")}
          data-testid="__REPORTFORM_SELECT_CATEGORY__"
          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          aria-label="Status"
          aria-invalid={errors.status ? "true" : "false"}
          disabled={isSubmitting}
        >
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </FormField>

      <FormField label="Priority *" error={errors.priority?.message} required>
        <select
          {...register("priority")}
          data-testid="__REPORTFORM_SELECT_REASON__"
          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          aria-label="Priority"
          aria-invalid={errors.priority ? "true" : "false"}
          disabled={isSubmitting}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </FormField>

      <FormField label="Due Date" error={errors.dueDate?.message} required>
        <Input
          {...register("dueDate")}
          type="date"
          data-testid="__REPORTFORM_SELECT_PRIORITY__"
          aria-label="Due Date"
          aria-invalid={errors.dueDate ? "true" : "false"}
          disabled={isSubmitting}
        />
      </FormField>

      <div className="flex items-center gap-2">
        <input
          id="isPublic"
          type="checkbox"
          {...register("isPublic")}
          aria-label="Make this report public"
          disabled={isSubmitting}
        />
        <label htmlFor="isPublic" className="text-sm">
          Make this report public
        </label>
      </div>

      <FormActions>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </FormActions>
    </Form>
  );
}

export default ReportForm;
