import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Form, { FormField, FormActions } from "./Form";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  total: z.number().min(0, "Total must be positive"),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
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
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      customerId: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      subtotal: 0,
      taxRate: 0,
      total: 0,
      status: "draft",
      notes: "",
      ...initialData,
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(initialData);
  };

  return (
    <Form
      title={initialData ? "Edit Invoice" : "Create New Invoice"}
      description="Fill in the invoice details below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField
        label="Invoice Number"
        error={errors.invoiceNumber?.message}
        required
      >
        <Input
          {...register("invoiceNumber")}
          placeholder="INV-001"
          aria-label="Invoice number"
          aria-invalid={errors.invoiceNumber ? "true" : "false"}
        />
      </FormField>

      <FormField
        label="Customer ID"
        error={errors.customerId?.message}
        required
      >
        <Input
          {...register("customerId")}
          placeholder="Customer ID"
          aria-label="Customer ID"
          aria-invalid={errors.customerId ? "true" : "false"}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Issue Date"
          error={errors.issueDate?.message}
          required
        >
          <Input
            {...register("issueDate")}
            type="date"
            aria-label="Invoice issue date"
            aria-invalid={errors.issueDate ? "true" : "false"}
          />
        </FormField>

        <FormField label="Due Date" error={errors.dueDate?.message} required>
          <Input
            {...register("dueDate")}
            type="date"
            aria-label="Invoice due date"
            aria-invalid={errors.dueDate ? "true" : "false"}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Subtotal" error={errors.subtotal?.message} required>
          <Input
            {...register("subtotal", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Invoice subtotal"
            aria-invalid={errors.subtotal ? "true" : "false"}
          />
        </FormField>

        <FormField
          label="Tax Rate (%)"
          error={errors.taxRate?.message}
          required
        >
          <Input
            {...register("taxRate", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Tax rate"
            aria-invalid={errors.taxRate ? "true" : "false"}
          />
        </FormField>
      </div>

      <FormField label="Total" error={errors.total?.message} required>
        <Input
          {...register("total", { valueAsNumber: true })}
          type="number"
          step="0.01"
          placeholder="0.00"
          aria-label="Invoice total"
          aria-invalid={errors.total ? "true" : "false"}
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message} required>
        <select
          {...register("status")}
          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          aria-label="Invoice status"
          aria-invalid={errors.status ? "true" : "false"}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </FormField>

      <FormField
        label="Notes"
        error={errors.notes?.message}
        description="Additional notes or terms for this invoice"
      >
        <textarea
          {...register("notes")}
          rows={4}
          className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          placeholder="Enter any additional notes..."
          aria-label="Invoice notes"
        />
      </FormField>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          aria-label={initialData ? "Update invoice" : "Create invoice"}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Invoice"
              : "Create Invoice"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default InvoiceForm;
