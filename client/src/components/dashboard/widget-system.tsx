import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Settings, Plus, X, Users, Clock, FileText, BarChart3, DollarSign, MapPin, Activity, TrendingUp, AlertTriangle, Navigation, Zap } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface Widget {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
  size: 'small' | 'medium' | 'large';
  color: string;
  enabled: boolean;
  position: number;
  data?: any;
}

export interface WidgetProps {
  widget: Widget;
  onUpdate?: (widget: Widget) => void;
  onRemove?: (widgetId: string) => void;
}

// Widget components
const WorkersWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    // Fetch worker stats
    fetch('/api/workers')
      .then(res => res.json())
      .then(workers => {
        const total = workers.length;
        const active = workers.filter((w: any) => w.status === 'active').length;
        setStats({ total, active, inactive: total - active });
      })
      .catch(console.error);
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.total}</div>
        <p className="text-xs text-muted-foreground">Total Workers</p>
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="text-green-600 font-semibold">{stats.active}</span> Active
          </div>
          <div className="text-sm">
            <span className="text-gray-500 font-semibold">{stats.inactive}</span> Inactive
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TimeLogsWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, activeNow: 0 });

  useEffect(() => {
    // Fetch time log stats
    fetch('/api/time-logs')
      .then(res => res.json())
      .then(logs => {
        const today = new Date().toDateString();
        const todayLogs = logs.filter((log: any) => 
          new Date(log.clockIn).toDateString() === today
        );
        const activeNow = logs.filter((log: any) => 
          log.clockIn && !log.clockOut
        );

        setStats({ 
          today: todayLogs.length, 
          thisWeek: logs.length, // Simplified
          activeNow: activeNow.length 
        });
      })
      .catch(console.error);
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.activeNow}</div>
        <p className="text-xs text-muted-foreground">Currently Clocked In</p>
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="font-semibold">{stats.today}</span> Today
          </div>
          <div className="text-sm">
            <span className="font-semibold">{stats.thisWeek}</span> This Week
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectsWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(projects => {
        const total = projects.length;
        const active = projects.filter((p: any) => p.status === 'active').length;
        const completed = projects.filter((p: any) => p.status === 'completed').length;
        setStats({ total, active, completed });
      })
      .catch(console.error);
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.total}</div>
        <p className="text-xs text-muted-foreground">Total Projects</p>
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="text-blue-600 font-semibold">{stats.active}</span> Active
          </div>
          <div className="text-sm">
            <span className="text-green-600 font-semibold">{stats.completed}</span> Done
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RevenueWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ thisMonth: 0, lastMonth: 0, pending: 0 });

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(invoices => {
        const thisMonth = invoices
          .filter((inv: any) => inv.status === 'paid')
          .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);
        
        const pending = invoices
          .filter((inv: any) => inv.status === 'pending')
          .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);

        setStats({ thisMonth, lastMonth: 0, pending });
      })
      .catch(console.error);
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Revenue This Month</p>
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="text-orange-600 font-semibold">${stats.pending.toFixed(2)}</span> Pending
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Location/GPS Widget
const LocationWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ 
    activeLocations: 0, 
    totalScans: 0, 
    recentActivity: [] as any[] 
  });

  useEffect(() => {
    // Fetch location stats from dedicated endpoint
    fetch('/api/dashboard/location-stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          activeLocations: data.activeLocations,
          totalScans: data.totalScans,
          recentActivity: data.recentActivity
        });
      })
      .catch(console.error);
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.activeLocations}</div>
        <p className="text-xs text-muted-foreground">Active Locations Today</p>
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="text-blue-600 font-semibold">{stats.totalScans}</span> QR Scans
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Real-time Operations Widget  
const RealTimeWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ 
    currentlyActive: 0, 
    recentActivity: [] as any[],
    alertCount: 0 
  });

  useEffect(() => {
    // Fetch real-time data
    const fetchRealTimeData = () => {
      fetch('/api/dashboard/realtime-stats')
        .then(res => res.json())
        .then(data => {
          setStats({
            currentlyActive: data.currentlyActive,
            recentActivity: data.recentActivity,
            alertCount: data.alertCount
          });
        })
        .catch(console.error);
    };

    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.currentlyActive}</div>
        <p className="text-xs text-muted-foreground">Currently Active</p>
        <div className="flex gap-4 mt-2">
          {stats.alertCount > 0 && (
            <div className="text-sm">
              <span className="text-red-600 font-semibold">{stats.alertCount}</span> Alerts
            </div>
          )}
          <div className="text-sm">
            <span className="text-green-600 font-semibold">Live</span> Updates
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Financial Tracking Widget
const FinancialWidget = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  const [stats, setStats] = useState({ 
    totalReceivables: 0, 
    paidThisMonth: 0, 
    profitMargin: 0,
    expenseRatio: 0 
  });

  useEffect(() => {
    // Fetch financial data from dedicated endpoint
    fetch('/api/dashboard/financial-stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalReceivables: data.totalReceivables || 0,
          paidThisMonth: data.paidThisMonth || 0,
          profitMargin: data.profitMargin || 0,
          expenseRatio: data.overdueCount || 0
        });
      })
      .catch(err => {
        console.error('Financial stats error:', err);
        setStats({
          totalReceivables: 0,
          paidThisMonth: 0,
          profitMargin: 0,
          expenseRatio: 0
        });
      });
  }, []);

  return (
    <Card className={`${widget.size === 'large' ? 'col-span-2' : ''} border-l-4`} style={{ borderLeftColor: widget.color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: widget.color }} />
          {widget.title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemove?.(widget.id)}>
              <X className="mr-2 h-4 w-4" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${stats?.totalReceivables?.toFixed(0) || '0'}</div>
        <p className="text-xs text-muted-foreground">Total Receivables</p>
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="text-green-600 font-semibold">{stats?.profitMargin?.toFixed(1) || '0'}%</span> Margin
          </div>
          <div className="text-sm">
            <span className="text-red-600 font-semibold">{stats?.expenseRatio || '0'}</span> Overdue
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Available widget types
export const AVAILABLE_WIDGETS: Omit<Widget, 'id' | 'enabled' | 'position'>[] = [
  {
    type: 'workers',
    title: 'Worker Overview',
    description: 'Track active and inactive workers',
    icon: Users,
    size: 'medium',
    color: '#3b82f6',
  },
  {
    type: 'time-logs',
    title: 'Time Tracking',
    description: 'Monitor clock-in status and daily logs',
    icon: Clock,
    size: 'medium',
    color: '#10b981',
  },
  {
    type: 'projects',
    title: 'Project Status',
    description: 'View active and completed projects',
    icon: FileText,
    size: 'medium',
    color: '#8b5cf6',
  },
  {
    type: 'revenue',
    title: 'Revenue Tracking',
    description: 'Monitor monthly revenue and pending invoices',
    icon: DollarSign,
    size: 'medium',
    color: '#f59e0b',
  },
  {
    type: 'location',
    title: 'Location Tracking',
    description: 'Monitor active locations and GPS scans',
    icon: MapPin,
    size: 'medium',
    color: '#ef4444',
  },
  {
    type: 'realtime',
    title: 'Real-Time Operations',
    description: 'Live activity monitoring and alerts',
    icon: Activity,
    size: 'medium',
    color: '#06b6d4',
  },
  {
    type: 'financial',
    title: 'Financial Analytics',
    description: 'Advanced financial tracking and metrics',
    icon: TrendingUp,
    size: 'medium',
    color: '#84cc16',
  },
];

// Widget renderer
export const WidgetRenderer = ({ widget, onUpdate, onRemove }: WidgetProps) => {
  switch (widget.type) {
    case 'workers':
      return <WorkersWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    case 'time-logs':
      return <TimeLogsWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    case 'projects':
      return <ProjectsWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    case 'revenue':
      return <RevenueWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    case 'location':
      return <LocationWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    case 'realtime':
      return <RealTimeWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    case 'financial':
      return <FinancialWidget widget={widget} onUpdate={onUpdate} onRemove={onRemove} />;
    default:
      return null;
  }
};

// Widget customization dialog
export const WidgetCustomizer = ({ 
  availableWidgets, 
  enabledWidgets, 
  onUpdate 
}: {
  availableWidgets: typeof AVAILABLE_WIDGETS;
  enabledWidgets: Widget[];
  onUpdate: (widgets: Widget[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWidget = (widgetType: string) => {
    const existing = enabledWidgets.find(w => w.type === widgetType);
    
    if (existing) {
      // Remove widget
      onUpdate(enabledWidgets.filter(w => w.type !== widgetType));
    } else {
      // Add widget
      const template = availableWidgets.find(w => w.type === widgetType);
      if (template) {
        const newWidget: Widget = {
          ...template,
          id: `${widgetType}-${Date.now()}`,
          enabled: true,
          position: enabledWidgets.length,
        };
        onUpdate([...enabledWidgets, newWidget]);
      }
    }
  };

  const isWidgetEnabled = (widgetType: string) => {
    return enabledWidgets.some(w => w.type === widgetType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Dashboard Widgets</DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your dashboard. You can add or remove widgets at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {availableWidgets.map((widget) => (
            <div key={widget.type} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={widget.type}
                checked={isWidgetEnabled(widget.type)}
                onCheckedChange={() => toggleWidget(widget.type)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <widget.icon className="h-4 w-4" style={{ color: widget.color }} />
                  <Label htmlFor={widget.type} className="text-sm font-medium">
                    {widget.title}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {widget.size}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {widget.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main dashboard widget system
export const DashboardWidgetSystem = () => {
  const [enabledWidgets, setEnabledWidgets] = useState<Widget[]>([]);

  // Load saved widget configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    if (saved) {
      try {
        setEnabledWidgets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load widget configuration:', error);
        // Set default widgets
        setDefaultWidgets();
      }
    } else {
      setDefaultWidgets();
    }
  }, []);

  // Save widget configuration to localStorage
  useEffect(() => {
    if (enabledWidgets.length > 0) {
      localStorage.setItem('dashboard-widgets', JSON.stringify(enabledWidgets));
    }
  }, [enabledWidgets]);

  const setDefaultWidgets = () => {
    const defaultWidgets: Widget[] = [
      {
        ...AVAILABLE_WIDGETS[0], // Workers
        id: 'workers-default',
        enabled: true,
        position: 0,
      },
      {
        ...AVAILABLE_WIDGETS[1], // Time Logs
        id: 'time-logs-default',
        enabled: true,
        position: 1,
      },
      {
        ...AVAILABLE_WIDGETS[2], // Projects
        id: 'projects-default',
        enabled: true,
        position: 2,
      },
    ];
    setEnabledWidgets(defaultWidgets);
  };

  const handleWidgetUpdate = (widgets: Widget[]) => {
    setEnabledWidgets(widgets);
  };

  const handleWidgetRemove = (widgetId: string) => {
    setEnabledWidgets(widgets => widgets.filter(w => w.id !== widgetId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your business operations and key metrics
          </p>
        </div>
        <WidgetCustomizer
          availableWidgets={AVAILABLE_WIDGETS}
          enabledWidgets={enabledWidgets}
          onUpdate={handleWidgetUpdate}
        />
      </div>

      {enabledWidgets.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Widgets Configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add widgets to your dashboard to view key business metrics and insights.
            </p>
            <WidgetCustomizer
              availableWidgets={AVAILABLE_WIDGETS}
              enabledWidgets={enabledWidgets}
              onUpdate={handleWidgetUpdate}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enabledWidgets
            .sort((a, b) => a.position - b.position)
            .map((widget) => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                onUpdate={(updatedWidget) => {
                  setEnabledWidgets(widgets =>
                    widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w)
                  );
                }}
                onRemove={handleWidgetRemove}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default DashboardWidgetSystem;