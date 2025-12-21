import React from "react";
import { useFormContext, RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  name: string;
  label?: string;
  description?: string;
  className?: string;
  children: React.ReactElement;
  options?: RegisterOptions;
};

export function FormField({
  name,
  label,
  description,
  className,
  children,
  options,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = getNestedError(errors, name);
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-1">
        {React.cloneElement(children, {
          id: name,
          ...(name ? register(name, options) : {}),
          "aria-invalid": error ? "true" : "false",
          ...children.props,
        })}
      </div>
      {errorMessage && (
        <p className="mt-1 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// Helper to get nested form errors
function getNestedError(
  errors: Record<string, any>,
  path: string,
): { message?: string } | undefined {
  return path.split(".").reduce((obj, key) => {
    if (!obj) return undefined;
    return obj[key];
  }, errors);
}
