import { useEffect, useRef } from "react";
import { useFormContext, FieldValues } from "react-hook-form";
import { debounce } from "lodash";

interface UseAutoSaveProps<T> {
  onSave: (data: T) => Promise<void> | void;
  delay?: number;
  enabled?: boolean;
}

// @ts-ignore
export function useAutoSave<T extends FieldValues>({
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveProps<T>) {
  const form = useFormContext<T>();
  const isFirstRender = useRef(true);
  const previousValues = useRef<T>();

  // Create a debounced save function
  const debouncedSave = useRef(
    debounce(async (data: T) => {
      try {
        await onSave(data);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, delay),
  ).current;

  // Watch all form values
  const values = form.watch();

  useEffect(() => {
    // Skip the first render and don't save if form is not dirty
    if (isFirstRender.current || !enabled || !form.formState.isDirty) {
      isFirstRender.current = false;
      return;
    }

    // Only save if values have actually changed
    if (JSON.stringify(previousValues.current) !== JSON.stringify(values)) {
      previousValues.current = values;
      debouncedSave(values);
    }
  }, [values, form, debouncedSave, enabled]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    isSaving: form.formState.isSubmitting || form.formState.isValidating,
  };
}
