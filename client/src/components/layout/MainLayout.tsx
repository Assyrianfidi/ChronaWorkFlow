declare global {
  interface Window {
    [key: string]: any;
  }
}

import * as React from "react";
import { Outlet } from "react-router-dom";
import { EnterpriseSidebar } from "./EnterpriseSidebar";
import { EnterpriseHeader } from "./EnterpriseHeader";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
  user,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { user: authUser } = useAuth();
  const [isMobile, setIsMobile] = React.useState(false);

  // Use the user from props or fallback to auth user
  const currentUser = user || authUser;

  // Handle responsive behavior
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={cn("min-h-screen bg-surface1", className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-enterprise-navy focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex h-screen overflow-hidden bg-surface0">
        {/* Sidebar */}
        <EnterpriseSidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <EnterpriseHeader
            user={
              currentUser
                ? {
                    name: currentUser.name,
                    email: currentUser.email,
                    avatar: currentUser.avatar,
                    role:
                      currentUser.role.charAt(0).toUpperCase() +
                      currentUser.role.slice(1),
                  }
                : undefined
            }
            onSidebarToggle={handleSidebarToggle}
            sidebarOpen={sidebarOpen}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-surface1">
            <div className="container mx-auto px-6 py-6 max-w-7xl">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export { MainLayout };
