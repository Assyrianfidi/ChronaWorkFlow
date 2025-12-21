import React from "react";
import { type ReactElement } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/components/ui/button";
import { Input } from "@/components/components/ui/input";
import { Label } from "@/components/components/ui/label";
import { CardContent, CardFooter } from "@/components/components/ui/card";
import { Calendar } from "@/components/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  reportFormSchema,
  type ReportFormInput,
  type ReportFormData,
} from "@/lib/validations/schemas";
import { Textarea } from "@/components/components/ui/textarea";

interface ReportFormProps {
  onSubmit: (data: ReportFormData) => void;
  initialData?: Partial<ReportFormInput>;
  isLoading?: boolean;
  error?: string | null;
  submitButtonText?: string;
  onCancel?: () => void;
}

const categories = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals" },
  { value: "lodging", label: "Lodging" },
  { value: "supplies", label: "Supplies" },
  { value: "other", label: "Other" },
];

export function ReportForm({
  onSubmit,
  isLoading = false,
  error = null,
  submitButtonText = "Submit",
  initialData = {},
  onCancel,
}: ReportFormProps): ReactElement {
  const form = useForm<ReportFormInput>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      amount: initialData?.amount || 0,
      description: initialData?.description || "",
      date: initialData?.date
        ? new Date(initialData.date as string | number)
        : new Date(),
      category: initialData?.category || "",
      status: initialData?.status || "pending",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

  const selectedDate = watch("date");

  const onFormSubmit: SubmitHandler<ReportFormInput> = (data) => {
    onSubmit(data as ReportFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive dark:text-destructive-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter report title"
              {...register("title")}
              disabled={isLoading}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm font-medium text-destructive dark:text-destructive-500">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`pl-8 ${errors.amount ? "border-destructive" : ""}`}
                  {...register("amount", { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
              {errors.amount && (
                <p className="text-sm font-medium text-destructive dark:text-destructive-500">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                      errors.date && "border-destructive",
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(new Date(selectedDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate) : undefined}
                    onSelect={(date) =>
                      date && setValue("date", date, { shouldValidate: true })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm font-medium text-destructive dark:text-destructive-500">
                  {errors.date.message}
                </p>
              )}
            </div>
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 ${errors.category ? "border-destructive" : ""}`}
              {...register("category")}
              disabled={isLoading}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm font-medium text-destructive dark:text-destructive-500">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter a detailed description"
              {...register("description")}
              disabled={isLoading}
              className={`min-h-[100px] ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && (
              <p className="text-sm font-medium text-destructive dark:text-destructive-500">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>

        {/* Form Actions */}
        <CardFooter className="flex justify-end gap-4 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="min-w-[120px]"
          >
            {isLoading || isSubmitting ? "Saving..." : submitButtonText}
          </Button>
        </CardFooter>
      </form>
  );
}
