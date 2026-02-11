import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export function AppLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {isMobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}
      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-card shadow-sm z-10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground md:hidden"
                aria-label="Open navigation"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <h1 className="text-xl font-semibold">AccuBooks</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
