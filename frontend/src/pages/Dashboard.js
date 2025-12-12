import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuth();
    const getRoleSpecificMetrics = () => {
        switch (user?.role) {
            case 'CFO':
                return {
                    revenue: '$2,456,789',
                    expenses: '$1,234,567',
                    profit: '$1,222,222',
                    growth: '+12.5%'
                };
            case 'Controller':
                return {
                    transactions: '1,234',
                    accounts: '456',
                    reconciled: '98.5%',
                    pending: '23'
                };
            case 'Project Manager':
                return {
                    projects: '12',
                    active: '8',
                    completed: '4',
                    budget: '89%'
                };
            case 'Accountant':
                return {
                    invoices: '234',
                    payments: '189',
                    overdue: '12',
                    processed: '95%'
                };
            default:
                return {};
        }
    };
    const metrics = getRoleSpecificMetrics();
    const renderDashboardContent = () => {
        switch (activeTab) {
            case 'overview':
                return _jsx(OverviewDashboard, { userRole: user?.role || '', metrics: metrics });
            case 'financial':
                return _jsx(FinancialDashboard, {});
            case 'reports':
                return _jsx(ReportsDashboard, {});
            case 'analytics':
                return _jsx(AnalyticsDashboard, {});
            default:
                return _jsx(OverviewDashboard, { userRole: user?.role || '', metrics: metrics });
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dashboard Overview" }), _jsxs("p", { className: "mt-2 text-gray-600", children: ["Welcome back! Here's your financial summary for ", user?.role, "."] })] }), _jsx("div", { className: "bg-white border-b border-gray-200 mb-8", children: _jsx("div", { className: "max-w-7xl", children: _jsx("nav", { className: "flex space-x-8", "aria-label": "Tabs", children: ['overview', 'financial', 'reports', 'analytics'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: tab }, tab))) }) }) }), renderDashboardContent()] }));
};
// Overview Dashboard Component
const OverviewDashboard = ({ userRole, metrics }) => {
    return (_jsxs("div", { children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: Object.entries(metrics).map(([key, value]) => (_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-medium", children: key.charAt(0).toUpperCase() }) }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate capitalize", children: key.replace(/([A-Z])/g, ' $1').trim() }), _jsx("dd", { className: "text-lg font-medium text-gray-900", children: value })] }) })] }) }) }, key))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Revenue Trend" }), _jsx("div", { className: "h-64 bg-gray-50 rounded-lg flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Revenue Chart Placeholder" }) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Expense Breakdown" }), _jsx("div", { className: "h-64 bg-gray-50 rounded-lg flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Expense Chart Placeholder" }) })] })] })] }));
};
// Financial Dashboard Component
const FinancialDashboard = () => (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Financial Summary" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center py-2 border-b", children: [_jsx("span", { className: "text-gray-600", children: "Total Revenue" }), _jsx("span", { className: "font-medium text-green-600", children: "$2,456,789" })] }), _jsxs("div", { className: "flex justify-between items-center py-2 border-b", children: [_jsx("span", { className: "text-gray-600", children: "Total Expenses" }), _jsx("span", { className: "font-medium text-red-600", children: "$1,234,567" })] }), _jsxs("div", { className: "flex justify-between items-center py-2 border-b", children: [_jsx("span", { className: "text-gray-600", children: "Net Profit" }), _jsx("span", { className: "font-medium text-blue-600", children: "$1,222,222" })] }), _jsxs("div", { className: "flex justify-between items-center py-2", children: [_jsx("span", { className: "text-gray-600", children: "Profit Margin" }), _jsx("span", { className: "font-medium text-gray-900", children: "49.7%" })] })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { className: "w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Generate Invoice" }), _jsx("button", { className: "w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700", children: "Record Payment" }), _jsx("button", { className: "w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700", children: "Create Report" })] })] })] }));
// Reports Dashboard Component
const ReportsDashboard = () => (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
        { name: 'Balance Sheet', date: '2024-01-15', status: 'Ready' },
        { name: 'Income Statement', date: '2024-01-15', status: 'Ready' },
        { name: 'Cash Flow Report', date: '2024-01-14', status: 'Processing' },
        { name: 'Aging Report', date: '2024-01-13', status: 'Ready' },
        { name: 'Tax Summary', date: '2024-01-12', status: 'Ready' },
        { name: 'Budget Analysis', date: '2024-01-10', status: 'Draft' }
    ].map((report, index) => (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: report.name }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${report.status === 'Ready' ? 'bg-green-100 text-green-800' :
                            report.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`, children: report.status })] }), _jsxs("p", { className: "text-sm text-gray-500 mb-4", children: ["Generated: ", report.date] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { className: "flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700", children: "View" }), _jsx("button", { className: "flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700", children: "Export" })] })] }, index))) }));
// Analytics Dashboard Component
const AnalyticsDashboard = () => (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Performance Metrics" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Revenue Growth" }), _jsx("span", { className: "text-sm font-medium", children: "+12.5%" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full", style: { width: '75%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Cost Efficiency" }), _jsx("span", { className: "text-sm font-medium", children: "89.2%" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: '89.2%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Customer Satisfaction" }), _jsx("span", { className: "text-sm font-medium", children: "94.7%" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-purple-600 h-2 rounded-full", style: { width: '94.7%' } }) })] })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Predictive Insights" }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "p-3 bg-blue-50 border border-blue-200 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("strong", { children: "Revenue Forecast:" }), " Expected 15% growth in Q2 based on current trends"] }) }), _jsx("div", { className: "p-3 bg-green-50 border border-green-200 rounded-lg", children: _jsxs("p", { className: "text-sm text-green-800", children: [_jsx("strong", { children: "Cash Flow:" }), " Positive cash flow projected for next 3 months"] }) }), _jsx("div", { className: "p-3 bg-yellow-50 border border-yellow-200 rounded-lg", children: _jsxs("p", { className: "text-sm text-yellow-800", children: [_jsx("strong", { children: "Expense Alert:" }), " Marketing budget approaching 80% utilization"] }) })] })] })] }));
export default Dashboard;
