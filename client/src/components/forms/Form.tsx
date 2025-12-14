import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
  success?: string;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      children,
      title,
      description,
      loading,
      error,
      success,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full max-w-md mx-auto">
        {title && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form ref={ref} className={cn("space-y-4", className)} {...props}>
          {children}
        </form>

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  },
);

Form.displayName = "Form";

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  description,
  children,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {children}

      {description && <p className="text-xs text-gray-500">{description}</p>}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({ children, className }) => {
  return <div className={cn("flex space-x-3 pt-4", className)}>{children}</div>;
};

export { FormField, FormActions };
export default Form;
