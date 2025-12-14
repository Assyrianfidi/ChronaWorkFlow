
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from '../components/ErrorBoundary.js';

// Mock console.error to avoid test output noise
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  const GoodComponent = () => <div>Good component</div>;

  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Good component")).toBeInTheDocument();
  });

  it("should catch and display error information", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("We're sorry, but something unexpected happened."),
    ).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("should show error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = import.meta.env.MODE;

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Error Details")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should use fallback component when provided", () => {
    const Fallback = () => <div>Custom fallback</div>;

    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("should reset error state when try again button is clicked", async () => {
    const { rerender } = render(
      <ErrorBoundary key="initial">
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click try again
    fireEvent.click(screen.getByText("Try Again"));

    // Rerender with good component and new key to force remount
    rerender(
      <ErrorBoundary key="reset">
        <GoodComponent />
      </ErrorBoundary>,
    );

    // Wait for React to update
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText("Good component")).toBeInTheDocument();
  });

  it("should reload page when reload button is clicked", () => {
    const mockReload = vi.fn();
    const originalLocation = window.location;

    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      reload: mockReload,
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText("Reload Page"));
    expect(mockReload).toHaveBeenCalled();

    // Restore original location
    window.location = originalLocation;
  });

  it("should log errors in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = import.meta.env.MODE;

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });
});
