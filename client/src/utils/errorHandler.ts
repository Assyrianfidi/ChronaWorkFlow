declare global {
  interface Window {
    [key: string]: any;
  }
}

import { useToast } from "../hooks/useToast.js";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public severity: "low" | "medium" | "high" = "medium",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleApiError = (
  error: any,
  toast: ReturnType<typeof useToast>["toast"],
) => {
  console.error("API Error:", error);

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message =
      error.response.data?.error?.message ||
      error.response.data?.message ||
      "Server error occurred";

    switch (status) {
      case 400:
        toast({
          title: "Bad Request",
          description: message,
          variant: "destructive",
        });
        break;
      case 401:
        toast({
          title: "Unauthorized",
          description: "Please log in again",
          variant: "destructive",
        });
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        break;
      case 403:
        toast({
          title: "Forbidden",
          description: "You don't have permission to perform this action",
          variant: "destructive",
        });
        break;
      case 404:
        toast({
          title: "Not Found",
          description: "The requested resource was not found",
          variant: "destructive",
        });
        break;
      case 500:
        toast({
          title: "Server Error",
          description: "Something went wrong on the server",
          variant: "destructive",
        });
        break;
      default:
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
    }
  } else if (error.request) {
    // Network error
    toast({
      title: "Network Error",
      description: "Unable to connect to the server",
      variant: "destructive",
    });
  } else {
    // Other error
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  }
};

export const handleValidationError = (
  error: any,
  toast: ReturnType<typeof useToast>["toast"],
) => {
  console.error("Validation Error:", error);

  const message = error.message || "Validation failed";
  toast({
    title: "Validation Error",
    description: message,
    variant: "destructive",
  });
};

export const handleSuccess = (
  message: string,
  toast: ReturnType<typeof useToast>["toast"],
) => {
  toast({
    title: "Success",
    description: message,
    variant: "success",
  });
};
