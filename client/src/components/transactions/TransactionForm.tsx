import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTransactionSchema,
  type CreateTransactionFormData,
} from "@/schemas/transaction.schema";
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

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<CreateTransactionFormData>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  companies?: Array<{ id: string; name: string }>;
}

export function TransactionForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading,
  mode = "create",
  companies = [],
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTransactionFormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: defaultValues || {
      type: "INCOME",
      status: "PENDING",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedType = watch("type");
  const selectedStatus = watch("status");
  const selectedCompanyId = watch("companyId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
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
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="Enter transaction description"
            className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ${
              errors.description ? "border-red-500" : ""
            }`}
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            {...register("date")}
            className={errors.date ? "border-red-500" : ""}
          />
          {errors.date && (
            <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Type *</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger className={errors.type ? "border-red-500" : ""}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
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
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
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
          <Label htmlFor="referenceNumber">Reference Number</Label>
          <Input
            id="referenceNumber"
            {...register("referenceNumber")}
            placeholder="Optional reference number"
            className={errors.referenceNumber ? "border-red-500" : ""}
          />
          {errors.referenceNumber && (
            <p className="text-sm text-red-500 mt-1">
              {errors.referenceNumber.message}
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
              ? "Create Transaction"
              : "Update Transaction"}
        </Button>
      </div>
    </form>
  );
}
