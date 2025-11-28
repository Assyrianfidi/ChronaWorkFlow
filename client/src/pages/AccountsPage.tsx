import React, { useEffect, useState } from 'react';
import { useAccounts } from '../contexts/AccountsContext';
import { Button } from '../components/ui/button';

const AccountsPage: React.FC = () => {
  const { state, fetchAccounts, createAccount, updateAccount, adjustBalance, clearError } = useAccounts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET' as const,
    description: '',
    balance: '',
  });

  useEffect(() => {
    if (state.selectedCompanyId) {
      fetchAccounts(state.selectedCompanyId);
    }
  }, [state.selectedCompanyId, fetchAccounts]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedCompanyId) return;

    try {
      await createAccount({
        ...formData,
        companyId: state.selectedCompanyId,
        balance: formData.balance || '0',
        isActive: true,
      });
      setShowCreateForm(false);
      setFormData({
        code: '',
        name: '',
        type: 'ASSET',
        description: '',
        balance: '',
      });
    } catch (error) {
      // Error handled in context
    }
  };

  const handleAdjustBalance = async (accountId: string, amount: number) => {
    try {
      await adjustBalance(accountId, amount);
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Account
            </Button>
          </div>

          {state.error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{state.error}</div>
              <button
                onClick={clearError}
                className="ml-2 text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {showCreateForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Account
                  </h3>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Code
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="ASSET">Asset</option>
                        <option value="LIABILITY">Liability</option>
                        <option value="EQUITY">Equity</option>
                        <option value="REVENUE">Revenue</option>
                        <option value="EXPENSE">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Initial Balance
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={state.isLoading}>
                        {state.isLoading ? 'Creating...' : 'Create Account'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {state.isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-500">Loading accounts...</div>
              </div>
            ) : state.accounts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-500">No accounts found. Create your first account to get started.</div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {state.accounts.map((account) => (
                  <li key={account.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {account.code}
                          </p>
                          <p className="ml-2 text-sm text-gray-900 truncate">
                            {account.name}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.type === 'ASSET' ? 'bg-green-100 text-green-800' :
                            account.type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                            account.type === 'EQUITY' ? 'bg-blue-100 text-blue-800' :
                            account.type === 'REVENUE' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {account.type}
                          </span>
                          {account.balance && (
                            <span className="ml-2 text-sm text-gray-500">
                              Balance: ${parseFloat(account.balance).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {account.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {account.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustBalance(account.id, 100)}
                        >
                          +$100
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustBalance(account.id, -100)}
                        >
                          -$100
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;
