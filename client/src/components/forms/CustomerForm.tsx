import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Form, { FormField, FormActions } from "./Form";

const customerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\d\s\-\(\)]+$/, "Invalid phone number"),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
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
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      ...initialData,
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: CustomerFormData) => {
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
      title={initialData ? "Edit Customer" : "Add New Customer"}
      description="Fill in the customer information below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField label="Full Name" error={errors.name?.message} required>
        <Input
          {...register("name")}
          placeholder="Enter customer name"
          aria-label="Customer full name"
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
      </FormField>

      <FormField
        label="Email Address"
        error={errors.email?.message}
        required
        description="We'll use this for invoices and notifications"
      >
        <Input
          {...register("email")}
          type="email"
          placeholder="customer@example.com"
          aria-label="Customer email address"
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
      </FormField>

      <FormField label="Phone Number" error={errors.phone?.message} required>
        <Input
          {...register("phone")}
          type="tel"
          placeholder="(555) 123-4567"
          aria-label="Customer phone number"
          aria-invalid={errors.phone ? "true" : "false"}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
      </FormField>

      <FormField label="Company" error={errors.company?.message}>
        <Input
          {...register("company")}
          placeholder="Company name (optional)"
          aria-label="Customer company name"
        />
      </FormField>

      <FormField label="Address" error={errors.address?.message}>
        <Input
          {...register("address")}
          placeholder="Street address"
          aria-label="Customer street address"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" error={errors.city?.message}>
          <Input
            {...register("city")}
            placeholder="City"
            aria-label="Customer city"
          />
        </FormField>

        <FormField label="State" error={errors.state?.message}>
          <Input
            {...register("state")}
            placeholder="State"
            aria-label="Customer state"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="ZIP Code" error={errors.zipCode?.message}>
          <Input
            {...register("zipCode")}
            placeholder="ZIP or postal code"
            aria-label="Customer ZIP code"
          />
        </FormField>

        <FormField label="Country" error={errors.country?.message}>
          <Input
            {...register("country")}
            placeholder="Country"
            aria-label="Customer country"
          />
        </FormField>
      </div>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          aria-label={initialData ? "Update customer" : "Create customer"}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Customer"
              : "Create Customer"}
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

export default CustomerForm;
