import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SidebarNavigation: React.FC = () => {
  const { user } = useAuth();

  const navigationGroups = [
    {
      title: "Main",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: "📊" },
        { name: "Customers", path: "/customers", icon: "👥" },
        { name: "Invoices", path: "/invoices", icon: "📄" },
        { name: "Reports", path: "/reports", icon: "📈" },
      ],
    },
    {
      title: "Operations",
      items: [
        { name: "Inventory", path: "/inventory", icon: "📦" },
        { name: "Transactions", path: "/transactions", icon: "💳" },
        { name: "Payroll", path: "/payroll", icon: "💰" },
        { name: "Reconciliation", path: "/reconciliation", icon: "🔄" },
        { name: "Vendors", path: "/vendors", icon: "🏢" },
      ],
    },
    {
      title: "Account",
      items: [
        { name: "Profile", path: "/profile", icon: "👤" },
        { name: "Settings", path: "/settings", icon: "⚙️" },
      ],
    },
  ];

  return (
    <nav
      className="w-64 bg-white shadow-lg h-full border-r border-gray-200"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">AccuBooks</h2>

        {navigationGroups.map((group, groupIndex) => (
          <div key={group.title} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                    aria-label={`Navigate to ${item.name}`}
                  >
                    <span className="mr-3" role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Role-specific dashboards */}
        {user?.role && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Role Dashboards
            </h3>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/dashboard/cfo"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                  aria-label="Navigate to CFO Dashboard"
                >
                  <span className="mr-3" role="img" aria-hidden="true">
                    🎯
                  </span>
                  CFO Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/controller"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                  aria-label="Navigate to Controller Dashboard"
                >
                  <span className="mr-3" role="img" aria-hidden="true">
                    🎯
                  </span>
                  Controller Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/project-manager"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                  aria-label="Navigate to Project Manager Dashboard"
                >
                  <span className="mr-3" role="img" aria-hidden="true">
                    🎯
                  </span>
                  Project Manager Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/accountant"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                  aria-label="Navigate to Accountant Dashboard"
                >
                  <span className="mr-3" role="img" aria-hidden="true">
                    🎯
                  </span>
                  Accountant Dashboard
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
