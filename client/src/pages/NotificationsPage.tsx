import * as React from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useEffect, useState } from "react";
import { Switch } from "../components/ui/Switch";
import Button from "../components/ui/Button";
import {
  default as Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { DashboardShell } from "../components/ui/layout/DashboardShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Mail,
  Calendar,
  Filter,
  Check,
  Trash2,
  Eye,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Notification {
  id: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  category:
    | "SYSTEM"
    | "INVOICE"
    | "CUSTOMER"
    | "PAYMENT"
    | "SECURITY"
    | "REPORT";
  actionUrl?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "SUCCESS",
    title: "New Invoice Created",
    message:
      "Invoice INV-003 has been successfully created for Tech Solutions Ltd with amount $3,200.00",
    read: false,
    createdAt: "2024-12-10T10:30:00Z",
    category: "INVOICE",
    actionUrl: "/invoices",
    priority: "MEDIUM",
  },
  {
    id: "2",
    type: "WARNING",
    title: "Overdue Invoice Alert",
    message:
      "Invoice INV-002 for ABC Corporation is overdue by 10 days. Total amount: $2,500.00",
    read: false,
    createdAt: "2024-12-10T09:15:00Z",
    category: "PAYMENT",
    actionUrl: "/invoices",
    priority: "HIGH",
  },
  {
    id: "3",
    type: "ERROR",
    title: "Payment Processing Failed",
    message:
      "Payment for invoice INV-005 could not be processed due to invalid payment method. Please update customer payment information.",
    read: false,
    createdAt: "2024-12-10T08:45:00Z",
    category: "PAYMENT",
    actionUrl: "/invoices",
    priority: "URGENT",
  },
  {
    id: "4",
    type: "INFO",
    title: "System Maintenance Scheduled",
    message:
      "Scheduled system maintenance will occur on December 15, 2024 from 2:00 AM to 4:00 AM EST. Services may be temporarily unavailable.",
    read: true,
    createdAt: "2024-12-09T16:30:00Z",
    category: "SYSTEM",
    priority: "LOW",
  },
  {
    id: "5",
    type: "SUCCESS",
    title: "Customer Registration Completed",
    message:
      "New customer Global Marketing Inc has been successfully registered and added to the system.",
    read: true,
    createdAt: "2024-12-09T14:20:00Z",
    category: "CUSTOMER",
    actionUrl: "/customers",
    priority: "MEDIUM",
  },
  {
    id: "6",
    type: "WARNING",
    title: "Unusual Login Activity Detected",
    message:
      "Multiple failed login attempts detected from IP address 203.45.67.89. Please review security logs.",
    read: false,
    createdAt: "2024-12-09T12:10:00Z",
    category: "SECURITY",
    actionUrl: "/audit",
    priority: "HIGH",
  },
  {
    id: "7",
    type: "INFO",
    title: "Monthly Report Generated",
    message:
      "November 2024 financial report has been generated and is ready for review. Total revenue: $45,200.00",
    read: true,
    createdAt: "2024-12-09T10:00:00Z",
    category: "REPORT",
    actionUrl: "/reports",
    priority: "MEDIUM",
  },
  {
    id: "8",
    type: "SUCCESS",
    title: "Payment Received",
    message:
      "Payment of $1,800.50 has been received for invoice INV-004 from XYZ Industries.",
    read: true,
    createdAt: "2024-12-08T16:45:00Z",
    category: "PAYMENT",
    actionUrl: "/invoices",
    priority: "MEDIUM",
  },
];

const typeConfig = {
  SUCCESS: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Success",
  },
  WARNING: {
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
    label: "Warning",
  },
  ERROR: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Error" },
  INFO: { color: "bg-blue-100 text-blue-800", icon: Info, label: "Info" },
};

const priorityConfig = {
  LOW: { color: "bg-gray-100 text-gray-800", label: "Low" },
  MEDIUM: { color: "bg-orange-100 text-orange-800", label: "Medium" },
  HIGH: { color: "bg-red-100 text-red-800", label: "High" },
  URGENT: { color: "bg-purple-100 text-purple-800", label: "Urgent" },
};

const categoryConfig = {
  SYSTEM: { label: "System", icon: Settings },
  INVOICE: { label: "Invoice", icon: Mail },
  CUSTOMER: { label: "Customer", icon: Mail },
  PAYMENT: { label: "Payment", icon: Mail },
  SECURITY: { label: "Security", icon: AlertTriangle },
  REPORT: { label: "Report", icon: Info },
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [filteredNotifications, setFilteredNotifications] =
    useState<Notification[]>(mockNotifications);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Mock fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      console.log("🔔 Fetching notifications...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setNotifications(mockNotifications);
      setFilteredNotifications(mockNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.type === typeFilter,
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.category === categoryFilter,
      );
    }

    if (readFilter !== "all") {
      filtered = filtered.filter((notification) =>
        readFilter === "read" ? notification.read : !notification.read,
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.priority === priorityFilter,
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, typeFilter, categoryFilter, readFilter, priorityFilter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log("🔔 Marking notification as read:", notificationId);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );
      console.log("✅ Notification marked as read");
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log("🔔 Marking all notifications as read");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true })),
      );
      console.log("✅ All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      console.log("🔔 Deleting notification:", notificationId);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setNotifications(
        notifications.filter(
          (notification) => notification.id !== notificationId,
        ),
      );
      console.log("✅ Notification deleted successfully");
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all notifications? This action cannot be undone.",
      )
    )
      return;

    try {
      console.log("🔔 Clearing all notifications");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNotifications([]);
      console.log("✅ All notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-600">
              Stay updated with system alerts and important information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-surface1 border border-border-gray shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Notifications
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {unreadCount}
              </div>
              <p className="text-xs text-muted-foreground">Pending attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Priority
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {
                  notifications.filter(
                    (n) => n.priority === "HIGH" || n.priority === "URGENT",
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate action
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Alerts
              </CardTitle>
              <Settings className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {notifications.filter((n) => n.category === "SYSTEM").length}
              </div>
              <p className="text-xs text-muted-foreground">
                System notifications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <label className="text-sm font-medium">
                      Email Notifications
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {emailNotifications ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <label className="text-sm font-medium">
                      Push Notifications
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Receive browser push notifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pushNotifications ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="INVOICE">Invoice</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="REPORT">Report</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Notifications ({filteredNotifications.length})
            </CardTitle>
            <CardDescription>
              Recent system notifications and alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState label="Loading notifications…" size="sm" />
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                size="sm"
                title="No notifications found"
                icon={<Bell className="h-5 w-5" />}
              />
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const TypeIcon = typeConfig[notification.type].icon;
                  const CategoryIcon =
                    categoryConfig[notification.category].icon;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        !notification.read
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`p-2 rounded-full ${typeConfig[notification.type].color}`}
                          >
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`font-medium ${!notification.read ? "text-blue-900" : ""}`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p
                              className={`text-sm mb-2 ${!notification.read ? "text-blue-800" : "text-gray-600"}`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <CategoryIcon className="w-3 h-3" />
                                {categoryConfig[notification.category].label}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(notification.createdAt)}
                              </div>
                              <Badge
                                className={
                                  priorityConfig[notification.priority].color
                                }
                              >
                                {priorityConfig[notification.priority].label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default NotificationsPage;
