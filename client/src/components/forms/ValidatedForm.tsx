import React, { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { validateField, formatValidationErrors } from "@/validations/utils";

// Enhanced Input with real-time validation
interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  validationSchema?: z.ZodTypeAny;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  showSuccessIndicator?: boolean;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  label,
  error,
  touched = false,
  validationSchema,
  onValidationChange,
  showSuccessIndicator = true,
  className,
  onChange,
  onBlur,
  ...props
}) => {
  const [fieldError, setFieldError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);

      if (validationSchema) {
        const validationError = validateField(
          validationSchema,
          name as any,
          e.target.value,
        );
        setFieldError(validationError || "");
        setIsValid(!validationError);
        onValidationChange?.(!validationError, validationError || undefined);
      }

      onChange?.(e);
    },
    [name, validationSchema, onValidationChange, onChange],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (validationSchema && isDirty) {
        const validationError = validateField(
          validationSchema,
          name as any,
          e.target.value,
        );
        setFieldError(validationError || "");
        setIsValid(!validationError);
        onValidationChange?.(!validationError, validationError || undefined);
      }

      onBlur?.(e);
    },
    [name, validationSchema, isDirty, onValidationChange, onBlur],
  );

  const displayError = error || fieldError;
  const showError = touched && isDirty && displayError;
  const showSuccess =
    touched && isDirty && isValid && showSuccessIndicator && !displayError;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Input
          id={name}
          name={name}
          className={cn(
            showError && "border-red-500 focus:ring-red-500",
            showSuccess && "border-green-500 focus:ring-green-500",
            className,
          )}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? `${name}-error` : undefined}
          {...props}
        />

        {/* Validation indicators */}
        {showSuccess && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {showError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {showError && (
        <p id={`${name}-error`} className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
};

// Enhanced Form with comprehensive validation feedback
interface EnhancedFormProps {
  schema: z.ZodSchema;
  onSubmit: (data: any, isValid: boolean) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  confirmOnSubmit?: boolean;
  resetOnSubmit?: boolean;
}

const EnhancedForm: React.FC<EnhancedFormProps> = ({
  schema,
  onSubmit,
  children,
  className,
  showProgress = false,
  confirmOnSubmit = false,
  resetOnSubmit = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");
  const [fieldValidations, setFieldValidations] = useState<
    Record<string, boolean>
  >({});

  const {
    handleSubmit,
    formState: { errors, touchedFields, isValid, isDirty },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const handleFieldValidation = useCallback(
    (fieldName: string, isValid: boolean, error?: string) => {
      setFieldValidations((prev) => ({
        ...prev,
        [fieldName]: isValid,
      }));
    },
    [],
  );

  const handleFormSubmit = useCallback(
    async (data: any) => {
      if (confirmOnSubmit) {
        const confirmed = window.confirm(
          "Are you sure you want to submit this form?",
        );
        if (!confirmed) return;
      }

      setIsSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      try {
        await onSubmit(data, isValid);
        setSubmitSuccess("Form submitted successfully!");

        if (resetOnSubmit) {
          reset();
          setFieldValidations({});
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Submission failed",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, isValid, confirmOnSubmit, resetOnSubmit, reset],
  );

  const allFieldsValid = Object.values(fieldValidations).every(Boolean);
  const canSubmit = isValid && isDirty && allFieldsValid;

  // Clone children and inject validation props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === ValidatedInput) {
      return React.cloneElement(child, {
        onValidationChange: handleFieldValidation,
      } as any);
    }
    return child;
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.keys(fieldValidations).length / Object.keys(schema.shape).length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Error and success messages */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{submitSuccess}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {enhancedChildren}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setFieldValidations({});
              setSubmitError("");
              setSubmitSuccess("");
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>

          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { ValidatedInput, EnhancedForm };
export default ValidatedInput;
