import React from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import router from "./routes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import { ToastProvider } from "@/components/ui/EnterpriseToast";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorFallback from "@/components/ErrorFallback";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <ThemeProvider>
      <ViewProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FeatureFlagProvider>
              <ToastProvider>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  <RouterProvider router={router} />
                </ErrorBoundary>
              </ToastProvider>
            </FeatureFlagProvider>
          </AuthProvider>
          {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
      </ViewProvider>
    </ThemeProvider>
  );
}

export default App;
