import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppDomain(): string {
  // Use custom domain in production, otherwise use the current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we're on the custom domain, use it
    if (hostname.includes('chronaworkflow.com')) {
      return 'https://www.chronaworkflow.com';
    }
    
    // For development or Replit domains
    return window.location.origin;
  }
  
  // Fallback for server-side rendering
  return 'https://www.chronaworkflow.com';
}
