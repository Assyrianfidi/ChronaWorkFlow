const fs = require('fs');
const path = require('path');

function fixRoutingNavigation() {
  console.log('🔧 Fixing Routing & Navigation Issues\n');
  
  let fixesApplied = [];
  
  // 1. Create a comprehensive router configuration
  console.log('🛣️  Creating Comprehensive Router Configuration...');
  
  const routerConfig = `import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Lazy loaded components for code splitting
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const SignIn = React.lazy(() => import('@/pages/auth/SignIn'));
const SignUp = React.lazy(() => import('@/pages/auth/SignUp'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const Unauthorized = React.lazy(() => import('@/pages/Unauthorized'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Role-specific dashboards
const CFODashboard = React.lazy(() => import('@/pages/dashboards/CFODashboard'));
const ControllerDashboard = React.lazy(() => import('@/pages/dashboards/ControllerDashboard'));
const ProjectManagerDashboard = React.lazy(() => import('@/pages/dashboards/ProjectManagerDashboard'));
const AccountantDashboard = React.lazy(() => import('@/pages/dashboards/AccountantDashboard'));

// Feature pages
const Customers = React.lazy(() => import('@/pages/Customers'));
const Invoices = React.lazy(() => import('@/pages/Invoices'));
const Reports = React.lazy(() => import('@/pages/Reports'));
const Inventory = React.lazy(() => import('@/pages/Inventory'));
const Transactions = React.lazy(() => import('@/pages/Transactions'));
const Payroll = React.lazy(() => import('@/pages/Payroll'));
const Reconciliation = React.lazy(() => import('@/pages/Reconciliation'));
const Vendors = React.lazy(() => import('@/pages/Vendors'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Role-Specific Dashboards */}
            <Route path="/dashboard/cfo" element={
              <ProtectedRoute requiredRole="CFO">
                <CFODashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/controller" element={
              <ProtectedRoute requiredRole="Controller">
                <ControllerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/project-manager" element={
              <ProtectedRoute requiredRole="ProjectManager">
                <ProjectManagerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/accountant" element={
              <ProtectedRoute requiredRole="Accountant">
                <AccountantDashboard />
              </ProtectedRoute>
            } />
            
            {/* Feature Routes */}
            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            
            <Route path="/customers/:id" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            
            <Route path="/invoices" element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            } />
            
            <Route path="/invoices/:id" element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="/reports/:id" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            
            <Route path="/inventory/:id" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions/:id" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            
            <Route path="/payroll" element={
              <ProtectedRoute>
                <Payroll />
              </ProtectedRoute>
            } />
            
            <Route path="/reconciliation" element={
              <ProtectedRoute>
                <Reconciliation />
              </ProtectedRoute>
            } />
            
            <Route path="/vendors" element={
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            } />
            
            <Route path="/vendors/:id" element={
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            } />
            
            {/* Settings and Profile */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* 404 Route - Must be last */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default AppRouter;`;
  
  fs.writeFileSync('src/router/index.tsx', routerConfig);
  fixesApplied.push('Created comprehensive router configuration with code splitting');
  
  // 2. Create missing page components
  console.log('\n📄 Creating Missing Page Components...');
  
  const pageComponents = [
    {
      name: 'Dashboard',
      path: 'src/pages/Dashboard.tsx',
      content: `import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome to AccuBooks</h2>
              <p className="mt-2 text-gray-600">Your financial management dashboard</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;`
    },
    {
      name: 'SignIn',
      path: 'src/pages/auth/SignIn.tsx',
      content: `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in logic
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;`
    },
    {
      name: 'SignUp',
      path: 'src/pages/auth/SignUp.tsx',
      content: `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign up logic
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </label>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;`
    },
    {
      name: 'Settings',
      path: 'src/pages/Settings.tsx',
      content: `import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Account Settings
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                Manage your account preferences and settings.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;`
    },
    {
      name: 'Profile',
      path: 'src/pages/Profile.tsx',
      content: `import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Profile
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                View and manage your profile information.
              </div>
              <div className="mt-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.name || 'John Doe'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email || 'john@example.com'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.role || 'User'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-sm text-gray-900">Finance</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;`
    },
    {
      name: 'Unauthorized',
      path: 'src/pages/Unauthorized.tsx',
      content: `import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">401</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Unauthorized</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/dashboard">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/auth/signin">
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;`
    },
    {
      name: 'NotFound',
      path: 'src/pages/NotFound.tsx',
      content: `import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mt-2 text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/dashboard">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;`
    },
  ];
  
  pageComponents.forEach(({ name, path, content }) => {
    // Create directory if it doesn't exist
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, content);
      fixesApplied.push(`Created page component: ${name}`);
    }
  });
  
  // 3. Create role-specific dashboard placeholders
  console.log('\n👥 Creating Role-Specific Dashboard Placeholders...');
  
  const roleDashboards = [
    'CFODashboard',
    'ControllerDashboard', 
    'ProjectManagerDashboard',
    'AccountantDashboard'
  ];
  
  roleDashboards.forEach(dashboard => {
    const dashboardPath = `src/pages/dashboards/${dashboard}.tsx`;
    const dashboardDir = 'src/pages/dashboards';
    
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }
    
    if (!fs.existsSync(dashboardPath)) {
      const dashboardContent = `import React from 'react';

const ${dashboard}: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">${dashboard.replace('Dashboard', '')} Dashboard</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">${dashboard.replace('Dashboard', '')} Dashboard</h2>
              <p className="mt-2 text-gray-600">Role-specific dashboard content</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ${dashboard};`;
      
      fs.writeFileSync(dashboardPath, dashboardContent);
      fixesApplied.push(`Created role-specific dashboard: ${dashboard}`);
    }
  });
  
  // 4. Create feature page placeholders
  console.log('\n📄 Creating Feature Page Placeholders...');
  
  const featurePages = [
    'Customers',
    'Invoices',
    'Reports',
    'Inventory',
    'Transactions',
    'Payroll',
    'Reconciliation',
    'Vendors'
  ];
  
  featurePages.forEach(page => {
    const pagePath = `src/pages/${page}.tsx`;
    
    if (!fs.existsSync(pagePath)) {
      const pageContent = `import React from 'react';

const ${page}: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">${page}</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">${page} Management</h2>
              <p className="mt-2 text-gray-600">${page} content and functionality</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ${page};`;
      
      fs.writeFileSync(pagePath, pageContent);
      fixesApplied.push(`Created feature page: ${page}`);
    }
  });
  
  // 5. Create navigation component
  console.log('\n🧭 Creating Navigation Component...');
  
  const navigationComponent = `import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/signin');
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Customers', path: '/customers', icon: '👥' },
    { name: 'Invoices', path: '/invoices', icon: '📄' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Transactions', path: '/transactions', icon: '💳' },
    { name: 'Payroll', path: '/payroll', icon: '💰' },
    { name: 'Reconciliation', path: '/reconciliation', icon: '🔄' },
    { name: 'Vendors', path: '/vendors', icon: '🏢' },
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
              <h1 className="text-xl font-bold text-blue-600">AccuBooks</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    \`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium \${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }\`
                  }
                  aria-label={\`Navigate to \${item.name}\`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700" aria-label="Current user">
              {user?.name}
            </span>
            <NavLink
              to="/profile"
              className="text-sm text-gray-500 hover:text-gray-700"
              aria-label="Go to profile"
            >
              Profile
            </NavLink>
            <NavLink
              to="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
              aria-label="Go to settings"
            >
              Settings
            </NavLink>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              aria-label="Sign out"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;`;
  
  if (!fs.existsSync('src/components/Navigation.tsx')) {
    fs.writeFileSync('src/components/Navigation.tsx', navigationComponent);
    fixesApplied.push('Created accessible navigation component');
  }
  
  // 6. Update main App.tsx to use the router
  console.log('\n🔄 Updating App.tsx to Use Router...');
  
  const appContent = `import React from 'react';
import AppRouter from '@/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;`;
  
  if (fs.existsSync('src/App.tsx')) {
    fs.writeFileSync('src/App.tsx', appContent);
    fixesApplied.push('Updated App.tsx to use comprehensive router');
  }
  
  // 7. Summary
  console.log('\n📊 Routing & Navigation Fix Summary:');
  console.log(`  🔧 Fixes Applied: ${fixesApplied.length}`);
  
  if (fixesApplied.length > 0) {
    console.log('\n✅ Fixes Applied:');
    fixesApplied.forEach(fix => console.log(`  - ${fix}`));
  }
  
  console.log('\n🎯 Routing & Navigation is now optimized for:');
  console.log('  ✅ Comprehensive route structure');
  console.log('  ✅ Authentication protection');
  console.log('  ✅ Code splitting with lazy loading');
  console.log('  ✅ 404 and error handling');
  console.log('  ✅ Accessible navigation');
  console.log('  ✅ Role-based routing');
  console.log('  ✅ Dynamic routes with parameters');
  
  return {
    success: true,
    fixesApplied
  };
}

if (require.main === module) {
  fixRoutingNavigation();
}

module.exports = { fixRoutingNavigation };
