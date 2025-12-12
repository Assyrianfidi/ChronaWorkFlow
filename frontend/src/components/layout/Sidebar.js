import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedItems, setExpandedItems] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const menuItems = [
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
    const filteredMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));
    const toggleExpanded = (itemId) => {
        setExpandedItems(prev => prev.includes(itemId)
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId]);
    };
    const isItemActive = (item) => {
        if (location.pathname === item.path)
            return true;
        if (item.subItems) {
            return item.subItems.some(subItem => location.pathname === subItem.path);
        }
        return false;
    };
    const handleItemClick = (item) => {
        if (item.subItems) {
            toggleExpanded(item.id);
        }
        else {
            navigate(item.path);
        }
    };
    return (_jsxs("div", { className: `bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-700", children: [!isCollapsed && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold", children: "A" }) }), _jsx("span", { className: "font-bold text-lg", children: "AccuBooks" })] })), _jsx("button", { onClick: () => setIsCollapsed(!isCollapsed), className: "p-1 rounded hover:bg-gray-700 transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7" }) }) })] }), _jsx("nav", { className: "p-4 space-y-2", children: filteredMenuItems.map(item => (_jsxs("div", { children: [_jsxs("button", { onClick: () => handleItemClick(item), className: `w-full flex items-center justify-between p-3 rounded-lg transition-colors ${isItemActive(item)
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-800 text-gray-300'}`, children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-lg", children: item.icon }), !isCollapsed && _jsx("span", { children: item.label })] }), !isCollapsed && item.subItems && (_jsx("svg", { className: `w-4 h-4 transition-transform ${expandedItems.includes(item.id) ? 'rotate-90' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }))] }), !isCollapsed && item.subItems && expandedItems.includes(item.id) && (_jsx("div", { className: "ml-8 mt-2 space-y-1", children: item.subItems.map(subItem => (_jsxs("button", { onClick: () => navigate(subItem.path), className: `w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${location.pathname === subItem.path
                                    ? 'bg-gray-700 text-white'
                                    : 'hover:bg-gray-800 text-gray-400'}`, children: [_jsx("span", { className: "text-sm", children: subItem.icon }), _jsx("span", { className: "text-sm", children: subItem.label })] }, subItem.id))) }))] }, item.id))) }), _jsx("div", { className: "absolute bottom-4 left-4 right-4", children: !isCollapsed && user && (_jsx("div", { className: "bg-gray-800 rounded-lg p-3", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-medium", children: user.name.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: user.name }), _jsx("p", { className: "text-xs text-gray-400 truncate", children: user.role })] })] }) })) })] }));
};
export default Sidebar;
