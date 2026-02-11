import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInvoiceSchema,
  type CreateInvoiceFormData,
} from "@/schemas/invoice.schema";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface InvoiceFormProps {
  onSubmit: (data: CreateInvoiceFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<CreateInvoiceFormData>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  companies?: Array<{ id: string; name: string }>;
}

export function InvoiceForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading,
  mode = "create",
  companies = [],
}: InvoiceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: defaultValues || {
      status: "DRAFT",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  const selectedStatus = watch("status");
  const selectedCompanyId = watch("companyId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="invoiceNumber">Invoice Number *</Label>
          <Input
            id="invoiceNumber"
            {...register("invoiceNumber")}
            placeholder="INV-001"
            className={errors.invoiceNumber ? "border-red-500" : ""}
          />
          {errors.invoiceNumber && (
            <p className="text-sm text-red-500 mt-1">
              {errors.invoiceNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            {...register("customerName")}
            placeholder="Enter customer name"
            className={errors.customerName ? "border-red-500" : ""}
          />
          {errors.customerName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0.00"
            className={errors.amount ? "border-red-500" : ""}
          />
          {errors.amount && (
            <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            {...register("dueDate")}
            className={errors.dueDate ? "border-red-500" : ""}
          />
          {errors.dueDate && (
            <p className="text-sm text-red-500 mt-1">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setValue("status", value as any)}
          >
            <SelectTrigger className={errors.status ? "border-red-500" : ""}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="companyId">Company *</Label>
          <Select
            value={selectedCompanyId}
            onValueChange={(value) => setValue("companyId", value)}
          >
            <SelectTrigger className={errors.companyId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.length === 0 ? (
                <SelectItem value="none" disabled>
                  No companies available
                </SelectItem>
              ) : (
                companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.companyId && (
            <p className="text-sm text-red-500 mt-1">
              {errors.companyId.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="customerId">Customer ID</Label>
          <Input
            id="customerId"
            {...register("customerId")}
            placeholder="Optional customer ID"
            className={errors.customerId ? "border-red-500" : ""}
          />
          {errors.customerId && (
            <p className="text-sm text-red-500 mt-1">
              {errors.customerId.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Create Invoice"
              : "Update Invoice"}
        </Button>
      </div>
    </form>
  );
}
