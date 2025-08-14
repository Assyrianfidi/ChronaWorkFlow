import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoggedOut from "@/pages/logged-out";
import Dashboard from "@/pages/dashboard";
import Workers from "@/pages/workers";
import TimeTracking from "@/pages/time-tracking";
import WorkerMap from "@/pages/worker-map";
import Clients from "@/pages/clients";
import Projects from "@/pages/projects";
import Invoices from "@/pages/invoices";
import Reports from "@/pages/reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes that don't require authentication */}
      <Route path="/logged-out" component={LoggedOut} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/workers" component={Workers} />
          <Route path="/time-tracking" component={TimeTracking} />
          <Route path="/worker-map" component={WorkerMap} />
          <Route path="/clients" component={Clients} />
          <Route path="/projects" component={Projects} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/reports" component={Reports} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
