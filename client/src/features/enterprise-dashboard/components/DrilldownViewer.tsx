import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, RefreshCw, Filter } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DrilldownViewerProps {
  kpiId: string;
  onBack: () => void;
}

// Mock data - in a real app, this would be fetched based on kpiId
const getChartData = (kpiId: string) => {
  const now = new Date();
  const data = [];
  
  for (let i = 12; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Math.floor(Math.random() * 100000) + 50000,
      previousYear: Math.floor(Math.random() * 80000) + 30000,
      target: 120000,
    });
  }
  
  return data;
};

export const DrilldownViewer: React.FC<DrilldownViewerProps> = ({ kpiId, onBack }) => {
  const chartData = getChartData(kpiId);
  
  const getKpiTitle = (id: string) => {
    const titles: Record<string, string> = {
      revenue: 'Revenue Analysis',
      expenses: 'Expense Breakdown',
      'profit-margin': 'Profit Margin Trends',
      'invoices-outstanding': 'Aging Analysis',
    };
    return titles[id] || 'KPI Details';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-blue-600 hover:bg-blue-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getKpiTitle(kpiId)}</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Current Year']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="Current Year"
                />
                <Line 
                  type="monotone" 
                  dataKey="previousYear" 
                  stroke="#9ca3af" 
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Previous Year"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { name: 'Product Sales', value: 420000 },
                    { name: 'Services', value: 380000 },
                    { name: 'Subscriptions', value: 250000 },
                    { name: 'Other Income', value: 200000 },
                  ]}
                >
                  <CartesianGrid horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Enterprise Plan', value: 320000, change: 12.5 },
                { name: 'Professional Services', value: 280000, change: 8.2 },
                { name: 'Premium Support', value: 195000, change: 5.7 },
                { name: 'Add-on Modules', value: 178000, change: -2.3 },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="flex items-center space-x-4">
                    <div className="font-medium">
                      ${item.value.toLocaleString()}
                    </div>
                    <div 
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.change >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
