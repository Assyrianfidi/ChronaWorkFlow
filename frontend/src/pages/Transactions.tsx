import React, { useState } from 'react';

const Transactions: React.FC = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-2 text-gray-600">Manage invoices, payments, and expense tracking</p>
      </div>

      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📄</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                  <dd className="text-lg font-medium text-gray-900">234</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Payments Received</dt>
                  <dd className="text-lg font-medium text-gray-900">$45,678</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📤</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expenses</dt>
                  <dd className="text-lg font-medium text-gray-900">$12,345</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">⏰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                  <dd className="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['all', 'invoices', 'payments', 'expenses'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  filter === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          <li>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-medium">INV</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Invoice #1234</div>
                    <div className="text-sm text-gray-500">ABC Corporation - Due Jan 15, 2024</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">$2,500.00</div>
                    <div className="text-sm text-gray-500">Paid</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">PAY</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Payment #5678</div>
                    <div className="text-sm text-gray-500">XYZ LLC - Received Jan 10, 2024</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">$1,200.00</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 font-medium">EXP</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Expense #9012</div>
                    <div className="text-sm text-gray-500">Office Supplies - Jan 8, 2024</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">$350.00</div>
                    <div className="text-sm text-gray-500">Approved</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <button className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Create Invoice
        </button>
        <button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Export Transactions
        </button>
      </div>
    </div>
  );
};

export default Transactions;
