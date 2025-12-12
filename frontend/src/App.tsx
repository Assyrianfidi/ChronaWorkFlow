import { useState } from 'react'
import './App.css'

// Dashboard Components
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [userRole, setUserRole] = useState('CFO') // Simulated role

  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard userRole={userRole} />
      case 'financial':
        return <FinancialDashboard />
      case 'reports':
        return <ReportsDashboard />
      case 'analytics':
        return <AnalyticsDashboard />
      default:
        return <OverviewDashboard userRole={userRole} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AccuBooks</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {userRole}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CFO">CFO</option>
                <option value="Controller">Controller</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Accountant">Accountant</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {['overview', 'financial', 'reports', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderDashboardContent()}
      </main>
    </div>
  )
}

// Overview Dashboard Component
const OverviewDashboard = ({ userRole }: { userRole: string }) => {
  const getRoleSpecificMetrics = () => {
    switch (userRole) {
      case 'CFO':
        return {
          revenue: '$2,456,789',
          expenses: '$1,234,567',
          profit: '$1,222,222',
          growth: '+12.5%'
        }
      case 'Controller':
        return {
          transactions: '1,234',
          accounts: '456',
          reconciled: '98.5%',
          pending: '23'
        }
      case 'Project Manager':
        return {
          projects: '12',
          active: '8',
          completed: '4',
          budget: '89%'
        }
      case 'Accountant':
        return {
          invoices: '234',
          payments: '189',
          overdue: '12',
          processed: '95%'
        }
      default:
        return {}
    }
  }

  const metrics = getRoleSpecificMetrics()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-2 text-gray-600">Welcome back! Here's your financial summary.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {key.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Revenue Chart Placeholder</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Expense Chart Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Financial Dashboard Component
const FinancialDashboard = () => (
  <div className="px-4 py-6 sm:px-0">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Management</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Total Revenue</span>
            <span className="font-medium text-green-600">$2,456,789</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Total Expenses</span>
            <span className="font-medium text-red-600">$1,234,567</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Net Profit</span>
            <span className="font-medium text-blue-600">$1,222,222</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Profit Margin</span>
            <span className="font-medium text-gray-900">49.7%</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Generate Invoice
          </button>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Record Payment
          </button>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Create Report
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Reports Dashboard Component
const ReportsDashboard = () => (
  <div className="px-4 py-6 sm:px-0">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: 'Balance Sheet', date: '2024-01-15', status: 'Ready' },
        { name: 'Income Statement', date: '2024-01-15', status: 'Ready' },
        { name: 'Cash Flow Report', date: '2024-01-14', status: 'Processing' },
        { name: 'Aging Report', date: '2024-01-13', status: 'Ready' },
        { name: 'Tax Summary', date: '2024-01-12', status: 'Ready' },
        { name: 'Budget Analysis', date: '2024-01-10', status: 'Draft' }
      ].map((report, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              report.status === 'Ready' ? 'bg-green-100 text-green-800' :
              report.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {report.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Generated: {report.date}</p>
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
              View
            </button>
            <button className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">
              Export
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Analytics Dashboard Component
const AnalyticsDashboard = () => (
  <div className="px-4 py-6 sm:px-0">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Analytics</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className="text-sm font-medium">+12.5%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Cost Efficiency</span>
              <span className="text-sm font-medium">89.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '89.2%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium">94.7%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94.7%' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Predictive Insights</h3>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Revenue Forecast:</strong> Expected 15% growth in Q2 based on current trends
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Cash Flow:</strong> Positive cash flow projected for next 3 months
            </p>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Expense Alert:</strong> Marketing budget approaching 80% utilization
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

function App() {
  return <Dashboard />
}

export default App
