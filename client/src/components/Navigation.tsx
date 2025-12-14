import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth/signin");
  };

  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Customers", path: "/customers", icon: "👥" },
    { name: "Invoices", path: "/invoices", icon: "📄" },
    { name: "Reports", path: "/reports", icon: "📈" },
    { name: "Inventory", path: "/inventory", icon: "📦" },
    { name: "Transactions", path: "/transactions", icon: "💳" },
    { name: "Payroll", path: "/payroll", icon: "💰" },
    { name: "Reconciliation", path: "/reconciliation", icon: "🔄" },
    { name: "Vendors", path: "/vendors", icon: "🏢" },
  ];

  const secondaryItems = [
    { name: "Settings", path: "/settings", icon: "⚙️" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  return (
    <nav
      className="bg-white shadow-lg border-b"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <NavLink
                to="/dashboard"
                className="text-xl font-bold text-blue-600 hover:text-blue-700"
                aria-label="AccuBooks home"
              >
                AccuBooks
              </NavLink>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                      isActive
                        ? "border-blue-500 text-gray-900 bg-blue-50"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                    }`
                  }
                  aria-label={`Navigate to ${item.name}`}
                >
                  <span className="mr-2" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.name}
                </NavLink>
              ))}

              {secondaryItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                      isActive
                        ? "border-blue-500 text-gray-900 bg-blue-50"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                    }`
                  }
                  aria-label={`Navigate to ${item.name}`}
                >
                  <span className="mr-2" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <span className="text-sm text-gray-700" aria-label="Current user">
              {user?.name || "Guest"}
            </span>

            {/* Role-specific dashboards */}
            {user?.role && user.role !== "User" && (
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Role-specific dashboards"
                  className="flex items-center"
                >
                  <span className="mr-1">🎯</span>
                  {user.role}
                </Button>

                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <NavLink
                      to="/dashboard/cfo"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      aria-label="CFO Dashboard"
                    >
                      CFO Dashboard
                    </NavLink>
                    <NavLink
                      to="/dashboard/controller"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      aria-label="Controller Dashboard"
                    >
                      Controller Dashboard
                    </NavLink>
                    <NavLink
                      to="/dashboard/project-manager"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      aria-label="Project Manager Dashboard"
                    >
                      Project Manager Dashboard
                    </NavLink>
                    <NavLink
                      to="/dashboard/accountant"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      aria-label="Accountant Dashboard"
                    >
                      Accountant Dashboard
                    </NavLink>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              aria-label="Sign out"
            >
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  }`
                }
                aria-label={`Navigate to ${item.name}`}
              >
                <span className="mr-3" role="img" aria-hidden="true">
                  {item.icon}
                </span>
                {item.name}
              </NavLink>
            ))}

            {secondaryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  }`
                }
                aria-label={`Navigate to ${item.name}`}
              >
                <span className="mr-3" role="img" aria-hidden="true">
                  {item.icon}
                </span>
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || "G"}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.name || "Guest"}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.email || "Not signed in"}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start"
                aria-label="Sign out"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
