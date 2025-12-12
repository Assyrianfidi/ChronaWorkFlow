import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading..." })] }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading..." })] }) }));
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
// Main App Content with Routing
const AppContent = () => {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(Login, {}) }) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "accounts", element: _jsx(Accounts, {}) }), _jsx(Route, { path: "transactions", element: _jsx(Transactions, {}) }), _jsx(Route, { path: "reports", element: _jsx(Reports, {}) }), _jsx(Route, { path: "settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "accounts/customers", element: _jsx(Accounts, {}) }), _jsx(Route, { path: "accounts/vendors", element: _jsx(Accounts, {}) }), _jsx(Route, { path: "accounts/employees", element: _jsx(Accounts, {}) }), _jsx(Route, { path: "transactions/invoices", element: _jsx(Transactions, {}) }), _jsx(Route, { path: "transactions/payments", element: _jsx(Transactions, {}) }), _jsx(Route, { path: "transactions/expenses", element: _jsx(Transactions, {}) }), _jsx(Route, { path: "reports/financial", element: _jsx(Reports, {}) }), _jsx(Route, { path: "reports/aging", element: _jsx(Reports, {}) }), _jsx(Route, { path: "reports/tax", element: _jsx(Reports, {}) }), _jsx(Route, { path: "projects/active", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "projects/budget", element: _jsx(Dashboard, {}) })] }) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }));
};
// Main App Component
const App = () => {
    return (_jsx(Router, { children: _jsx(AuthProvider, { children: _jsx(AppContent, {}) }) }));
};
export default App;
