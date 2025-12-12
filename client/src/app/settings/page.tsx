import React from 'react';
"use client";

import { MainLayout } from '../components/layout/MainLayout.js';
import {
  EnterpriseDataTable,
  type Column,
} from '../components/ui/EnterpriseDataTable.js';
import { EnterpriseButton } from '../components/ui/EnterpriseButton.js';
import { EnterpriseInput } from '../components/ui/EnterpriseInput.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
// @ts-ignore
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  Database,
  Globe,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";

// Mock data
const usersData = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@accubooks.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2024-01-15 09:30",
    permissions: ["read", "write", "delete", "admin"],
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@accubooks.com",
    role: "Manager",
    status: "Active",
    lastLogin: "2024-01-15 08:15",
    permissions: ["read", "write", "delete"],
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike.chen@accubooks.com",
    role: "Accountant",
    status: "Active",
    lastLogin: "2024-01-14 16:45",
    permissions: ["read", "write"],
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@accubooks.com",
    role: "Viewer",
    status: "Inactive",
    lastLogin: "2024-01-10 14:20",
    permissions: ["read"],
  },
  {
    id: 5,
    name: "Robert Wilson",
    email: "robert.wilson@accubooks.com",
    role: "Custom",
    status: "Active",
    lastLogin: "2024-01-15 11:00",
    permissions: ["read", "write"],
  },
];

const roles = [
  {
    name: "Admin",
    description: "Full system access and user management",
    permissions: ["read", "write", "delete", "admin", "users", "settings"],
    color: "bg-red-100 text-red-800",
  },
  {
    name: "Manager",
    description: "Manage accounts, transactions, and reports",
    permissions: ["read", "write", "delete", "reports"],
    color: "bg-blue-100 text-blue-800",
  },
  {
    name: "Accountant",
    description: "Manage financial data and generate reports",
    permissions: ["read", "write", "reports"],
    color: "bg-green-100 text-green-800",
  },
  {
    name: "Viewer",
    description: "Read-only access to financial data",
    permissions: ["read"],
    color: "bg-gray-100 text-gray-800",
  },
  {
    name: "Custom",
    description: "Custom permissions based on role requirements",
    permissions: ["read", "write"],
    color: "bg-purple-100 text-purple-800",
  },
];

export default function SettingsPage() {
  const [users, setUsers] = useState(usersData);
  const [activeTab, setActiveTab] = useState("users");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const userColumns: Column<(typeof usersData)[0]>[] = [
    {
      key: "name",
      title: "Name",
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
            <span className="text-secondary font-medium text-sm">
              {value
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <div className="font-medium text-primary">{value}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      sortable: true,
      filterable: true,
      render: (value) => {
        const role = roles.find((r) => r.name === value);
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${role?.color || "bg-gray-100 text-gray-800"}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${value === "Active" ? "bg-success" : "bg-gray-400"}`}
          />
          <span
            className={`text-sm ${value === "Active" ? "text-success" : "text-gray-500"}`}
          >
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "lastLogin",
      title: "Last Login",
      sortable: true,
      render: (value) => <div className="text-sm text-gray-600">{value}</div>,
    },
    {
      key: "permissions",
      title: "Permissions",
      render: (value) => (
        <div className="flex gap-1 flex-wrap">
          {value.slice(0, 3).map((permission: string) => (
            <span
              key={permission}
              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {permission}
            </span>
          ))}
          {value.length > 3 && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              +{value.length - 3}
            </span>
          )}
        </div>
      ),
    },
  ];

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowAddUserModal(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleSaveUser = (userData: any) => {
    if (editingUser) {
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...userData } : u)),
      );
      setEditingUser(null);
    } else {
      const newUser = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        ...userData,
        status: "Active",
        lastLogin: new Date().toISOString().replace("T", " ").slice(0, 16),
      };
      setUsers([...users, newUser]);
    }
    setShowAddUserModal(false);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute(
      "data-theme",
      !darkMode ? "dark" : "light",
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage users, roles, and system configuration
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              {
                id: "users",
                label: "User Management",
                icon: <Users className="h-4 w-4" />,
              },
              {
                id: "roles",
                label: "Roles & Permissions",
                icon: <Shield className="h-4 w-4" />,
              },
              {
                id: "general",
                label: "General Settings",
                icon: <SettingsIcon className="h-4 w-4" />,
              },
              {
                id: "security",
                label: "Security",
                icon: <Lock className="h-4 w-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-secondary text-secondary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <EnterpriseButton
                    variant="primary"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={handleAddUser}
                  >
                    Add User
                  </EnterpriseButton>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <EnterpriseDataTable
                  data={users}
                  columns={userColumns}
                  searchable={true}
                  exportable={true}
                  pagination={true}
                  emptyMessage="No users found"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Roles & Permissions Tab */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}
                      >
                        {role.permissions.length} permissions
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      {role.description}
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-primary">
                        Permissions:
                      </h4>
                      <div className="flex gap-1 flex-wrap">
                        {role.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <EnterpriseButton
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Edit
                      </EnterpriseButton>
                      {role.name !== "Admin" && role.name !== "Viewer" && (
                        <EnterpriseButton
                          variant="outline"
                          size="sm"
                          className="text-danger"
                        >
                          Delete
                        </EnterpriseButton>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Dark Mode</h3>
                    <p className="text-sm text-gray-600">
                      Toggle dark mode theme for the application
                    </p>
                  </div>
                  <button
                    onClick={handleToggleDarkMode}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-600">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <EnterpriseInput
                      placeholder="Enter company name"
                      defaultValue="AccuBooks Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    <EnterpriseInput
                      placeholder="Enter tax ID"
                      defaultValue="12-3456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <EnterpriseInput
                      placeholder="Enter phone number"
                      defaultValue="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <EnterpriseInput
                      type="email"
                      placeholder="Enter email"
                      defaultValue="contact@accubooks.com"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    rows={3}
                    defaultValue="123 Business Ave, Suite 100, New York, NY 10001"
                  />
                </div>
                <div className="flex gap-3">
                  <EnterpriseButton variant="primary">
                    Save Changes
                  </EnterpriseButton>
                  <EnterpriseButton variant="outline">Cancel</EnterpriseButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-primary">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <EnterpriseButton variant="outline" size="sm">
                      Enable
                    </EnterpriseButton>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-primary">
                          Session Management
                        </h3>
                        <p className="text-sm text-gray-600">
                          Manage active sessions and sign out devices
                        </p>
                      </div>
                    </div>
                    <EnterpriseButton variant="outline" size="sm">
                      View Sessions
                    </EnterpriseButton>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-primary">API Access</h3>
                        <p className="text-sm text-gray-600">
                          Manage API keys and access tokens
                        </p>
                      </div>
                    </div>
                    <EnterpriseButton variant="outline" size="sm">
                      Manage
                    </EnterpriseButton>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      user: "John Smith",
                      action: "Created new user",
                      time: "2 hours ago",
                      status: "success",
                    },
                    {
                      user: "Sarah Johnson",
                      action: "Modified invoice INV-002",
                      time: "4 hours ago",
                      status: "success",
                    },
                    {
                      user: "Mike Chen",
                      action: "Failed login attempt",
                      time: "6 hours ago",
                      status: "error",
                    },
                    {
                      user: "System",
                      action: "Database backup completed",
                      time: "8 hours ago",
                      status: "success",
                    },
                  ].map((log, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-success" : "bg-danger"}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-primary">
                            {log.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.user} • {log.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.status === "success" ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-danger" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {editingUser ? "Edit User" : "Add New User"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <EnterpriseInput
                      placeholder="Enter full name"
                      defaultValue={editingUser?.name || ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <EnterpriseInput
                      type="email"
                      placeholder="Enter email address"
                      defaultValue={editingUser?.email || ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      defaultValue={editingUser?.role || "Viewer"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      {roles.map((role) => (
                        <option key={role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <EnterpriseInput
                      type="password"
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current"
                          : "Enter password"
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <EnterpriseButton
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddUserModal(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancel
                  </EnterpriseButton>
                  <EnterpriseButton
                    variant="primary"
                    className="flex-1"
                    onClick={() =>
                      handleSaveUser({
                        name: "New User",
                        email: "user@example.com",
                        role: "Viewer",
                        permissions: ["read"],
                      })
                    }
                  >
                    {editingUser ? "Update" : "Create"}
                  </EnterpriseButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
