import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Form, { FormField, FormActions } from "./Form";

const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(2, "Name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  cost: z.number().min(0, "Cost must be positive"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  category: z.string().optional(),
  supplier: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
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
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: 0,
      cost: 0,
      quantity: 0,
      category: "",
      supplier: "",
      ...initialData,
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: ProductFormData) => {
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
      title={initialData ? "Edit Product" : "Add New Product"}
      description="Fill in the product information below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField label="Product Name" error={errors.name?.message} required>
        <Input
          {...register("name")}
          placeholder="Enter product name"
          aria-label="Product name"
          aria-invalid={errors.name ? "true" : "false"}
        />
      </FormField>

      <FormField label="SKU" error={errors.sku?.message} required>
        <Input
          {...register("sku")}
          placeholder="Enter product SKU"
          aria-label="Product SKU"
          aria-invalid={errors.sku ? "true" : "false"}
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
          placeholder="Product description (optional)"
          aria-label="Product description"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Price" error={errors.price?.message} required>
          <Input
            {...register("price", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Product price"
            aria-invalid={errors.price ? "true" : "false"}
          />
        </FormField>

        <FormField label="Cost" error={errors.cost?.message} required>
          <Input
            {...register("cost", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Product cost"
            aria-invalid={errors.cost ? "true" : "false"}
          />
        </FormField>
      </div>

      <FormField label="Quantity" error={errors.quantity?.message} required>
        <Input
          {...register("quantity", { valueAsNumber: true })}
          type="number"
          placeholder="0"
          aria-label="Product quantity"
          aria-invalid={errors.quantity ? "true" : "false"}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category" error={errors.category?.message}>
          <Input
            {...register("category")}
            placeholder="Product category"
            aria-label="Product category"
          />
        </FormField>

        <FormField label="Supplier" error={errors.supplier?.message}>
          <Input
            {...register("supplier")}
            placeholder="Supplier name"
            aria-label="Product supplier"
          />
        </FormField>
      </div>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          aria-label={initialData ? "Update product" : "Add product"}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Product"
              : "Add Product"}
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

export default ProductForm;
