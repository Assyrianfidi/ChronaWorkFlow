import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js.js';
// @ts-ignore
import { Button } from '../components/ui/button.js.js';
// @ts-ignore
import { Input } from '../components/ui/input.js.js';
// @ts-ignore
import { Badge } from '../components/ui/badge.js.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js.js';
// @ts-ignore
import { DashboardShell } from '../components/ui/layout/DashboardShell.js.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js.js';
import {
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  User,
  Calendar,
  Activity,
  Shield,
  FileText,
  Settings,
  Trash2,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "SUCCESS" | "FAILED" | "WARNING" | "INFO";
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    userId: "1",
    userName: "Admin User",
    userEmail: "admin@accubooks.com",
    action: "LOGIN",
    resource: "AUTH",
    details: "User logged in successfully from IP 192.168.1.100",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "SUCCESS",
    timestamp: "2024-12-10T09:15:30Z",
    severity: "LOW",
  },
  {
    id: "2",
    userId: "2",
    userName: "Manager User",
    userEmail: "manager@accubooks.com",
    action: "CREATE",
    resource: "INVOICE",
    resourceId: "INV-003",
    details: "Created new invoice for Tech Solutions Ltd - Amount: $3,200.00",
    ipAddress: "192.168.1.105",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    status: "SUCCESS",
    timestamp: "2024-12-10T10:30:15Z",
    severity: "MEDIUM",
  },
  {
    id: "3",
    userId: "3",
    userName: "Regular User",
    userEmail: "user@accubooks.com",
    action: "DELETE",
    resource: "CUSTOMER",
    resourceId: "CUST-015",
    details:
      "Attempted to delete customer with active invoices - Action blocked",
    ipAddress: "192.168.1.110",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "FAILED",
    timestamp: "2024-12-10T11:45:22Z",
    severity: "HIGH",
  },
  {
    id: "4",
    userId: "1",
    userName: "Admin User",
    userEmail: "admin@accubooks.com",
    action: "UPDATE",
    resource: "USER_ROLE",
    resourceId: "USER-008",
    details: "Changed user role from USER to MANAGER for john.doe@company.com",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "SUCCESS",
    timestamp: "2024-12-10T12:00:45Z",
    severity: "HIGH",
  },
  {
    id: "5",
    userId: "4",
    userName: "Auditor User",
    userEmail: "auditor@accubooks.com",
    action: "EXPORT",
    resource: "REPORTS",
    details: "Exported financial report for Q4 2024 - 150 records",
    ipAddress: "192.168.1.120",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    status: "SUCCESS",
    timestamp: "2024-12-10T13:15:10Z",
    severity: "MEDIUM",
  },
  {
    id: "6",
    userId: "unknown",
    userName: "Unknown User",
    userEmail: "unknown@malicious.com",
    action: "LOGIN",
    resource: "AUTH",
    details:
      "Failed login attempt - Invalid credentials for admin@accubooks.com",
    ipAddress: "203.45.67.89",
    userAgent: "Mozilla/5.0 (compatible; scanner/1.0)",
    status: "FAILED",
    timestamp: "2024-12-10T14:30:00Z",
    severity: "CRITICAL",
  },
  {
    id: "7",
    userId: "5",
    userName: "Inventory Manager",
    userEmail: "inventory@accubooks.com",
    action: "VIEW",
    resource: "INVENTORY",
    details: "Accessed inventory report - 500 items viewed",
    ipAddress: "192.168.1.125",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "SUCCESS",
    timestamp: "2024-12-10T15:45:30Z",
    severity: "LOW",
  },
  {
    id: "8",
    userId: "2",
    userName: "Manager User",
    userEmail: "manager@accubooks.com",
    action: "UPDATE",
    resource: "INVOICE",
    resourceId: "INV-002",
    details: "Updated invoice status from SENT to PAID for ABC Corporation",
    ipAddress: "192.168.1.105",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    status: "SUCCESS",
    timestamp: "2024-12-10T16:20:15Z",
    severity: "MEDIUM",
  },
];

const statusConfig = {
  SUCCESS: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Success",
  },
  FAILED: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" },
  WARNING: {
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
    label: "Warning",
  },
  INFO: { color: "bg-blue-100 text-blue-800", icon: Info, label: "Info" },
};

const severityConfig = {
  LOW: { color: "bg-gray-100 text-gray-800", label: "Low" },
  MEDIUM: { color: "bg-orange-100 text-orange-800", label: "Medium" },
  HIGH: { color: "bg-red-100 text-red-800", label: "High" },
  CRITICAL: { color: "bg-purple-100 text-purple-800", label: "Critical" },
};

const actionConfig = {
  LOGIN: { icon: User, color: "text-blue-600" },
  LOGOUT: { icon: User, color: "text-gray-600" },
  CREATE: { icon: FileText, color: "text-green-600" },
  UPDATE: { icon: Settings, color: "text-orange-600" },
  DELETE: { icon: Trash2, color: "text-red-600" },
  VIEW: { icon: Eye, color: "text-blue-600" },
  EXPORT: { icon: Download, color: "text-purple-600" },
};

// @ts-ignore
const AuditLogsPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Mock fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Fetching audit logs...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAuditLogs(mockAuditLogs);
      setFilteredLogs(mockAuditLogs);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filter audit logs
  useEffect(() => {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((log) => log.severity === severityFilter);
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, statusFilter, severityFilter, actionFilter]);

  const handleExportLogs = async () => {
    try {
      console.log("🔍 Exporting audit logs...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Audit logs exported successfully");
      alert("Audit logs exported successfully!");
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUniqueValues = (key: keyof AuditLog) => {
    return [...new Set(auditLogs.map((log) => log[key]))];
  };

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-gray-600">
              System activity and security audit trail
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-surface1 border border-border-gray shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Activities
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <p className="text-xs text-muted-foreground">Logged activities</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {auditLogs.filter((log) => log.status === "SUCCESS").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successful operations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter((log) => log.status === "FAILED").length}
              </div>
              <p className="text-xs text-muted-foreground">Failed operations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Events
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {auditLogs.filter((log) => log.severity === "CRITICAL").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search audit logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {getUniqueValues("action").map((action) => (
                    <SelectItem
                      key={action || "unknown"}
                      value={action || "unknown"}
                    >
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
            <CardDescription>
              Complete audit trail of all system activities and security events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-enterprise-navy"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const StatusIcon = statusConfig[log.status].icon;
                    const ActionIcon =
// @ts-ignore
                      actionConfig[log.action as keyof typeof actionConfig]
                        ?.icon || Activity;
                    const actionColor =
// @ts-ignore
                      actionConfig[log.action as keyof typeof actionConfig]
                        ?.color || "text-gray-600";

                    return (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDate(log.timestamp)}
                            </div>
                            <div className="text-gray-500">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.userName}</div>
                            <div className="text-sm text-gray-500">
                              {log.userEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ActionIcon className={`w-4 h-4 ${actionColor}`} />
                            <span className="font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.resource}</div>
                          {log.resourceId && (
                            <div className="text-sm text-gray-500">
                              {log.resourceId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div
                            className="max-w-xs truncate text-sm"
                            title={log.details}
                          >
                            {log.details}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[log.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[log.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={severityConfig[log.severity].color}>
                            {severityConfig[log.severity].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {log.ipAddress}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Security Alert */}
        {filteredLogs.some((log) => log.severity === "CRITICAL") && (
          <Card className="border-red-500/40 bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Security Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                {
                  filteredLogs.filter((log) => log.severity === "CRITICAL")
                    .length
                }{" "}
                critical security events detected. Please review the audit logs
                immediately and take appropriate action.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
};

export default AuditLogsPage;
