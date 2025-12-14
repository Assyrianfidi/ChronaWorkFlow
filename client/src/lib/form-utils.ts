import { UseFormSetError } from "react-hook-form";
import { toast } from '../components/ui/use-toast.js';

type FormError = {
  message: string;
  field?: string;
};

type FormSubmitHandler<T> = (
  data: T,
  setError: UseFormSetError<any>,
  reset?: () => void,
) => Promise<{ success: boolean; message: string }>;

export async function handleFormSubmit<T>(
  data: T,
  submitFn: FormSubmitHandler<T>,
  setError: UseFormSetError<any>,
  onSuccess?: () => void,
  reset?: () => void,
) {
  try {
    const result = await submitFn(data, setError, reset);

    if (result.success) {
      toast({
        title: "Success",
        description: result.message || "Operation completed successfully",
        variant: "default",
      });

      if (onSuccess) {
        onSuccess();
      }

      if (reset) {
        reset();
      }
    } else {
      toast({
        title: "Error",
        description: result.message || "An error occurred",
        variant: "destructive",
      });
    }

    return result;
  } catch (error) {
    console.error("Form submission error:", error);

    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });

    return { success: false, message: "An unexpected error occurred" };
  }
}

export function formatFormErrors(errors: Record<string, any>): FormError[] {
  return Object.entries(errors).map(([key, value]) => ({
    field: key,
    message: value?.message || "Invalid field",
  }));
}

export function setFormErrors(
  errors: FormError[],
  setError: UseFormSetError<any>,
) {
  errors.forEach(({ field, message }) => {
    if (field) {
      setError(field, { type: "manual", message });
    }
  });
}
