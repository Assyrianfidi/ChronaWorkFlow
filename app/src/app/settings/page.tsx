'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building, Mail, Phone, Globe, DollarSign, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanySettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await api.get<CompanySettings>(API_ENDPOINTS.settings.company);
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.settings.company, settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your company settings and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Basic details about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings?.company.name || ''}
                    onChange={(e) => settings && setSettings({ ...settings, company: { ...settings.company, name: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={settings?.company.legalName || ''}
                    onChange={(e) => settings && setSettings({ ...settings, company: { ...settings.company, legalName: e.target.value } })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={settings?.company.email || ''}
                  onChange={(e) => settings && setSettings({ ...settings, company: { ...settings.company, email: e.target.value } })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={settings?.company.phone || ''}
                    onChange={(e) => settings && setSettings({ ...settings, company: { ...settings.company, phone: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={settings?.company.website || ''}
                    onChange={(e) => settings && setSettings({ ...settings, company: { ...settings.company, website: e.target.value } })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Settings
              </CardTitle>
              <CardDescription>Default currency and formatting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Input
                    id="currency"
                    value={settings?.currencySettings.baseCurrency || 'USD'}
                    onChange={(e) => settings && setSettings({ ...settings, currencySettings: { ...settings.currencySettings, baseCurrency: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decimalPlaces">Decimal Places</Label>
                  <Input
                    id="decimalPlaces"
                    type="number"
                    value={settings?.currencySettings.decimalPlaces || 2}
                    onChange={(e) => settings && setSettings({ ...settings, currencySettings: { ...settings.currencySettings, decimalPlaces: parseInt(e.target.value) } })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fiscal Year
              </CardTitle>
              <CardDescription>Configure your fiscal year settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startMonth">Start Month</Label>
                  <Input
                    id="startMonth"
                    type="number"
                    min="1"
                    max="12"
                    value={settings?.fiscalYear.startMonth || 1}
                    onChange={(e) => settings && setSettings({ ...settings, fiscalYear: { ...settings.fiscalYear, startMonth: parseInt(e.target.value) } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDay">Start Day</Label>
                  <Input
                    id="startDay"
                    type="number"
                    min="1"
                    max="31"
                    value={settings?.fiscalYear.startDay || 1}
                    onChange={(e) => settings && setSettings({ ...settings, fiscalYear: { ...settings.fiscalYear, startDay: parseInt(e.target.value) } })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Tax Settings
              </CardTitle>
              <CardDescription>Configure tax settings for your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input
                  id="taxId"
                  value={settings?.taxSettings.taxId || ''}
                  onChange={(e) => settings && setSettings({ ...settings, taxSettings: { ...settings.taxSettings, taxId: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={settings?.taxSettings.defaultTaxRate || 10}
                  onChange={(e) => settings && setSettings({ ...settings, taxSettings: { ...settings.taxSettings, defaultTaxRate: parseFloat(e.target.value) } })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <Badge className="mt-1">{settings?.company.plan || 'Free'}</Badge>
                </div>
                <Button variant="outline">Upgrade</Button>
              </div>
              <div className="space-y-2">
                <Label>Plan Features</Label>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited transactions</li>
                  <li>• Multi-currency support</li>
                  <li>• Advanced reporting</li>
                  <li>• API access</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <Skeleton className="h-10 w-[400px]" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
