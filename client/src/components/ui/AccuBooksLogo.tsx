import React from 'react';
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';

interface AccuBooksLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "monogram";
}

const AccuBooksLogo = React.forwardRef<SVGSVGElement, AccuBooksLogoProps>(
  ({ className, size = "md", variant = "full", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
    };

    if (variant === "monogram") {
      return (
        <svg
          ref={ref}
          className={cn(sizeClasses[size], className)}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <rect width="100" height="100" rx="20" fill="#007bff" />
          <path d="M30 35L50 25L70 35V65L50 75L30 65V35Z" fill="white" />
          <path d="M40 45L50 40L60 45V55L50 60L40 55V45Z" fill="#007bff" />
          <path d="M45 50L50 47.5L55 50V52.5L50 55L45 52.5V50Z" fill="white" />
        </svg>
      );
    }

    if (variant === "icon") {
      return (
        <svg
          ref={ref}
          className={cn(sizeClasses[size], className)}
          viewBox="0 0 120 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <rect width="40" height="40" rx="8" fill="#007bff" />
          <path d="M12 14L20 10L28 14V26L20 30L12 26V14Z" fill="white" />
          <path d="M16 18L20 16L24 18V22L20 24L16 22V18Z" fill="#007bff" />
          <path d="M18 20L20 19L22 20V21L20 22L18 21V20Z" fill="white" />
          <text
            x="48"
            y="28"
            fontFamily="Inter, sans-serif"
            fontSize="20"
            fontWeight="700"
            fill="#007bff"
          >
            AccuBooks
          </text>
        </svg>
      );
    }

    return (
      <svg
        ref={ref}
        className={cn("w-32 h-10", className)}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect width="60" height="60" rx="12" fill="#007bff" />
        <path d="M18 21L30 15L42 21V39L30 45L18 39V21Z" fill="white" />
        <path d="M24 27L30 24L36 27V33L30 36L24 33V27Z" fill="#007bff" />
        <path d="M27 30L30 28.5L33 30V31.5L30 33L27 31.5V30Z" fill="white" />
        <text
          x="72"
          y="42"
          fontFamily="Inter, sans-serif"
          fontSize="28"
          fontWeight="800"
          fill="#007bff"
        >
          AccuBooks
        </text>
        <text
          x="72"
          y="52"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          fontWeight="400"
          fill="#6c757d"
        >
          Enterprise Accounting
        </text>
      </svg>
    );
  },
);
AccuBooksLogo.displayName = "AccuBooksLogo";

export { AccuBooksLogo };
