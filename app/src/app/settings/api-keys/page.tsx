'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Key, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt?: string;
  createdAt: string;
  isActive: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { scope: 'read:invoices', description: 'Read invoices' },
  { scope: 'write:invoices', description: 'Create and update invoices' },
  { scope: 'read:customers', description: 'Read customer data' },
  { scope: 'write:customers', description: 'Create and update customers' },
  { scope: 'read:expenses', description: 'Read expenses' },
  { scope: 'write:expenses', description: 'Create and update expenses' },
  { scope: 'read:reports', description: 'Read financial reports' },
  { scope: 'read:accounts', description: 'Read chart of accounts' },
  { scope: 'write:accounts', description: 'Modify chart of accounts' },
  { scope: 'read:journal', description: 'Read journal entries' },
  { scope: 'write:journal', description: 'Create journal entries' },
  { scope: 'webhook', description: 'Receive webhooks' },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read:invoices']);
  const [rateLimit, setRateLimit] = useState('1000');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      // In production: const response = await api.get('/api/api-keys');
      // Mock data for now
      setApiKeys([
        {
          id: '1',
          name: 'Production Integration',
          keyPrefix: 'ak_live_3x9a',
          permissions: ['read:invoices', 'write:invoices', 'read:customers'],
          rateLimit: 1000,
          lastUsedAt: '2024-02-08T10:30:00Z',
          createdAt: '2024-01-15T00:00:00Z',
          isActive: true,
        },
        {
          id: '2',
          name: 'Reporting Dashboard',
          keyPrefix: 'ak_live_7k2m',
          permissions: ['read:reports', 'read:invoices', 'read:expenses'],
          rateLimit: 500,
          lastUsedAt: '2024-02-07T15:45:00Z',
          createdAt: '2024-01-20T00:00:00Z',
          isActive: true,
        },
        {
          id: '3',
          name: 'Legacy Integration',
          keyPrefix: 'ak_live_9p4x',
          permissions: ['read:invoices', 'write:invoices'],
          rateLimit: 100,
          lastUsedAt: '2024-01-25T08:00:00Z',
          createdAt: '2023-12-01T00:00:00Z',
          isActive: false,
        },
      ]);
    } catch (error) {
      toast.error('Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      // In production: const response = await api.post('/api/api-keys', { name: newKeyName, permissions: selectedPermissions, rateLimit: parseInt(rateLimit) });
      
      // Simulate API call
      const newKey = 'ak_live_' + Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
      
      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        keyPrefix: newKey.substring(0, 12),
        permissions: selectedPermissions,
        rateLimit: parseInt(rateLimit),
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      setApiKeys([newApiKey, ...apiKeys]);
      setNewlyCreatedKey(newKey);
      setShowKeyDialog(true);
      setIsDialogOpen(false);
      setNewKeyName('');
      setSelectedPermissions(['read:invoices']);
      
      toast.success('API key created successfully');
    } catch (error) {
      toast.error('Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      // In production: await api.delete(`/api/api-keys/${keyId}`);
      setApiKeys(apiKeys.map(k => k.id === keyId ? { ...k, isActive: false } : k));
      toast.success('API key revoked');
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  };

  const handleRotateKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to rotate this key? A new key will be generated and the old one will be revoked.')) {
      return;
    }

    try {
      // In production: const response = await api.post(`/api/api-keys/${keyId}/rotate`);
      const newKey = 'ak_live_' + Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
      setNewlyCreatedKey(newKey);
      setShowKeyDialog(true);
      toast.success('API key rotated successfully');
    } catch (error) {
      toast.error('Failed to rotate API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  if (isLoading) {
    return <ApiKeysSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys for programmatic access</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to the AccuBooks API.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Integration"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
                <Select value={rateLimit} onValueChange={setRateLimit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 / hour</SelectItem>
                    <SelectItem value="500">500 / hour</SelectItem>
                    <SelectItem value="1000">1,000 / hour</SelectItem>
                    <SelectItem value="5000">5,000 / hour</SelectItem>
                    <SelectItem value="10000">10,000 / hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.scope} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.scope}
                        checked={selectedPermissions.includes(permission.scope)}
                        onCheckedChange={() => togglePermission(permission.scope)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permission.scope}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.scope}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey}>
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Show New Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Save Your API Key
            </DialogTitle>
            <DialogDescription>
              This is the only time you will see this key. Copy it now and store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm break-all">
              {newlyCreatedKey}
            </div>
            <Button 
              className="w-full" 
              onClick={() => newlyCreatedKey && copyToClipboard(newlyCreatedKey)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKeyDialog(false)}>
              I've Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            {apiKeys.filter(k => k.isActive).length} active, {apiKeys.filter(k => !k.isActive).length} revoked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {key.keyPrefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.slice(0, 3).map(p => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p.split(':')[0]}
                        </Badge>
                      ))}
                      {key.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{key.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{key.rateLimit}/hr</TableCell>
                  <TableCell>{key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}</TableCell>
                  <TableCell>{formatDate(key.createdAt)}</TableCell>
                  <TableCell>
                    <Badge className={key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {key.isActive && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRotateKey(key.id)}
                          title="Rotate key"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeKey(key.id)}
                          title="Revoke key"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>How to use the AccuBooks API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded block">
              https://api.accubooks.com/v1
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header:
            </p>
            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded block">
              Authorization: Bearer ak_live_xxxxxxxxxxxxxxxx
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Rate Limiting</h4>
            <p className="text-sm text-muted-foreground">
              Each API key has its own rate limit. Exceeding the limit will return a 429 Too Many Requests response.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
