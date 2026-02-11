import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCompanySchema,
  type CreateCompanyFormData,
} from "@/schemas/company.schema";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/label";

interface CompanyFormProps {
  onSubmit: (data: CreateCompanyFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<CreateCompanyFormData>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function CompanyForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading,
  mode = "create",
}: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: defaultValues || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter company name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="Enter company description"
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
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            {...register("industry")}
            placeholder="e.g., Technology, Finance, Healthcare"
            className={errors.industry ? "border-red-500" : ""}
          />
          {errors.industry && (
            <p className="text-sm text-red-500 mt-1">
              {errors.industry.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            {...register("website")}
            placeholder="https://example.com"
            className={errors.website ? "border-red-500" : ""}
          />
          {errors.website && (
            <p className="text-sm text-red-500 mt-1">
              {errors.website.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="contact@company.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="+1 (555) 123-4567"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
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
              ? "Create Company"
              : "Update Company"}
        </Button>
      </div>
    </form>
  );
}
