import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReportFormValues, reportFormSchema, defaultValues } from '../types/reportForm';
import { useEffect } from 'react';

interface ReportFormProps {
  /** Initial form values */
  initialValues?: Partial<ReportFormValues>;
  /** Form submission handler */
  onSubmit: (values: ReportFormValues) => Promise<void>;
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
}: ReportFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema) as any,
    defaultValues: { ...defaultValues, ...initialValues },
  });

  // Form submission handler
  const handleFormSubmit = async (data: ReportFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

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
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-6', className)}>
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
                <div className="relative">
                  <Input
                    id="title"
                    placeholder="Enter report title"
                    {...field}
                    disabled={isLoading || isSubmitting}
                    className={cn(errors.title && 'border-destructive')}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Enter report description"
                    {...field}
                    disabled={isLoading || isSubmitting}
                    className={cn('min-h-[100px]', errors.description && 'border-destructive')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || isSubmitting}
                  >
                    <SelectTrigger className={cn(errors.status && 'border-destructive')}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || isSubmitting}
                  >
                    <SelectTrigger className={cn(errors.priority && 'border-destructive')}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.priority.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Is Public */}
          <div className="flex items-center space-x-2">
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isPublic"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || isSubmitting}
                />
              )}
            />
            <Label htmlFor="isPublic">Make this report public</Label>
          </div>

          {/* Tags - Will be implemented in a future update */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="text-sm text-muted-foreground">Tag functionality coming soon</div>
          </div>

          {/* File Upload - Will be implemented in a future update */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="text-sm text-muted-foreground">File upload functionality coming soon</div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading || isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          {onCancel ? 'Cancel' : 'Reset'}
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || isSubmitting}
          className="min-w-[100px]"
        >
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
