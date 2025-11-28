export interface FormErrors {
  [key: string]: {
    message: string;
    type?: string;
    ref?: unknown;
  };
}

export interface FormSubmitOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
}
