import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Globe, Save, User, Lock } from "lucide-react";

export default function BusinessSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [customDomain, setCustomDomain] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/logged-out";
      return;
    }
  }, [isAuthenticated, isLoading]);

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ["/api/business/settings"],
    retry: false,
  });

  useEffect(() => {
    if (business) {
      setCustomDomain(business.customEmailDomain || "chronaworkflow.com");
    }
  }, [business]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { customEmailDomain: string }) => {
      const response = await apiRequest("PUT", "/api/business/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your business settings have been saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/logged-out";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const updateCredentialsMutation = useMutation({
    mutationFn: async (data: { email?: string; password?: string }) => {
      const response = await apiRequest("PUT", "/api/business/credentials", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credentials Updated",
        description: "Your login credentials have been updated successfully",
      });
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/logged-out";
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      customEmailDomain: customDomain,
    });
  };

  const handleUpdateCredentials = () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    const updateData: { email?: string; password?: string } = {};
    if (newEmail) updateData.email = newEmail;
    if (newPassword) updateData.password = newPassword;

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "No Changes",
        description: "Please enter new email or password to update",
        variant: "destructive",
      });
      return;
    }

    updateCredentialsMutation.mutate(updateData);
  };

  if (isLoading || loadingBusiness) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading business settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure your business preferences and customization options</p>
              </div>
            </div>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Business Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input value={business?.name || ""} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Business Email</Label>
                    <Input value={business?.email || ""} disabled className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={business?.phone || "Not set"} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input value={business?.industry || "Not specified"} disabled className="bg-gray-50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Email Domain Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Custom Email Domain</span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Set your custom domain for client email generation. When creating clients, emails will automatically use this domain.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customDomain">Email Domain</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-500">@</span>
                    <Input
                      id="customDomain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="chronaworkflow.com"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: If you set "mycompany.com", client emails will be generated as "clientname@mycompany.com"
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Preview:</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Client "John Smith" → johnsmith@{customDomain || "chronaworkflow.com"}
                  </p>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}</span>
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Account Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Update Login Credentials</span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Change your email address or password for logging into Chrona Workflow Ledger.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newEmail">New Email Address (Optional)</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password (Optional)</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Note:</strong> You can update either your email or password, or both. Leave fields empty if you don't want to change them.
                  </p>
                </div>

                <Button 
                  onClick={handleUpdateCredentials}
                  disabled={updateCredentialsMutation.isPending}
                  className="flex items-center space-x-2"
                  variant="outline"
                >
                  <Lock className="h-4 w-4" />
                  <span>{updateCredentialsMutation.isPending ? "Updating..." : "Update Credentials"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Domain Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Domain Setup Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">To use your custom domain:</h4>
                  <ol className="list-decimal list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>Purchase your desired domain (e.g., mycompany.com)</li>
                    <li>Set up email hosting with your domain provider</li>
                    <li>Configure MX records for email delivery</li>
                    <li>Update the domain setting above to match your domain</li>
                    <li>Test by creating a new client to see the auto-generated email</li>
                  </ol>
                </div>
                <p className="text-xs text-gray-500">
                  Note: This setting only affects how client emails are automatically generated in the system. 
                  You'll need to configure actual email hosting separately with your domain provider.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}