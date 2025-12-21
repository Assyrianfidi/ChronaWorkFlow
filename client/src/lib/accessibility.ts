import * as React from "react";
import type { ComponentType, ReactNode } from "react";

// Type for HTML elements that can be rendered
type ElementType = keyof JSX.IntrinsicElements | ComponentType<any>;

/**
 * Adds a role and optional className to a component
 */
export const withRole = (role: string, className: string = '') => ({
  role,
  className: `role-${role} ${className}`.trim()
});

/**
 * Adds an aria-label to a component
 */
export const withAriaLabel = (label: string, props: Record<string, any> = {}) => ({
  ...props,
  'aria-label': label
});

interface AccessibleContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementType;
  role?: string;
  children: ReactNode;
}

/**
 * A container component that enforces accessibility best practices
 */
export const AccessibleContainer = React.forwardRef<
  HTMLElement,
  AccessibleContainerProps
>(
  ({ as: Component = 'div', role, className = '', children, ...props }, ref) => {
    return React.createElement(
      Component as React.ElementType,
      {
        ...(props as Record<string, unknown>),
        ref,
        className: `accessible-container ${className}`.trim(),
        role,
      },
      children,
    );
  }
);

AccessibleContainer.displayName = 'AccessibleContainer';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  children: ReactNode;
}

/**
 * An accessible button component with proper ARIA attributes
 */
export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  ({ children, label, className = "", ...props }, ref) =>
    React.createElement(
      "button",
      {
        ...(props as Record<string, unknown>),
        ref,
        type: "button",
        className: `accessible-button ${className}`.trim(),
        "aria-label":
          label || (typeof children === "string" ? children : undefined),
      },
      children,
    ),
);

AccessibleButton.displayName = 'AccessibleButton';

interface AccessibleIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: ComponentType<{ 'aria-hidden'?: boolean }>;
  label: string;
}

/**
 * An accessible icon component with proper ARIA attributes
 */
export const AccessibleIcon = React.forwardRef<
  HTMLSpanElement,
  AccessibleIconProps
>(
  ({ icon: Icon, label, className = "", ...props }, ref) =>
    React.createElement(
      "span",
      {
        ...(props as Record<string, unknown>),
        ref,
        role: "img",
        "aria-label": label,
        className: `inline-flex items-center justify-center ${className}`.trim(),
      },
      React.createElement(Icon, { "aria-hidden": true }),
    ),
);

AccessibleIcon.displayName = 'AccessibleIcon';
