import React, { useState, useEffect } from 'react';
import {
  Activity,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Server,
  Mail,
  MessageSquare,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Shield,
  Database,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  health: any;
  financial: any;
  customers: any;
  externalServices: any;
  alerts: any;
  compliance: any;
  apiPerformance: any;
}

const CEODashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const [health, financial, customers, externalServices, alerts, compliance, apiPerformance] =
        await Promise.all([
          fetch(`${baseURL}/api/dashboard/health`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${baseURL}/api/dashboard/financial`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${baseURL}/api/dashboard/customers`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${baseURL}/api/dashboard/external-services`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${baseURL}/api/dashboard/alerts`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${baseURL}/api/dashboard/compliance`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch(`${baseURL}/api/dashboard/api-performance`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ]);

      setData({
        health: health.data,
        financial: financial.data,
        customers: customers.data,
        externalServices: externalServices.data,
        alerts: alerts.data,
        compliance: compliance.data,
        apiPerformance: apiPerformance.data,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const sendTestEmail = async () => {
    const email = prompt('Enter email address:');
    if (!email) return;

    const token = localStorage.getItem('authToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${baseURL}/api/dashboard/actions/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: email }),
      });

      const result = await response.json();
      alert(result.data.success ? 'Email sent successfully!' : `Failed: ${result.data.error}`);
    } catch (error) {
      alert('Error sending test email');
    }
  };

  const sendTestSMS = async () => {
    const phone = prompt('Enter phone number (with country code):');
    if (!phone) return;

    const token = localStorage.getItem('authToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${baseURL}/api/dashboard/actions/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: phone }),
      });

      const result = await response.json();
      alert(result.data.success ? 'SMS sent successfully!' : `Failed: ${result.data.error}`);
    } catch (error) {
      alert('Error sending test SMS');
    }
  };

  const runHealthCheck = async () => {
    const token = localStorage.getItem('authToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${baseURL}/api/dashboard/actions/run-health-check`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      alert(`Health Check: ${result.data.overall}\n\nDetails:\n${JSON.stringify(result.data.checks, null, 2)}`);
    } catch (error) {
      alert('Error running health check');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CEO Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  // Chart data
  const invoicesPieData = {
    labels: ['Paid', 'Unpaid', 'Overdue'],
    datasets: [
      {
        data: [
          data.financial.invoices.paid,
          data.financial.invoices.unpaid,
          data.financial.invoices.overdue,
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      },
    ],
  };

  const revenueLineData = {
    labels: ['Daily', 'Weekly', 'Monthly', 'YTD'],
    datasets: [
      {
        label: 'Revenue',
        data: [
          data.financial.revenue.daily / 100,
          data.financial.revenue.weekly / 100,
          data.financial.revenue.monthly / 100,
          data.financial.revenue.ytd / 100,
        ],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">AccuBooks CEO Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto-refresh</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={fetchDashboardData}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Stats Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-10 w-10 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Revenue (Month)</p>
                <p className="text-xl font-bold">{formatCurrency(data.financial.revenue.monthly)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl font-bold">{data.customers.users.active}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="h-10 w-10 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="text-xl font-bold">{data.financial.invoices.total}</p>
              </div>
            </div>
            <div className="flex items-center">
              <AlertTriangle className="h-10 w-10 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Alerts</p>
                <p className="text-xl font-bold">{data.alerts.alerts.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'health', label: 'System Health', icon: Server },
                { id: 'financial', label: 'Financial', icon: DollarSign },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'services', label: 'External Services', icon: CreditCard },
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
                { id: 'compliance', label: 'Compliance', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
                <Line data={revenueLineData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>

              {/* Invoices Pie Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Invoices Breakdown</h3>
                <Pie data={invoicesPieData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatusCard
                  icon={<Database className="h-8 w-8" />}
                  label="Database"
                  status={data.health.database.status}
                  detail={`${data.health.database.latency}ms`}
                />
                <StatusCard
                  icon={<Server className="h-8 w-8" />}
                  label="API Server"
                  status={data.health.apiServer.status}
                  detail={`Port ${data.health.apiServer.port}`}
                />
                <StatusCard
                  icon={<Activity className="h-8 w-8" />}
                  label="Redis"
                  status={data.health.redis.status}
                  detail="Cache"
                />
                <StatusCard
                  icon={<Server className="h-8 w-8" />}
                  label="Health Server"
                  status={data.health.healthServer.status}
                  detail="Port 3001"
                />
              </div>
            </div>

            {/* Recent Alerts */}
            {data.alerts.alerts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  Active Alerts
                </h3>
                <div className="space-y-3">
                  {data.alerts.alerts.map((alert: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.type === 'error'
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">System Health Metrics</h3>
                <button
                  onClick={runHealthCheck}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Run Health Check
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={<Cpu className="h-8 w-8 text-blue-600" />}
                  label="CPU Load"
                  value={`${data.health.system.cpuUsage[0].toFixed(2)}`}
                  unit="avg"
                />
                <MetricCard
                  icon={<HardDrive className="h-8 w-8 text-purple-600" />}
                  label="Memory"
                  value={`${data.health.system.memoryUsage.percentage}%`}
                  unit={`${data.health.system.memoryUsage.used}MB / ${data.health.system.memoryUsage.total}MB`}
                />
                <MetricCard
                  icon={<Activity className="h-8 w-8 text-green-600" />}
                  label="Uptime"
                  value={formatUptime(data.health.system.uptime)}
                  unit="system"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Database Performance</h3>
              <p className="text-sm text-gray-600">Status: <span className="font-semibold text-green-600">Connected</span></p>
              <p className="text-sm text-gray-600">Latency: <span className="font-semibold">{data.health.database.latency}ms</span></p>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialCard
                label="Today"
                value={formatCurrency(data.financial.revenue.daily)}
                trend="up"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <FinancialCard
                label="This Week"
                value={formatCurrency(data.financial.revenue.weekly)}
                trend="up"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <FinancialCard
                label="This Month"
                value={formatCurrency(data.financial.revenue.monthly)}
                trend="up"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <FinancialCard
                label="Year to Date"
                value={formatCurrency(data.financial.revenue.ytd)}
                trend="up"
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Invoice Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{data.financial.invoices.total}</p>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.financial.invoices.paid}</p>
                  <p className="text-sm text-gray-600">Paid</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{data.financial.invoices.unpaid}</p>
                  <p className="text-sm text-gray-600">Unpaid</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{data.financial.invoices.overdue}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Average Payment Time: <span className="font-semibold">{data.financial.averagePaymentTime} days</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.financial.recentPayments.map((payment: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-2 text-sm">{payment.method}</td>
                        <td className="px-4 py-2 text-sm text-blue-600">{payment.invoiceId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Users className="h-10 w-10 text-blue-600 mb-3" />
                <p className="text-3xl font-bold">{data.customers.users.total}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Activity className="h-10 w-10 text-green-600 mb-3" />
                <p className="text-3xl font-bold">{data.customers.users.active}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Shield className="h-10 w-10 text-purple-600 mb-3" />
                <p className="text-3xl font-bold">{data.customers.companies.active}</p>
                <p className="text-sm text-gray-600">Active Companies</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {data.customers.recentActivity.logins.slice(0, 5).map((login: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">User Login</p>
                      <p className="text-sm text-gray-600">IP: {login.ipAddress}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(login.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* External Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ServiceCard
                icon={<Mail className="h-8 w-8" />}
                name="SendGrid"
                status={data.externalServices.sendGrid.status}
                configured={data.externalServices.sendGrid.configured}
              />
              <ServiceCard
                icon={<MessageSquare className="h-8 w-8" />}
                name="Twilio"
                status={data.externalServices.twilio.status}
                configured={data.externalServices.twilio.configured}
              />
              <ServiceCard
                icon={<CreditCard className="h-8 w-8" />}
                name="Stripe"
                status={data.externalServices.stripe.status}
                configured={data.externalServices.stripe.configured}
              />
              <ServiceCard
                icon={<FileText className="h-8 w-8" />}
                name="PDF Service"
                status={data.externalServices.pdf.status}
                configured={data.externalServices.pdf.configured}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={sendTestEmail}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Send Test Email
                </button>
                <button
                  onClick={sendTestSMS}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Send Test SMS
                </button>
                <button
                  onClick={runHealthCheck}
                  className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Run Health Check
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
            {data.alerts.alerts.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">No active alerts. System is running smoothly!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.alerts.alerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'error'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          {alert.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Shield className="h-10 w-10 text-green-600 mb-3" />
                <p className="text-2xl font-bold">
                  {data.compliance.complianceStatus.gdprCompliant ? 'Compliant' : 'Non-Compliant'}
                </p>
                <p className="text-sm text-gray-600">GDPR Status</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Shield className="h-10 w-10 text-green-600 mb-3" />
                <p className="text-2xl font-bold">
                  {data.compliance.complianceStatus.multiTenantSecure ? 'Secure' : 'At Risk'}
                </p>
                <p className="text-sm text-gray-600">Multi-Tenant Isolation</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Activity className="h-10 w-10 text-blue-600 mb-3" />
                <p className="text-2xl font-bold">
                  {data.compliance.complianceStatus.auditLogsActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-600">Audit Logging</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">GDPR Requests (Last 30 Days)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold">{data.compliance.gdpr.exportRequests}</p>
                  <p className="text-sm text-gray-600">Data Export Requests</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{data.compliance.gdpr.deletionRequests}</p>
                  <p className="text-sm text-gray-600">Account Deletion Requests</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Security Events (Last 7 Days)</h3>
              <p className="text-3xl font-bold">{data.compliance.security.eventsLastWeek}</p>
              <p className="text-sm text-gray-600">Total Security Events Detected</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          Last updated: {new Date().toLocaleString()} | AccuBooks CEO Dashboard v1.0
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const StatusCard: React.FC<{ icon: React.ReactNode; label: string; status: string; detail: string }> = ({
  icon,
  label,
  status,
  detail,
}) => (
  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
    <div className={`mr-3 ${status === 'up' || status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
      {icon}
    </div>
    <div>
      <p className="font-semibold">{label}</p>
      <p className="text-xs text-gray-600">{detail}</p>
      <span
        className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
          status === 'up' || status === 'connected'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {status}
      </span>
    </div>
  </div>
);

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; unit: string }> = ({
  icon,
  label,
  value,
  unit,
}) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <div className="flex items-center mb-3">
      {icon}
      <span className="ml-3 font-semibold">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-sm text-gray-600">{unit}</p>
  </div>
);

const FinancialCard: React.FC<{
  label: string;
  value: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}> = ({ label, value, trend, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>{icon}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const ServiceCard: React.FC<{
  icon: React.ReactNode;
  name: string;
  status: string;
  configured: boolean;
}> = ({ icon, name, status, configured }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-3">
      <div className={configured ? 'text-green-600' : 'text-gray-400'}>{icon}</div>
      <span className="ml-3 font-semibold">{name}</span>
    </div>
    <span
      className={`inline-block px-3 py-1 text-xs rounded ${
        status === 'operational'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
    {!configured && <p className="text-xs text-gray-500 mt-2">Not configured</p>}
  </div>
);

export default CEODashboard;
