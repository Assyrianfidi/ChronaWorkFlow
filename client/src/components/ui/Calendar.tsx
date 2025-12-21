import * as React from "react";
import ReactDatePicker from "react-datepicker";
import { cn } from "@/lib/utils";

import "react-datepicker/dist/react-datepicker.css";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date?: Date) => void;
  disabled?: boolean;
  initialFocus?: boolean;
  fromDate?: Date;
  toDate?: Date;
  className?: string;
  mode?: "single";
}

export function Calendar({
  selected,
  onSelect,
  disabled = false,
  fromDate,
  toDate,
  className,
}: CalendarProps) {
  const SingleDatePicker = ReactDatePicker as unknown as React.ComponentType<{
    inline?: boolean;
    selected?: Date;
    onChange?: (date: Date | null) => void;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
  }>;

  return (
    <div className={cn("p-3", className)}>
      <SingleDatePicker
        inline
        selected={selected}
        onChange={(date) => onSelect?.(date ?? undefined)}
        disabled={disabled}
        minDate={fromDate}
        maxDate={toDate}
      />
    </div>
  );
}

export default Calendar;
