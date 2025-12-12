import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles?: string[];
  subItems?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/dashboard',
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: '👥',
      path: '/accounts',
      roles: ['CFO', 'Controller', 'Accountant'],
      subItems: [
        { id: 'customers', label: 'Customers', icon: '👤', path: '/accounts/customers' },
        { id: 'vendors', label: 'Vendors', icon: '🏢', path: '/accounts/vendors' },
        { id: 'employees', label: 'Employees', icon: '👨‍💼', path: '/accounts/employees' },
      ],
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: '💳',
      path: '/transactions',
      roles: ['CFO', 'Controller', 'Accountant'],
      subItems: [
        { id: 'invoices', label: 'Invoices', icon: '📄', path: '/transactions/invoices' },
        { id: 'payments', label: 'Payments', icon: '💰', path: '/transactions/payments' },
        { id: 'expenses', label: 'Expenses', icon: '📤', path: '/transactions/expenses' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📈',
      path: '/reports',
      roles: ['CFO', 'Controller', 'Project Manager'],
      subItems: [
        { id: 'financial', label: 'Financial', icon: '💹', path: '/reports/financial' },
        { id: 'aging', label: 'Aging Report', icon: '⏰', path: '/reports/aging' },
        { id: 'tax', label: 'Tax Reports', icon: '🧾', path: '/reports/tax' },
      ],
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: '📋',
      path: '/projects',
      roles: ['CFO', 'Project Manager'],
      subItems: [
        { id: 'active', label: 'Active Projects', icon: '🚀', path: '/projects/active' },
        { id: 'budget', label: 'Budget Analysis', icon: '💵', path: '/projects/budget' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings',
      roles: ['CFO', 'Controller'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems) {
      toggleExpanded(item.id);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold text-lg">AccuBooks</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      <nav className="p-4 space-y-2">
        {filteredMenuItems.map(item => (
          <div key={item.id}>
            <button
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                isItemActive(item)
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && item.subItems && (
                <svg
                  className={`w-4 h-4 transition-transform ${
                    expandedItems.includes(item.id) ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {!isCollapsed && item.subItems && expandedItems.includes(item.id) && (
              <div className="ml-8 mt-2 space-y-1">
                {item.subItems.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => navigate(subItem.path)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      location.pathname === subItem.path
                        ? 'bg-gray-700 text-white'
                        : 'hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                    <span className="text-sm">{subItem.icon}</span>
                    <span className="text-sm">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        {!isCollapsed && user && (
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
