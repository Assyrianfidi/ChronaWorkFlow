import { useState, useCallback, useEffect } from "react";
import { useForm, FormState } from "react-hook-form";
import { z } from "zod";
import { formatValidationErrors, validateField, validateForm } from "./utils";

// Real-time validation hook
export const useRealTimeValidation = <T extends Record<string, any>>(
  schema: z.ZodTypeAny,
  initialData?: T,
) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldValidities, setFieldValidities] = useState<
    Record<string, boolean>
  >({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateFieldRealTime = useCallback(
    (fieldName: string, value: any) => {
      const error = validateField(schema as any, fieldName, value);
      const isValid = !error;

      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: error || "",
      }));

      setFieldValidities((prev) => ({
        ...prev,
        [fieldName]: isValid,
      }));

      return isValid;
    },
    [schema],
  );

  const validateAllFields = useCallback(
    (data: T) => {
      const result = validateForm(schema, data);

      if (result.success) {
        setFieldErrors({});
        setFieldValidities(
          Object.keys(data).reduce(
            (acc, key) => ({
              ...acc,
              [key]: true,
            }),
            {},
          ),
        );
        setIsFormValid(true);
        return true;
      }

      {
        const errors = formatValidationErrors(
          (result as { success: false; errors: z.ZodIssue[] }).errors,
        );
        setFieldErrors(errors);
        setFieldValidities(
          Object.keys(data).reduce(
            (acc, key) => ({
              ...acc,
              [key]: !errors[key],
            }),
            {},
          ),
        );
        setIsFormValid(false);
        return false;
      }
    },
    [schema],
  );

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    setFieldValidities((prev) => ({
      ...prev,
      [fieldName]: false,
    }));
  }, []);

  const resetValidation = useCallback(() => {
    setFieldErrors({});
    setFieldValidities({});
    setIsFormValid(false);
  }, []);

  return {
    fieldErrors,
    fieldValidities,
    isFormValid,
    validateFieldRealTime,
    validateAllFields,
    clearFieldError,
    resetValidation,
  };
};

// Form submission with validation hook
export const useFormSubmission = <T extends Record<string, any>>(
  schema: z.ZodSchema,
  onSubmit: (data: T) => Promise<void>,
  options?: {
    resetOnSubmit?: boolean;
    validateOnChange?: boolean;
    showConfirmDialog?: boolean;
  },
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);

  const {
    fieldErrors,
    fieldValidities,
    isFormValid,
    validateFieldRealTime,
    validateAllFields,
    clearFieldError,
    resetValidation,
  } = useRealTimeValidation(schema);

  const handleSubmit = useCallback(
    async (data: T) => {
      if (!validateAllFields(data)) {
        setSubmitError("Please fix validation errors before submitting");
        return;
      }

      if (options?.showConfirmDialog) {
        const confirmed = window.confirm(
          "Are you sure you want to submit this form?",
        );
        if (!confirmed) return;
      }

      setIsSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      try {
        await onSubmit(data);
        setSubmitSuccess("Form submitted successfully!");

        if (options?.resetOnSubmit) {
          resetValidation();
          setIsDirty(false);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Submission failed",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateAllFields, onSubmit, options, resetValidation],
  );

  const handleReset = useCallback(() => {
    resetValidation();
    setIsDirty(false);
    setSubmitError("");
    setSubmitSuccess("");
  }, [resetValidation]);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    isDirty,
    setIsDirty,
    fieldErrors,
    fieldValidities,
    isFormValid,
    validateFieldRealTime,
    validateAllFields,
    clearFieldError,
    handleSubmit,
    handleReset,
  };
};

// Auto-save form hook
export const useAutoSave = <T extends Record<string, any>>(
  key: string,
  data: T,
  interval: number = 30000, // 30 seconds default
) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveToStorage = useCallback(
    async (dataToSave: T) => {
      setIsSaving(true);
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            data: dataToSave,
            timestamp: new Date().toISOString(),
          }),
        );
        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [key],
  );

  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.error("Load from storage failed:", error);
    }
    return null;
  }, [key]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(key);
    setLastSaved(null);
  }, [key]);

  // Auto-save effect
  useEffect(() => {
    const saveTimer = setInterval(() => {
      if (data && Object.keys(data).length > 0) {
        saveToStorage(data);
      }
    }, interval);

    return () => clearInterval(saveTimer);
  }, [data, interval, saveToStorage]);

  return {
    lastSaved,
    isSaving,
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
};

// Form progress tracking hook
export const useFormProgress = (
  fields: string[],
  fieldValidities: Record<string, boolean>,
) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const validFields = Object.entries(fieldValidities).filter(
      ([field, isValid]) => fields.includes(field) && isValid,
    ).length;

    const totalFields = fields.length;
    const progressPercentage =
      totalFields > 0 ? (validFields / totalFields) * 100 : 0;

    setProgress(progressPercentage);
  }, [fields, fieldValidities]);

  const getProgressStatus = useCallback(() => {
    if (progress === 0) return "not-started";
    if (progress < 50) return "in-progress";
    if (progress < 100) return "almost-complete";
    return "complete";
  }, [progress]);

  return {
    progress,
    progressStatus: getProgressStatus(),
    isComplete: progress === 100,
    isInProgress: progress > 0 && progress < 100,
  };
};
