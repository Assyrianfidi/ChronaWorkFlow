import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const Reports = () => {
    const [selectedReport, setSelectedReport] = useState('');
    const reports = [
        {
            id: 'balance-sheet',
            name: 'Balance Sheet',
            description: 'Assets, liabilities, and equity summary',
            lastGenerated: '2024-01-15',
            status: 'ready',
            icon: '📊'
        },
        {
            id: 'income-statement',
            name: 'Income Statement',
            description: 'Revenue, expenses, and profit analysis',
            lastGenerated: '2024-01-15',
            status: 'ready',
            icon: '📈'
        },
        {
            id: 'cash-flow',
            name: 'Cash Flow Statement',
            description: 'Operating, investing, and financing activities',
            lastGenerated: '2024-01-14',
            status: 'processing',
            icon: '💰'
        },
        {
            id: 'aging-report',
            name: 'Aging Report',
            description: 'Accounts receivable and payable aging',
            lastGenerated: '2024-01-13',
            status: 'ready',
            icon: '⏰'
        },
        {
            id: 'tax-summary',
            name: 'Tax Summary',
            description: 'Tax liabilities and payments overview',
            lastGenerated: '2024-01-12',
            status: 'ready',
            icon: '🧾'
        },
        {
            id: 'budget-analysis',
            name: 'Budget vs Actual',
            description: 'Budget performance and variance analysis',
            lastGenerated: '2024-01-10',
            status: 'draft',
            icon: '📋'
        }
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'ready':
                return 'bg-green-100 text-green-800';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Financial Reports" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Generate and view comprehensive financial reports" })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center", children: _jsx("span", { className: "text-white text-lg", children: "\uD83D\uDCCA" }) }) }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-blue-800", children: "Quick Report Generation" }), _jsxs("div", { className: "mt-2 text-sm text-blue-700", children: [_jsx("button", { className: "font-medium text-blue-900 underline hover:text-blue-800", children: "Generate All Monthly Reports" }), ' or ', _jsx("button", { className: "font-medium text-blue-900 underline hover:text-blue-800", children: "Schedule Automatic Reports" })] })] })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8", children: reports.map((report) => (_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 text-lg", children: report.icon }) }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: report.name }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`, children: report.status })] })] }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: report.description }), _jsxs("div", { className: "text-sm text-gray-500 mb-4", children: ["Last generated: ", report.lastGenerated] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setSelectedReport(report.id), className: "flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm", children: "View" }), _jsx("button", { className: "flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm", children: "Export" })] })] }) }, report.id))) }), selectedReport && (_jsx("div", { className: "bg-white shadow rounded-lg", children: _jsxs("div", { className: "px-4 py-5 sm:p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: [reports.find(r => r.id === selectedReport)?.name, " Preview"] }), _jsx("button", { onClick: () => setSelectedReport(''), className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center", children: _jsxs("div", { className: "text-gray-400", children: [_jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 17v1a3 3 0 003 3h0a3 3 0 003-3v-1m3-10V4a3 3 0 00-3-3h0a3 3 0 00-3 3v3m0 10h6m-6 0h6" }) }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Report preview would be displayed here" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Full report generation and display would be implemented in production" })] }) })] }) })), _jsx("div", { className: "mt-8 bg-white shadow rounded-lg", children: _jsxs("div", { className: "px-4 py-5 sm:p-6", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Export Options" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("button", { className: "flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDCC4" }), " Export as PDF"] }), _jsxs("button", { className: "flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDCCA" }), " Export as Excel"] }), _jsxs("button", { className: "flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDCCB" }), " Export as CSV"] })] })] }) })] }));
};
export default Reports;
