import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js.js';
// @ts-ignore
import { Button } from '../components/ui/button.js.js';
// @ts-ignore
import { Input } from '../components/ui/input.js.js';
// @ts-ignore
import { Badge } from '../components/ui/badge.js.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog.js.js';
// @ts-ignore
import { Label } from '../components/ui/label.js.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js.js';
// @ts-ignore
import { Switch } from '../components/ui/switch.js.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs.js.js';
import {
  Users,
  Settings,
  Shield,
  Bell,
  Database,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Mail,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER" | "AUDITOR" | "INVENTORY_MANAGER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string | boolean;
  description: string;
  type: "string" | "boolean" | "number";
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@accubooks.com",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: "2024-12-10T09:15:30Z",
    createdAt: "2024-01-01T00:00:00Z",
    permissions: ["all"],
  },
  {
    id: "2",
    name: "Manager User",
    email: "manager@accubooks.com",
    role: "MANAGER",
    status: "ACTIVE",
    lastLogin: "2024-12-10T08:30:00Z",
    createdAt: "2024-02-15T00:00:00Z",
    permissions: ["invoices", "customers", "reports"],
  },
  {
    id: "3",
    name: "Regular User",
    email: "user@accubooks.com",
    role: "USER",
    status: "ACTIVE",
    lastLogin: "2024-12-09T16:45:00Z",
    createdAt: "2024-03-20T00:00:00Z",
    permissions: ["dashboard", "profile"],
  },
  {
    id: "4",
    name: "Auditor User",
    email: "auditor@accubooks.com",
    role: "AUDITOR",
    status: "ACTIVE",
    lastLogin: "2024-12-10T10:00:00Z",
    createdAt: "2024-04-10T00:00:00Z",
    permissions: ["reports", "audit_logs", "view"],
  },
  {
    id: "5",
    name: "Inventory Manager",
    email: "inventory@accubooks.com",
    role: "INVENTORY_MANAGER",
    status: "SUSPENDED",
    lastLogin: "2024-12-05T14:20:00Z",
    createdAt: "2024-05-15T00:00:00Z",
    permissions: ["inventory", "reports"],
  },
];

const mockSystemSettings: SystemSetting[] = [
  {
    id: "1",
    category: "Security",
    key: "two_factor_auth",
    value: false,
    description: "Enable two-factor authentication for all users",
    type: "boolean",
  },
  {
    id: "2",
    category: "Security",
    key: "session_timeout",
    value: "30",
    description: "Session timeout in minutes",
    type: "number",
  },
  {
    id: "3",
    category: "Notifications",
    key: "email_notifications",
    value: true,
    description: "Enable email notifications for system events",
    type: "boolean",
  },
  {
    id: "4",
    category: "System",
    key: "maintenance_mode",
    value: false,
    description: "Put system in maintenance mode",
    type: "boolean",
  },
  {
    id: "5",
    category: "Backup",
    key: "auto_backup",
    value: true,
    description: "Enable automatic daily backups",
    type: "boolean",
  },
];

const roleConfig = {
  ADMIN: { color: "bg-purple-100 text-purple-800", label: "Administrator" },
  MANAGER: { color: "bg-blue-100 text-blue-800", label: "Manager" },
  USER: { color: "bg-green-100 text-green-800", label: "User" },
  AUDITOR: { color: "bg-orange-100 text-orange-800", label: "Auditor" },
  INVENTORY_MANAGER: {
    color: "bg-yellow-100 text-yellow-800",
    label: "Inventory Manager",
  },
};

const statusConfig = {
  ACTIVE: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Active",
  },
  INACTIVE: {
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
    label: "Inactive",
  },
  SUSPENDED: {
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    label: "Suspended",
  },
};

// @ts-ignore
const AdminSettingsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [systemSettings, setSystemSettings] =
    useState<SystemSetting[]>(mockSystemSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log("👥 Fetching users...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleCreateUser = async (userData: any) => {
    try {
      console.log("👥 Creating user:", userData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: "ACTIVE",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString().split("T")[0],
        permissions: getPermissionsForRole(userData.role),
      };

      setUsers([newUser, ...users]);
      setIsCreateUserDialogOpen(false);
      console.log("✅ User created successfully");
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUpdateUserRole = async (
    userId: string,
    newRole: User["role"],
  ) => {
    try {
      console.log("👥 Updating user role:", userId, newRole);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: newRole,
                permissions: getPermissionsForRole(newRole),
              }
            : user,
        ),
      );
      console.log("✅ User role updated successfully");
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleUpdateUserStatus = async (
    userId: string,
    newStatus: User["status"],
  ) => {
    try {
      console.log("👥 Updating user status:", userId, newStatus);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user,
        ),
      );
      console.log("✅ User status updated successfully");
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (
      user.role === "ADMIN" &&
      users.filter((u) => u.role === "ADMIN").length <= 1
    ) {
      alert("Cannot delete the last administrator user.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      )
    )
      return;

    try {
      console.log("👥 Deleting user:", userId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUsers(users.filter((user) => user.id !== userId));
      console.log("✅ User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleUpdateSetting = async (settingId: string, newValue: any) => {
    try {
      console.log("⚙️ Updating setting:", settingId, newValue);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSystemSettings(
        systemSettings.map((setting) =>
          setting.id === settingId ? { ...setting, value: newValue } : setting,
        ),
      );
      console.log("✅ Setting updated successfully");
    } catch (error) {
      console.error("Failed to update setting:", error);
    }
  };

  const getPermissionsForRole = (role: User["role"]): string[] => {
    switch (role) {
      case "ADMIN":
        return ["all"];
      case "MANAGER":
        return ["invoices", "customers", "reports", "dashboard"];
      case "USER":
        return ["dashboard", "profile"];
      case "AUDITOR":
        return ["reports", "audit_logs", "view"];
      case "INVENTORY_MANAGER":
        return ["inventory", "reports", "dashboard"];
      default:
        return [];
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-gray-600">
            Manage users, roles, and system configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter((u) => u.status === "ACTIVE").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Administrators
                </CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter((u) => u.role === "ADMIN").length}
                </div>
                <p className="text-xs text-muted-foreground">System admins</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter((u) => u.status === "SUSPENDED").length}
                </div>
                <p className="text-xs text-muted-foreground">Suspended users</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <Dialog
                  open={isCreateUserDialogOpen}
                  onOpenChange={setIsCreateUserDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-enterprise-navy hover:bg-enterprise-navy/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user to the system with appropriate role and
                        permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateUserForm onSubmit={handleCreateUser} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                    <SelectItem value="INVENTORY_MANAGER">
                      Inventory Manager
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const StatusIcon = statusConfig[user.status].icon;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleConfig[user.role].color}>
                            {roleConfig[user.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[user.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[user.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.lastLogin)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.createdAt}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user.status === "ACTIVE" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUpdateUserStatus(user.id, "SUSPENDED")
                                }
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUpdateUserStatus(user.id, "ACTIVE")
                                }
                              >
                                <Unlock className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={
                                user.role === "ADMIN" &&
                                users.filter((u) => u.role === "ADMIN")
                                  .length <= 1
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {systemSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">
                        {setting.key.replace(/_/g, " ").toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {setting.description}
                      </div>
                      <Badge variant="outline">{setting.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {setting.type === "boolean" ? (
                        <Switch
// @ts-ignore
                          checked={setting.value as boolean}
                          onCheckedChange={(checked) =>
                            handleUpdateSetting(setting.id, checked)
                          }
                        />
                      ) : (
                        <Input
                          type={setting.type}
                          value={setting.value.toString()}
                          onChange={(e) =>
                            handleUpdateSetting(
                              setting.id,
                              setting.type === "number"
                                ? parseInt(e.target.value)
                                : e.target.value,
                            )
                          }
                          className="w-32"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Role-Based Access Control
              </CardTitle>
              <CardDescription>
                Define roles and their associated permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(roleConfig).map(([role, config]) => (
                  <Card
                    key={role}
                    className="border-l-4 border-l-enterprise-navy"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Permissions:</div>
                        <div className="flex flex-wrap gap-1">
// @ts-ignore
                          {getPermissionsForRole(role as User["role"]).map(
                            (permission) => (
                              <Badge
                                key={permission}
                                variant="outline"
                                className="text-xs"
                              >
                                {permission}
                              </Badge>
                            ),
                          )}
                        </div>
                        <div className="pt-2">
                          <div className="text-sm text-gray-500">
                            {users.filter((u) => u.role === role).length}{" "}
                            user(s) with this role
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Two-Factor Authentication</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Failed Login Attempts (24h)</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Sessions</span>
                    <Badge variant="outline">
                      {users.filter((u) => u.status === "ACTIVE").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Security Alerts</span>
                    <Badge variant="destructive">2 Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Minimum Length</span>
                    <span className="font-medium">8 characters</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Require Uppercase</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Require Numbers</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Require Special Characters</span>
                    <span className="font-medium">Yes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Create User Form Component
// @ts-ignore
const CreateUserForm: React.FC<{ onSubmit: (data: any) => void }> = ({
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
// @ts-ignore
    role: "USER" as User["role"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter full name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value: User["role"]) =>
            setFormData({ ...formData, role: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="AUDITOR">Auditor</SelectItem>
            <SelectItem value="INVENTORY_MANAGER">Inventory Manager</SelectItem>
            <SelectItem value="ADMIN">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-enterprise-navy hover:bg-enterprise-navy/90"
        >
          Create User
        </Button>
      </div>
    </form>
  );
};

export default AdminSettingsPage;
