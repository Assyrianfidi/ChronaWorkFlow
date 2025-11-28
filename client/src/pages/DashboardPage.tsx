import React from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to AccuBooks Dashboard
              </h1>
              {state.user && (
                <div className="mb-6">
                  <p className="text-lg text-gray-600">
                    Hello, {state.user.firstName} {state.user.lastName}!
                  </p>
                  <p className="text-sm text-gray-500">
                    Email: {state.user.email}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Accounts
                  </h3>
                  <p className="text-gray-600">
                    Manage your chart of accounts
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Transactions
                  </h3>
                  <p className="text-gray-600">
                    Create and view transactions
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Reports
                  </h3>
                  <p className="text-gray-600">
                    Generate financial reports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
