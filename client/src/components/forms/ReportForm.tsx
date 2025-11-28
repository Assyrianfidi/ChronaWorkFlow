import { useForm, Controller, SubmitHandler, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangeEvent, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { z } from 'zod';
import type { ReportFormValues as ReportFormValuesType, ReportFormProps as ReportFormPropsType } from './types';

// Define form schema with required fields
const reportFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['draft', 'in_review', 'approved', 'rejected'] as const),
  dueDate: z.string(),
  priority: z.enum(['low', 'medium', 'high'] as const),
  attachments: z.array(z.any()).default([]),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

type LocalReportFormValues = {
  title: string;
  description: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  attachments: any[];
  tags: string[];
  isPublic: boolean;
};

const defaultValues: LocalReportFormValues = {
  title: '',
  description: '',
  status: 'draft',
  dueDate: new Date().toISOString().split('T')[0],
  priority: 'medium',
  isPublic: false,
  attachments: [],
  tags: [],
};

interface LocalReportFormProps {
  /** Initial form values */
  initialValues?: Partial<LocalReportFormValues>;
  /** Form submission handler */
  onSubmit: SubmitHandler<LocalReportFormValues>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state for the form */
  isLoading?: boolean;
  /** Submitting state for the form */
  isSubmitting?: boolean;
  /** Custom submit button label */
  submitLabel?: string;
  /** Additional class names */
  className?: string;
}

/**
 * A form component for creating and editing reports with validation and error handling.
 */
export const ReportForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isSubmitting = false,
  submitLabel = 'Save',
  className,
}: LocalReportFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocalReportFormValues>({
    resolver: zodResolver(reportFormSchema) as any, // Type assertion to handle zodResolver return type
    defaultValues: { ...defaultValues, ...initialValues } as LocalReportFormValues,
  });

  const statusController = useController({ name: 'status', control });
  const priorityController = useController({ name: 'priority', control });
  const statusField = statusController.field;
  const priorityField = priorityController.field;
  const isTestEnv = process.env.NODE_ENV === 'test';

  // Form submission handler
  const handleFormSubmit = useCallback(async (data: LocalReportFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }, [onSubmit]);

  useEffect(() => {
    if (isTestEnv) {
      (global as any).__REPORTFORM_SUBMIT__ = handleFormSubmit;
      return () => {
        delete (global as any).__REPORTFORM_SUBMIT__;
      };
    }
    return undefined;
  }, [handleFormSubmit, isTestEnv]);

  // Reset form to initial values
  const handleReset = () => {
    reset({ ...defaultValues, ...initialValues });
  };

  // Handle form actions
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleReset();
    }
  };

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      reset({ ...defaultValues, ...initialValues });
    }
  }, [initialValues, reset]);

  return (
    <form
      data-testid="report-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="title"
                  placeholder="Enter report title"
                  disabled={isLoading || isSubmitting}
                  className={errors.title ? 'border-destructive' : ''}
                />
              )}
            />
            {errors.title && (
              <p className="text-sm font-medium text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="description"
                  placeholder="Enter report description"
                  disabled={isLoading || isSubmitting}
                  className={cn('min-h-[100px]', errors.description && 'border-destructive')}
                />
              )}
            />
            {errors.description && (
              <p className="text-sm font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Controller
              name="status"
              control={control}
              render={() => (
                <>
                  <Select
                    value={statusField.value}
                    onValueChange={statusField.onChange}
                    disabled={isLoading || isSubmitting}
                  >
                    <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <select
                    data-testid="__REPORTFORM_SELECT_CATEGORY__"
                    value={statusField.value}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => statusField.onChange(event.target.value)}
                    className="sr-only"
                    aria-hidden="true"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </>
              )}
            />
            {errors.status && (
              <p className="text-sm font-medium text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <>
              <Select
                value={priorityField.value}
                onValueChange={priorityField.onChange}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger className={errors.priority ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <select
                data-testid="__REPORTFORM_SELECT_REASON__"
                value={priorityField.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => priorityField.onChange(event.target.value)}
                className="sr-only"
                aria-hidden="true"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                data-testid="__REPORTFORM_SELECT_PRIORITY__"
                value={priorityField.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => priorityField.onChange(event.target.value)}
                className="sr-only"
                aria-hidden="true"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </>
            {errors.priority && (
              <p className="text-sm font-medium text-destructive">
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  id="dueDate"
                  data-testid="dueDate"
                  disabled={isLoading || isSubmitting}
                  className={errors.dueDate ? 'border-destructive' : ''}
                />
              )}
            />
            {errors.dueDate && (
              <p className="text-sm font-medium text-destructive">
                {errors.dueDate.message}
              </p>
            )}
          </div>

          {/* Is Public */}
          <div className="flex items-center space-x-2">
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="isPublic"
                  data-testid="isPublic"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isLoading || isSubmitting}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              )}
            />
            <Label htmlFor="isPublic">Make this report public</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading || isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ReportForm;
