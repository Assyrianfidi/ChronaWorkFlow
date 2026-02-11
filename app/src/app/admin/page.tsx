'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Building2, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
  Crown,
  Lock,
  Unlock,
  Eye,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Types
interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  userCount: number;
  mrr: number;
  createdAt: string;
  lastActive: string;
  healthScore: number;
}

interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  arpu: number;
  trialConversion: number;
  growthRate: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: 'GLOBAL' | 'TENANT';
  tenantId?: string;
  category: 'SECURITY' | 'COMPLIANCE' | 'OPERATIONS' | 'UI';
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CEODashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setTenants([
        { id: '1', name: 'Acme Corp', subdomain: 'acme', plan: 'ENTERPRISE', status: 'ACTIVE', userCount: 45, mrr: 999, createdAt: '2024-01-15', lastActive: '2024-02-08', healthScore: 98 },
        { id: '2', name: 'TechStart Inc', subdomain: 'techstart', plan: 'PROFESSIONAL', status: 'ACTIVE', userCount: 12, mrr: 299, createdAt: '2024-01-20', lastActive: '2024-02-07', healthScore: 95 },
        { id: '3', name: 'Global Solutions', subdomain: 'global', plan: 'STARTER', status: 'TRIAL', userCount: 5, mrr: 0, createdAt: '2024-02-01', lastActive: '2024-02-08', healthScore: 87 },
        { id: '4', name: 'Local Business', subdomain: 'local', plan: 'FREE', status: 'ACTIVE', userCount: 3, mrr: 0, createdAt: '2024-01-25', lastActive: '2024-02-05', healthScore: 72 },
        { id: '5', name: 'Suspended Co', subdomain: 'suspended', plan: 'PROFESSIONAL', status: 'SUSPENDED', userCount: 8, mrr: 0, createdAt: '2023-12-01', lastActive: '2024-01-15', healthScore: 45 },
      ]);

      setMetrics({
        mrr: 15497,
        arr: 185964,
        churnRate: 2.3,
        arpu: 245,
        trialConversion: 68,
        growthRate: 12.5,
      });

      setFeatureFlags([
        { id: '1', name: 'ADVANCED_REPORTING', description: 'Enable advanced financial reports', enabled: true, scope: 'GLOBAL', category: 'OPERATIONS' },
        { id: '2', name: 'MULTI_CURRENCY', description: 'Multi-currency support', enabled: true, scope: 'GLOBAL', category: 'OPERATIONS' },
        { id: '3', name: 'AUDIT_LOGS', description: 'Enhanced audit logging', enabled: true, scope: 'GLOBAL', category: 'COMPLIANCE' },
        { id: '4', name: 'API_ACCESS', description: 'API key management', enabled: false, scope: 'TENANT', tenantId: '1', category: 'OPERATIONS' },
        { id: '5', name: 'BETA_FEATURES', description: 'Early access to beta features', enabled: false, scope: 'GLOBAL', category: 'UI' },
      ]);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = (tenant: Tenant) => {
    toast.success(`Impersonating ${tenant.name}`);
    // In production: Set impersonation session, redirect to tenant dashboard
  };

  const handleSuspendTenant = (tenantId: string) => {
    toast.success('Tenant suspended');
    setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: 'SUSPENDED' } : t));
  };

  const handleActivateTenant = (tenantId: string) => {
    toast.success('Tenant activated');
    setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: 'ACTIVE' } : t));
  };

  const handleToggleFeatureFlag = (flagId: string) => {
    setFeatureFlags(featureFlags.map(f => 
      f.id === flagId ? { ...f, enabled: !f.enabled } : f
    ));
    toast.success('Feature flag updated');
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      STARTER: 'bg-blue-100 text-blue-800',
      PROFESSIONAL: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-amber-100 text-amber-800',
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <CEODashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold">CEO Command Center</h1>
                <p className="text-sm text-muted-foreground">Owner & Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <CheckCircle className="mr-1 h-3 w-3" />
                System Healthy
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics ? formatCurrency(metrics.mrr) : '-'}</div>
                  <p className="text-xs text-green-600">+{metrics?.growthRate}% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tenants.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {tenants.filter(t => t.status === 'ACTIVE').length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tenants.reduce((sum, t) => sum + t.userCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all tenants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  <Activity className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.churnRate}%</div>
                  <p className="text-xs text-green-600">-{0.5}% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>MRR Growth</CardTitle>
                  <CardDescription>Monthly recurring revenue trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Aug', mrr: 12000 },
                      { month: 'Sep', mrr: 13200 },
                      { month: 'Oct', mrr: 14100 },
                      { month: 'Nov', mrr: 14800 },
                      { month: 'Dec', mrr: 15200 },
                      { month: 'Jan', mrr: 15497 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Line type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>Customers by subscription tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Free', value: tenants.filter(t => t.plan === 'FREE').length },
                          { name: 'Starter', value: tenants.filter(t => t.plan === 'STARTER').length },
                          { name: 'Pro', value: tenants.filter(t => t.plan === 'PROFESSIONAL').length },
                          { name: 'Enterprise', value: tenants.filter(t => t.plan === 'ENTERPRISE').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Acme Corp</TableCell>
                      <TableCell>Upgraded to Enterprise</TableCell>
                      <TableCell>2 hours ago</TableCell>
                      <TableCell>From Professional</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">TechStart Inc</TableCell>
                      <TableCell>New user invited</TableCell>
                      <TableCell>5 hours ago</TableCell>
                      <TableCell>admin@techstart.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Global Solutions</TableCell>
                      <TableCell>Trial started</TableCell>
                      <TableCell>1 day ago</TableCell>
                      <TableCell>14-day trial</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>Manage all tenant accounts</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tenants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>MRR</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.subdomain}.accubooks.com</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlanBadgeColor(tenant.plan)}>
                            {tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.userCount}</TableCell>
                        <TableCell>{tenant.mrr > 0 ? formatCurrency(tenant.mrr) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${
                              tenant.healthScore >= 90 ? 'bg-green-500' :
                              tenant.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            {tenant.healthScore}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleImpersonate(tenant)}
                              title="Impersonate"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {tenant.status === 'ACTIVE' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSuspendTenant(tenant.id)}
                                title="Suspend"
                              >
                                <Ban className="h-4 w-4 text-red-500" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleActivateTenant(tenant.id)}
                                title="Activate"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics ? formatCurrency(metrics.arr) : '-'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics ? formatCurrency(metrics.arpu) : '-'}</div>
                  <p className="text-xs text-muted-foreground">Average revenue per user</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trial Conversion</CardTitle>
                  <Activity className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.trialConversion}%</div>
                  <p className="text-xs text-muted-foreground">Trial to paid rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[
                    { month: 'Aug', revenue: 12000, expenses: 8000 },
                    { month: 'Sep', revenue: 13200, expenses: 8500 },
                    { month: 'Oct', revenue: 14100, expenses: 9000 },
                    { month: 'Nov', revenue: 14800, expenses: 9200 },
                    { month: 'Dec', revenue: 15200, expenses: 9500 },
                    { month: 'Jan', revenue: 15497, expenses: 9800 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="revenue" name="Revenue" fill="#22c55e" />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Toggle features globally or per tenant</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Add Flag
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureFlags.map((flag) => (
                      <TableRow key={flag.id}>
                        <TableCell className="font-medium">{flag.name}</TableCell>
                        <TableCell>{flag.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{flag.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={flag.scope === 'GLOBAL' ? 'text-blue-600' : 'text-purple-600'}>
                            {flag.scope}
                          </Badge>
                          {flag.tenantId && <span className="text-xs text-muted-foreground ml-2">({flag.tenantId})</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatureFlag(flag.id)}
                          >
                            {flag.enabled ? (
                              <><Ban className="mr-2 h-4 w-4" />Disable</>
                            ) : (
                              <><CheckCircle className="mr-2 h-4 w-4" />Enable</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CEODashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <Skeleton className="h-10 w-64" />
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </main>
    </div>
  );
}
