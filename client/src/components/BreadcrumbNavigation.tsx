import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const getBreadcrumbName = (path: string) => {
    const nameMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'customers': 'Customers',
      'invoices': 'Invoices',
      'reports': 'Reports',
      'inventory': 'Inventory',
      'transactions': 'Transactions',
      'payroll': 'Payroll',
      'reconciliation': 'Reconciliation',
      'vendors': 'Vendors',
      'settings': 'Settings',
      'profile': 'Profile',
      'cfo': 'CFO Dashboard',
      'controller': 'Controller Dashboard',
      'project-manager': 'Project Manager Dashboard',
      'accountant': 'Accountant Dashboard',
      'signin': 'Sign In',
      'signup': 'Sign Up',
      'unauthorized': 'Unauthorized',
    };
    
    return nameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  if (pathnames.length === 0 || pathnames.length === 1) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <nav 
      className="flex px-4 py-2 text-sm text-gray-600 border-b border-gray-200 bg-white"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        <li>
          <Link 
            to="/dashboard" 
            className="hover:text-blue-600 transition-colors"
            aria-label="Go to dashboard"
          >
            Home
          </Link>
        </li>
        
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <li key={name} className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              {isLast ? (
                <span className="text-gray-900 font-medium">
                  {getBreadcrumbName(name)}
                </span>
              ) : (
                <Link 
                  to={routeTo} 
                  className="hover:text-blue-600 transition-colors"
                  aria-label={`Navigate to ${getBreadcrumbName(name)}`}
                >
                  {getBreadcrumbName(name)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbNavigation;