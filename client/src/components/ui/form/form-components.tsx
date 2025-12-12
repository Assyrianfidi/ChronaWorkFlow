import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from '../lib/utils.js';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, name, label, description, error, ...props }, ref) => {
    const { register } = useFormContext();
    const inputId = React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-300",
            className,
          )}
          {...(name ? register(name) : {})}
          {...props}
          ref={ref}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  label?: string;
  description?: string;
  error?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, name, options, label, description, error, ...props }, ref) => {
    const { register } = useFormContext();
    const selectId = React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-300",
            className,
          )}
          {...(name ? register(name) : {})}
          {...props}
          ref={ref}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  description?: string;
  error?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, name, label, description, error, ...props }, ref) => {
    const { register } = useFormContext();
    const textareaId = React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-300",
            className,
          )}
          {...(name ? register(name) : {})}
          {...props}
          ref={ref}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  error?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, name, label, description, error, ...props }, ref) => {
    const { register } = useFormContext();
    const checkboxId = React.useId();

    return (
      <div className="space-y-2">
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id={checkboxId}
              type="checkbox"
              className={cn(
                "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
                error && "border-red-500 text-red-600 focus:ring-red-500",
                className,
              )}
              {...(name ? register(name) : {})}
              {...props}
              ref={ref}
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor={checkboxId}
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
            {description && (
              <p className="text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
