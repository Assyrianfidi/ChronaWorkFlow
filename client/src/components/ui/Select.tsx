import React from "react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  items: Array<{ value: string; label: React.ReactNode; disabled?: boolean }>;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function collectSelectParts(children: React.ReactNode): {
  placeholder?: string;
  items: Array<{ value: string; label: React.ReactNode; disabled?: boolean }>;
} {
  let placeholder: string | undefined;
  const items: Array<{ value: string; label: React.ReactNode; disabled?: boolean }> = [];

  const visit = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;

      const typeAny = child.type as any;
      const displayName = typeAny?.displayName;

      if (displayName === "SelectValue") {
        const ph = (child.props as any).placeholder;
        if (typeof ph === "string") placeholder = ph;
      }

      if (displayName === "SelectItem") {
        const { value, disabled } = child.props as any;
        items.push({ value, label: child.props.children, disabled });
      }

      if ((child.props as any)?.children) {
        visit((child.props as any).children);
      }
    });
  };

  visit(children);

  return { placeholder, items };
}

export function Select({ value, onValueChange, children, className }: SelectProps) {
  const parts = React.useMemo(() => collectSelectParts(children), [children]);

  const ctxValue = React.useMemo<SelectContextValue>(
    () => ({ value, onValueChange, placeholder: parts.placeholder, items: parts.items }),
    [onValueChange, parts.items, parts.placeholder, value],
  );

  return (
    <SelectContext.Provider value={ctxValue}>
      <select
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
      >
        {parts.placeholder && (
          <option value="" disabled>
            {parts.placeholder}
          </option>
        )}
        {parts.items.map((it) => (
          <option key={it.value} value={it.value} disabled={it.disabled}>
            {it.label as any}
          </option>
        ))}
      </select>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext);
  void ctx;
  void placeholder;
  return null;
}
SelectValue.displayName = "SelectValue";

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ children }: { value: string; disabled?: boolean; children?: React.ReactNode }) {
  return <>{children}</>;
}
SelectItem.displayName = "SelectItem";
