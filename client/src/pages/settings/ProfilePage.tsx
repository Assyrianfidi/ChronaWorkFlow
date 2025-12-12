import React, { useState } from 'react';
import { useState, useEffect } from "react";
// @ts-ignore
import { useAuthStore } from '../../store/auth-store.js.js';
// @ts-ignore
import { Button } from '../../components/ui/button.js.js';
// @ts-ignore
import { Input } from '../../components/ui/input.js.js';
// @ts-ignore
import { Label } from '../../components/ui/label.js.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js.js';
// @ts-ignore
import { Icons } from '../../components/icons.js.js';
// @ts-ignore
import { useToast } from '../../components/ui/use-toast.js.js';
// @ts-ignore
import { DashboardShell } from '../../components/ui/layout/DashboardShell.js.js';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    setIsProfileLoading(true);

    try {
      await updateProfile({
        name: profileForm.name.trim(),
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordLoading(true);

    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      toast({
        title: "Error",
        description:
          "Failed to change password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-8">
          <Card className="bg-surface1 border-border-gray shadow-soft">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account's profile information and email address.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={isProfileLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    disabled
                    title="Email cannot be changed"
                  />
                  <p className="text-sm text-muted-foreground">
                    Contact support if you need to change your email address.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isProfileLoading}>
                  {isProfileLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="bg-surface1 border-border-gray shadow-soft">
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to stay
                secure.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isPasswordLoading}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
