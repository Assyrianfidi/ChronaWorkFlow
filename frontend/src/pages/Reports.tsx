import React, { useState } from 'react';

const Reports: React.FC = () => {
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

  const getStatusColor = (status: string) => {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-2 text-gray-600">Generate and view comprehensive financial reports</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Quick Report Generation</h3>
            <div className="mt-2 text-sm text-blue-700">
              <button className="font-medium text-blue-900 underline hover:text-blue-800">
                Generate All Monthly Reports
              </button>
              {' or '}
              <button className="font-medium text-blue-900 underline hover:text-blue-800">
                Schedule Automatic Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {reports.map((report) => (
          <div key={report.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">{report.icon}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">{report.description}</p>
              
              <div className="text-sm text-gray-500 mb-4">
                Last generated: {report.lastGenerated}
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedReport(report.id)}
                  className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                >
                  View
                </button>
                <button className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm">
                  Export
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview Section */}
      {selectedReport && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {reports.find(r => r.id === selectedReport)?.name} Preview
              </h3>
              <button 
                onClick={() => setSelectedReport('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a3 3 0 003 3h0a3 3 0 003-3v-1m3-10V4a3 3 0 00-3-3h0a3 3 0 00-3 3v3m0 10h6m-6 0h6" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Report preview would be displayed here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Full report generation and display would be implemented in production
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Export Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <span className="mr-2">📄</span> Export as PDF
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <span className="mr-2">📊</span> Export as Excel
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <span className="mr-2">📋</span> Export as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
