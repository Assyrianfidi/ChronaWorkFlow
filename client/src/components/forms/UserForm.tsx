import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Form, { FormField, FormActions } from "./Form";

const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  role: z.enum(["Admin", "User", "Manager", "Accountant"]),
  department: z.string().optional(),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)]+$/, "Invalid phone number")
    .optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const UserForm: React.FC<UserFormProps> = ({
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
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "User",
      department: "",
      phone: "",
      ...initialData,
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: UserFormData) => {
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
      title={initialData ? "Edit User" : "Add New User"}
      description="Fill in the user information below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField label="Full Name" error={errors.name?.message} required>
        <Input
          {...register("name")}
          placeholder="Enter user name"
          aria-label="User full name"
          aria-invalid={errors.name ? "true" : "false"}
        />
      </FormField>

      <FormField label="Email Address" error={errors.email?.message} required>
        <Input
          {...register("email")}
          type="email"
          placeholder="user@example.com"
          aria-label="User email address"
          aria-invalid={errors.email ? "true" : "false"}
        />
      </FormField>

      <FormField label="Role" error={errors.role?.message} required>
        <select
          {...register("role")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          aria-label="User role"
          aria-invalid={errors.role ? "true" : "false"}
        >
          <option value="User">User</option>
          <option value="Manager">Manager</option>
          <option value="Accountant">Accountant</option>
          <option value="Admin">Admin</option>
        </select>
      </FormField>

      <FormField label="Department" error={errors.department?.message}>
        <Input
          {...register("department")}
          placeholder="Department (optional)"
          aria-label="User department"
        />
      </FormField>

      <FormField label="Phone Number" error={errors.phone?.message}>
        <Input
          {...register("phone")}
          type="tel"
          placeholder="(555) 123-4567"
          aria-label="User phone number"
          aria-invalid={errors.phone ? "true" : "false"}
        />
      </FormField>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          loading={isSubmitting}
          aria-label={initialData ? "Update user" : "Create user"}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update User"
              : "Create User"}
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

export default UserForm;
