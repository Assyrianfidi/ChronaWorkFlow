import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import BusinessAuthPage from "@/pages/business-auth-page";
import AdminAuthPage from "@/pages/admin-auth-page";
import AdminSetup from "@/pages/admin-setup";
import AdminDashboard from "@/pages/admin-dashboard";
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
  const { isAuthenticated, isBusinessUser, isLoading } = useAuth();

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
      <Route path="/business-auth" component={BusinessAuthPage} />
      <Route path="/admin-auth" component={AdminAuthPage} />
      <Route path="/admin-setup" component={AdminSetup} />
      
      {!isAuthenticated ? (
        <Route path="/" component={LandingPage} />
      ) : isBusinessUser ? (
        <>
          {/* Business user routes */}
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/workers" component={Workers} />
          <Route path="/time-tracking" component={TimeTracking} />
          <Route path="/worker-map" component={WorkerMap} />
          <Route path="/clients" component={Clients} />
          <Route path="/projects" component={Projects} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/reports" component={Reports} />
        </>
      ) : (
        <>
          {/* Admin user routes */}
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
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
