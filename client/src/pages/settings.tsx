import * as React from "react";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import { Switch } from "../components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/Dialog";
import {
  Building2,
  User,
  CreditCard,
  Bell,
  Shield,
  Users,
  Database,
  Zap,
} from "lucide-react";
import { useCompanies, useUpdateCompany, useUsers } from "../hooks/use-api";
import { format } from "date-fns";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../hooks/use-toast";
import { useAuthStore } from "../store/auth-store";

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState("company");
  const [companyForm, setCompanyForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    currency: "USD",
    fiscalYearEnd: "12-31",
  });
  const [profileForm, setProfileForm] = React.useState({
    name: "",
    email: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = React.useState({
    overdueInvoices: true,
    paymentReceived: true,
    lowBalance: false,
    monthlyReports: true,
    bankReconciliation: false,
    invoiceReminders: true,
  });

  const { toast } = useToast();
  const { user } = useAuthStore();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: users = [] } = useUsers();
  const updateCompanyMutation = useUpdateCompany();

  // Get current company
  const currentCompany = companies.find((c) => c.id === user?.currentCompanyId);

  // Initialize forms with current data
  React.useEffect(() => {
    if (currentCompany) {
      setCompanyForm({
        name: currentCompany.name || "",
        email: currentCompany.email || "",
        phone: currentCompany.phone || "",
        address: currentCompany.address || "",
        taxId: currentCompany.taxId || "",
        currency: currentCompany.currency || "USD",
        fiscalYearEnd: currentCompany.fiscalYearEnd || "12-31",
      });
    }
  }, [currentCompany]);

  const handleCompanySave = async () => {
    try {
      if (currentCompany) {
        await updateCompanyMutation.mutateAsync({
          id: currentCompany.id,
          data: companyForm,
        });
        toast({
          title: "Success",
          description: "Company information updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update company information: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileSave = () => {
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Success",
      description: "Password updated successfully",
    });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Success",
      description: "Notification preferences updated",
    });
  };

  if (companiesLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and company preferences
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-6">
          <TabsTrigger value="company" data-testid="tab-company">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Zap className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyForm.name}
                    onChange={(e) =>
                      setCompanyForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={companyForm.taxId}
                    onChange={(e) =>
                      setCompanyForm((prev) => ({
                        ...prev,
                        taxId: e.target.value,
                      }))
                    }
                    data-testid="input-tax-id"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={companyForm.address}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  data-testid="input-address"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companyForm.phone}
                    onChange={(e) =>
                      setCompanyForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) =>
                      setCompanyForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={companyForm.currency}
                    onValueChange={(value) =>
                      setCompanyForm((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">
                        AUD - Australian Dollar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal-year">Fiscal Year End</Label>
                  <Input
                    id="fiscal-year"
                    value={companyForm.fiscalYearEnd}
                    onChange={(e) =>
                      setCompanyForm((prev) => ({
                        ...prev,
                        fiscalYearEnd: e.target.value,
                      }))
                    }
                    data-testid="input-fiscal-year"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleCompanySave}
                  disabled={updateCompanyMutation.isPending}
                  data-testid="button-save-company"
                >
                  {updateCompanyMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management for Admins */}
          {user?.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage company users and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Total Users</p>
                      <p className="text-sm text-muted-foreground">
                        {users.length} active users
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Invite User</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite New User</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your company
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input placeholder="user@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select defaultValue="user">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="accountant">
                                  Accountant
                                </SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button>Send Invitation</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {users.slice(0, 3).map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">
                            {user.name || user.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select defaultValue={user.role}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="accountant">
                                Accountant
                              </SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    data-testid="input-full-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    data-testid="input-user-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  data-testid="input-username"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleProfileSave}
                  data-testid="button-save-profile"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  data-testid="input-confirm-password"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handlePasswordChange}
                  data-testid="button-change-password"
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Not Enabled
                    </span>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Login Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Manage active sessions on your account
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Current: 8+ characters, mixed case, numbers
                    </p>
                  </div>
                  <Button variant="outline">Update Policy</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">
                  Current Plan: Professional
                </p>
                <p className="text-2xl font-semibold mb-1">$49.99/month</p>
                <p className="text-xs text-muted-foreground">
                  Next billing date: February 1, 2024
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Visa ending in 4242</p>
                      <p className="text-xs text-muted-foreground">
                        Expires 12/2025
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-update-payment"
                  >
                    Update
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" data-testid="button-billing-history">
                  View Billing History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive alerts and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Overdue Invoices</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified when invoices become overdue
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.overdueInvoices}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        overdueInvoices: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Payment Received</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified when payments are received
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.paymentReceived}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        paymentReceived: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Low Balance Alert</p>
                    <p className="text-xs text-muted-foreground">
                      Alert when bank balance falls below threshold
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowBalance}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        lowBalance: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Monthly Reports</p>
                    <p className="text-xs text-muted-foreground">
                      Receive monthly financial summary via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.monthlyReports}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        monthlyReports: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Bank Reconciliation</p>
                    <p className="text-xs text-muted-foreground">
                      Alerts for reconciliation status and issues
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.bankReconciliation}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        bankReconciliation: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Invoice Reminders</p>
                    <p className="text-xs text-muted-foreground">
                      Automated reminders for upcoming and overdue invoices
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.invoiceReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        invoiceReminders: checked,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNotificationSave}
                  data-testid="button-save-notifications"
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Advanced system configuration and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Data Backup</p>
                    <p className="text-sm text-muted-foreground">
                      Last backup:{" "}
                      {format(new Date(), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button variant="outline">Backup Now</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Export Data</p>
                    <p className="text-sm text-muted-foreground">
                      Download all company data in standard formats
                    </p>
                  </div>
                  <Button variant="outline">Export All</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">API Access</p>
                    <p className="text-sm text-muted-foreground">
                      Manage API keys and webhooks
                    </p>
                  </div>
                  <Button variant="outline">Manage API</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Audit Logs</p>
                    <p className="text-sm text-muted-foreground">
                      View system activity and changes
                    </p>
                  </div>
                  <Button variant="outline">View Logs</Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-destructive dark:text-destructive-500">
                    Danger Zone
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-destructive/20 rounded-md">
                      <div>
                        <p className="font-medium">Reset Demo Data</p>
                        <p className="text-sm text-muted-foreground">
                          Reset all data to initial demo state
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Reset Data
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-destructive/20 rounded-md">
                      <div>
                        <p className="font-medium">Delete Company</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this company and all data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete Company
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
