import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Form, { FormField, FormActions } from "./Form";

const reportSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),
  type: z.enum(["financial", "sales", "inventory", "payroll", "custom"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  parameters: z.record(z.string(), z.any()).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  initialData?: Partial<ReportFormData>;
  onSubmit: (data: ReportFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const ReportForm: React.FC<ReportFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error,
  success,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    setValue,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      type: "financial",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      parameters: {},
      ...initialData,
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      title={initialData ? "Edit Report" : "Generate New Report"}
      description="Configure your report parameters below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField label="Report Title" error={errors.title?.message} required>
        <Input
          {...register("title")}
          placeholder="Enter report title"
          aria-label="Report title"
          aria-invalid={errors.title ? "true" : "false"}
        />
      </FormField>

      <FormField label="Report Type" error={errors.type?.message} required>
        <select
          {...register("type")}
          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          aria-label="Report type"
          aria-invalid={errors.type ? "true" : "false"}
        >
          <option value="financial">Financial Report</option>
          <option value="sales">Sales Report</option>
          <option value="inventory">Inventory Report</option>
          <option value="payroll">Payroll Report</option>
          <option value="custom">Custom Report</option>
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start Date"
          error={errors.startDate?.message}
          required
        >
          <Input
            {...register("startDate")}
            type="date"
            aria-label="Report start date"
            aria-invalid={errors.startDate ? "true" : "false"}
          />
        </FormField>

        <FormField label="End Date" error={errors.endDate?.message} required>
          <Input
            {...register("endDate")}
            type="date"
            aria-label="Report end date"
            aria-invalid={errors.endDate ? "true" : "false"}
          />
        </FormField>
      </div>

      <FormField
        label="Parameters (JSON)"
        error={
          typeof errors.parameters?.message === "string"
            ? errors.parameters.message
            : ""
        }
        description="JSON format for additional report parameters"
      >
        <textarea
          {...register("parameters")}
          rows={4}
          className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          placeholder='{"key": "value"}'
          aria-label="Report parameters"
        />
      </FormField>

      <FormActions>
        <Button
          type="submit"
          disabled={loading || isSubmitting || !isDirty || !isValid}
          aria-label="Submit report"
        >
          {isSubmitting ? "Generating..." : initialData ? "Update" : "Generate"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => reset(initialData)}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default ReportForm;
