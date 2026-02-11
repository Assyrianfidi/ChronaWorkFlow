import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  type CreateUserFormData,
} from "../../schemas/user.schema";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormProps {
  onSubmit: (data: CreateUserFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<CreateUserFormData>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function UserForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading,
  mode = "create",
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: defaultValues || {
      role: "USER",
    },
  });

  const selectedRole = watch("role");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter full name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="user@example.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {mode === "create" && (
          <div>
            <Label htmlFor="password">
              Password {mode === "create" && "*"}
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder={
                mode === "create"
                  ? "Min 8 characters"
                  : "Leave blank to keep current"
              }
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
            {mode === "create" && (
              <p className="text-sm text-gray-500 mt-1">
                If not provided, a default password will be set
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setValue("role", value as any)}
          >
            <SelectTrigger className={errors.role ? "border-red-500" : ""}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="AUDITOR">Auditor</SelectItem>
              <SelectItem value="INVENTORY_MANAGER">
                Inventory Manager
              </SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
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
              ? "Create User"
              : "Update User"}
        </Button>
      </div>
    </form>
  );
}
