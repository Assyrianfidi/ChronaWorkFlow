import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Clients", href: "/clients", icon: "users" },
  { name: "Transactions", href: "/transactions", icon: "receipt" },
  { name: "Accounting", href: "/accounting", icon: "calculator" },
  { name: "Reports", href: "/reports", icon: "file-text" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

const iconMap = {
  dashboard: <div className="h-6 w-6 text-muted-foreground" />,
  users: <div className="h-6 w-6 text-muted-foreground" />,
  receipt: <div className="h-6 w-6 text-muted-foreground" />,
  calculator: <div className="h-6 w-6 text-muted-foreground" />,
  "file-text": <div className="h-6 w-6 text-muted-foreground" />,
  settings: <div className="h-6 w-6 text-muted-foreground" />,
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className={cn("flex h-screen bg-background", { dark: darkMode })}>
      {/* Mobile sidebar */}
      <div className="md:hidden">{/* Mobile sidebar implementation */}</div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col bg-card text-card-foreground border-r border-border transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-foreground">AccuBooks</h1>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-md" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted"
          >
            {sidebarOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-lg text-sm font-medium",
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                    "transition-colors duration-200",
                  )}
                >
                  <span className="flex-shrink-0">
                    {iconMap[item.icon as keyof typeof iconMap]}
                  </span>
                  {sidebarOpen && <span className="ml-3">{item.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            {sidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background border-b border-border shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-muted mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full text-muted-foreground hover:bg-muted"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              <button className="p-2 rounded-full text-muted-foreground hover:bg-muted relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
              </button>

              <div className="relative">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="hidden md:inline-block text-sm font-medium text-foreground">
                    {user?.name}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
