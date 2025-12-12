import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Profile Information</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-6">
                        <button className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Change Photo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          defaultValue={user?.name?.split(' ')[0]}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          defaultValue={user?.name?.split(' ')[1]}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          defaultValue={user?.email}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <input
                          type="text"
                          defaultValue={user?.role}
                          disabled
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Security Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Current Password</label>
                          <input
                            type="password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">New Password</label>
                          <input
                            type="password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                          <input
                            type="password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                              Two-factor authentication is not enabled. Enable it for added security.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button className="mt-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Enable 2FA
                      </button>
                    </div>

                    <div className="pt-6">
                      <button className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Update Security Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Preferences</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Appearance</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="radio" name="theme" className="form-radio" defaultChecked />
                          <span className="ml-2">Light Theme</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="theme" className="form-radio" />
                          <span className="ml-2">Dark Theme</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="theme" className="form-radio" />
                          <span className="ml-2">System Default</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Notifications</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                          <input type="checkbox" className="form-checkbox" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                          <input type="checkbox" className="form-checkbox" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                          <input type="checkbox" className="form-checkbox" />
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Billing & Subscription</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Current Plan</h4>
                      <p className="text-2xl font-bold text-gray-900">Enterprise Plan</p>
                      <p className="text-sm text-gray-500 mt-1">$299/month per user</p>
                      <div className="mt-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Usage Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-gray-900">1,234</div>
                          <div className="text-sm text-gray-500">Transactions this month</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-gray-900">456</div>
                          <div className="text-sm text-gray-500">Active accounts</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-gray-900">89</div>
                          <div className="text-sm text-gray-500">Team members</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Manage Subscription
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
