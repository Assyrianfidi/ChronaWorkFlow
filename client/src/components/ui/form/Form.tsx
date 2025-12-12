import React from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  FieldValues,
// @ts-ignore
  SubmitHandler as RHFSubmitHandler,
  UseFormReturn,
  DefaultValues,
  UseFormProps,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";
import { cn } from '../lib/utils.js';

type SubmitHandler<T extends FieldValues> = RHFSubmitHandler<T>;

type FormProps<T extends FieldValues> = {
  children: React.ReactNode | ((methods: UseFormReturn<T>) => React.ReactNode);
  schema: ZodType<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: SubmitHandler<T>;
  className?: string;
  id?: string;
};

// @ts-ignore
export function Form<T extends FieldValues>({
  children,
  schema,
  defaultValues,
  onSubmit,
  className,
  id,
}: FormProps<T>) {
  const formOptions: UseFormProps<T> = {
    mode: "onTouched",
  };

  if (schema) {
// @ts-ignore
// @ts-ignore
    formOptions.resolver = zodResolver(schema as any) as any;
  }

  if (defaultValues) {
// @ts-ignore
    formOptions.defaultValues = defaultValues as DefaultValues<T>;
  }

  const methods = useForm<T>(formOptions);

  return (
    <FormProvider {...methods}>
      <form
        id={id}
        onSubmit={methods.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
      >
        {typeof children === "function" ? children(methods) : children}
      </form>
    </FormProvider>
  );
}

type FormFieldProps = {
  name: string;
  label: string;
  description?: string;
  children: React.ReactElement;
  className?: string;
};

export function FormField({
  name,
  label,
  description,
  children,
  className,
}: FormFieldProps) {
  const descriptionId = description ? `${name}-description` : undefined;
  const errorId = `${name}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {description}
        </p>
      )}
      <div className="mt-1">
        {React.cloneElement(children, {
          id: name,
          name,
          "aria-describedby":
            [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
          ...children.props,
        })}
      </div>
      <FormError name={name} id={errorId} />
    </div>
  );
}

type FormErrorProps = {
  name: string;
  id?: string;
  className?: string;
};

export function FormError({ name, id, className }: FormErrorProps) {
  const {
    formState: { errors },
  } = useFormContext();

// @ts-ignore
  const error = getNestedError(errors as Record<string, any>, name);

  if (!error?.message) return null;

  return (
    <p
      id={id || `${name}-error`}
      className={cn("mt-1 text-sm text-red-600 dark:text-red-400", className)}
    >
      {String(error.message)}
    </p>
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

export { useFormContext };
